import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Headphones, 
  Ticket, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  Star,
  MessageSquare,
  RefreshCcw,
  ArrowRight,
  ThumbsUp,
  XCircle,
  Timer,
  BarChart3,
  Target
} from '@/components/icons';
import { formatDistanceToNow, format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import { TicketStatusBadge } from '@/components/service/TicketStatusBadge';
import { TicketPriorityBadge } from '@/components/service/TicketPriorityBadge';

type TicketStatus = 'new' | 'open' | 'pending' | 'on_hold' | 'resolved' | 'closed';

const COLORS = ['#3b82f6', '#f97316', '#eab308', '#6b7280', '#22c55e', '#64748b'];

const statusLabels: Record<TicketStatus, string> = {
  new: 'Novo',
  open: 'Aberto',
  pending: 'Pendente',
  on_hold: 'Em Espera',
  resolved: 'Resolvido',
  closed: 'Fechado',
};

export default function ServiceDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [dateRange, setDateRange] = useState('7');

  // Fetch all tickets for metrics
  const { data: tickets = [], isLoading, refetch } = useQuery({
    queryKey: ['service-dashboard-tickets', profile?.organization_id, dateRange],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      const startDate = startOfDay(subDays(new Date(), parseInt(dateRange)));
      
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          id, ticket_number, subject, status, priority, type, channel,
          created_at, updated_at, resolved_at, closed_at,
          sla_first_response_due, sla_first_response_at, sla_first_response_breached,
          sla_resolution_due, sla_resolution_breached,
          assigned_to
        `)
        .eq('organization_id', profile.organization_id)
        .gte('created_at', startDate.toISOString());
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.organization_id,
  });

  // Fetch CSAT data
  const { data: csatData = [] } = useQuery({
    queryKey: ['service-csat', profile?.organization_id, dateRange],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      const startDate = startOfDay(subDays(new Date(), parseInt(dateRange)));
      
      const { data, error } = await supabase
        .from('csat_responses')
        .select('score, submitted_at')
        .eq('organization_id', profile.organization_id)
        .gte('submitted_at', startDate.toISOString());
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.organization_id,
  });

  // Fetch team performance
  const { data: teamPerformance = [] } = useQuery({
    queryKey: ['service-team-performance', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      const { data: teamMembers, error: teamError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true);
      
      if (teamError) throw teamError;
      
      const { data: ticketCounts } = await supabase
        .from('tickets')
        .select('assigned_to, status')
        .eq('organization_id', profile.organization_id);
      
      return (teamMembers || []).map(member => {
        const memberTickets = (ticketCounts || []).filter(t => t.assigned_to === member.id);
        const openTickets = memberTickets.filter(t => !['resolved', 'closed'].includes(t.status)).length;
        const resolvedTickets = memberTickets.filter(t => t.status === 'resolved').length;
        
        return {
          ...member,
          openTickets,
          resolvedTickets,
          totalTickets: memberTickets.length,
        };
      }).filter(m => m.totalTickets > 0).sort((a, b) => b.resolvedTickets - a.resolvedTickets);
    },
    enabled: !!profile?.organization_id,
  });

  // Calculate metrics
  const metrics = {
    total: tickets.length,
    open: tickets.filter(t => !['resolved', 'closed'].includes(t.status)).length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    closed: tickets.filter(t => t.status === 'closed').length,
    breachedSLA: tickets.filter(t => t.sla_first_response_breached || t.sla_resolution_breached).length,
    avgResolutionTime: 0,
    slaCompliance: 0,
    csatScore: 0,
  };

  // Calculate SLA compliance
  const ticketsWithSLA = tickets.filter(t => t.sla_first_response_due);
  if (ticketsWithSLA.length > 0) {
    const compliant = ticketsWithSLA.filter(t => !t.sla_first_response_breached && !t.sla_resolution_breached).length;
    metrics.slaCompliance = Math.round((compliant / ticketsWithSLA.length) * 100);
  }

  // Calculate CSAT score
  if (csatData.length > 0) {
    const totalScore = csatData.reduce((sum, r) => sum + r.score, 0);
    metrics.csatScore = Math.round((totalScore / csatData.length) * 20); // Convert 1-5 to percentage
  }

  // Tickets by status for pie chart
  const ticketsByStatus = Object.entries(statusLabels).map(([status, label]) => ({
    name: label,
    value: tickets.filter(t => t.status === status).length,
    status,
  })).filter(item => item.value > 0);

  // Tickets by priority
  const ticketsByPriority = [
    { name: 'Crítica', value: tickets.filter(t => t.priority === 'critical').length, color: '#ef4444' },
    { name: 'Alta', value: tickets.filter(t => t.priority === 'high').length, color: '#f97316' },
    { name: 'Média', value: tickets.filter(t => t.priority === 'medium').length, color: '#3b82f6' },
    { name: 'Baixa', value: tickets.filter(t => t.priority === 'low').length, color: '#6b7280' },
  ].filter(item => item.value > 0);

  // Tickets by channel
  const ticketsByChannel = [
    { name: 'E-mail', value: tickets.filter(t => t.channel === 'email').length },
    { name: 'Chat', value: tickets.filter(t => t.channel === 'chat').length },
    { name: 'Telefone', value: tickets.filter(t => t.channel === 'phone').length },
    { name: 'WhatsApp', value: tickets.filter(t => t.channel === 'whatsapp').length },
    { name: 'Portal', value: tickets.filter(t => t.channel === 'portal').length },
    { name: 'Formulário', value: tickets.filter(t => t.channel === 'form').length },
  ].filter(item => item.value > 0);

  // Tickets trend over time
  const ticketsTrend = [];
  for (let i = parseInt(dateRange) - 1; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    
    const dayTickets = tickets.filter(t => {
      const created = new Date(t.created_at);
      return created >= dayStart && created <= dayEnd;
    });
    
    const resolved = tickets.filter(t => {
      if (!t.resolved_at) return false;
      const resolvedDate = new Date(t.resolved_at);
      return resolvedDate >= dayStart && resolvedDate <= dayEnd;
    });
    
    ticketsTrend.push({
      date: format(date, 'dd/MM'),
      criados: dayTickets.length,
      resolvidos: resolved.length,
    });
  }

  // Recent tickets
  const recentTickets = [...tickets]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Urgent tickets (SLA breached or about to breach)
  const urgentTickets = tickets
    .filter(t => {
      if (['resolved', 'closed'].includes(t.status)) return false;
      if (t.sla_first_response_breached || t.sla_resolution_breached) return true;
      return t.priority === 'critical';
    })
    .slice(0, 5);

  return (
    <>
      <div className="space-y-6">
        <ModuleHeroBanner
          module="service"
          title="Dashboard de Atendimento"
          subtitle="Visão geral de performance e métricas de suporte"
          compact
        />
        <div className="flex justify-end gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="14">Últimos 14 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="60">Últimos 60 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tickets Abertos</CardTitle>
              <Ticket className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.open}</div>
              <p className="text-xs text-muted-foreground">
                de {metrics.total} no período
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
              <Target className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.slaCompliance}%</div>
              <Progress value={metrics.slaCompliance} className="h-2 mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CSAT Score</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.csatScore}%</div>
              <p className="text-xs text-muted-foreground">
                {csatData.length} avaliações
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SLA Violado</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{metrics.breachedSLA}</div>
              <p className="text-xs text-muted-foreground">
                tickets precisam de atenção
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Tickets Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Tendência de Tickets</CardTitle>
              <CardDescription>Criados vs Resolvidos por dia</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ticketsTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))'
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="criados" 
                      name="Criados"
                      stroke="#f97316" 
                      fill="#f97316"
                      fillOpacity={0.2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="resolvidos"
                      name="Resolvidos" 
                      stroke="#22c55e" 
                      fill="#22c55e"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Tickets by Status */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
              <CardDescription>Tickets agrupados por status atual</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ticketsByStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {ticketsByStatus.map((entry, index) => (
                        <Cell key={entry.status} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Second Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Tickets by Channel */}
          <Card>
            <CardHeader>
              <CardTitle>Tickets por Canal</CardTitle>
              <CardDescription>Origem das solicitações</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ticketsByChannel} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="name" type="category" className="text-xs" width={80} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))'
                      }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Team Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Performance da Equipe</CardTitle>
              <CardDescription>Tickets resolvidos por agente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamPerformance.slice(0, 5).map((member, index) => (
                  <div key={member.id} className="flex items-center gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center justify-center w-6 text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </div>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar_url || ''} />
                        <AvatarFallback className="text-xs">
                          {member.first_name?.[0]}{member.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {member.first_name} {member.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {member.openTickets} abertos
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">
                        {member.resolvedTickets}
                      </p>
                      <p className="text-xs text-muted-foreground">resolvidos</p>
                    </div>
                  </div>
                ))}
                {teamPerformance.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum agente com tickets</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tickets Lists */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Urgent Tickets */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-red-600">Tickets Urgentes</CardTitle>
                <CardDescription>Requerem atenção imediata</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/tickets?filter=breached')}>
                Ver Todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {urgentTickets.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm font-medium">Nenhum ticket urgente!</p>
                  <p className="text-xs">Todos os SLAs estão sendo cumpridos</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {urgentTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-destructive/20 bg-destructive/5 cursor-pointer hover:bg-destructive/10 transition-colors"
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                    >
                      <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ticket.subject}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-mono text-muted-foreground">
                            {ticket.ticket_number}
                          </span>
                          <TicketPriorityBadge priority={ticket.priority as any} size="sm" />
                        </div>
                      </div>
                      {(ticket.sla_first_response_breached || ticket.sla_resolution_breached) && (
                        <Badge variant="destructive" className="text-xs">
                          SLA Violado
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Tickets */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tickets Recentes</CardTitle>
                <CardDescription>Últimos tickets criados</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/tickets')}>
                Ver Todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {recentTickets.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Ticket className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum ticket no período</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ticket.subject}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-mono text-muted-foreground">
                            {ticket.ticket_number}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(ticket.created_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                      </div>
                      <TicketStatusBadge status={ticket.status as TicketStatus} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
