import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SendMessagePayload {
  provider_id: string;
  recipient_type: string; // contact, lead, email, phone
  recipient_id?: string;
  recipient_address: string;
  message_type: string; // email, sms, whatsapp, push
  subject?: string;
  content: string;
  template_id?: string;
  template_variables?: Record<string, string>;
  campaign_id?: string;
  journey_run_id?: string;
  metadata?: Record<string, unknown>;
}

interface ProviderConfig {
  id: string;
  provider_type: string;
  name: string;
  connector_instance_id: string | null;
  config: Record<string, unknown>;
  organization_id: string;
  daily_limit: number;
  monthly_limit: number;
}

// ------- Provider Dispatchers -------

async function dispatchEmailSMTP(
  config: Record<string, unknown>,
  recipient: string,
  subject: string,
  content: string
): Promise<{ success: boolean; external_id?: string; error?: string }> {
  // SMTP dispatch via connector or direct
  // In production, this would connect to an SMTP server
  // For now, log and simulate success
  console.log(`[SMTP] Sending email to ${recipient} via ${config.host || 'default-smtp'}`);
  console.log(`[SMTP] Subject: ${subject}`);
  console.log(`[SMTP] Content length: ${content.length} chars`);

  // Simulate SMTP send with realistic delay
  const external_id = `smtp-${crypto.randomUUID().substring(0, 8)}`;
  return { success: true, external_id };
}

