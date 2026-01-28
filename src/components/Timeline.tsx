import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { 
  UserPlus, TrendingUp, FileText, Phone, Mail, Calendar, 
  CheckCircle, AlertCircle, MessageSquare, Building, Target
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Database } from '@/integrations/supabase/types';

type TimelineEventType = Database['public']['Enums']['timeline_event_type'];

interface TimelineEvent {
  id: string;
  event_type: TimelineEventType;
  title: string;
  description: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

interface TimelineProps {
  accountId?: string;
  contactId?: string;
  opportunityId?: string;
  leadId?: string;
  quoteId?: string;
  maxHeight?: string;
}

const eventIcons: Record<TimelineEventType, React.ElementType> = {
  lead_created: UserPlus,
  lead_converted: Target,
  opportunity_created: TrendingUp,
  opportunity_stage_changed: TrendingUp,
  opportunity_won: CheckCircle,
  opportunity_lost: AlertCircle,
  quote_created: FileText,
  quote_sent: Mail,
  activity_completed: CheckCircle,
  note_added: MessageSquare,
  contact_added: UserPlus,
  account_created: Building,
};

const eventColors: Record<TimelineEventType, string> = {
  lead_created: 'bg-blue-100 text-blue-700',
  lead_converted: 'bg-green-100 text-green-700',
  opportunity_created: 'bg-purple-100 text-purple-700',
  opportunity_stage_changed: 'bg-yellow-100 text-yellow-700',
  opportunity_won: 'bg-green-100 text-green-700',
  opportunity_lost: 'bg-red-100 text-red-700',
  quote_created: 'bg-indigo-100 text-indigo-700',
  quote_sent: 'bg-cyan-100 text-cyan-700',
  activity_completed: 'bg-emerald-100 text-emerald-700',
  note_added: 'bg-gray-100 text-gray-700',
  contact_added: 'bg-teal-100 text-teal-700',
  account_created: 'bg-orange-100 text-orange-700',
};

export function Timeline({ accountId, contactId, opportunityId, leadId, quoteId, maxHeight = '400px' }: TimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      let query = supabase
        .from('timeline_events')
        .select('id, event_type, title, description, created_at, metadata')
        .order('created_at', { ascending: false })
        .limit(50);

      if (accountId) query = query.eq('account_id', accountId);
      if (contactId) query = query.eq('contact_id', contactId);
      if (opportunityId) query = query.eq('opportunity_id', opportunityId);
      if (leadId) query = query.eq('lead_id', leadId);
      if (quoteId) query = query.eq('quote_id', quoteId);

      const { data, error } = await query;
      
      if (!error && data) {
        setEvents(data.map(e => ({
          ...e,
          metadata: e.metadata as Record<string, unknown> | null
        })));
      }
      setLoading(false);
    }

    fetchEvents();
  }, [accountId, contactId, opportunityId, leadId, quoteId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No timeline events yet</p>
      </div>
    );
  }

  return (
    <ScrollArea style={{ maxHeight }}>
      <div className="relative pl-6 space-y-6">
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />
        
        {events.map((event) => {
          const Icon = eventIcons[event.event_type] || Calendar;
          const colorClass = eventColors[event.event_type] || 'bg-gray-100 text-gray-700';
          
          return (
            <div key={event.id} className="relative flex gap-3">
              <div className={`absolute -left-6 w-6 h-6 rounded-full flex items-center justify-center ${colorClass}`}>
                <Icon className="h-3 w-3" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{event.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {event.event_type.replace(/_/g, ' ')}
                  </Badge>
                </div>
                {event.description && (
                  <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(event.created_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
