import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface JourneyStep {
  id: string;
  type: string; // send_email, send_sms, send_whatsapp, wait, condition, split, tag, webhook
  config: Record<string, unknown>;
  next_step_id?: string;
  true_step_id?: string;  // For condition/split
  false_step_id?: string; // For condition/split
}

interface JourneyConfig {
  steps: JourneyStep[];
  entry_trigger?: string;
  exit_conditions?: Record<string, unknown>[];
}

interface ProcessRequest {
  journey_run_id: string;
  force_step_id?: string; // For manual override
}

// ------- Condition evaluator -------

function evaluateCondition(
  condition: Record<string, unknown>,
  context: Record<string, unknown>
): boolean {
  const field = condition.field as string;
  const operator = condition.operator as string;
  const value = condition.value;

  const actualValue = context[field];

  switch (operator) {
    case 'equals':
      return actualValue === value;
    case 'not_equals':
      return actualValue !== value;
    case 'contains':
      return typeof actualValue === 'string' && actualValue.includes(value as string);
    case 'greater_than':
      return typeof actualValue === 'number' && actualValue > (value as number);
    case 'less_than':
      return typeof actualValue === 'number' && actualValue < (value as number);
    case 'is_empty':
      return !actualValue || actualValue === '';
    case 'is_not_empty':
      return !!actualValue && actualValue !== '';
    case 'in_list':
      return Array.isArray(value) && value.includes(actualValue);
    case 'has_opened_email':
      return context['email_opened'] === true;
    case 'has_clicked_email':
      return context['email_clicked'] === true;
    case 'days_since_last_activity': {
      if (!context['last_activity_at']) return false;
      const daysSince = (Date.now() - new Date(context['last_activity_at'] as string).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince > (value as number);
    }
    default:
      console.warn(`[journey-processor] Unknown operator: ${operator}`);
      return false;
  }
}

// ------- Wait calculator -------

function calculateWaitUntil(config: Record<string, unknown>): Date {
  const waitType = config.wait_type as string;
  const now = new Date();

  switch (waitType) {
    case 'delay': {
      const amount = (config.amount as number) || 1;
      const unit = (config.unit as string) || 'hours';
      const ms = {
        'minutes': amount * 60 * 1000,
        'hours': amount * 60 * 60 * 1000,
        'days': amount * 24 * 60 * 60 * 1000,
        'weeks': amount * 7 * 24 * 60 * 60 * 1000,
      }[unit] || amount * 60 * 60 * 1000;
      return new Date(now.getTime() + ms);
    }
    case 'until_date': {
      return new Date(config.date as string);
    }
    case 'until_event': {
      // Wait max 30 days for event, re-evaluate periodically
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
    case 'business_hours': {
      // Simple: wait until next business hour (9 AM)
      const next = new Date(now);
      next.setDate(next.getDate() + 1);
      next.setHours(9, 0, 0, 0);
      return next;
    }
    default:
      return new Date(now.getTime() + 60 * 60 * 1000); // Default 1 hour
  }
}

// ------- Step executors -------

async function executeSendStep(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  supabaseKey: string,
  step: JourneyStep,
  journeyRun: Record<string, unknown>,
  organizationId: string
): Promise<{ success: boolean; output?: Record<string, unknown>; error?: string }> {
  const config = step.config;
  const providerId = config.provider_id as string;
  const recipientAddress = config.recipient_address as string || journeyRun['recipient_address'] as string;
  const subject = config.subject as string;
  const content = config.content as string;
  const templateId = config.template_id as string;
  const templateVariables = config.template_variables as Record<string, string>;

  if (!providerId || !recipientAddress) {
    return { success: false, error: 'Missing provider_id or recipient_address' };
  }

  console.log(`[journey-processor] Executing send step ${step.id} via provider ${providerId}`);

  // Call the send-message function
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        provider_id: providerId,
        recipient_type: 'contact',
        recipient_address: recipientAddress,
        message_type: step.type.replace('send_', ''),
        subject: subject,
        content: content,
        template_id: templateId,
        template_variables: templateVariables,
        journey_run_id: journeyRun['id'],
      }),
    });

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        output: {
          send_id: result.send_id,
          external_id: result.external_id,
          provider_type: result.provider_type,
        },
      };
    }

    return { success: false, error: result.error || 'Send failed' };
  } catch (err) {
    return { success: false, error: `Send dispatch error: ${err.message}` };
  }
}

