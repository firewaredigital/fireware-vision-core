import { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface Notification {
  id: string;
  organization_id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: string;
  priority: string;
  category: string | null;
  entity_type: string | null;
  entity_id: string | null;
  entity_name: string | null;
  action_url: string | null;
  action_label: string | null;
  sender_id: string | null;
  sender_name: string | null;
  icon: string | null;
  is_read: boolean;
  read_at: string | null;
  is_archived: boolean;
  archived_at: string | null;
  is_actioned: boolean;
  group_key: string | null;
  group_count: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface NotificationCounts {
  total: number;
  urgent: number;
  high: number;
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [realtimeNew, setRealtimeNew] = useState<Notification | null>(null);

  // Fetch unread count
  const { data: counts } = useQuery({
    queryKey: ['notification-counts', user?.id],
    queryFn: async (): Promise<NotificationCounts> => {
      if (!user?.id) return { total: 0, urgent: 0, high: 0 };

      const { data, error } = await supabase.rpc('get_notification_counts', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching notification counts:', error);
        return { total: 0, urgent: 0, high: 0 };
      }

      const result = data as unknown as NotificationCounts;
      return {
        total: result?.total || 0,
        urgent: result?.urgent || 0,
        high: result?.high || 0,
      };
    },
    enabled: !!user?.id,
    refetchInterval: 60_000, // Refresh every minute as fallback
    staleTime: 30_000,
  });

  // Fetch recent notifications (paginated)
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async (): Promise<Notification[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      return (data || []) as unknown as Notification[];
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  // Mark single as read
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-counts'] });
    },
  });

  // Mark all as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('No user');
      const { data, error } = await supabase.rpc('mark_all_notifications_read', {
        p_user_id: user.id,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-counts'] });
    },
  });

  // Archive notification
  const archiveNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_archived: true, archived_at: new Date().toISOString() })
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-counts'] });
    },
  });

  // Archive old read notifications
  const archiveOld = useMutation({
    mutationFn: async (daysOld: number = 30) => {
      if (!user?.id) throw new Error('No user');
      const { data, error } = await supabase.rpc('archive_old_notifications', {
        p_user_id: user.id,
        p_days_old: daysOld,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-counts'] });
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const newNotification = payload.new as unknown as Notification;
          setRealtimeNew(newNotification);

          // Invalidate queries to refresh UI
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['notification-counts'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Clear realtime notification after being consumed
  const clearRealtimeNew = useCallback(() => {
    setRealtimeNew(null);
  }, []);

  return {
    notifications: notifications || [],
    counts: counts || { total: 0, urgent: 0, high: 0 },
    isLoading,
    realtimeNew,
    clearRealtimeNew,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    archiveNotification: archiveNotification.mutate,
    archiveOld: archiveOld.mutate,
  };
}
