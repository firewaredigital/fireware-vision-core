import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Building2,
  Clock,
  MessageSquare,
  Phone,
  Mail,
  Ticket,
  ShoppingCart,
  ExternalLink,
  Activity,
  TrendingUp,
} from '@/components/icons';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import type { Conversation } from '@/hooks/useConversations';

interface InboxContextPanelProps {
  conversation: Conversation;
}

export function InboxContextPanel({ conversation }: InboxContextPanelProps) {
  const navigate = useNavigate();

  const { data: recentTickets = [] } = useQuery({
    queryKey: ['inbox-context-tickets', conversation.contact_id],
    queryFn: async () => {
      if (!conversation.contact_id) return [];
      const { data, error } = await supabase
        .from('tickets')
        .select('id, ticket_number, subject, status, priority, created_at')
        .eq('contact_id', conversation.contact_id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!conversation.contact_id,
  });

  const { data: recentOrders = [] } = useQuery({
    queryKey: ['inbox-context-orders', conversation.account_id],
    queryFn: async () => {
      if (!conversation.account_id) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, status, grand_total, created_at')
        .eq('account_id', conversation.account_id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!conversation.account_id,
  });

  const { data: otherConversations = [] } = useQuery({
    queryKey: ['inbox-context-conversations', conversation.contact_id, conversation.id],
    queryFn: async () => {
      if (!conversation.contact_id) return [];
      const { data, error } = await supabase
        .from('conversations')
        .select('id, conversation_number, channel, status, subject, created_at')
        .eq('contact_id', conversation.contact_id)
        .neq('id', conversation.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!conversation.contact_id,
  });

  const { data: recentActivities = [] } = useQuery({
    queryKey: ['inbox-context-activities', conversation.contact_id],
    queryFn: async () => {
      if (!conversation.contact_id) return [];
      const { data, error } = await supabase
        .from('activities')
        .select('id, subject, type, status, created_at')
        .eq('contact_id', conversation.contact_id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!conversation.contact_id,
  });

  const { data: opportunities = [] } = useQuery({
    queryKey: ['inbox-context-opportunities', conversation.account_id],
    queryFn: async () => {
      if (!conversation.account_id) return [];
      const { data, error } = await supabase
        .from('opportunities')
        .select('id, name, stage, amount, probability, created_at')
        .eq('account_id', conversation.account_id)
        .not('stage', 'in', '("closed_won","closed_lost")')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!conversation.account_id,
  });

  const statusColors: Record<string, string> = {
    open: 'bg-blue-500',
    new: 'bg-blue-500',
    in_progress: 'bg-amber-500',
    waiting: 'bg-orange-500',
    resolved: 'bg-green-500',
    closed: 'bg-gray-500',
    pending: 'bg-amber-500',
    processing: 'bg-blue-500',
    shipped: 'bg-purple-500',
    delivered: 'bg-green-500',
    cancelled: 'bg-red-500',
  };

  const contactName = conversation.contact
    ? `${conversation.contact.first_name || ''} ${conversation.contact.last_name || ''}`.trim()
    : 'Sem contato vinculado';

  return (
    <div className="w-[280px] bg-card flex flex-col shadow-[-2px_0_8px_-2px_rgba(0,0,0,0.06)]">
      {/* Header */}
      <div className="p-3 flex items-center gap-2 shadow-[0_1px_4px_-1px_rgba(0,0,0,0.04)]">
        <div className="bg-primary/10 p-1 rounded-lg">
          <User className="h-3.5 w-3.5 text-primary" />
        </div>
        <h3 className="text-xs font-bold">Contexto 360</h3>
      </div>

      <ScrollArea className="flex-1">
        <Tabs defaultValue="contact" className="w-full">
          <div className="px-2.5 pt-1.5">
            <TabsList className="w-full h-7 bg-muted/30 rounded-full p-0.5">
              <TabsTrigger value="contact" className="text-[9px] flex-1 h-6 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <User className="h-2.5 w-2.5 mr-0.5" />
                Contato
              </TabsTrigger>
              <TabsTrigger value="history" className="text-[9px] flex-1 h-6 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Clock className="h-2.5 w-2.5 mr-0.5" />
                Histórico
              </TabsTrigger>
              <TabsTrigger value="deals" className="text-[9px] flex-1 h-6 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                Negócios
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Contact Tab */}
          <TabsContent value="contact" className="p-3 space-y-3 mt-0">
            {/* Contact Card */}
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-xs font-bold text-primary">
                {contactName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-xs truncate">{contactName}</p>
                {conversation.contact?.email && (
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                    <Mail className="h-2.5 w-2.5 text-blue-500" />
                    <span className="truncate">{conversation.contact.email}</span>
                  </div>
                )}
                {conversation.contact?.phone && (
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                    <Phone className="h-2.5 w-2.5 text-green-500" />
                    <span>{conversation.contact.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {conversation.contact_id && (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-7 text-[11px] rounded-full"
                onClick={() => navigate(`/contacts/${conversation.contact_id}`)}
              >
                <ExternalLink className="h-2.5 w-2.5 mr-1" />
                Ver Contato
              </Button>
            )}

            {/* Account */}
            {conversation.account && (
              <div className="bg-muted/50 rounded-xl p-2 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-semibold">{conversation.account.name}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-6 text-[10px] rounded-full"
                  onClick={() => navigate(`/accounts/${conversation.account!.id}`)}
                >
                  <ExternalLink className="h-2.5 w-2.5 mr-1" />
                  Ver Conta
                </Button>
              </div>
            )}

            {/* Details */}
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Detalhes</h4>
              <div className="grid grid-cols-2 gap-y-1.5 text-[11px]">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Prioridade</span>
                <span className="font-semibold">{conversation.priority}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Mensagens</span>
                <span className="font-semibold">{conversation.message_count}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Não lidas</span>
                <span className="font-semibold">{conversation.unread_count}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Criada</span>
                <span className="font-semibold">
                  {formatDistanceToNow(new Date(conversation.created_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
            </div>

            {/* Owner */}
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Atribuído a</h4>
              {conversation.owner ? (
                <div className="bg-muted/50 rounded-xl p-2 flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-[8px] font-bold text-primary">
                    {conversation.owner.first_name?.[0]}{conversation.owner.last_name?.[0]}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold">
                      {conversation.owner.first_name} {conversation.owner.last_name}
                    </p>
                    <p className="text-[9px] text-muted-foreground">{conversation.owner.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground italic">Sem atribuição</p>
              )}
            </div>

            {/* Tags */}
            {conversation.tags && conversation.tags.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {conversation.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-[9px] px-1.5 py-0 rounded-full">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="p-3 space-y-3 mt-0">
            {/* Recent Tickets */}
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Ticket className="h-2.5 w-2.5" />
                Tickets Recentes
              </h4>
              {recentTickets.length === 0 ? (
                <p className="text-[11px] text-muted-foreground italic">Nenhum ticket</p>
              ) : (
                <div className="space-y-1">
                  {recentTickets.map(ticket => (
                    <div
                      key={ticket.id}
                      className="p-2 rounded-xl bg-muted/50 text-[11px] cursor-pointer hover:bg-accent/50 hover:shadow-sm transition-all"
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] text-muted-foreground">{ticket.ticket_number}</span>
                        <div className={cn('h-1.5 w-1.5 rounded-full', statusColors[ticket.status] || 'bg-gray-400')} />
                      </div>
                      <p className="truncate mt-0.5 font-medium">{ticket.subject}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Other Conversations */}
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <MessageSquare className="h-2.5 w-2.5" />
                Outras Conversas
              </h4>
              {otherConversations.length === 0 ? (
                <p className="text-[11px] text-muted-foreground italic">Nenhuma outra conversa</p>
              ) : (
                <div className="space-y-1">
                  {otherConversations.map(conv => (
                    <div
                      key={conv.id}
                      className="p-2 rounded-xl bg-muted/50 text-[11px] cursor-pointer hover:bg-accent/50 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] text-muted-foreground">{conv.conversation_number}</span>
                        <Badge variant="outline" className="text-[8px] px-1 py-0 rounded-full">{conv.channel}</Badge>
                      </div>
                      <p className="truncate mt-0.5 font-medium">{conv.subject || conv.conversation_number}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activities */}
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Activity className="h-2.5 w-2.5" />
                Atividades
              </h4>
              {recentActivities.length === 0 ? (
                <p className="text-[11px] text-muted-foreground italic">Nenhuma atividade</p>
              ) : (
                <div className="space-y-1">
                  {recentActivities.map(act => (
                    <div key={act.id} className="p-2 rounded-xl bg-muted/50 text-[11px]">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-[8px] px-1 py-0 rounded-full">{act.type}</Badge>
                        <span className="text-[9px] text-muted-foreground">
                          {formatDistanceToNow(new Date(act.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                      <p className="truncate mt-0.5 font-medium">{act.subject}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Deals Tab */}
          <TabsContent value="deals" className="p-3 space-y-3 mt-0">
            {/* Opportunities */}
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="h-2.5 w-2.5" />
                Oportunidades Abertas
              </h4>
              {opportunities.length === 0 ? (
                <p className="text-[11px] text-muted-foreground italic">Nenhuma oportunidade aberta</p>
              ) : (
                <div className="space-y-1">
                  {opportunities.map(opp => (
                    <div
                      key={opp.id}
                      className="p-2 rounded-xl bg-muted/50 text-[11px] cursor-pointer hover:bg-accent/50 hover:shadow-sm transition-all"
                      onClick={() => navigate(`/opportunities/${opp.id}`)}
                    >
                      <p className="font-semibold truncate">{opp.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <Badge variant="outline" className="text-[8px] px-1 py-0 rounded-full">{opp.stage}</Badge>
                        <span className="font-bold text-sm">
                          {opp.amount ? `R$ ${Number(opp.amount).toLocaleString('pt-BR')}` : '-'}
                        </span>
                      </div>
                      {opp.probability != null && (
                        <div className="mt-1.5">
                          <div className="h-1 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${opp.probability}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-muted-foreground mt-0.5 block">{opp.probability}% probabilidade</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Orders */}
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <ShoppingCart className="h-2.5 w-2.5" />
                Pedidos Recentes
              </h4>
              {recentOrders.length === 0 ? (
                <p className="text-[11px] text-muted-foreground italic">Nenhum pedido</p>
              ) : (
                <div className="space-y-1">
                  {recentOrders.map(order => (
                    <div
                      key={order.id}
                      className="p-2 rounded-xl bg-muted/50 text-[11px] cursor-pointer hover:bg-accent/50 hover:shadow-sm transition-all"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] text-muted-foreground">{order.order_number}</span>
                        <div className={cn('h-1.5 w-1.5 rounded-full', statusColors[order.status] || 'bg-gray-400')} />
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[9px] text-muted-foreground">
                          {format(new Date(order.created_at), 'dd/MM/yyyy')}
                        </span>
                        <span className="font-bold">
                          {order.grand_total ? `R$ ${Number(order.grand_total).toLocaleString('pt-BR')}` : '-'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </div>
  );
}
