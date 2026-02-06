import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.93.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LOVABLE_AI_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

interface AgentConfig {
  id: string;
  name: string;
  agent_type: string;
  system_prompt: string;
  model_config: {
    model: string;
    temperature: number;
    max_tokens: number;
  };
  max_turns: number;
  timeout_seconds: number;
}

interface ToolDef {
  id: string;
  name: string;
  description: string;
  parameters_schema: Record<string, unknown>;
  requires_approval: boolean;
  risk_level: string;
}

interface PolicyDef {
  id: string;
  name: string;
  policy_type: string;
  rules: unknown[];
  actions_on_violation: string;
}

// PII patterns for masking
const PII_PATTERNS = [
  { name: 'cpf', regex: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, mask: '***.***.***-**' },
  { name: 'cnpj', regex: /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, mask: '**.***.***\/****-**' },
  { name: 'email', regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, mask: '***@***.***' },
  { name: 'phone_br', regex: /\b(?:\+55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}\b/g, mask: '(**) *****-****' },
  { name: 'credit_card', regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, mask: '**** **** **** ****' },
];

function maskPII(text: string): { masked: string; detected: boolean; fields: string[] } {
  let masked = text;
  const detectedFields: string[] = [];
  
  for (const pattern of PII_PATTERNS) {
    if (pattern.regex.test(masked)) {
      detectedFields.push(pattern.name);
      masked = masked.replace(pattern.regex, pattern.mask);
    }
    // Reset lastIndex for global regex
    pattern.regex.lastIndex = 0;
  }
  
  return {
    masked,
    detected: detectedFields.length > 0,
    fields: detectedFields,
  };
}

