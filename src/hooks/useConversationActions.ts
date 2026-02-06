import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { ConversationStatus } from '@/hooks/useConversations';

export function useConversationActions(onSuccess?: () => void) {
  const { profile } = useAuth();
  const { toast } = useToast();

  const assignToMe = useCallback(async (conversationId: string) => {
    if (!profile?.id) return false;
    try {
      const { error } = await supabase.rpc('assign_conversation_to_agent', {
        p_conversation_id: conversationId,
        p_agent_id: profile.id,
        p_method: 'manual'
      });
      if (error) throw error;
      toast({ title: 'Conversação atribuída', description: 'A conversação foi atribuída a você.' });
      onSuccess?.();
      return true;
    } catch (err) {
      console.error('Error assigning conversation:', err);
      toast({ title: 'Erro', description: 'Não foi possível atribuir a conversação.', variant: 'destructive' });
      return false;
    }
  }, [profile?.id, toast, onSuccess]);

  const transferConversation = useCallback(async (conversationId: string, agentId: string) => {
    if (!profile?.id) return false;
    try {
      const { error } = await supabase.rpc('assign_conversation_to_agent', {
        p_conversation_id: conversationId,
        p_agent_id: agentId,
        p_method: 'transfer'
      });
      if (error) throw error;
      toast({ title: 'Conversação transferida' });
      onSuccess?.();
      return true;
    } catch (err) {
      console.error('Error transferring conversation:', err);
      toast({ title: 'Erro', description: 'Não foi possível transferir a conversação.', variant: 'destructive' });
      return false;
    }
  }, [profile?.id, toast, onSuccess]);

  const closeConversation = useCallback(async (conversationId: string) => {
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
      onSuccess?.();
      return true;
    } catch (err) {
      console.error('Error closing conversation:', err);
      toast({ title: 'Erro', description: 'Não foi possível fechar a conversação.', variant: 'destructive' });
      return false;
    }
  }, [profile?.id, toast, onSuccess]);

  const updateStatus = useCallback(async (conversationId: string, status: ConversationStatus) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', conversationId);
      if (error) throw error;
      toast({ title: 'Status atualizado' });
      onSuccess?.();
      return true;
    } catch (err) {
      console.error('Error updating status:', err);
      toast({ title: 'Erro', description: 'Não foi possível atualizar o status.', variant: 'destructive' });
      return false;
    }
  }, [toast, onSuccess]);

  const updatePriority = useCallback(async (conversationId: string, priority: 'low' | 'medium' | 'high' | 'critical') => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ priority, updated_at: new Date().toISOString() })
        .eq('id', conversationId);
      if (error) throw error;
      toast({ title: 'Prioridade atualizada' });
      onSuccess?.();
      return true;
    } catch (err) {
      console.error('Error updating priority:', err);
      toast({ title: 'Erro', description: 'Não foi possível atualizar a prioridade.', variant: 'destructive' });
      return false;
    }
  }, [toast, onSuccess]);

  const updateTags = useCallback(async (conversationId: string, tags: string[]) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ tags, updated_at: new Date().toISOString() })
        .eq('id', conversationId);
      if (error) throw error;
      toast({ title: 'Tags atualizadas' });
      onSuccess?.();
      return true;
    } catch (err) {
      console.error('Error updating tags:', err);
      toast({ title: 'Erro', description: 'Não foi possível atualizar as tags.', variant: 'destructive' });
      return false;
    }
  }, [toast, onSuccess]);

  const snoozeConversation = useCallback(async (conversationId: string, snoozeUntil: Date) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({
          status: 'snoozed' as ConversationStatus,
          snoozed_until: snoozeUntil.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);
      if (error) throw error;
      toast({ title: 'Conversação adiada', description: `Será reaberta em ${snoozeUntil.toLocaleString('pt-BR')}` });
      onSuccess?.();
      return true;
    } catch (err) {
      console.error('Error snoozing conversation:', err);
      toast({ title: 'Erro', description: 'Não foi possível adiar a conversação.', variant: 'destructive' });
      return false;
    }
  }, [toast, onSuccess]);

  const markAsSpam = useCallback(async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({
          status: 'spam' as ConversationStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);
      if (error) throw error;
      toast({ title: 'Marcada como spam' });
      onSuccess?.();
      return true;
    } catch (err) {
      console.error('Error marking as spam:', err);
      toast({ title: 'Erro', variant: 'destructive' });
      return false;
    }
  }, [toast, onSuccess]);

  const markUnread = useCallback(async (conversationId: string, count: number = 1) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ unread_count: count, updated_at: new Date().toISOString() })
        .eq('id', conversationId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error marking unread:', err);
      return false;
    }
  }, []);

  const markRead = useCallback(async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ unread_count: 0, updated_at: new Date().toISOString() })
        .eq('id', conversationId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error marking read:', err);
      return false;
    }
  }, []);

  return {
    assignToMe,
    transferConversation,
    closeConversation,
    updateStatus,
    updatePriority,
    updateTags,
    snoozeConversation,
    markAsSpam,
    markUnread,
    markRead,
  };
}
