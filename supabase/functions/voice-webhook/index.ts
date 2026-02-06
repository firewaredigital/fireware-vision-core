import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TwilioVoiceWebhook {
  CallSid: string;
  AccountSid: string;
  From: string;
  To: string;
  CallStatus: string;
  Direction: string;
  ApiVersion?: string;
  ForwardedFrom?: string;
  CallerName?: string;
  ParentCallSid?: string;
  CallDuration?: string;
  RecordingUrl?: string;
  RecordingDuration?: string;
  RecordingSid?: string;
  Digits?: string;
  SpeechResult?: string;
  Confidence?: string;
  DialCallStatus?: string;
  DialCallSid?: string;
  DialCallDuration?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const url = new URL(req.url);
  const path = url.pathname.replace('/voice-webhook', '');
  const providerId = url.searchParams.get('provider_id');

  try {
    if (!providerId) {
      return new Response('Missing provider_id', { status: 400 });
    }

    // Get provider and org
    const { data: provider } = await supabase
      .from('voice_providers')
      .select('id, organization_id, provider_type')
      .eq('id', providerId)
      .single();

    if (!provider) {
      return new Response('Provider not found', { status: 404 });
    }

    // Parse form data (Twilio sends form-urlencoded)
    const formData = await req.formData();
    const body: TwilioVoiceWebhook = Object.fromEntries(formData) as unknown as TwilioVoiceWebhook;

    console.log('Voice webhook received:', path, body);

    // Handle different webhook types
    if (path === '/incoming' || path === '/status') {
      const callSid = body.CallSid;
      const callStatus = body.CallStatus;
      
      // Map Twilio status to our enum
      const statusMap: Record<string, string> = {
        'queued': 'initiated',
        'ringing': 'ringing',
        'in-progress': 'in_progress',
        'completed': 'completed',
        'busy': 'busy',
        'failed': 'failed',
        'no-answer': 'no_answer',
        'canceled': 'cancelled'
      };

      const mappedStatus = statusMap[callStatus] || 'initiated';
      const direction = body.Direction === 'outbound-api' || body.Direction === 'outbound-dial' 
        ? 'outbound' 
        : 'inbound';

      // Check if call exists
      const { data: existingCall } = await supabase
        .from('voice_calls')
        .select('id')
        .eq('external_call_id', callSid)
        .single();

      if (existingCall) {
        // Update existing call
        await supabase.rpc('update_voice_call_status', {
          p_call_id: existingCall.id,
          p_status: mappedStatus,
          p_event_data: {
            twilio_status: callStatus,
            duration: body.CallDuration,
            recording_url: body.RecordingUrl
          }
        });

        // Update recording info if available
        if (body.RecordingUrl) {
          await supabase
            .from('voice_calls')
            .update({
              recording_url: body.RecordingUrl,
              recording_duration_seconds: body.RecordingDuration ? parseInt(body.RecordingDuration) : null,
              recording_status: 'completed'
            })
            .eq('id', existingCall.id);
        }
      } else if (path === '/incoming') {
        // Create new call for incoming
        // Try to find contact by phone
        const formattedFrom = body.From.startsWith('+') ? body.From : `+${body.From}`;
        
        const { data: contact } = await supabase
          .from('contacts')
          .select('id')
          .eq('organization_id', provider.organization_id)
          .eq('phone', formattedFrom)
          .single();

        // Register new call
        await supabase.rpc('register_voice_call', {
          p_organization_id: provider.organization_id,
          p_provider_id: provider.id,
          p_external_call_id: callSid,
          p_direction: direction,
          p_from_number: body.From,
          p_to_number: body.To,
          p_contact_id: contact?.id || null
        });
      }

      // Return TwiML response for incoming calls
      if (path === '/incoming') {
        // Get the first available agent from the default queue
        const { data: availableAgent } = await supabase
          .from('agent_status')
          .select('user_id, profiles!inner(first_name)')
          .eq('organization_id', provider.organization_id)
          .eq('status', 'available')
          .eq('is_accepting_new', true)
          .limit(1)
          .single();

        // Default TwiML - play message and gather input or connect to agent
        let twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="pt-BR">Obrigado por ligar. Aguarde um momento enquanto conectamos você a um atendente.</Say>`;

        if (availableAgent) {
          // In a real implementation, you'd dial the agent's phone or use a Twilio Client
          twiml += `
  <Say language="pt-BR">Conectando você agora.</Say>
  <Dial timeout="30">
    <Client>${availableAgent.user_id}</Client>
  </Dial>`;
        } else {
          // No agent available - offer voicemail
          twiml += `
  <Say language="pt-BR">No momento, todos os nossos atendentes estão ocupados. Por favor, deixe sua mensagem após o sinal.</Say>
  <Record maxLength="120" playBeep="true" action="/voice-webhook/recording?provider_id=${providerId}" />`;
        }

        twiml += `
</Response>`;

        return new Response(twiml, {
          status: 200,
          headers: { 'Content-Type': 'application/xml' }
        });
      }

      // For status callbacks, just acknowledge
      return new Response('OK', { status: 200 });
    }

    // Handle recording completed
    if (path === '/recording') {
      const callSid = body.CallSid;
      const recordingUrl = body.RecordingUrl;
      const recordingDuration = body.RecordingDuration;

      if (callSid && recordingUrl) {
        // Find the call
        const { data: call } = await supabase
          .from('voice_calls')
          .select('id, organization_id, agent_id, queue_id')
          .eq('external_call_id', callSid)
          .single();

        if (call) {
          // Update call with recording
          await supabase
            .from('voice_calls')
            .update({
              recording_url: recordingUrl,
              recording_duration_seconds: recordingDuration ? parseInt(recordingDuration) : null,
              recording_status: 'completed'
            })
            .eq('id', call.id);

          // Create voicemail if this was a missed call or after hours
          await supabase
            .from('voice_voicemails')
            .insert({
              organization_id: call.organization_id,
              call_id: call.id,
              agent_id: call.agent_id,
              queue_id: call.queue_id,
              audio_url: recordingUrl,
              duration_seconds: recordingDuration ? parseInt(recordingDuration) : null,
              transcription_status: 'pending'
            });

          // Log event
          await supabase
            .from('voice_call_events')
            .insert({
              organization_id: call.organization_id,
              call_id: call.id,
              event_type: 'voicemail_received',
              event_data: { recording_url: recordingUrl, duration: recordingDuration }
            });
        }
      }

      // Return TwiML to end the call
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="pt-BR">Obrigado pela sua mensagem. Retornaremos em breve.</Say>
  <Hangup />
</Response>`;

      return new Response(twiml, {
        status: 200,
        headers: { 'Content-Type': 'application/xml' }
      });
    }

    // Handle transcription completed
    if (path === '/transcription') {
      const callSid = body.CallSid;
      const transcriptionText = formData.get('TranscriptionText') as string;
      const transcriptionSid = formData.get('TranscriptionSid') as string;

      if (callSid && transcriptionText) {
        // Find the call
        const { data: call } = await supabase
          .from('voice_calls')
          .select('id, organization_id')
          .eq('external_call_id', callSid)
          .single();

        if (call) {
          // Create transcript
          const { data: transcript } = await supabase
            .from('voice_transcripts')
            .insert({
              organization_id: call.organization_id,
              call_id: call.id,
              full_text: transcriptionText,
              status: 'completed',
              completed_at: new Date().toISOString(),
              provider: 'twilio'
            })
            .select('id')
            .single();

          // Update call
          await supabase
            .from('voice_calls')
            .update({
              transcription_status: 'completed',
              transcription_id: transcript?.id
            })
            .eq('id', call.id);

          // Update voicemail if exists
          await supabase
            .from('voice_voicemails')
            .update({
              transcription_text: transcriptionText,
              transcription_status: 'completed'
            })
            .eq('call_id', call.id);
        }
      }

      return new Response('OK', { status: 200 });
    }

    // Handle DTMF/gather input
    if (path === '/gather') {
      const callSid = body.CallSid;
      const digits = body.Digits;
      const speechResult = body.SpeechResult;

      if (callSid) {
        // Find the call
        const { data: call } = await supabase
          .from('voice_calls')
          .select('id, organization_id')
          .eq('external_call_id', callSid)
          .single();

        if (call) {
          // Update DTMF input
          if (digits) {
            await supabase
              .from('voice_calls')
              .update({ dtmf_input: digits })
              .eq('id', call.id);
          }

          // Log event
          await supabase
            .from('voice_call_events')
            .insert({
              organization_id: call.organization_id,
              call_id: call.id,
              event_type: 'dtmf_received',
              event_data: { digits, speech_result: speechResult }
            });
        }
      }

      // Return empty TwiML to continue
      return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, {
        status: 200,
        headers: { 'Content-Type': 'application/xml' }
      });
    }

    return new Response('Not found', { status: 404 });

  } catch (error) {
    console.error('Voice webhook error:', error);
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="pt-BR">Desculpe, ocorreu um erro. Por favor, tente novamente mais tarde.</Say>
  <Hangup />
</Response>`, {
      status: 200,
      headers: { 'Content-Type': 'application/xml' }
    });
  }
});