import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hub-signature-256',
};

interface WhatsAppWebhookEntry {
  id: string;
  changes: Array<{
    value: {
      messaging_product: string;
      metadata: {
        display_phone_number: string;
        phone_number_id: string;
      };
      contacts?: Array<{
        profile: { name: string };
        wa_id: string;
      }>;
      messages?: Array<{
        from: string;
        id: string;
        timestamp: string;
        type: string;
        text?: { body: string };
        image?: { caption?: string; mime_type: string; sha256: string; id: string };
        audio?: { mime_type: string; sha256: string; id: string };
        video?: { caption?: string; mime_type: string; sha256: string; id: string };
        document?: { caption?: string; filename: string; mime_type: string; sha256: string; id: string };
        sticker?: { mime_type: string; sha256: string; id: string };
        location?: { latitude: number; longitude: number; name?: string; address?: string };
        contacts?: Array<{ name: { formatted_name: string }; phones: Array<{ phone: string; type: string }> }>;
        interactive?: { type: string; button_reply?: { id: string; title: string }; list_reply?: { id: string; title: string } };
        button?: { payload: string; text: string };
        context?: { from: string; id: string };
        reaction?: { message_id: string; emoji: string };
      }>;
      statuses?: Array<{
        id: string;
        status: string;
        timestamp: string;
        recipient_id: string;
        conversation?: { id: string; origin: { type: string } };
        pricing?: { billable: boolean; pricing_model: string; category: string };
        errors?: Array<{ code: number; title: string; message: string; error_data?: { details: string } }>;
      }>;
    };
    field: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const url = new URL(req.url);
    
    // Webhook verification (GET request from Meta)
    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');
      
      if (mode === 'subscribe' && token && challenge) {
        // Verify the token matches one of our configured accounts
        const { data: account } = await supabase
          .from('whatsapp_accounts')
          .select('id')
          .eq('webhook_verify_token', token)
          .single();
        
        if (account) {
          console.log('Webhook verified successfully');
          return new Response(challenge, { 
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
        
        console.error('Verify token mismatch');
        return new Response('Forbidden', { status: 403 });
      }
      
      return new Response('Bad Request', { status: 400 });
    }

    // Handle incoming webhook (POST request)
    if (req.method === 'POST') {
      const body = await req.json();
      
      console.log('Received webhook:', JSON.stringify(body, null, 2));
      
      // Process each entry
      for (const entry of (body.entry || []) as WhatsAppWebhookEntry[]) {
        for (const change of entry.changes || []) {
          if (change.field !== 'messages') continue;
          
          const value = change.value;
          const phoneNumberId = value.metadata?.phone_number_id;
          
          if (!phoneNumberId) continue;
          
          // Find the WhatsApp account
          const { data: account } = await supabase
            .from('whatsapp_accounts')
            .select('id, organization_id')
            .eq('phone_number_id', phoneNumberId)
            .single();
          
          if (!account) {
            console.error(`No account found for phone_number_id: ${phoneNumberId}`);
            continue;
          }
          
          // Process incoming messages
          if (value.messages && value.messages.length > 0) {
            for (const message of value.messages) {
              const contact = value.contacts?.find(c => c.wa_id === message.from);
              
              // Check if message already processed
              const { data: existingMessage } = await supabase
                .from('whatsapp_message_logs')
                .select('id')
                .eq('whatsapp_message_id', message.id)
                .single();
              
              if (existingMessage) {
                console.log(`Message ${message.id} already processed`);
                continue;
              }
              
              // Find or create contact
              let contactId: string | null = null;
              const formattedPhone = `+${message.from}`;
              
              const { data: existingContact } = await supabase
                .from('contacts')
                .select('id')
                .eq('organization_id', account.organization_id)
                .eq('phone', formattedPhone)
                .single();
              
              if (existingContact) {
                contactId = existingContact.id;
              } else if (contact) {
                // Create new contact
                const nameParts = contact.profile.name.split(' ');
                const { data: newContact } = await supabase
                  .from('contacts')
                  .insert({
                    organization_id: account.organization_id,
                    first_name: nameParts[0] || 'WhatsApp',
                    last_name: nameParts.slice(1).join(' ') || 'Contact',
                    phone: formattedPhone,
                    source: 'whatsapp'
                  })
                  .select('id')
                  .single();
                
                if (newContact) {
                  contactId = newContact.id;
                }
              }
              
              // Find existing open conversation or create new one
              let conversationId: string | null = null;
              
              const { data: existingConversation } = await supabase
                .from('conversations')
                .select('id')
                .eq('organization_id', account.organization_id)
                .eq('channel', 'whatsapp')
                .eq('contact_id', contactId)
                .in('status', ['open', 'waiting_customer', 'waiting_agent', 'bot_handling'])
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
              
              if (existingConversation) {
                conversationId = existingConversation.id;
              } else {
                // Create new conversation using RPC
                const { data: newConversation } = await supabase.rpc(
                  'create_conversation_from_whatsapp',
                  {
                    p_organization_id: account.organization_id,
                    p_whatsapp_account_id: account.id,
                    p_from_phone: formattedPhone,
                    p_message_content: message.text?.body || `[${message.type}]`,
                    p_whatsapp_message_id: message.id
                  }
                );
                
                if (newConversation) {
                  conversationId = newConversation;
                  continue; // RPC already created the message log
                }
              }
              
              // Create conversation message
              let messageContent = '';
              let contentType = message.type;
              let mediaUrl = null;
              let mediaMimeType = null;
              let mediaId = null;
              let caption = null;
              
              switch (message.type) {
                case 'text':
                  messageContent = message.text?.body || '';
                  break;
                case 'image':
                  messageContent = '[Imagem]';
                  mediaId = message.image?.id;
                  mediaMimeType = message.image?.mime_type;
                  caption = message.image?.caption;
                  break;
                case 'audio':
                  messageContent = '[Áudio]';
                  mediaId = message.audio?.id;
                  mediaMimeType = message.audio?.mime_type;
                  break;
                case 'video':
                  messageContent = '[Vídeo]';
                  mediaId = message.video?.id;
                  mediaMimeType = message.video?.mime_type;
                  caption = message.video?.caption;
                  break;
                case 'document':
                  messageContent = `[Documento: ${message.document?.filename}]`;
                  mediaId = message.document?.id;
                  mediaMimeType = message.document?.mime_type;
                  caption = message.document?.caption;
                  break;
                case 'sticker':
                  messageContent = '[Sticker]';
                  mediaId = message.sticker?.id;
                  mediaMimeType = message.sticker?.mime_type;
                  break;
                case 'location':
                  messageContent = `[Localização: ${message.location?.name || ''} ${message.location?.address || ''}]`;
                  break;
                case 'contacts':
                  messageContent = '[Contato]';
                  break;
                case 'interactive':
                  const reply = message.interactive?.button_reply || message.interactive?.list_reply;
                  messageContent = reply?.title || '[Resposta interativa]';
                  break;
                case 'button':
                  messageContent = message.button?.text || '[Botão]';
                  break;
                case 'reaction':
                  messageContent = message.reaction?.emoji || '[Reação]';
                  break;
                default:
                  messageContent = `[${message.type}]`;
              }
              
              // Insert conversation message
              const { data: newMessage } = await supabase
                .from('conversation_messages')
                .insert({
                  organization_id: account.organization_id,
                  conversation_id: conversationId,
                  sender_type: 'customer',
                  content: messageContent,
                  content_type: contentType,
                  external_message_id: message.id
                })
                .select('id')
                .single();
              
              // Insert WhatsApp message log
              await supabase
                .from('whatsapp_message_logs')
                .insert({
                  organization_id: account.organization_id,
                  whatsapp_account_id: account.id,
                  conversation_id: conversationId,
                  message_id: newMessage?.id,
                  contact_id: contactId,
                  whatsapp_message_id: message.id,
                  direction: 'inbound',
                  message_type: message.type,
                  content: messageContent,
                  media_id: mediaId,
                  media_mime_type: mediaMimeType,
                  caption: caption,
                  from_phone: formattedPhone,
                  profile_name: contact?.profile.name,
                  context_message_id: message.context?.id,
                  status: 'delivered'
                });
              
              console.log(`Processed message ${message.id} for conversation ${conversationId}`);
            }
          }
          
          // Process status updates
          if (value.statuses && value.statuses.length > 0) {
            for (const status of value.statuses) {
              const statusMap: Record<string, string> = {
                'sent': 'sent',
                'delivered': 'delivered',
                'read': 'read',
                'failed': 'failed'
              };
              
              const mappedStatus = statusMap[status.status];
              if (!mappedStatus) continue;
              
              const updateData: Record<string, unknown> = {
                status: mappedStatus
              };
              
              if (status.status === 'sent') {
                updateData.sent_at = new Date(parseInt(status.timestamp) * 1000).toISOString();
              } else if (status.status === 'delivered') {
                updateData.delivered_at = new Date(parseInt(status.timestamp) * 1000).toISOString();
              } else if (status.status === 'read') {
                updateData.read_at = new Date(parseInt(status.timestamp) * 1000).toISOString();
              } else if (status.status === 'failed') {
                updateData.failed_at = new Date(parseInt(status.timestamp) * 1000).toISOString();
                if (status.errors && status.errors.length > 0) {
                  const error = status.errors[0];
                  updateData.error_code = error.code.toString();
                  updateData.error_title = error.title;
                  updateData.error_message = error.message;
                  updateData.error_details = error.error_data;
                }
              }
              
              // Add pricing info
              if (status.pricing) {
                updateData.billable = status.pricing.billable;
                updateData.pricing_model = status.pricing.pricing_model;
                updateData.pricing_category = status.pricing.category;
              }
              
              // Add conversation ID
              if (status.conversation) {
                updateData.whatsapp_conversation_id = status.conversation.id;
              }
              
              await supabase
                .from('whatsapp_message_logs')
                .update(updateData)
                .eq('whatsapp_message_id', status.id);
              
              console.log(`Updated status for message ${status.id}: ${status.status}`);
            }
          }
        }
      }
      
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Method not allowed', { status: 405 });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});