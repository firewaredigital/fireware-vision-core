import { 
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  MessageSquare,
  Play,
  Pause,
  XCircle,
  User,
  UserPlus,
  Flag
} from '@/components/icons';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type TicketStatus = 'new' | 'open' | 'pending' | 'on_hold' | 'resolved' | 'closed';

interface StatusHistoryItem {
  id: string;
  old_status: TicketStatus | null;
  new_status: TicketStatus;
  changed_by: string | null;
  reason?: string;
  duration_minutes?: number;
  created_at: string;
  changed_by_user?: {
    first_name: string;
    last_name: string;
  } | null;
}

interface TicketTimelineProps {
  statusHistory: StatusHistoryItem[];
  ticket: {
    created_at: string;
    assigned_at?: string;
    first_response_at?: string;
    resolved_at?: string;
    closed_at?: string;
    is_escalated?: boolean;
    escalated_at?: string;
  };
}

const statusIcons: Record<TicketStatus, React.ReactNode> = {
  new: <AlertCircle className="h-4 w-4" />,
  open: <Play className="h-4 w-4" />,
  pending: <Clock className="h-4 w-4" />,
  on_hold: <Pause className="h-4 w-4" />,
  resolved: <CheckCircle2 className="h-4 w-4" />,
  closed: <XCircle className="h-4 w-4" />,
};

const statusLabels: Record<TicketStatus, string> = {
  new: 'Novo',
  open: 'Aberto',
  pending: 'Pendente',
  on_hold: 'Em Espera',
  resolved: 'Resolvido',
  closed: 'Fechado',
};

const statusColors: Record<TicketStatus, string> = {
  new: 'text-blue-500 bg-blue-100',
  open: 'text-orange-500 bg-orange-100',
  pending: 'text-yellow-600 bg-yellow-100',
  on_hold: 'text-gray-500 bg-gray-100',
  resolved: 'text-green-500 bg-green-100',
  closed: 'text-slate-600 bg-slate-100',
};

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutos`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} horas`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days} dias`;
}

export function TicketTimeline({ statusHistory, ticket }: TicketTimelineProps) {
  // Build timeline events from various sources
  const timelineEvents: Array<{
    id: string;
    type: 'status' | 'assignment' | 'response' | 'escalation' | 'creation';
    title: string;
    description?: string;
    timestamp: string;
    icon: React.ReactNode;
    iconBg: string;
    user?: string;
    duration?: number;
  }> = [];

  // Add creation event
  timelineEvents.push({
    id: 'creation',
    type: 'creation',
    title: 'Ticket criado',
    timestamp: ticket.created_at,
    icon: <MessageSquare className="h-4 w-4" />,
    iconBg: 'text-blue-500 bg-blue-100',
  });

  // Add assignment event if exists
  if (ticket.assigned_at) {
    timelineEvents.push({
      id: 'assignment',
      type: 'assignment',
      title: 'Ticket atribuído',
      timestamp: ticket.assigned_at,
      icon: <UserPlus className="h-4 w-4" />,
      iconBg: 'text-purple-500 bg-purple-100',
    });
  }

  // Add first response event if exists
  if (ticket.first_response_at) {
    timelineEvents.push({
      id: 'first-response',
      type: 'response',
      title: 'Primeira resposta enviada',
      timestamp: ticket.first_response_at,
      icon: <MessageSquare className="h-4 w-4" />,
      iconBg: 'text-green-500 bg-green-100',
    });
  }

  // Add escalation event if exists
  if (ticket.is_escalated && ticket.escalated_at) {
    timelineEvents.push({
      id: 'escalation',
      type: 'escalation',
      title: 'Ticket escalado',
      timestamp: ticket.escalated_at,
      icon: <Flag className="h-4 w-4" />,
      iconBg: 'text-red-500 bg-red-100',
    });
  }

  // Add status history events
  statusHistory.forEach((item) => {
    if (!item.old_status) return; // Skip initial status
    
    timelineEvents.push({
      id: item.id,
      type: 'status',
      title: `Status alterado para ${statusLabels[item.new_status]}`,
      description: item.old_status 
        ? `De ${statusLabels[item.old_status]}`
        : undefined,
      timestamp: item.created_at,
      icon: statusIcons[item.new_status],
      iconBg: statusColors[item.new_status],
      user: item.changed_by_user 
        ? `${item.changed_by_user.first_name} ${item.changed_by_user.last_name}`
        : undefined,
      duration: item.duration_minutes,
    });
  });

  // Sort by timestamp descending (most recent first)
  timelineEvents.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (timelineEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-lg font-medium">Nenhum evento registrado</h3>
        <p className="text-muted-foreground text-sm mt-1">
          O histórico de alterações aparecerá aqui
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

      <div className="space-y-6">
        {timelineEvents.map((event, index) => (
          <div key={event.id} className="relative flex gap-4 pl-10">
            {/* Icon */}
            <div 
              className={cn(
                'absolute left-0 flex h-8 w-8 items-center justify-center rounded-full',
                event.iconBg
              )}
            >
              {event.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{event.title}</span>
                {event.description && (
                  <>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {event.description}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span>
                  {formatDistanceToNow(new Date(event.timestamp), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
                <span className="text-muted-foreground/50">•</span>
                <span>
                  {format(new Date(event.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
                {event.user && (
                  <>
                    <span className="text-muted-foreground/50">•</span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {event.user}
                    </span>
                  </>
                )}
                {event.duration !== undefined && event.duration > 0 && (
                  <>
                    <span className="text-muted-foreground/50">•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Duração: {formatDuration(event.duration)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
