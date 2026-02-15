import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Inbox,
  Search,
  MessageSquare,
  Phone,
  Mail,
  User,
  AlertCircle,
  RefreshCw,
  Hash,
  Globe,
  Smartphone,
} from '@/components/icons';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Conversation, ConversationStatus, ConversationChannel, AgentStatus } from '@/hooks/useConversations';

const channelIcons: Record<string, React.ReactNode> = {
  email: <Mail className="h-2 w-2" />,
  chat: <MessageSquare className="h-2 w-2" />,
  phone: <Phone className="h-2 w-2" />,
  whatsapp: <Smartphone className="h-2 w-2" />,
  sms: <MessageSquare className="h-2 w-2" />,
  social: <Globe className="h-2 w-2" />,
  portal: <User className="h-2 w-2" />,
  internal: <Hash className="h-2 w-2" />,
};

const channelBorderColors: Record<string, string> = {
  whatsapp: 'ring-green-500',
  email: 'ring-blue-500',
  chat: 'ring-purple-500',
  phone: 'ring-gray-500',
  sms: 'ring-sky-500',
  social: 'ring-pink-500',
  portal: 'ring-indigo-500',
  internal: 'ring-gray-400',
};

const statusConfig: Record<ConversationStatus, { color: string; label: string }> = {
  open: { color: 'bg-blue-500', label: 'Aberta' },
  waiting_customer: { color: 'bg-amber-500', label: 'Aguardando' },
  waiting_agent: { color: 'bg-orange-500', label: 'Ag. Agente' },
  bot_handling: { color: 'bg-purple-500', label: 'Bot' },
  on_hold: { color: 'bg-gray-500', label: 'Espera' },
  snoozed: { color: 'bg-gray-400', label: 'Adiada' },
  closed: { color: 'bg-green-500', label: 'Fechada' },
  spam: { color: 'bg-red-500', label: 'Spam' },
};

interface InboxConversationListProps {
  conversations: Conversation[];
  loading: boolean;
  selectedId: string | null;
  agentStatus: AgentStatus;
  onSelect: (conversation: Conversation) => void;
  onRefresh: () => void;
  onUpdateAgentStatus: (status: AgentStatus) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  channelFilter: string;
  onChannelFilterChange: (value: string) => void;
  ownerFilter: string;
  onOwnerFilterChange: (value: string) => void;
}

