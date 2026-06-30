import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Activity, AlertTriangle, RefreshCw, Star, Zap,
  DollarSign, Target, TrendingUp, Ticket, ShoppingCart,
  Mail, Phone, FileSignature, MessageSquare, StickyNote,
} from '@/components/icons';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart as RechartsPie, Pie, Cell,
} from 'recharts';

// Subcomponents
import { Customer360Header } from '@/components/customer360/Customer360Header';
import { Customer360Stats } from '@/components/customer360/Customer360Stats';
import { Customer360Contracts } from '@/components/customer360/Customer360Contracts';
import { Customer360Conversations } from '@/components/customer360/Customer360Conversations';
import { Customer360Notes } from '@/components/customer360/Customer360Notes';
import { Customer360EngagementScore } from '@/components/customer360/Customer360EngagementScore';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Customer360() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const entityType = type || 'account';
  const tableName = entityType === 'contact' ? 'contacts' : 'accounts';

  // Fetch main entity
  const { data: entity, isLoading: loadingEntity } = useQuery({
    queryKey: ['customer-360-entity', entityType, id],
    queryFn: async () => {
      const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
      if (error) throw error;
      return data as unknown;
    },
    enabled: !!id,
  });

  // Fetch related contacts (for accounts)
  const { data: contacts = [] } = useQuery({
    queryKey: ['customer-360-contacts', id],
    queryFn: async () => {
      if (entityType !== 'account') return [];
      const { data, error } = await supabase.from('contacts').select('*').eq('account_id', id).order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown[];
    },
    enabled: entityType === 'account' && !!id,
  });

  // Fetch opportunities
  const { data: opportunities = [] } = useQuery({
    queryKey: ['customer-360-opportunities', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('opportunities').select('*').eq('account_id', id).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch tickets
  const { data: tickets = [] } = useQuery({
    queryKey: ['customer-360-tickets', id],
    queryFn: async () => {
      const column = entityType === 'account' ? 'account_id' : 'contact_id';
      const { data, error } = await supabase.from('tickets').select('*').eq(column, id).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch orders
  const { data: orders = [] } = useQuery({
    queryKey: ['customer-360-orders', id],
    queryFn: async () => {
      const column = entityType === 'account' ? 'account_id' : 'contact_id';
      const { data, error } = await supabase.from('orders').select('*').eq(column, id).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch activities
  const { data: activities = [] } = useQuery({
    queryKey: ['customer-360-activities', id],
    queryFn: async () => {
      const column = entityType === 'account' ? 'account_id' : 'contact_id';
      const { data, error } = await supabase.from('activities').select('*').eq(column, id).order('created_at', { ascending: false }).limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch contracts
  const { data: contracts = [] } = useQuery({
    queryKey: ['customer-360-contracts-count', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('contracts').select('id, status').eq('account_id', id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch conversations count
  const { data: conversationsData = [] } = useQuery({
    queryKey: ['customer-360-conversations-count', id],
    queryFn: async () => {
      const column = entityType === 'account' ? 'account_id' : 'contact_id';
      const { data, error } = await supabase.from('conversations').select('id').eq(column, id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch timeline events
  const { data: timelineEvents = [] } = useQuery({
    queryKey: ['customer-360-timeline', id],
    queryFn: async () => {
      const column = entityType === 'account' ? 'account_id' : 'contact_id';
      const { data, error } = await supabase.from('timeline_events').select('*').eq(column, id).order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch health score
  const { data: healthScore } = useQuery({
    queryKey: ['customer-360-health', id],
    queryFn: async () => {
      if (entityType !== 'account') return null;
      const { data, error } = await supabase.from('customer_health_scores').select('*').eq('account_id', id).order('calculated_at', { ascending: false }).limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as unknown;
    },
    enabled: entityType === 'account' && !!id,
  });

  // Fetch behavioral events
  const { data: behavioralEvents = [] } = useQuery({
    queryKey: ['customer-360-behavioral', id],
    queryFn: async () => {
      const column = entityType === 'account' ? 'account_id' : 'contact_id';
      const { data, error } = await supabase.from('behavioral_events').select('*').eq(column, id).order('occurred_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Calculate metrics
  const metrics = {
    totalRevenue: opportunities.filter((o: unknown) => o.stage === 'closed_won').reduce((sum: number, o: unknown) => sum + (o.amount || 0), 0),
    openPipeline: opportunities.filter((o: unknown) => !['closed_won', 'closed_lost'].includes(o.stage)).reduce((sum: number, o: unknown) => sum + (o.amount || 0), 0),
    totalOpportunities: opportunities.length,
    wonOpportunities: opportunities.filter((o: unknown) => o.stage === 'closed_won').length,
    openTickets: tickets.filter((t: unknown) => !['resolved', 'closed'].includes(t.status)).length,
    totalOrders: orders.length,
    orderValue: orders.reduce((sum: number, o: unknown) => sum + (o.grand_total || 0), 0),
    activities: activities.length,
    activeContracts: contracts.filter((c: unknown) => c.status === 'active').length,
    totalConversations: conversationsData.length,
    winRate: opportunities.length > 0
      ? ((opportunities.filter((o: unknown) => o.stage === 'closed_won').length / opportunities.length) * 100).toFixed(0)
      : '0',
  };

  // Chart data
  const revenueByMonth = opportunities
    .filter((o: unknown) => o.stage === 'closed_won' && o.close_date)
    .reduce((acc: Record<string, number>, o: unknown) => {
      const month = format(new Date(o.close_date!), 'MMM/yy', { locale: ptBR });
      acc[month] = (acc[month] || 0) + (o.amount || 0);
      return acc;
    }, {});

  const revenueChartData = Object.entries(revenueByMonth).map(([month, value]) => ({ month, value }));

  const opportunityStages = opportunities.reduce((acc: Record<string, number>, o: unknown) => {
    acc[o.stage] = (acc[o.stage] || 0) + 1;
    return acc;
  }, {});

  const stageChartData = Object.entries(opportunityStages).map(([name, value], index) => ({
    name,
    value,
    fill: COLORS[index % COLORS.length],
  }));

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(value);

  if (loadingEntity) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </>
    );
  }

  if (!entity) {
    return (
      <>
        <div className="text-center py-16">
          <AlertTriangle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Registro não encontrado</h2>
          <Button onClick={() => navigate(-1)} className="mt-4">Voltar</Button>
        </div>
      </>
    );
  }

  const entityName = entityType === 'account'
    ? entity.name
    : `${entity.first_name || ''} ${entity.last_name || ''}`.trim();

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <Customer360Header
          entityType={entityType}
          entityName={entityName}
          entity={entity}
          healthScore={healthScore}
        />

        {/* Quick Stats */}
        <Customer360Stats metrics={metrics} />

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="opportunities">Oportunidades</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
            <TabsTrigger value="contracts">Contratos</TabsTrigger>
            <TabsTrigger value="conversations">Conversas</TabsTrigger>
            <TabsTrigger value="notes">Notas</TabsTrigger>
            {entityType === 'account' && <TabsTrigger value="contacts">Contatos</TabsTrigger>}
            <TabsTrigger value="behavior">Comportamento</TabsTrigger>
          </TabsList>

          {/* ─── Overview ─── */}
          <TabsContent value="overview" className="mt-4 space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                {/* Revenue Chart */}
                <Card>
                  <CardHeader><CardTitle>Receita por Mês</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Stage Distribution */}
                <Card>
                  <CardHeader><CardTitle>Oportunidades por Estágio</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie>
                          <Pie data={stageChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                            {stageChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activities */}
                <Card>
                  <CardHeader><CardTitle>Atividades Recentes</CardTitle></CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-4">
                        {activities.slice(0, 10).map((activity: unknown) => (
                          <div key={activity.id} className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                              <Activity className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{activity.subject}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(activity.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                              </p>
                            </div>
                            <Badge variant="outline">{activity.type}</Badge>
                          </div>
                        ))}
                        {activities.length === 0 && (
                          <p className="text-center text-muted-foreground py-8">Nenhuma atividade registrada</p>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Engagement Score Sidebar */}
              <div>
                <Customer360EngagementScore
                  opportunities={opportunities}
                  tickets={tickets}
                  orders={orders}
                  activities={activities}
                  conversations={conversationsData.length}
                  contracts={contracts.filter((c: unknown) => c.status === 'active').length}
                />
              </div>
            </div>
          </TabsContent>

          {/* ─── Timeline ─── */}
          <TabsContent value="timeline" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Timeline Unificada</CardTitle>
                <CardDescription>Todas as interações e eventos relacionados</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {timelineEvents.map((event: unknown) => (
                      <div key={event.id} className="p-3 border rounded-lg">
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(event.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                    ))}
                    {timelineEvents.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">Nenhum evento na timeline</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Opportunities ─── */}
          <TabsContent value="opportunities" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Oportunidades ({opportunities.length})</CardTitle>
                <Button size="sm" onClick={() => navigate(`/opportunities/new?${entityType}_id=${id}`)}>Nova Oportunidade</Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {opportunities.map((opp: unknown) => (
                    <div key={opp.id} className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => navigate(`/opportunities/${opp.id}`)}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{opp.name}</p>
                          <p className="text-sm text-muted-foreground">Criada em {format(new Date(opp.created_at), 'dd/MM/yyyy', { locale: ptBR })}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(opp.amount || 0)}</p>
                          <Badge variant={opp.stage === 'closed_won' ? 'default' : opp.stage === 'closed_lost' ? 'destructive' : 'secondary'}>{opp.stage}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                  {opportunities.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhuma oportunidade encontrada</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Tickets ─── */}
          <TabsContent value="tickets" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Tickets ({tickets.length})</CardTitle>
                <Button size="sm" onClick={() => navigate(`/tickets/new?${entityType}_id=${id}`)}>Novo Ticket</Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tickets.map((ticket: unknown) => (
                    <div key={ticket.id} className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => navigate(`/tickets/${ticket.id}`)}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{ticket.subject}</p>
                          <p className="text-sm text-muted-foreground">{ticket.ticket_number} • {format(new Date(ticket.created_at), 'dd/MM/yyyy', { locale: ptBR })}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={ticket.priority === 'critical' ? 'destructive' : 'secondary'}>{ticket.priority}</Badge>
                          <Badge variant="outline">{ticket.status}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                  {tickets.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum ticket encontrado</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Orders ─── */}
          <TabsContent value="orders" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Pedidos ({orders.length})</CardTitle>
                <Button size="sm" onClick={() => navigate(`/orders/new?${entityType}_id=${id}`)}>Novo Pedido</Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orders.map((order: unknown) => (
                    <div key={order.id} className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{order.order_number}</p>
                          <p className="text-sm text-muted-foreground">{format(new Date(order.created_at), 'dd/MM/yyyy', { locale: ptBR })}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(order.grand_total || 0)}</p>
                          <Badge variant="outline">{order.status}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum pedido encontrado</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Contracts ─── */}
          <TabsContent value="contracts" className="mt-4">
            <Customer360Contracts entityType={entityType} entityId={id!} />
          </TabsContent>

          {/* ─── Conversations ─── */}
          <TabsContent value="conversations" className="mt-4">
            <Customer360Conversations entityType={entityType} entityId={id!} />
          </TabsContent>

          {/* ─── Notes ─── */}
          <TabsContent value="notes" className="mt-4">
            <Customer360Notes entityType={entityType} entityId={id!} />
          </TabsContent>

          {/* ─── Contacts ─── */}
          {entityType === 'account' && (
            <TabsContent value="contacts" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Contatos ({contacts.length})</CardTitle>
                  <Button size="sm" onClick={() => navigate(`/contacts/new?account_id=${id}`)}>Novo Contato</Button>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {contacts.map((contact: unknown) => (
                      <div key={contact.id} className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => navigate(`/contacts/${contact.id}`)}>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{`${contact.first_name?.[0] || ''}${contact.last_name?.[0] || ''}`.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{contact.first_name} {contact.last_name}</p>
                            <p className="text-sm text-muted-foreground">{contact.title}</p>
                            {contact.email && <p className="text-sm text-muted-foreground">{contact.email}</p>}
                          </div>
                        </div>
                        {contact.is_primary && (
                          <Badge className="mt-2" variant="default">
                            <Star className="h-3 w-3 mr-1" />
                            Principal
                          </Badge>
                        )}
                      </div>
                    ))}
                    {contacts.length === 0 && <p className="text-center text-muted-foreground py-8 col-span-full">Nenhum contato encontrado</p>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* ─── Behavior ─── */}
          <TabsContent value="behavior" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Eventos Comportamentais</CardTitle>
                <CardDescription>Interações rastreadas do cliente</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {behavioralEvents.map((event: unknown) => (
                      <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Zap className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{event.event_name}</p>
                          <p className="text-sm text-muted-foreground">{event.page_url && `Página: ${event.page_url}`}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(event.occurred_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                          </p>
                        </div>
                        <Badge variant="secondary">{event.event_type}</Badge>
                      </div>
                    ))}
                    {behavioralEvents.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">Nenhum evento comportamental rastreado</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