async function executeTagStep(
  supabase: ReturnType<typeof createClient>,
  step: JourneyStep,
  journeyRun: Record<string, unknown>,
  organizationId: string
): Promise<{ success: boolean; output?: Record<string, unknown>; error?: string }> {
  const config = step.config;
  const action = config.action as string; // add_tag, remove_tag
  const tagName = config.tag as string;
  const entityType = config.entity_type as string || 'contact';
  const entityId = journeyRun['entity_id'] as string;

  if (!tagName || !entityId) {
    return { success: false, error: 'Missing tag or entity_id' };
  }

  console.log(`[journey-processor] ${action} tag "${tagName}" on ${entityType} ${entityId}`);

  // For contacts, update tags array
  if (entityType === 'contact') {
    const { data: contact } = await supabase
      .from('contacts')
      .select('tags')
      .eq('id', entityId)
      .single();

    let currentTags = (contact?.tags as string[]) || [];

    if (action === 'add_tag') {
      if (!currentTags.includes(tagName)) {
        currentTags.push(tagName);
      }
    } else if (action === 'remove_tag') {
      currentTags = currentTags.filter(t => t !== tagName);
    }

    await supabase
      .from('contacts')
      .update({ tags: currentTags })
      .eq('id', entityId);
  }

  return { success: true, output: { action, tag: tagName } };
}

async function executeWebhookStep(
  step: JourneyStep,
  journeyRun: Record<string, unknown>,
  context: Record<string, unknown>
): Promise<{ success: boolean; output?: Record<string, unknown>; error?: string }> {
  const config = step.config;
  const url = config.url as string;
  const method = (config.method as string) || 'POST';
  const headers = (config.headers as Record<string, string>) || {};

  if (!url) {
    return { success: false, error: 'Missing webhook URL' };
  }

  console.log(`[journey-processor] Executing webhook ${method} ${url}`);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: method !== 'GET' ? JSON.stringify({
        journey_run_id: journeyRun['id'],
        step_id: step.id,
        context,
      }) : undefined,
    });

    return {
      success: response.ok,
      output: {
        status: response.status,
        body: response.ok ? await response.json().catch(() => ({})) : await response.text(),
      },
      error: response.ok ? undefined : `Webhook returned ${response.status}`,
    };
  } catch (err) {
    return { success: false, error: `Webhook error: ${err.message}` };
  }
}

