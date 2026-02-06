import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Building2,
  Clock,
  Tag,
  MessageSquare,
  Phone,
  Mail,
  Ticket,
  ShoppingCart,
  FileText,
  ExternalLink,
  Activity,
  TrendingUp,
} from 'lucide-react';
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

  // Fetch recent tickets for this contact
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

  // Fetch recent orders for this account
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

  // Fetch recent conversations (other than current)
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

  // Fetch recent activities for the contact
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

  // Fetch opportunities for this account
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

  return (
    <div className="w-72 border-l bg-card flex flex-col">
      <div className="p-3 border-b">
        <h3 className="text-sm font-semibold">Contexto</h3>
      </div>

      <ScrollArea className="flex-1">
        <Tabs defaultValue="contact" className="w-full">
          <TabsList className="w-full h-8 rounded-none border-b px-1">
            <TabsTrigger value="contact" className="text-[10px] flex-1 h-7">
              <User className="h-3 w-3 mr-1" />
              Contato
            </TabsTrigger>
            <TabsTrigger value="history" className="text-[10px] flex-1 h-7">
              <Clock className="h-3 w-3 mr-1" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="deals" className="text-[10px] flex-1 h-7">
              <TrendingUp className="h-3 w-3 mr-1" />
              Negócios
            </TabsTrigger>
          </TabsList>

          {/* Contact Tab */}
          <TabsContent value="contact" className="p-3 space-y-3 mt-0">
            {/* Contact Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {conversation.contact
                    ? `${conversation.contact.first_name || ''} ${conversation.contact.last_name || ''}`.trim()
                    : 'Sem contato vinculado'}
                </span>
              </div>
              {conversation.contact?.email && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{conversation.contact.email}</span>
                </div>
              )}
              {conversation.contact?.phone && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span>{conversation.contact.phone}</span>
                </div>
              )}
              {conversation.contact_id && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-7 text-xs"
                  onClick={() => navigate(`/contacts/${conversation.contact_id}`)}
                >
                  <ExternalLink className="h-3 w-3 mr-1.5" />
                  Ver Contato
                </Button>
              )}
            </div>

            <Separator />

            {/* Account Info */}
            {conversation.account && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium">{conversation.account.name}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-7 text-xs"
                    onClick={() => navigate(`/accounts/${conversation.account!.id}`)}
                  >
                    <ExternalLink className="h-3 w-3 mr-1.5" />
                    Ver Conta
                  </Button>
                </div>
                <Separator />
              </>
            )}

            {/* Conversation Details */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Detalhes</h4>
              <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                <span className="text-muted-foreground">Prioridade</span>
                <span className="font-medium">{conversation.priority}</span>
                <span className="text-muted-foreground">Mensagens</span>
                <span className="font-medium">{conversation.message_count}</span>
                <span className="text-muted-foreground">Não lidas</span>
                <span className="font-medium">{conversation.unread_count}</span>
                <span className="text-muted-foreground">Criada</span>
                <span className="font-medium">
                  {formatDistanceToNow(new Date(conversation.created_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
            </div>

            <Separator />

            {/* Owner */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Atribuído a</h4>
              {conversation.owner ? (
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium">
                    {conversation.owner.first_name?.[0]}{conversation.owner.last_name?.[0]}
                  </div>
                  <div>
                    <p className="text-xs font-medium">
                      {conversation.owner.first_name} {conversation.owner.last_name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{conversation.owner.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Sem atribuição</p>
              )}
            </div>

            {/* Tags */}
            {conversation.tags && conversation.tags.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {conversation.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="p-3 space-y-3 mt-0">
            {/* Recent Tickets */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Ticket className="h-3 w-3" />
                Tickets Recentes
              </h4>
              {recentTickets.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Nenhum ticket</p>
              ) : (
                <div className="space-y-1.5">
                  {recentTickets.map(ticket => (
                    <div
                      key={ticket.id}
                      className="p-2 rounded border text-xs cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-muted-foreground">{ticket.ticket_number}</span>
                        <div className={cn('h-1.5 w-1.5 rounded-full', statusColors[ticket.status] || 'bg-gray-400')} />
                      </div>
                      <p className="truncate mt-0.5">{ticket.subject}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Other Conversations */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="h-3 w-3" />
                Outras Conversas
              </h4>
              {otherConversations.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Nenhuma outra conversa</p>
              ) : (
                <div className="space-y-1.5">
                  {otherConversations.map(conv => (
                    <div
                      key={conv.id}
                      className="p-2 rounded border text-xs cursor-pointer hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-muted-foreground">{conv.conversation_number}</span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0">{conv.channel}</Badge>
                      </div>
                      <p className="truncate mt-0.5">{conv.subject || conv.conversation_number}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Recent Activities */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="h-3 w-3" />
                Atividades
              </h4>
              {recentActivities.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Nenhuma atividade</p>
              ) : (
                <div className="space-y-1.5">
                  {recentActivities.map(act => (
                    <div key={act.id} className="p-2 rounded border text-xs">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-[9px] px-1 py-0">{act.type}</Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(act.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                      <p className="truncate mt-0.5">{act.subject}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Deals Tab */}
          <TabsContent value="deals" className="p-3 space-y-3 mt-0">
            {/* Opportunities */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3" />
                Oportunidades Abertas
              </h4>
              {opportunities.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Nenhuma oportunidade aberta</p>
              ) : (
                <div className="space-y-1.5">
                  {opportunities.map(opp => (
                    <div
                      key={opp.id}
                      className="p-2 rounded border text-xs cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => navigate(`/opportunities/${opp.id}`)}
                    >
                      <p className="font-medium truncate">{opp.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <Badge variant="outline" className="text-[9px] px-1 py-0">{opp.stage}</Badge>
                        <span className="font-medium">
                          {opp.amount ? `R$ ${Number(opp.amount).toLocaleString('pt-BR')}` : '-'}
                        </span>
                      </div>
                      {opp.probability != null && (
                        <div className="mt-1">
                          <div className="h-1 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${opp.probability}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground">{opp.probability}% probabilidade</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Recent Orders */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingCart className="h-3 w-3" />
                Pedidos Recentes
              </h4>
              {recentOrders.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Nenhum pedido</p>
              ) : (
                <div className="space-y-1.5">
                  {recentOrders.map(order => (
                    <div
                      key={order.id}
                      className="p-2 rounded border text-xs cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-muted-foreground">{order.order_number}</span>
                        <div className={cn('h-1.5 w-1.5 rounded-full', statusColors[order.status] || 'bg-gray-400')} />
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(order.created_at), 'dd/MM/yyyy')}
                        </span>
                        <span className="font-medium">
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
