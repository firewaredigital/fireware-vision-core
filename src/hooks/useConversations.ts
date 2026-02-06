import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export type ConversationChannel = 'email' | 'chat' | 'phone' | 'whatsapp' | 'sms' | 'social' | 'portal' | 'internal';
export type ConversationStatus = 'open' | 'waiting_customer' | 'waiting_agent' | 'bot_handling' | 'on_hold' | 'snoozed' | 'closed' | 'spam';
export type AgentStatus = 'available' | 'busy' | 'away' | 'offline' | 'in_meeting' | 'on_break' | 'after_call_work' | 'training';

export interface Conversation {
  id: string;
  organization_id: string;
  conversation_number: string;
  channel: ConversationChannel;
  status: ConversationStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  subject: string | null;
  summary: string | null;
  tags: string[];
  account_id: string | null;
  contact_id: string | null;
  owner_id: string | null;
  queue_id: string | null;
  message_count: number;
  unread_count: number;
  first_message_at: string | null;
  last_message_at: string | null;
  sla_response_due_at: string | null;
  sla_response_breached: boolean;
  created_at: string;
  updated_at: string;
  contact?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  account?: {
    id: string;
    name: string;
  } | null;
  owner?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  sender_type: 'agent' | 'customer' | 'bot' | 'system';
  sender_id: string | null;
  sender_name: string | null;
  sender_email: string | null;
  content: string | null;
  content_html: string | null;
  content_type: string;
  attachments: any[];
  delivery_status: string;
  is_internal: boolean;
  created_at: string;
}

interface UseConversationsOptions {
  status?: ConversationStatus | ConversationStatus[];
  channel?: ConversationChannel;
  ownerId?: string;
  queueId?: string;
}

export function useConversations(options: UseConversationsOptions = {}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchConversations = useCallback(async () => {
    if (!profile?.organization_id) return;
    
    try {
      setLoading(true);
      let query = supabase
        .from('conversations')
        .select(`
          *,
          contact:contacts(id, first_name, last_name, email, phone),
          account:accounts(id, name),
          owner:profiles!conversations_owner_id_fkey(id, first_name, last_name, email)
        `)
        .eq('organization_id', profile.organization_id)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (options.status) {
        if (Array.isArray(options.status)) {
          query = query.in('status', options.status);
        } else {
          query = query.eq('status', options.status);
        }
      }

      if (options.channel) {
        query = query.eq('channel', options.channel);
      }

      if (options.ownerId) {
        query = query.eq('owner_id', options.ownerId);
      }

      if (options.queueId) {
        query = query.eq('queue_id', options.queueId);
      }

      const { data, error: fetchError } = await query.limit(100);

      if (fetchError) throw fetchError;
      setConversations((data || []) as unknown as Conversation[]);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [profile?.organization_id, options.status, options.channel, options.ownerId, options.queueId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Real-time subscription
  useEffect(() => {
    if (!profile?.organization_id) return;

    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `organization_id=eq.${profile.organization_id}`,
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.organization_id, fetchConversations]);

  const assignToMe = async (conversationId: string) => {
    if (!profile?.id) return false;
    
    try {
      const { error } = await supabase.rpc('assign_conversation_to_agent', {
        p_conversation_id: conversationId,
        p_agent_id: profile.id,
        p_method: 'manual'
      });

      if (error) throw error;
      
      toast({ title: 'Conversação atribuída', description: 'A conversação foi atribuída a você.' });
      fetchConversations();
      return true;
    } catch (err) {
      console.error('Error assigning conversation:', err);
      toast({ title: 'Erro', description: 'Não foi possível atribuir a conversação.', variant: 'destructive' });
      return false;
    }
  };

  const closeConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ 
          status: 'closed' as ConversationStatus, 
          closed_at: new Date().toISOString(),
          closed_by: profile?.id 
        })
        .eq('id', conversationId);

      if (error) throw error;
      
      toast({ title: 'Conversação fechada' });
      fetchConversations();
      return true;
    } catch (err) {
      console.error('Error closing conversation:', err);
      toast({ title: 'Erro', description: 'Não foi possível fechar a conversação.', variant: 'destructive' });
      return false;
    }
  };

  return {
    conversations,
    loading,
    error,
    refetch: fetchConversations,
    assignToMe,
    closeConversation,
  };
}

export function useConversationMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []) as ConversationMessage[]);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Real-time subscription for messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as ConversationMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return { messages, loading, refetch: fetchMessages };
}

export function useAgentStatus() {
  const { profile } = useAuth();
  const [status, setStatus] = useState<AgentStatus>('offline');
  const { toast } = useToast();

  useEffect(() => {
    if (!profile?.id) return;

    const fetchStatus = async () => {
      const { data } = await supabase
        .from('agent_status')
        .select('status')
        .eq('user_id', profile.id)
        .single();

      if (data) {
        setStatus(data.status as AgentStatus);
      }
    };

    fetchStatus();
  }, [profile?.id]);

  const updateStatus = async (newStatus: AgentStatus, reason?: string) => {
    if (!profile?.id) return false;

    try {
      const { error } = await supabase.rpc('update_agent_availability', {
        p_user_id: profile.id,
        p_status: newStatus,
        p_reason: reason || null
      });

      if (error) throw error;
      
      setStatus(newStatus);
      toast({ title: 'Status atualizado', description: `Seu status agora é: ${newStatus}` });
      return true;
    } catch (err) {
      console.error('Error updating status:', err);
      toast({ title: 'Erro', description: 'Não foi possível atualizar o status.', variant: 'destructive' });
      return false;
    }
  };

  return { status, updateStatus };
}
