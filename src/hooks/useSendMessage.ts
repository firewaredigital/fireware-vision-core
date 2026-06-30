import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface SendMessageOptions {
  conversationId: string;
  content: string;
  contentHtml?: string;
  isInternal?: boolean;
  attachments?: Array<{ name: string; url: string; size?: number; type?: string }>;
}

export function useSendMessage() {
  const [sending, setSending] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  const sendMessage = useCallback(async (options: SendMessageOptions) => {
    if (!profile?.id || !options.content.trim()) return false;

    try {
      setSending(true);

      // 1. Insert message into conversation_messages
      const insertData: Record<string, unknown> = {
        conversation_id: options.conversationId,
        sender_type: 'agent',
        sender_id: profile.id,
        sender_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
        sender_email: profile.email,
        content: options.content,
        content_html: options.contentHtml || null,
        content_type: options.contentHtml ? 'html' : 'text',
        is_internal: options.isInternal || false,
        attachments: options.attachments || [],
        delivery_status: options.isInternal ? 'internal' : 'sent',
      };

      const { data: message, error: msgError } = await supabase
        .from('conversation_messages')
        .insert(insertData as unknown)
        .select()
        .single();

      if (msgError) throw msgError;

      // 2. If NOT internal, get conversation details to dispatch through channel
      if (!options.isInternal) {
        const { data: conv } = await supabase
          .from('conversations')
          .select('channel, contact_id, contact:contacts(email, phone)')
          .eq('id', options.conversationId)
          .single();

        if (conv) {
          // Dispatch based on channel - this calls the send-message edge function
          const channel = conv.channel as string;
          const contact = conv.contact as unknown;

          if (channel === 'whatsapp' && contact?.phone) {
            // Route through WhatsApp sender
            try {
              await supabase.functions.invoke('whatsapp-send', {
                body: {
                  to: contact.phone,
                  type: 'text',
                  content: options.content,
                  conversation_id: options.conversationId,
                  message_id: message?.id,
                },
              });
            } catch (waError) {
              console.warn('[useSendMessage] WhatsApp dispatch failed (non-blocking):', waError);
            }
          } else if (channel === 'email' && contact?.email) {
            // Route through email sender
            try {
              await supabase.functions.invoke('send-message', {
                body: {
                  recipient_type: 'contact',
                  recipient_id: conv.contact_id,
                  recipient_address: contact.email,
                  message_type: 'email',
                  content: options.content,
                  subject: `Re: Conversação`,
                  metadata: {
                    conversation_id: options.conversationId,
                    message_id: message?.id,
                  },
                },
              });
            } catch (emailError) {
              console.warn('[useSendMessage] Email dispatch failed (non-blocking):', emailError);
            }
          }
          // For chat/portal channels, the real-time subscription handles delivery
        }
      }

      return true;
    } catch (err) {
      console.error('[useSendMessage] Error sending message:', err);
      toast({
        title: 'Erro ao enviar',
        description: 'Não foi possível enviar a mensagem. Tente novamente.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSending(false);
    }
  }, [profile, toast]);

  return { sendMessage, sending };
}