// ------- Main handler -------

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  try {
    // Authenticate
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await userClient.auth.getUser();
    if (claimsError || !claimsData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload: ProcessRequest = await req.json();
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[journey-processor] Processing run ${payload.journey_run_id}`);

    // 1. Load journey run
    const { data: journeyRun, error: runError } = await supabase
      .from('journey_runs')
      .select('*')
      .eq('id', payload.journey_run_id)
      .single();

    if (runError || !journeyRun) {
      console.error('[journey-processor] Run not found:', runError);
      return new Response(JSON.stringify({ error: 'Journey run not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (journeyRun.status === 'completed' || journeyRun.status === 'failed') {
      return new Response(JSON.stringify({ error: 'Journey run is already terminal' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Load journey definition with steps
    const { data: journey, error: journeyError } = await supabase
      .from('journeys')
      .select('*')
      .eq('id', journeyRun.journey_id)
      .single();

    if (journeyError || !journey) {
      console.error('[journey-processor] Journey not found:', journeyError);
      return new Response(JSON.stringify({ error: 'Journey not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Load journey steps
    const { data: journeySteps, error: stepsError } = await supabase
      .from('journey_steps')
      .select('*')
      .eq('journey_id', journey.id)
      .order('step_order', { ascending: true });

    if (stepsError) {
      console.error('[journey-processor] Steps fetch error:', stepsError);
      return new Response(JSON.stringify({ error: 'Failed to load journey steps' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const steps = (journeySteps || []) as JourneyStep[];
    const stepsMap = new Map<string, JourneyStep>();
    steps.forEach(s => stepsMap.set(s.id, s));

    // Determine current step
    let currentStepId = payload.force_step_id || journeyRun.current_step_id;

    if (!currentStepId && steps.length > 0) {
      currentStepId = steps[0].id;
    }

    if (!currentStepId) {
      // No steps, mark as completed
      await supabase
        .from('journey_runs')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', journeyRun.id);

      return new Response(JSON.stringify({ status: 'completed', message: 'No steps to process' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const currentStep = stepsMap.get(currentStepId);
    if (!currentStep) {
      console.error(`[journey-processor] Step ${currentStepId} not found in journey`);
      await supabase
        .from('journey_runs')
        .update({ status: 'failed', error_message: `Step ${currentStepId} not found` })
        .eq('id', journeyRun.id);

      return new Response(JSON.stringify({ error: 'Current step not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[journey-processor] Executing step ${currentStep.id} (type: ${currentStep.type})`);

    // 4. Build context for condition evaluation
    const runMetadata = (journeyRun.metadata as Record<string, unknown>) || {};
    const evaluationContext: Record<string, unknown> = {
      ...runMetadata,
      journey_run_id: journeyRun.id,
      journey_id: journey.id,
      started_at: journeyRun.started_at,
    };

    // 5. Create step run record
    const { data: stepRun } = await supabase
      .from('journey_step_runs')
      .insert({
        journey_run_id: journeyRun.id,
        organization_id: journeyRun.organization_id,
        step_id: currentStep.id,
        status: 'running',
        input_data: evaluationContext,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    // 6. Execute step based on type
    let nextStepId: string | undefined;
    let stepResult: { success: boolean; output?: Record<string, unknown>; error?: string } = { success: true };
    let runStatus: string = 'active';

    const stepConfig = (currentStep.config as Record<string, unknown>) || {};

    switch (currentStep.type) {
      case 'send_email':
      case 'send_sms':
      case 'send_whatsapp':
      case 'send_push':
        stepResult = await executeSendStep(
          supabase,
          supabaseUrl,
          supabaseKey,
          currentStep,
          journeyRun,
          journeyRun.organization_id
        );
        nextStepId = currentStep.next_step_id;
        break;

      case 'wait': {
        const waitUntil = calculateWaitUntil(stepConfig);
        if (new Date() < waitUntil) {
          // Still waiting
          runStatus = 'waiting';
          await supabase
            .from('journey_runs')
            .update({
              status: 'waiting',
              next_step_at: waitUntil.toISOString(),
              current_step_id: currentStep.id,
            })
            .eq('id', journeyRun.id);

          if (stepRun) {
            await supabase
              .from('journey_step_runs')
              .update({
                status: 'waiting',
                output_data: { wait_until: waitUntil.toISOString() },
              })
              .eq('id', stepRun.id);
          }

          return new Response(JSON.stringify({
            status: 'waiting',
            wait_until: waitUntil.toISOString(),
            step_id: currentStep.id,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        // Wait is over, proceed to next
        nextStepId = currentStep.next_step_id;
        stepResult = { success: true, output: { waited_until: waitUntil.toISOString() } };
        break;
      }

      case 'condition': {
        const conditions = (stepConfig.conditions as Record<string, unknown>[]) || [];
        const conditionLogic = (stepConfig.logic as string) || 'and';

        let conditionMet: boolean;
        if (conditionLogic === 'or') {
          conditionMet = conditions.some(c => evaluateCondition(c, evaluationContext));
        } else {
          conditionMet = conditions.every(c => evaluateCondition(c, evaluationContext));
        }

        nextStepId = conditionMet ? currentStep.true_step_id : currentStep.false_step_id;
        stepResult = {
          success: true,
          output: { condition_met: conditionMet, branch: conditionMet ? 'true' : 'false' },
        };
        break;
      }

      case 'split': {
        // A/B split based on percentage
        const splitPercentage = (stepConfig.percentage as number) || 50;
        const random = Math.random() * 100;
        const isGroupA = random < splitPercentage;

        nextStepId = isGroupA ? currentStep.true_step_id : currentStep.false_step_id;
        stepResult = {
          success: true,
          output: { group: isGroupA ? 'A' : 'B', random_value: random, threshold: splitPercentage },
        };
        break;
      }

      case 'tag':
        stepResult = await executeTagStep(supabase, currentStep, journeyRun, journeyRun.organization_id);
        nextStepId = currentStep.next_step_id;
        break;

      case 'webhook':
        stepResult = await executeWebhookStep(currentStep, journeyRun, evaluationContext);
        nextStepId = currentStep.next_step_id;
        break;

      case 'update_field': {
        // Update a field on the entity
        const entityType = stepConfig.entity_type as string || 'contact';
        const entityId = runMetadata['entity_id'] as string;
        const fieldName = stepConfig.field as string;
        const fieldValue = stepConfig.value;

        if (entityId && fieldName) {
          await supabase
            .from(entityType === 'lead' ? 'leads' : 'contacts')
            .update({ [fieldName]: fieldValue })
            .eq('id', entityId);
        }

        stepResult = { success: true, output: { entity_type: entityType, field: fieldName, value: fieldValue } };
        nextStepId = currentStep.next_step_id;
        break;
      }

      case 'end':
        runStatus = 'completed';
        stepResult = { success: true, output: { message: 'Journey completed' } };
        break;

      default:
        console.warn(`[journey-processor] Unknown step type: ${currentStep.type}`);
        stepResult = { success: false, error: `Unknown step type: ${currentStep.type}` };
        nextStepId = currentStep.next_step_id;
    }

    // 7. Update step run record
    if (stepRun) {
      await supabase
        .from('journey_step_runs')
        .update({
          status: stepResult.success ? 'completed' : 'failed',
          output_data: stepResult.output || {},
          error_message: stepResult.error || null,
          completed_at: new Date().toISOString(),
        })
        .eq('id', stepRun.id);
    }

    // 8. Log journey event
    await supabase
      .from('journey_event_log')
      .insert({
        journey_run_id: journeyRun.id,
        organization_id: journeyRun.organization_id,
        event_type: `step_${stepResult.success ? 'completed' : 'failed'}`,
        event_data: {
          step_id: currentStep.id,
          step_type: currentStep.type,
          result: stepResult.output,
          error: stepResult.error,
        },
        received_at: new Date().toISOString(),
      });

    // 9. Update journey run with next step or completion
    if (runStatus === 'completed' || !nextStepId) {
      await supabase
        .from('journey_runs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          current_step_id: null,
        })
        .eq('id', journeyRun.id);

      console.log(`[journey-processor] Journey run ${journeyRun.id} COMPLETED`);
    } else if (!stepResult.success) {
      await supabase
        .from('journey_runs')
        .update({
          status: 'failed',
          error_message: stepResult.error,
          current_step_id: currentStep.id,
        })
        .eq('id', journeyRun.id);

      console.log(`[journey-processor] Journey run ${journeyRun.id} FAILED at step ${currentStep.id}`);
    } else {
      // Move to next step
      await supabase
        .from('journey_runs')
        .update({
          status: 'active',
          current_step_id: nextStepId,
        })
        .eq('id', journeyRun.id);

      console.log(`[journey-processor] Journey run ${journeyRun.id} advancing to step ${nextStepId}`);
    }

    return new Response(
      JSON.stringify({
        status: runStatus === 'completed' ? 'completed' : (stepResult.success ? 'advanced' : 'failed'),
        step_executed: currentStep.id,
        step_type: currentStep.type,
        next_step: nextStepId || null,
        result: stepResult.output,
        error: stepResult.error,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('[journey-processor] Unhandled error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
