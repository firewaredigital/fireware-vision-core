import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Inbox,
  Search,
  Filter,
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
  email: <Mail className="h-3.5 w-3.5" />,
  chat: <MessageSquare className="h-3.5 w-3.5" />,
  phone: <Phone className="h-3.5 w-3.5" />,
  whatsapp: <Smartphone className="h-3.5 w-3.5 text-green-600" />,
  sms: <MessageSquare className="h-3.5 w-3.5 text-blue-500" />,
  social: <Globe className="h-3.5 w-3.5 text-purple-500" />,
  portal: <User className="h-3.5 w-3.5" />,
  internal: <Hash className="h-3.5 w-3.5" />,
};

const channelLabels: Record<string, string> = {
  email: 'Email',
  chat: 'Chat',
  phone: 'Telefone',
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  social: 'Social',
  portal: 'Portal',
  internal: 'Interno',
};

const statusConfig: Record<ConversationStatus, { color: string; label: string }> = {
  open: { color: 'bg-blue-500', label: 'Aberta' },
  waiting_customer: { color: 'bg-amber-500', label: 'Aguardando Cliente' },
  waiting_agent: { color: 'bg-orange-500', label: 'Aguardando Agente' },
  bot_handling: { color: 'bg-purple-500', label: 'Bot' },
  on_hold: { color: 'bg-gray-500', label: 'Em Espera' },
  snoozed: { color: 'bg-gray-400', label: 'Adiada' },
  closed: { color: 'bg-green-500', label: 'Fechada' },
  spam: { color: 'bg-red-500', label: 'Spam' },
};

const priorityConfig: Record<string, { color: string; label: string }> = {
  low: { color: 'text-muted-foreground', label: 'Baixa' },
  medium: { color: 'text-blue-600', label: 'Média' },
  high: { color: 'text-orange-600', label: 'Alta' },
  critical: { color: 'text-destructive', label: 'Crítica' },
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

  // Count by status for tabs
  const openCount = conversations.filter(c => ['open', 'waiting_agent'].includes(c.status)).length;
  const waitingCount = conversations.filter(c => c.status === 'waiting_customer').length;
  const closedCount = conversations.filter(c => c.status === 'closed').length;

  return (
    <div className="w-80 border-r flex flex-col bg-card">
      {/* Header */}
      <div className="p-3 border-b space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            Inbox
          </h2>
          <div className="flex items-center gap-1">
            <Select value={agentStatus} onValueChange={(v) => onUpdateAgentStatus(v as AgentStatus)}>
              <SelectTrigger className="h-7 w-auto text-xs px-2 gap-1">
                <div className={cn(
                  'h-2 w-2 rounded-full',
                  agentStatus === 'available' ? 'bg-green-500' :
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
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRefresh}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>

        {/* Quick tabs */}
        <Tabs value={statusFilter} onValueChange={onStatusFilterChange}>
          <TabsList className="w-full h-8">
            <TabsTrigger value="active" className="text-xs flex-1 h-7">
              Ativas {openCount > 0 && <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{openCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="waiting" className="text-xs flex-1 h-7">
              Aguardando {waitingCount > 0 && <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{waitingCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="closed" className="text-xs flex-1 h-7">
              Fechadas
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs flex-1 h-7">Todas</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Additional Filters */}
        <div className="flex gap-1.5">
          <Select value={channelFilter} onValueChange={onChannelFilterChange}>
            <SelectTrigger className="h-7 text-xs flex-1">
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
            <SelectTrigger className="h-7 text-xs flex-1">
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
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="animate-pulse flex gap-3">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Nenhuma conversação</p>
            <p className="text-xs mt-1">Ajuste os filtros ou aguarde novas interações</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredConversations.map((conv) => {
              const priority = priorityConfig[conv.priority] || priorityConfig.medium;
              const status = statusConfig[conv.status];

              return (
                <div
                  key={conv.id}
                  onClick={() => onSelect(conv)}
                  className={cn(
                    'p-3 cursor-pointer hover:bg-accent/50 transition-colors',
                    selectedId === conv.id && 'bg-accent border-l-2 border-l-primary',
                    conv.unread_count > 0 && selectedId !== conv.id && 'bg-primary/5'
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="relative">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className={cn(
                          'text-xs',
                          conv.priority === 'critical' && 'bg-destructive/10 text-destructive',
                          conv.priority === 'high' && 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400'
                        )}>
                          {getContactInitials(conv)}
                        </AvatarFallback>
                      </Avatar>
                      {/* Channel icon overlay */}
                      <div className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5 border">
                        {channelIcons[conv.channel] || <MessageSquare className="h-2.5 w-2.5" />}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={cn(
                          'text-sm truncate',
                          conv.unread_count > 0 ? 'font-semibold' : 'font-medium'
                        )}>
                          {getContactName(conv)}
                        </span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {conv.last_message_at
                            ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false, locale: ptBR })
                            : ''}
                        </span>
                      </div>

                      <p className={cn(
                        'text-xs truncate mt-0.5',
                        conv.unread_count > 0 ? 'text-foreground' : 'text-muted-foreground'
                      )}>
                        {conv.subject || conv.summary || conv.conversation_number}
                      </p>

                      <div className="flex items-center gap-1.5 mt-1">
                        <div className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', status.color)} />
                        <span className="text-[10px] text-muted-foreground">{status.label}</span>

                        {conv.unread_count > 0 && (
                          <Badge variant="destructive" className="h-4 px-1 text-[9px] ml-auto">
                            {conv.unread_count}
                          </Badge>
                        )}
                        {conv.sla_response_breached && (
                          <AlertCircle className="h-3 w-3 text-destructive flex-shrink-0" />
                        )}
                        {conv.priority === 'critical' && (
                          <Badge variant="destructive" className="h-4 px-1 text-[9px]">
                            Crítica
                          </Badge>
                        )}
                        {conv.priority === 'high' && (
                          <Badge variant="outline" className="h-4 px-1 text-[9px] border-orange-300 text-orange-600">
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
      <div className="border-t px-3 py-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{filteredConversations.length} conversas</span>
        <span>{conversations.filter(c => c.sla_response_breached).length} SLA violado</span>
      </div>
    </div>
  );
}