export function InboxConversationList({
  conversations,
  loading,
  selectedId,
  agentStatus,
  onSelect,
  onRefresh,
  onUpdateAgentStatus,
  statusFilter,
  onStatusFilterChange,
  channelFilter,
  onChannelFilterChange,
  ownerFilter,
  onOwnerFilterChange,
}: InboxConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      conv.conversation_number.toLowerCase().includes(search) ||
      conv.subject?.toLowerCase().includes(search) ||
      conv.contact?.first_name?.toLowerCase().includes(search) ||
      conv.contact?.last_name?.toLowerCase().includes(search) ||
      conv.contact?.email?.toLowerCase().includes(search) ||
      conv.account?.name?.toLowerCase().includes(search) ||
      conv.summary?.toLowerCase().includes(search)
    );
  });

  const getContactName = (conv: Conversation) => {
    if (conv.contact?.first_name || conv.contact?.last_name) {
      return `${conv.contact.first_name || ''} ${conv.contact.last_name || ''}`.trim();
    }
    return conv.contact?.email || 'Cliente';
  };

  const getContactInitials = (conv: Conversation) => {
    const name = getContactName(conv);
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const openCount = conversations.filter(c => ['open', 'waiting_agent'].includes(c.status)).length;
  const waitingCount = conversations.filter(c => c.status === 'waiting_customer').length;
  const closedCount = conversations.filter(c => c.status === 'closed').length;
  const slaBreachedCount = conversations.filter(c => c.sla_response_breached).length;

  return (
    <div className="w-[300px] flex flex-col bg-card shadow-[2px_0_8px_-2px_rgba(0,0,0,0.06)]">
      {/* Header */}
      <div className="p-2.5 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="bg-primary/10 p-0.5 rounded-md">
              <Inbox className="h-3 w-3 text-primary" />
            </div>
            <h2 className="text-xs font-bold">Inbox</h2>
          </div>
          <div className="flex items-center gap-1">
            <Select value={agentStatus} onValueChange={(v) => onUpdateAgentStatus(v as AgentStatus)}>
              <SelectTrigger className="h-6 w-auto text-[10px] px-2 gap-1 rounded-full bg-muted/50 border-0">
                <div className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  agentStatus === 'available' ? 'bg-green-500 animate-pulse' :
                  agentStatus === 'busy' ? 'bg-red-500' :
                  agentStatus === 'away' ? 'bg-amber-500' : 'bg-gray-400'
                )} />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Disponível</SelectItem>
                <SelectItem value="busy">Ocupado</SelectItem>
                <SelectItem value="away">Ausente</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="in_meeting">Em Reunião</SelectItem>
                <SelectItem value="on_break">Em Pausa</SelectItem>
                <SelectItem value="after_call_work">Pós-Atendimento</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg" onClick={onRefresh}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/70" />
          <Input
            placeholder="Buscar por nome, email, assunto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-8 text-[11px] bg-muted/50 border-0 rounded-xl backdrop-blur-sm"
          />
        </div>

        {/* Status Tabs - Pill shaped */}
        <div className="flex gap-0.5 p-0.5 bg-muted/30 rounded-full">
          {[
            { value: 'active', label: 'Ativas', count: openCount },
            { value: 'waiting', label: 'Aguard.', count: waitingCount },
            { value: 'closed', label: 'Fechadas', count: closedCount },
            { value: 'all', label: 'Todas', count: 0 },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => onStatusFilterChange(tab.value)}
              className={cn(
                'flex-1 flex items-center justify-center gap-0.5 rounded-full py-0.5 text-[10px] font-medium transition-all duration-200',
                statusFilter === tab.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={cn(
                  'h-3 min-w-[12px] px-0.5 rounded-full text-[7px] font-bold flex items-center justify-center',
                  statusFilter === tab.value
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-1.5">
          <Select value={channelFilter} onValueChange={onChannelFilterChange}>
            <SelectTrigger className="h-6 text-[10px] flex-1 rounded-full bg-muted/50 border-0">
              <SelectValue placeholder="Canal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os canais</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="chat">Chat</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="phone">Telefone</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="social">Social</SelectItem>
              <SelectItem value="portal">Portal</SelectItem>
            </SelectContent>
          </Select>
          <Select value={ownerFilter} onValueChange={onOwnerFilterChange}>
            <SelectTrigger className="h-6 text-[10px] flex-1 rounded-full bg-muted/50 border-0">
              <SelectValue placeholder="Atribuição" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="mine">Minhas</SelectItem>
              <SelectItem value="unassigned">Sem dono</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-3 space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="animate-pulse flex gap-1.5 mx-1.5 px-2 py-1.5 rounded-xl bg-muted/30">
                <div className="h-7 w-7 rounded-full bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 bg-muted rounded-full w-3/4" />
                  <div className="h-2.5 bg-muted rounded-full w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-5 text-center text-muted-foreground">
            <div className="h-8 w-8 mx-auto mb-2 rounded-xl bg-muted/50 flex items-center justify-center">
              <MessageSquare className="h-4 w-4 opacity-30" />
            </div>
            <p className="text-xs font-medium">Nenhuma conversação</p>
            <p className="text-[10px] mt-0.5 text-muted-foreground/70">Ajuste os filtros ou aguarde novas interações</p>
          </div>
        ) : (
          <div className="px-1.5 py-0.5 space-y-px">
            {filteredConversations.map((conv) => {
              const status = statusConfig[conv.status];
              const isSelected = selectedId === conv.id;
              const isUnread = conv.unread_count > 0 && !isSelected;

              return (
                  <div
                    key={conv.id}
                    onClick={() => onSelect(conv)}
                    className={cn(
                      'px-2 py-1.5 cursor-pointer rounded-xl transition-all duration-200 group',
                      isSelected
                        ? 'bg-primary/[0.08] border-l-[3px] border-l-primary shadow-sm'
                        : 'hover:bg-accent/30 hover:translate-x-0.5 border-l-[3px] border-l-transparent',
                      isUnread && 'bg-primary/5'
                    )}
                  >
                    <div className="flex items-start gap-1.5">
                      <div className="relative">
                        <Avatar className={cn(
                          'h-7 w-7 ring-1',
                        channelBorderColors[conv.channel] || 'ring-muted'
                      )}>
                        <AvatarFallback className={cn(
                          'text-[10px] font-medium',
                          conv.priority === 'critical' && 'bg-destructive/10 text-destructive',
                          conv.priority === 'high' && 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400'
                        )}>
                          {getContactInitials(conv)}
                        </AvatarFallback>
                      </Avatar>
                      {/* Channel icon overlay */}
                      <div className="absolute -bottom-0.5 -right-0.5 bg-card rounded-full p-[1px] shadow-sm">
                        {channelIcons[conv.channel] || <MessageSquare className="h-2 w-2" />}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={cn(
                          'text-xs truncate',
                          isUnread ? 'font-semibold text-foreground' : 'font-medium'
                        )}>
                          {getContactName(conv)}
                        </span>
                        <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                          {conv.last_message_at
                            ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false, locale: ptBR })
                            : ''}
                        </span>
                      </div>

                      <p className={cn(
                        'text-[11px] truncate line-clamp-1',
                        isUnread ? 'text-foreground font-medium' : 'text-muted-foreground'
                      )}>
                        {conv.subject || conv.summary || conv.conversation_number}
                      </p>

                      <div className="flex items-center gap-1 mt-0.5">
                        <div className={cn('h-1 w-1 rounded-full flex-shrink-0', status.color)} />
                        <span className="text-[9px] text-muted-foreground">{status.label}</span>

                        {isUnread && (
                          <Badge variant="destructive" className="h-3 min-w-[12px] px-0.5 text-[7px] ml-auto animate-pulse">
                            {conv.unread_count}
                          </Badge>
                        )}
                        {conv.sla_response_breached && (
                          <AlertCircle className="h-2 w-2 text-destructive flex-shrink-0" />
                        )}
                        {conv.priority === 'critical' && (
                          <Badge variant="destructive" className="h-3 px-1 text-[7px] animate-pulse">
                            Crítica
                          </Badge>
                        )}
                        {conv.priority === 'high' && !isUnread && (
                          <Badge variant="outline" className="h-3 px-1 text-[7px] border-orange-300 text-orange-600">
                            Alta
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Footer Stats */}
      <div className="px-3 py-1.5 bg-muted/30 rounded-t-xl flex items-center justify-between text-[9px] text-muted-foreground">
        <span className="font-medium">{filteredConversations.length} conversas</span>
        {slaBreachedCount > 0 && (
          <span className="flex items-center gap-1 text-destructive font-semibold">
            <AlertCircle className="h-2.5 w-2.5" />
            {slaBreachedCount} SLA violado
          </span>
        )}
      </div>
    </div>
  );
}
