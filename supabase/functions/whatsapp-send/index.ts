import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendMessageRequest {
  whatsapp_account_id: string;
  to: string;
  type: 'text' | 'template' | 'image' | 'audio' | 'video' | 'document' | 'sticker' | 'location' | 'contacts' | 'interactive';
  text?: { body: string; preview_url?: boolean };
  template?: {
    name: string;
    language: { code: string };
    components?: Array<{
      type: string;
      parameters: Array<{
        type: string;
        text?: string;
        currency?: { fallback_value: string; code: string; amount_1000: number };
        date_time?: { fallback_value: string };
        image?: { link: string };
        document?: { link: string; filename?: string };
        video?: { link: string };
      }>;
    }>;
  };
  image?: { link?: string; id?: string; caption?: string };
  audio?: { link?: string; id?: string };
  video?: { link?: string; id?: string; caption?: string };
  document?: { link?: string; id?: string; caption?: string; filename?: string };
  sticker?: { link?: string; id?: string };
  location?: { longitude: number; latitude: number; name?: string; address?: string };
  contacts?: Array<{
    addresses?: Array<{ street?: string; city?: string; state?: string; zip?: string; country?: string; type?: string }>;
    birthday?: string;
    emails?: Array<{ email: string; type?: string }>;
    name: { formatted_name: string; first_name?: string; last_name?: string };
    org?: { company?: string; department?: string; title?: string };
    phones?: Array<{ phone: string; type?: string; wa_id?: string }>;
    urls?: Array<{ url: string; type?: string }>;
  }>;
  interactive?: {
    type: 'list' | 'button' | 'product' | 'product_list';
    header?: { type: string; text?: string; image?: { link: string } };
    body: { text: string };
    footer?: { text: string };
    action: {
      button?: string;
      buttons?: Array<{ type: string; reply: { id: string; title: string } }>;
      sections?: Array<{ title?: string; rows: Array<{ id: string; title: string; description?: string }> }>;
    };
  };
  conversation_id?: string;
  context?: { message_id: string };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body: SendMessageRequest = await req.json();
    
    if (!body.whatsapp_account_id || !body.to || !body.type) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get WhatsApp account
    const { data: account, error: accountError } = await supabase
      .from('whatsapp_accounts')
      .select('*')
      .eq('id', body.whatsapp_account_id)
      .single();

    if (accountError || !account) {
      return new Response(JSON.stringify({ error: 'WhatsApp account not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (account.status !== 'active') {
      return new Response(JSON.stringify({ error: 'WhatsApp account is not active' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Format phone number (remove + if present)
    const toPhone = body.to.replace(/^\+/, '');

    // Build message payload for WhatsApp API
    const messagePayload: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhone,
      type: body.type
    };

    // Add context if replying to a message
    if (body.context) {
      messagePayload.context = body.context;
    }

    // Add message content based on type
    switch (body.type) {
      case 'text':
        if (!body.text?.body) {
          return new Response(JSON.stringify({ error: 'Text body is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        messagePayload.text = body.text;
        break;

      case 'template':
        if (!body.template?.name) {
          return new Response(JSON.stringify({ error: 'Template name is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        messagePayload.template = body.template;
        break;

      case 'image':
        if (!body.image?.link && !body.image?.id) {
          return new Response(JSON.stringify({ error: 'Image link or id is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        messagePayload.image = body.image;
        break;

      case 'audio':
        if (!body.audio?.link && !body.audio?.id) {
          return new Response(JSON.stringify({ error: 'Audio link or id is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        messagePayload.audio = body.audio;
        break;

      case 'video':
        if (!body.video?.link && !body.video?.id) {
          return new Response(JSON.stringify({ error: 'Video link or id is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        messagePayload.video = body.video;
        break;

      case 'document':
        if (!body.document?.link && !body.document?.id) {
          return new Response(JSON.stringify({ error: 'Document link or id is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        messagePayload.document = body.document;
        break;

      case 'sticker':
        if (!body.sticker?.link && !body.sticker?.id) {
          return new Response(JSON.stringify({ error: 'Sticker link or id is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        messagePayload.sticker = body.sticker;
        break;

      case 'location':
        if (!body.location?.latitude || !body.location?.longitude) {
          return new Response(JSON.stringify({ error: 'Location latitude and longitude are required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        messagePayload.location = body.location;
        break;

      case 'contacts':
        if (!body.contacts || body.contacts.length === 0) {
          return new Response(JSON.stringify({ error: 'Contacts array is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        messagePayload.contacts = body.contacts;
        break;

      case 'interactive':
        if (!body.interactive) {
          return new Response(JSON.stringify({ error: 'Interactive content is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        messagePayload.interactive = body.interactive;
        break;

      default:
        return new Response(JSON.stringify({ error: 'Invalid message type' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // Send message to WhatsApp API
    const whatsappApiUrl = `https://graph.facebook.com/v18.0/${account.phone_number_id}/messages`;
    
    const response = await fetch(whatsappApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${account.api_token_encrypted}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messagePayload)
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('WhatsApp API error:', responseData);
      return new Response(JSON.stringify({ 
        error: 'Failed to send message',
        details: responseData 
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const whatsappMessageId = responseData.messages?.[0]?.id;

    // Create conversation message if conversation_id provided
    let messageId: string | null = null;
    
    if (body.conversation_id) {
      let messageContent = '';
      
      switch (body.type) {
        case 'text':
          messageContent = body.text?.body || '';
          break;
        case 'template':
          messageContent = `[Template: ${body.template?.name}]`;
          break;
        case 'image':
          messageContent = body.image?.caption || '[Imagem]';
          break;
        case 'audio':
          messageContent = '[Áudio]';
          break;
        case 'video':
          messageContent = body.video?.caption || '[Vídeo]';
          break;
        case 'document':
          messageContent = body.document?.caption || `[Documento: ${body.document?.filename}]`;
          break;
        case 'sticker':
          messageContent = '[Sticker]';
          break;
        case 'location':
          messageContent = `[Localização: ${body.location?.name || ''} ${body.location?.address || ''}]`;
          break;
        case 'contacts':
          messageContent = '[Contato]';
          break;
        case 'interactive':
          messageContent = body.interactive?.body?.text || '[Mensagem interativa]';
          break;
      }

      const { data: newMessage } = await supabase
        .from('conversation_messages')
        .insert({
          organization_id: account.organization_id,
          conversation_id: body.conversation_id,
          sender_type: 'agent',
          sender_id: user.id,
          content: messageContent,
          content_type: body.type,
          external_message_id: whatsappMessageId
        })
        .select('id')
        .single();

      if (newMessage) {
        messageId = newMessage.id;
      }

      // Update conversation status
      await supabase
        .from('conversations')
        .update({ status: 'waiting_customer', updated_at: new Date().toISOString() })
        .eq('id', body.conversation_id);
    }

    // Log the message
    await supabase
      .from('whatsapp_message_logs')
      .insert({
        organization_id: account.organization_id,
        whatsapp_account_id: account.id,
        conversation_id: body.conversation_id || null,
        message_id: messageId,
        whatsapp_message_id: whatsappMessageId,
        direction: 'outbound',
        message_type: body.type,
        content: body.type === 'text' ? body.text?.body : `[${body.type}]`,
        template_name: body.type === 'template' ? body.template?.name : null,
        template_variables: body.type === 'template' ? body.template?.components : null,
        to_phone: `+${toPhone}`,
        status: 'sent',
        sent_at: new Date().toISOString()
      });

    // Update template usage if applicable
    if (body.type === 'template' && body.template?.name) {
      await supabase
        .from('whatsapp_templates')
        .update({ 
          times_used: supabase.rpc('increment_template_usage'),
          last_used_at: new Date().toISOString()
        })
        .eq('whatsapp_account_id', account.id)
        .eq('template_name', body.template.name);
    }

    return new Response(JSON.stringify({
      success: true,
      message_id: whatsappMessageId,
      conversation_message_id: messageId
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Send message error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});