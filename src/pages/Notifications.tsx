import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Bell, Check, CheckCheck, Archive, Trash2,
  AlertTriangle, Info, CheckCircle, XCircle, MessageSquare,
  Users, Target, Bot, Zap, Shield, BarChart3,
  ShoppingCart, Server, Link as LinkIcon, Database,
  Ticket, DollarSign, Clock, Megaphone, Filter,
  Search, Settings, ExternalLink,
} from '@/components/icons';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { toast } from 'sonner';

const TYPE_ICONS: Record<string, React.ElementType> = {
  info: Info, success: CheckCircle, warning: AlertTriangle, error: XCircle,
  mention: MessageSquare, assignment: Users, approval_request: Shield,
  approval_decision: CheckCircle, sla_breach: AlertTriangle, deal_update: BarChart3,
  ticket_update: Ticket, comment: MessageSquare, system: Info,
  ai_completion: Bot, workflow_trigger: Zap, lead_assigned: Target,
  opportunity_won: DollarSign, opportunity_lost: XCircle,
  contract_expiring: Clock, invoice_overdue: AlertTriangle,
  task_due: Clock, escalation: AlertTriangle, data_import: Database,
  integration_error: LinkIcon,
};

const CATEGORY_LABELS: Record<string, string> = {
  sales: 'Vendas', service: 'Atendimento', marketing: 'Marketing',
  commerce: 'Commerce', itsm: 'TI', ai: 'IA', automation: 'Automação',
  governance: 'Governança', data: 'Dados', system: 'Sistema',
  integrations: 'Integrações',
};

const PRIORITY_LABELS: Record<string, { label: string; className: string }> = {
  urgent: { label: 'Urgente', className: 'bg-destructive text-destructive-foreground' },
  high: { label: 'Alta', className: 'bg-orange-500 text-white' },
  normal: { label: 'Normal', className: 'bg-secondary text-secondary-foreground' },
  low: { label: 'Baixa', className: 'bg-muted text-muted-foreground' },
};

