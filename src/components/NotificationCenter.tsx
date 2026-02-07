import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Bell, Check, CheckCheck, Archive, X, ExternalLink,
  AlertTriangle, Info, CheckCircle, XCircle, MessageSquare,
  Users, Target, Ticket, Bot, Zap, Shield, BarChart3,
  ShoppingCart, Server, Link as LinkIcon, Database,
  FileText, DollarSign, Clock, Megaphone
} from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { toast } from 'sonner';

const TYPE_ICONS: Record<string, React.ElementType> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  mention: MessageSquare,
  assignment: Users,
  approval_request: Shield,
  approval_decision: CheckCircle,
  sla_breach: AlertTriangle,
  deal_update: BarChart3,
  ticket_update: Ticket,
  comment: MessageSquare,
  system: Info,
  ai_completion: Bot,
  workflow_trigger: Zap,
  lead_assigned: Target,
  opportunity_won: DollarSign,
  opportunity_lost: XCircle,
  contract_expiring: Clock,
  invoice_overdue: AlertTriangle,
  task_due: Clock,
  escalation: AlertTriangle,
  data_import: Database,
  integration_error: LinkIcon,
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  sales: BarChart3,
  service: Ticket,
  marketing: Megaphone,
  commerce: ShoppingCart,
  itsm: Server,
  ai: Bot,
  automation: Zap,
  governance: Shield,
  data: Database,
  system: Info,
  integrations: LinkIcon,
};

const CATEGORY_LABELS: Record<string, string> = {
  sales: 'Vendas',
  service: 'Atendimento',
  marketing: 'Marketing',
  commerce: 'Commerce',
  itsm: 'TI',
  ai: 'IA',
  automation: 'Automação',
  governance: 'Governança',
  data: 'Dados',
  system: 'Sistema',
  integrations: 'Integrações',
};

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'border-l-4 border-l-destructive bg-destructive/5',
  high: 'border-l-4 border-l-orange-500 bg-orange-500/5',
  normal: '',
  low: 'opacity-80',
};

function NotificationItem({
  notification,
  onRead,
  onArchive,
  onNavigate,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onArchive: (id: string) => void;
  onNavigate: (url: string) => void;
}) {
  const TypeIcon = TYPE_ICONS[notification.type] || Info;
  const priorityStyle = PRIORITY_STYLES[notification.priority] || '';

  const handleClick = () => {
    if (!notification.is_read) {
      onRead(notification.id);
    }
    if (notification.action_url) {
      onNavigate(notification.action_url);
    }
  };

  return (
    <div
      className={cn(
        'group flex gap-3 px-4 py-3 transition-colors cursor-pointer hover:bg-muted/50',
        !notification.is_read && 'bg-primary/5',
        priorityStyle
      )}
      onClick={handleClick}
    >
      {/* Icon */}
      <div className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
        notification.is_read ? 'bg-muted' : 'bg-primary/10'
      )}>
        <TypeIcon className={cn(
          'h-4 w-4',
          notification.is_read ? 'text-muted-foreground' : 'text-primary'
        )} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            'text-sm leading-tight',
            !notification.is_read && 'font-semibold'
          )}>
            {notification.title}
          </p>
          {!notification.is_read && (
            <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
          )}
        </div>
        {notification.body && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {notification.body}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          {notification.sender_name && (
            <span className="text-xs text-muted-foreground">
              {notification.sender_name}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.created_at), {
              addSuffix: true,
              locale: ptBR,
            })}
          </span>
          {notification.category && (
            <Badge variant="outline" className="text-[10px] h-4 px-1">
              {CATEGORY_LABELS[notification.category] || notification.category}
            </Badge>
          )}
        </div>
      </div>

      {/* Actions (visible on hover) */}
      <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {!notification.is_read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onRead(notification.id);
            }}
            title="Marcar como lida"
          >
            <Check className="h-3 w-3" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            onArchive(notification.id);
          }}
          title="Arquivar"
        >
          <Archive className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function NotificationCenter() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const {
    notifications,
    counts,
    isLoading,
    realtimeNew,
    clearRealtimeNew,
    markAsRead,
    markAllAsRead,
    archiveNotification,
  } = useNotifications();

  // Show toast for realtime notifications
  useEffect(() => {
    if (realtimeNew) {
      toast(realtimeNew.title, {
        description: realtimeNew.body || undefined,
        action: realtimeNew.action_url
          ? {
              label: realtimeNew.action_label || 'Ver',
              onClick: () => navigate(realtimeNew.action_url!),
            }
          : undefined,
      });
      clearRealtimeNew();
    }
  }, [realtimeNew, clearRealtimeNew, navigate]);

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const handleNavigate = (url: string) => {
    setOpen(false);
    navigate(url);
  };

  const unreadCount = counts.total;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className={cn(
              'absolute -right-1 -top-1 flex items-center justify-center rounded-full text-[10px] font-medium text-primary-foreground',
              unreadCount > 99 ? 'h-5 w-auto px-1 min-w-[20px]' : 'h-4 w-4',
              counts.urgent > 0 ? 'bg-destructive animate-pulse' : 'bg-primary'
            )}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="end" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Notificações</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs h-5">
                {unreadCount} nova{unreadCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => markAllAsRead()}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Ler tudo
              </Button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b bg-muted/30">
          <Button
            variant={filter === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-6 text-xs"
            onClick={() => setFilter('all')}
          >
            Todas
          </Button>
          <Button
            variant={filter === 'unread' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-6 text-xs"
            onClick={() => setFilter('unread')}
          >
            Não lidas
            {unreadCount > 0 && (
              <span className="ml-1 text-[10px] bg-primary text-primary-foreground rounded-full px-1.5">
                {unreadCount}
              </span>
            )}
          </Button>
        </div>

        {/* Notifications list */}
        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">
                {filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={markAsRead}
                  onArchive={archiveNotification}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground"
              onClick={() => {
                setOpen(false);
                navigate('/notifications');
              }}
            >
              Ver todas as notificações
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