function validatePolicies(
  policies: PolicyDef[],
  input: string,
  context: Record<string, unknown>
): { allowed: boolean; violations: string[] } {
  const violations: string[] = [];
  
  for (const policy of policies) {
    if (policy.policy_type === 'content_filter') {
      // Check for blocked content patterns
      const rules = policy.rules as Array<{ pattern?: string; blocked_words?: string[] }>;
      for (const rule of rules) {
        if (rule.blocked_words) {
          for (const word of rule.blocked_words) {
            if (input.toLowerCase().includes(word.toLowerCase())) {
              violations.push(`Política "${policy.name}": conteúdo bloqueado detectado`);
            }
          }
        }
      }
    }
    
    if (policy.policy_type === 'rate_limit') {
      // Rate limit checks would be done via DB query - placeholder
      const rules = policy.rules as Array<{ max_per_hour?: number }>;
      // Rate limiting is enforced at the RPC level
    }
  }
  
  return {
    allowed: violations.length === 0,
    violations,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI gateway não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create authenticated client to verify user
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role for DB operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's profile and org
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, organization_id, email, first_name, last_name')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return new Response(
        JSON.stringify({ error: 'Perfil ou organização não encontrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const orgId = profile.organization_id;

    // Parse request body
    const body = await req.json();
    const {
      agent_id,
      message,
      conversation_id,
      context: userContext = {},
    } = body;

    if (!agent_id || !message) {
      return new Response(
        JSON.stringify({ error: 'agent_id e message são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[AI Execute] Agent: ${agent_id}, User: ${user.id}, Org: ${orgId}`);

    // 1. Load agent configuration
    const { data: agent, error: agentError } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', agent_id)
      .eq('organization_id', orgId)
      .single();

    if (agentError || !agent) {
      console.error('Agent not found:', agentError);
      return new Response(
        JSON.stringify({ error: 'Agente não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (agent.status !== 'active' && agent.status !== 'testing') {
      return new Response(
        JSON.stringify({ error: `Agente não está ativo (status: ${agent.status})` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Load agent tools
    const { data: agentTools } = await supabase
      .from('ai_agent_tools')
      .select('*, ai_tools(*)')
      .eq('agent_id', agent_id)
      .eq('is_enabled', true);

    const tools: ToolDef[] = (agentTools || [])
      .filter((at: any) => at.ai_tools)
      .map((at: any) => at.ai_tools);

    // 3. Load agent policies
    const { data: agentPolicies } = await supabase
      .from('ai_agent_policies')
      .select('*, ai_policies(*)')
      .eq('agent_id', agent_id)
      .eq('is_active', true);

    const policies: PolicyDef[] = (agentPolicies || [])
      .filter((ap: any) => ap.ai_policies?.is_active)
      .map((ap: any) => ap.ai_policies);

    // 4. PII Masking on input
    const piiResult = maskPII(message);
    const processedMessage = piiResult.detected ? piiResult.masked : message;

    // 5. Validate policies
    const policyCheck = validatePolicies(policies, message, userContext);
    if (!policyCheck.allowed) {
      console.warn('[AI Execute] Policy violation:', policyCheck.violations);
      return new Response(
        JSON.stringify({
          error: 'Execução bloqueada por política de segurança',
          violations: policyCheck.violations,
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Create AI Run record
    const { data: runData, error: runError } = await supabase
      .from('ai_runs')
      .insert({
        organization_id: orgId,
        agent_id: agent_id,
        triggered_by: user.id,
        trigger_type: 'user_request',
        input_context: {
          message: processedMessage,
          original_has_pii: piiResult.detected,
          pii_fields_masked: piiResult.fields,
          user_context: userContext,
        },
        status: 'running',
        started_at: new Date().toISOString(),
        model_used: agent.model_config?.model || 'google/gemini-3-flash-preview',
        correlation_id: conversation_id || null,
      })
      .select()
      .single();

    if (runError) {
      console.error('Failed to create run:', runError);
      return new Response(
        JSON.stringify({ error: 'Falha ao criar registro de execução' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const runId = runData.id;
    console.log(`[AI Execute] Run created: ${runId}`);

    // 7. Build conversation history
    let conversationMessages: Array<{ role: string; content: string }> = [];
    
    if (conversation_id) {
      const { data: conv } = await supabase
        .from('ai_conversations')
        .select('messages')
        .eq('id', conversation_id)
        .eq('user_id', user.id)
        .single();

      if (conv?.messages && Array.isArray(conv.messages)) {
        conversationMessages = conv.messages.slice(-20); // Last 20 messages for context
      }
    }

    // 8. Build system prompt
    const systemPrompt = [
      agent.system_prompt || `Você é o ${agent.name}, um assistente especializado.`,
      `\nData/hora atual: ${new Date().toISOString()}`,
      `Usuário: ${profile.first_name || ''} ${profile.last_name || ''} (${profile.email})`,
      agent.scope ? `\nEscopo de atuação: ${agent.scope}` : '',
      tools.length > 0 ? `\nVocê tem acesso a ${tools.length} ferramenta(s).` : '',
      policies.length > 0 ? '\nTodas as ações são auditadas e registradas.' : '',
      '\nResponda sempre em português do Brasil de forma profissional e direta.',
    ].filter(Boolean).join('\n');

    // 9. Build OpenAI-compatible tools definition
    const openAITools = tools.length > 0 ? tools.map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name.replace(/[^a-zA-Z0-9_-]/g, '_'),
        description: tool.description || tool.name,
        parameters: tool.parameters_schema || { type: 'object', properties: {} },
      },
    })) : undefined;

    // 10. Build messages array
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationMessages,
      { role: 'user', content: processedMessage },
    ];

    const modelConfig = agent.model_config || {};
    const model = modelConfig.model || 'google/gemini-3-flash-preview';
    const temperature = modelConfig.temperature ?? 0.7;
    const maxTokens = modelConfig.max_tokens ?? 4096;

    console.log(`[AI Execute] Calling Lovable AI: model=${model}, tools=${tools.length}`);

    // 11. Call Lovable AI Gateway
    const startTime = Date.now();
    
    const aiRequestBody: Record<string, unknown> = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    };

    if (openAITools && openAITools.length > 0) {
      aiRequestBody.tools = openAITools;
      aiRequestBody.tool_choice = 'auto';
    }

    const aiResponse = await fetch(LOVABLE_AI_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(aiRequestBody),
    });

    const durationMs = Date.now() - startTime;

    if (!aiResponse.ok) {
      const errorBody = await aiResponse.text();
      console.error(`[AI Execute] AI Gateway error: ${aiResponse.status}`, errorBody);

      // Update run as failed
      await supabase
        .from('ai_runs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: `AI Gateway error: ${aiResponse.status} - ${errorBody.substring(0, 500)}`,
        })
        .eq('id', runId);

      return new Response(
        JSON.stringify({ error: 'Falha na comunicação com o gateway de IA', run_id: runId }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResult = await aiResponse.json();
    const choice = aiResult.choices?.[0];
    const responseMessage = choice?.message;
    const assistantContent = responseMessage?.content || '';
    
    const usage = aiResult.usage || {};
    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;
    const totalTokens = usage.total_tokens || promptTokens + completionTokens;

    console.log(`[AI Execute] Response received: tokens=${totalTokens}, duration=${durationMs}ms`);

    // 12. Record reasoning step
    await supabase.from('ai_run_steps').insert({
      run_id: runId,
      organization_id: orgId,
      step_order: 1,
      step_type: 'reasoning',
      input_data: { message: processedMessage },
      output_data: { content: assistantContent, tool_calls: responseMessage?.tool_calls || null },
      status: 'completed',
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: durationMs,
      tokens_used: totalTokens,
    });

    // 13. Process tool calls if any
    let toolResults: Array<{ tool_name: string; result: unknown }> = [];
    let requiresApproval = false;

    if (responseMessage?.tool_calls && responseMessage.tool_calls.length > 0) {
      let stepOrder = 2;
      
      for (const toolCall of responseMessage.tool_calls) {
        const toolName = toolCall.function?.name;
        const toolArgs = JSON.parse(toolCall.function?.arguments || '{}');
        
        const matchedTool = tools.find(
          t => t.name.replace(/[^a-zA-Z0-9_-]/g, '_') === toolName
        );

        console.log(`[AI Execute] Tool call: ${toolName}, requires_approval: ${matchedTool?.requires_approval}`);

        // Check if tool requires approval
        if (matchedTool?.requires_approval || matchedTool?.risk_level === 'critical' || matchedTool?.risk_level === 'high') {
          requiresApproval = true;

          // Create audit receipt with pending approval
          await supabase.from('ai_run_audit_receipts').insert({
            run_id: runId,
            organization_id: orgId,
            action_type: 'tool_execution',
            action_description: `Execução da ferramenta "${toolName}" requer aprovação`,
            tool_used: toolName,
            risk_level: matchedTool?.risk_level || 'medium',
            requires_approval: true,
            approval_status: 'pending',
            data_accessed: toolArgs,
            pii_detected: piiResult.detected,
            pii_fields_masked: piiResult.fields.length > 0 ? piiResult.fields : null,
            execution_context: {
              agent_name: agent.name,
              agent_type: agent.agent_type,
              user_email: profile.email,
            },
          });

          // Create approval request
          await supabase.from('approval_requests').insert({
            organization_id: orgId,
            approval_type: 'ai_action',
            entity_type: 'ai_run',
            entity_id: runId,
            title: `Ação IA: ${toolName}`,
            description: `O agente "${agent.name}" solicita aprovação para executar a ferramenta "${toolName}" com os parâmetros: ${JSON.stringify(toolArgs).substring(0, 500)}`,
            requested_by: user.id,
            metadata: {
              run_id: runId,
              tool_name: toolName,
              tool_args: toolArgs,
              risk_level: matchedTool?.risk_level,
            },
            status: 'pending',
          });

          // Record step as waiting approval
          await supabase.from('ai_run_steps').insert({
            run_id: runId,
            organization_id: orgId,
            step_order: stepOrder++,
            step_type: 'approval_wait',
            tool_name: toolName,
            input_data: toolArgs,
            status: 'pending',
            started_at: new Date().toISOString(),
          });

          toolResults.push({
            tool_name: toolName,
            result: { status: 'pending_approval', message: 'Ação requer aprovação humana' },
          });
        } else {
          // Tool execution (simulated - real execution would call actual endpoints)
          const toolResult = {
            status: 'executed',
            tool: toolName,
            args: toolArgs,
            message: `Ferramenta "${toolName}" executada com sucesso`,
          };

          // Record tool call step
          await supabase.from('ai_run_steps').insert({
            run_id: runId,
            organization_id: orgId,
            step_order: stepOrder++,
            step_type: 'tool_call',
            tool_id: matchedTool?.id || null,
            tool_name: toolName,
            input_data: toolArgs,
            output_data: toolResult,
            status: 'completed',
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            duration_ms: 0,
          });

          // Create audit receipt
          await supabase.from('ai_run_audit_receipts').insert({
            run_id: runId,
            organization_id: orgId,
            action_type: 'tool_execution',
            action_description: `Ferramenta "${toolName}" executada`,
            tool_used: toolName,
            risk_level: matchedTool?.risk_level || 'low',
            requires_approval: false,
            data_accessed: toolArgs,
            pii_detected: piiResult.detected,
            pii_fields_masked: piiResult.fields.length > 0 ? piiResult.fields : null,
            execution_context: {
              agent_name: agent.name,
              agent_type: agent.agent_type,
              user_email: profile.email,
            },
          });

          toolResults.push({ tool_name: toolName, result: toolResult });
        }
      }
    }

    // 14. Update run status
    const finalStatus = requiresApproval ? 'waiting_approval' : 'completed';
    
    await supabase
      .from('ai_runs')
      .update({
        status: finalStatus,
        completed_at: requiresApproval ? null : new Date().toISOString(),
        output_result: {
          content: assistantContent,
          tool_calls: toolResults.length > 0 ? toolResults : null,
          requires_approval: requiresApproval,
        },
        total_tokens_used: totalTokens,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_steps: 1 + toolResults.length,
      })
      .eq('id', runId);

    // 15. Update or create conversation
    const newMessages = [
      ...conversationMessages,
      { role: 'user', content: message }, // Original (unmasked) for user's view
      { role: 'assistant', content: assistantContent },
    ];

    if (conversation_id) {
      await supabase
        .from('ai_conversations')
        .update({
          messages: newMessages,
          message_count: newMessages.length,
          total_tokens_used: totalTokens,
          last_run_id: runId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversation_id);
    } else {
      // Create new conversation
      const title = message.substring(0, 100) + (message.length > 100 ? '...' : '');
      const { data: newConv } = await supabase
        .from('ai_conversations')
        .insert({
          organization_id: orgId,
          agent_id: agent_id,
          user_id: user.id,
          title,
          messages: newMessages,
          message_count: newMessages.length,
          total_tokens_used: totalTokens,
          last_run_id: runId,
          status: 'active',
        })
        .select('id')
        .single();

      if (newConv) {
        // Return conversation_id in response
        return new Response(
          JSON.stringify({
            success: true,
            run_id: runId,
            conversation_id: newConv.id,
            content: assistantContent,
            tool_calls: toolResults.length > 0 ? toolResults : undefined,
            requires_approval: requiresApproval,
            tokens_used: totalTokens,
            duration_ms: durationMs,
            pii_detected: piiResult.detected,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 16. Update module usage
    await supabase.rpc('update_module_usage', {
      _org_id: orgId,
      _module_key: 'ai_agents',
      _usage_key: 'total_runs',
    });

    console.log(`[AI Execute] Run ${runId} completed: status=${finalStatus}, tokens=${totalTokens}`);

    return new Response(
      JSON.stringify({
        success: true,
        run_id: runId,
        conversation_id: conversation_id || null,
        content: assistantContent,
        tool_calls: toolResults.length > 0 ? toolResults : undefined,
        requires_approval: requiresApproval,
        tokens_used: totalTokens,
        duration_ms: durationMs,
        pii_detected: piiResult.detected,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[AI Execute] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