export default function Notifications() {
  const navigate = useNavigate();
  const {
    notifications,
    counts,
    isLoading,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    archiveOld,
  } = useNotifications();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [tab, setTab] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = notifications.filter(n => {
    if (tab === 'unread' && n.is_read) return false;
    if (tab === 'read' && !n.is_read) return false;
    if (categoryFilter !== 'all' && n.category !== categoryFilter) return false;
    if (priorityFilter !== 'all' && n.priority !== priorityFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return n.title.toLowerCase().includes(term) ||
        n.body?.toLowerCase().includes(term) ||
        n.sender_name?.toLowerCase().includes(term);
    }
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(n => n.id)));
    }
  };

  const bulkMarkRead = () => {
    selectedIds.forEach(id => markAsRead(id));
    setSelectedIds(new Set());
    toast.success(`${selectedIds.size} notificação(ões) marcada(s) como lida(s)`);
  };

  const bulkArchive = () => {
    selectedIds.forEach(id => archiveNotification(id));
    setSelectedIds(new Set());
    toast.success(`${selectedIds.size} notificação(ões) arquivada(s)`);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Group by date
  const groups: { label: string; items: Notification[] }[] = [];
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const yesterdayStr = format(new Date(today.getTime() - 86400000), 'yyyy-MM-dd');

  const groupMap = new Map<string, Notification[]>();
  for (const n of filtered) {
    const dateStr = format(new Date(n.created_at), 'yyyy-MM-dd');
    let label: string;
    if (dateStr === todayStr) label = 'Hoje';
    else if (dateStr === yesterdayStr) label = 'Ontem';
    else label = format(new Date(n.created_at), "dd 'de' MMMM", { locale: ptBR });

    if (!groupMap.has(label)) groupMap.set(label, []);
    groupMap.get(label)!.push(n);
  }
  groupMap.forEach((items, label) => groups.push({ label, items }));

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Bell className="h-8 w-8 text-primary" />
              Notificações
            </h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} não lida${unreadCount !== 1 ? 's' : ''}` : 'Todas as notificações lidas'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                archiveOld(30);
                toast.success('Notificações antigas arquivadas');
              }}
            >
              <Archive className="h-4 w-4 mr-2" />
              Limpar Antigas
            </Button>
            {unreadCount > 0 && (
              <Button size="sm" onClick={() => markAllAsRead()}>
                <CheckCheck className="h-4 w-4 mr-2" />
                Marcar Tudo como Lido
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Não Lidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Urgentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{counts.urgent}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Alta Prioridade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{counts.high}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notifications.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar notificações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList>
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="unread">
                Não Lidas
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 text-[10px]">{unreadCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="read">Lidas</TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Categorias</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
            <span className="text-sm font-medium">{selectedIds.size} selecionada(s)</span>
            <Button variant="outline" size="sm" onClick={bulkMarkRead}>
              <Check className="h-3 w-3 mr-1" />
              Marcar como Lidas
            </Button>
            <Button variant="outline" size="sm" onClick={bulkArchive}>
              <Archive className="h-3 w-3 mr-1" />
              Arquivar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
              Cancelar
            </Button>
          </div>
        )}

        {/* Notification list */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Bell className="h-16 w-16 mb-4 opacity-30" />
                <p className="text-lg">Nenhuma notificação encontrada</p>
                <p className="text-sm mt-1">Ajuste os filtros ou aguarde novas notificações</p>
              </div>
            ) : (
              <div>
                {/* Select all header */}
                <div className="flex items-center gap-3 px-4 py-2 border-b bg-muted/30">
                  <Checkbox
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onCheckedChange={selectAll}
                  />
                  <span className="text-xs text-muted-foreground">
                    {filtered.length} notificação(ões)
                  </span>
                </div>

                {/* Grouped notifications */}
                {groups.map((group) => (
                  <div key={group.label}>
                    <div className="px-4 py-2 bg-muted/20 border-b">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {group.label}
                      </span>
                    </div>
                    {group.items.map((notification) => {
                      const TypeIcon = TYPE_ICONS[notification.type] || Info;
                      const priorityInfo = PRIORITY_LABELS[notification.priority];
                      const isSelected = selectedIds.has(notification.id);

                      return (
                        <div
                          key={notification.id}
                          className={cn(
                            'flex items-start gap-3 px-4 py-3 border-b transition-colors hover:bg-muted/30 group',
                            !notification.is_read && 'bg-primary/5',
                            notification.priority === 'urgent' && 'border-l-4 border-l-destructive',
                            notification.priority === 'high' && 'border-l-4 border-l-orange-500',
                          )}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(notification.id)}
                            className="mt-1"
                          />
                          <div
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                              notification.is_read ? 'bg-muted' : 'bg-primary/10'
                            )}
                          >
                            <TypeIcon className={cn('h-4 w-4', notification.is_read ? 'text-muted-foreground' : 'text-primary')} />
                          </div>
                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => {
                              if (!notification.is_read) markAsRead(notification.id);
                              if (notification.action_url) navigate(notification.action_url);
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className={cn('text-sm', !notification.is_read && 'font-semibold')}>
                                {notification.title}
                              </p>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}
                              </span>
                            </div>
                            {notification.body && (
                              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{notification.body}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              {notification.sender_name && (
                                <span className="text-xs text-muted-foreground">por {notification.sender_name}</span>
                              )}
                              {notification.category && (
                                <Badge variant="outline" className="text-[10px] h-4">
                                  {CATEGORY_LABELS[notification.category] || notification.category}
                                </Badge>
                              )}
                              {notification.entity_name && (
                                <Badge variant="secondary" className="text-[10px] h-4">
                                  {notification.entity_name}
                                </Badge>
                              )}
                              {priorityInfo && notification.priority !== 'normal' && (
                                <Badge className={cn('text-[10px] h-4', priorityInfo.className)}>
                                  {priorityInfo.label}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            {!notification.is_read && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => markAsRead(notification.id)} title="Marcar como lida">
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            {notification.action_url && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(notification.action_url!)} title="Abrir">
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => archiveNotification(notification.id)} title="Arquivar">
                              <Archive className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
