import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Inbox, 
  Search, 
  Filter, 
  MessageSquare, 
  Phone, 
  Mail, 
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  Send,
  Paperclip,
  MoreVertical,
  UserPlus,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { useConversations, useConversationMessages, useAgentStatus, Conversation, ConversationStatus } from '@/hooks/useConversations';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const channelIcons: Record<string, React.ReactNode> = {
  email: <Mail className="h-4 w-4" />,
  chat: <MessageSquare className="h-4 w-4" />,
  phone: <Phone className="h-4 w-4" />,
  whatsapp: <MessageSquare className="h-4 w-4 text-green-500" />,
  sms: <MessageSquare className="h-4 w-4 text-blue-500" />,
  portal: <User className="h-4 w-4" />,
};

const statusColors: Record<ConversationStatus, string> = {
  open: 'bg-blue-500',
  waiting_customer: 'bg-yellow-500',
  waiting_agent: 'bg-orange-500',
  bot_handling: 'bg-purple-500',
  on_hold: 'bg-gray-500',
  snoozed: 'bg-gray-400',
  closed: 'bg-green-500',
  spam: 'bg-red-500',
};

const statusLabels: Record<ConversationStatus, string> = {
  open: 'Aberta',
  waiting_customer: 'Aguardando Cliente',
  waiting_agent: 'Aguardando Agente',
  bot_handling: 'Bot',
  on_hold: 'Em Espera',
  snoozed: 'Adiada',
  closed: 'Fechada',
  spam: 'Spam',
};

export default function OmnichannelInbox() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [newMessage, setNewMessage] = useState('');
  
  const { status: agentStatus, updateStatus } = useAgentStatus();
  const { conversations, loading, assignToMe, closeConversation, refetch } = useConversations({
    status: statusFilter === 'all' ? undefined : statusFilter as ConversationStatus,
  });
  const { messages, loading: messagesLoading } = useConversationMessages(selectedConversation?.id || null);

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      conv.conversation_number.toLowerCase().includes(search) ||
      conv.subject?.toLowerCase().includes(search) ||
      conv.contact?.first_name?.toLowerCase().includes(search) ||
      conv.contact?.last_name?.toLowerCase().includes(search) ||
      conv.contact?.email?.toLowerCase().includes(search)
    );
  });

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    // TODO: Implement message sending
    setNewMessage('');
  };

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

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* Left Panel - Conversation List */}
        <div className="w-80 border-r flex flex-col bg-card">
          {/* Header */}
          <div className="p-4 border-b space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Inbox className="h-5 w-5" />
                Inbox
              </h2>
              <div className="flex items-center gap-2">
                <Badge variant={agentStatus === 'available' ? 'default' : 'secondary'} className="text-xs">
                  {agentStatus === 'available' ? 'Disponível' : 'Indisponível'}
                </Badge>
                <Button variant="ghost" size="icon" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conversas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filters */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="open">Abertas</SelectItem>
                <SelectItem value="waiting_agent">Aguardando Agente</SelectItem>
                <SelectItem value="waiting_customer">Aguardando Cliente</SelectItem>
                <SelectItem value="closed">Fechadas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conversation List */}
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">Carregando...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma conversação encontrada</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={cn(
                      'p-3 cursor-pointer hover:bg-accent transition-colors',
                      selectedConversation?.id === conv.id && 'bg-accent'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-xs">
                          {getContactInitials(conv)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium truncate">{getContactName(conv)}</span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {conv.last_message_at && formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {channelIcons[conv.channel]}
                          <span className="text-sm text-muted-foreground truncate">
                            {conv.subject || conv.conversation_number}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={cn('h-2 w-2 rounded-full', statusColors[conv.status])} />
                          <span className="text-xs text-muted-foreground">{statusLabels[conv.status]}</span>
                          {conv.unread_count > 0 && (
                            <Badge variant="destructive" className="text-xs px-1.5 py-0">
                              {conv.unread_count}
                            </Badge>
                          )}
                          {conv.sla_response_breached && (
                            <AlertCircle className="h-3 w-3 text-destructive" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Center Panel - Conversation Thread */}
        <div className="flex-1 flex flex-col bg-background">
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{getContactInitials(selectedConversation)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{getContactName(selectedConversation)}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedConversation.conversation_number} • {selectedConversation.contact?.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!selectedConversation.owner_id && (
                    <Button size="sm" onClick={() => assignToMe(selectedConversation.id)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Assumir
                    </Button>
                  )}
                  {selectedConversation.status !== 'closed' && (
                    <Button size="sm" variant="outline" onClick={() => closeConversation(selectedConversation.id)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Resolver
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Transferir</DropdownMenuItem>
                      <DropdownMenuItem>Adiar</DropdownMenuItem>
                      <DropdownMenuItem>Marcar como Spam</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="text-center text-muted-foreground">Carregando mensagens...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma mensagem nesta conversação</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          'flex gap-3',
                          msg.sender_type === 'agent' && 'flex-row-reverse'
                        )}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {msg.sender_type === 'agent' ? 'AG' : 'CL'}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={cn(
                            'max-w-[70%] rounded-lg p-3',
                            msg.sender_type === 'agent' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted',
                            msg.is_internal && 'border-2 border-dashed border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
                          )}
                        >
                          {msg.is_internal && (
                            <Badge variant="outline" className="mb-2 text-xs">Nota Interna</Badge>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <span className="text-xs opacity-70 mt-1 block">
                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Reply Box */}
              {selectedConversation.status !== 'closed' && (
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Digite sua mensagem..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Inbox className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-medium">Selecione uma conversação</h3>
                <p className="text-sm">Escolha uma conversação da lista para visualizar</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Customer Context */}
        {selectedConversation && (
          <div className="w-72 border-l bg-card p-4 space-y-4">
            <h3 className="font-semibold">Contexto do Cliente</h3>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>Nome:</strong> {getContactName(selectedConversation)}</p>
                <p><strong>Email:</strong> {selectedConversation.contact?.email || '-'}</p>
                <p><strong>Telefone:</strong> {selectedConversation.contact?.phone || '-'}</p>
              </CardContent>
            </Card>

            {selectedConversation.account && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Conta</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p>{selectedConversation.account.name}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Detalhes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>Canal:</strong> {selectedConversation.channel}</p>
                <p><strong>Prioridade:</strong> {selectedConversation.priority}</p>
                <p><strong>Mensagens:</strong> {selectedConversation.message_count}</p>
                <p><strong>Criada:</strong> {formatDistanceToNow(new Date(selectedConversation.created_at), { addSuffix: true, locale: ptBR })}</p>
              </CardContent>
            </Card>

            {selectedConversation.owner && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Atribuído a</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p>{selectedConversation.owner.first_name} {selectedConversation.owner.last_name}</p>
                  <p className="text-muted-foreground">{selectedConversation.owner.email}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