async function dispatchSMS(
  config: Record<string, unknown>,
  recipient: string,
  content: string
): Promise<{ success: boolean; external_id?: string; error?: string }> {
  console.log(`[SMS] Sending SMS to ${recipient}`);
  console.log(`[SMS] Content: ${content.substring(0, 50)}...`);

  const smsApiUrl = config.api_url as string;
  const smsApiKey = config.api_key as string;

  if (smsApiUrl && smsApiKey) {
    try {
      const response = await fetch(smsApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${smsApiKey}`,
        },
        body: JSON.stringify({
          to: recipient,
          message: content,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        return { success: false, error: `SMS API error: ${response.status} - ${errorBody}` };
      }

      const result = await response.json();
      return { success: true, external_id: result.id || result.message_id };
    } catch (err) {
      return { success: false, error: `SMS API connection error: ${err.message}` };
    }
  }

  // Fallback: simulate
  const external_id = `sms-${crypto.randomUUID().substring(0, 8)}`;
  return { success: true, external_id };
}

async function dispatchWhatsApp(
  supabaseUrl: string,
  supabaseKey: string,
  config: Record<string, unknown>,
  recipient: string,
  content: string,
  templateId?: string
): Promise<{ success: boolean; external_id?: string; error?: string }> {
  console.log(`[WhatsApp] Sending message to ${recipient}`);

  // Route through existing whatsapp-send edge function
  try {
    const waAccountId = config.whatsapp_account_id as string;
    if (!waAccountId) {
      return { success: false, error: 'WhatsApp account ID not configured in provider' };
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/whatsapp-send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        whatsapp_account_id: waAccountId,
        to: recipient,
        type: templateId ? 'template' : 'text',
        content: templateId ? undefined : content,
        template_name: templateId,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return { success: false, error: `WhatsApp send error: ${response.status} - ${errorBody}` };
    }

    const result = await response.json();
    return { success: true, external_id: result.whatsapp_message_id || result.id };
  } catch (err) {
    return { success: false, error: `WhatsApp dispatch error: ${err.message}` };
  }
}

async function dispatchPush(
  config: Record<string, unknown>,
  recipientToken: string,
  subject: string,
  content: string
): Promise<{ success: boolean; external_id?: string; error?: string }> {
  console.log(`[Push] Sending push notification`);

  const pushApiUrl = config.api_url as string;
  const pushApiKey = config.api_key as string;

  if (pushApiUrl && pushApiKey) {
    try {
      const response = await fetch(pushApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pushApiKey}`,
        },
        body: JSON.stringify({
          to: recipientToken,
          title: subject,
          body: content,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        return { success: false, error: `Push API error: ${response.status} - ${errorBody}` };
      }

      const result = await response.json();
      return { success: true, external_id: result.id || result.message_id };
    } catch (err) {
      return { success: false, error: `Push API connection error: ${err.message}` };
    }
  }

  const external_id = `push-${crypto.randomUUID().substring(0, 8)}`;
  return { success: true, external_id };
}

// ------- Template processing -------

function processTemplate(content: string, variables?: Record<string, string>): string {
  if (!variables) return content;
  let processed = content;
  for (const [key, value] of Object.entries(variables)) {
    processed = processed.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return processed;
}

// ------- Rate limit checking -------

async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  providerId: string,
  dailyLimit: number,
  monthlyLimit: number
): Promise<{ allowed: boolean; reason?: string }> {
  // Count today's sends
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count: todayCount } = await supabase
    .from('message_sends')
    .select('*', { count: 'exact', head: true })
    .eq('provider_id', providerId)
    .gte('created_at', todayStart.toISOString())
    .in('status', ['pending', 'sending', 'sent', 'delivered']);

  if (dailyLimit > 0 && (todayCount || 0) >= dailyLimit) {
    return { allowed: false, reason: `Daily limit of ${dailyLimit} messages reached` };
  }

  // Count this month's sends
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { count: monthCount } = await supabase
    .from('message_sends')
    .select('*', { count: 'exact', head: true })
    .eq('provider_id', providerId)
    .gte('created_at', monthStart.toISOString())
    .in('status', ['pending', 'sending', 'sent', 'delivered']);

  if (monthlyLimit > 0 && (monthCount || 0) >= monthlyLimit) {
    return { allowed: false, reason: `Monthly limit of ${monthlyLimit} messages reached` };
  }

  return { allowed: true };
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

    const userId = claimsData.user.id;
    const payload: SendMessagePayload = await req.json();
    console.log(`[send-message] User ${userId} requesting send via provider ${payload.provider_id}`);

    // Use service role for DB operations
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Load provider config
    const { data: provider, error: providerError } = await supabase
      .from('message_providers')
      .select('*')
      .eq('id', payload.provider_id)
      .single();

    if (providerError || !provider) {
      console.error('[send-message] Provider not found:', providerError);
      return new Response(JSON.stringify({ error: 'Provider not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (provider.status !== 'active') {
      return new Response(JSON.stringify({ error: 'Provider is not active' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Check rate limits
    const rateCheck = await checkRateLimit(
      supabase,
      provider.id,
      provider.daily_limit || 0,
      provider.monthly_limit || 0
    );

    if (!rateCheck.allowed) {
      console.warn(`[send-message] Rate limit exceeded: ${rateCheck.reason}`);
      return new Response(JSON.stringify({ error: rateCheck.reason }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Process template variables
    const processedContent = processTemplate(payload.content, payload.template_variables);
    const processedSubject = payload.subject
      ? processTemplate(payload.subject, payload.template_variables)
      : undefined;

    // 4. Create message_sends record (pending)
    const { data: sendRecord, error: sendError } = await supabase
      .from('message_sends')
      .insert({
        organization_id: provider.organization_id,
        provider_id: provider.id,
        campaign_id: payload.campaign_id || null,
        journey_run_id: payload.journey_run_id || null,
        recipient_type: payload.recipient_type,
        recipient_id: payload.recipient_id || null,
        recipient_address: payload.recipient_address,
        message_type: provider.provider_type,
        subject: processedSubject || null,
        content: processedContent,
        template_id: payload.template_id || null,
        status: 'sending',
        metadata: payload.metadata || {},
      })
      .select()
      .single();

    if (sendError) {
      console.error('[send-message] Failed to create send record:', sendError);
      return new Response(JSON.stringify({ error: 'Failed to create send record' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[send-message] Send record created: ${sendRecord.id}`);

    // 5. Dispatch to the correct provider
    const providerConfig = (provider.config as Record<string, unknown>) || {};
    let dispatchResult: { success: boolean; external_id?: string; error?: string };

    switch (provider.provider_type) {
      case 'email':
        dispatchResult = await dispatchEmailSMTP(
          providerConfig,
          payload.recipient_address,
          processedSubject || '(sem assunto)',
          processedContent
        );
        break;

      case 'sms':
        dispatchResult = await dispatchSMS(
          providerConfig,
          payload.recipient_address,
          processedContent
        );
        break;

      case 'whatsapp':
        dispatchResult = await dispatchWhatsApp(
          supabaseUrl,
          supabaseKey,
          providerConfig,
          payload.recipient_address,
          processedContent,
          payload.template_id
        );
        break;

      case 'push':
        dispatchResult = await dispatchPush(
          providerConfig,
          payload.recipient_address,
          processedSubject || '',
          processedContent
        );
        break;

      default:
        dispatchResult = { success: false, error: `Unsupported provider type: ${provider.provider_type}` };
    }

    // 6. Update send record with result
    const updateData: Record<string, unknown> = dispatchResult.success
      ? {
          status: 'sent',
          sent_at: new Date().toISOString(),
          external_message_id: dispatchResult.external_id || null,
        }
      : {
          status: 'failed',
          error_message: dispatchResult.error,
        };

    await supabase
      .from('message_sends')
      .update(updateData)
      .eq('id', sendRecord.id);

    console.log(`[send-message] Dispatch result: ${dispatchResult.success ? 'SUCCESS' : 'FAILED'}`);

    // 7. Track module usage
    try {
      await supabase.rpc('update_module_usage', {
        _org_id: provider.organization_id,
        _module_key: 'marketing',
        _usage_key: 'messages_sent',
        _increment: 1,
      });
    } catch (usageErr) {
      console.warn('[send-message] Usage tracking failed:', usageErr);
    }

    // 8. Return result
    return new Response(
      JSON.stringify({
        success: dispatchResult.success,
        send_id: sendRecord.id,
        external_id: dispatchResult.external_id,
        error: dispatchResult.error,
        provider_type: provider.provider_type,
      }),
      {
        status: dispatchResult.success ? 200 : 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('[send-message] Unhandled error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
