
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useState, useMemo } from 'react';
import { format, differenceInHours, differenceInMinutes, subDays, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ComposedChart
} from 'recharts';
import {
  Headphones, Clock, CheckCircle2, AlertTriangle, TrendingUp,
  Users, MessageSquare, BarChart3, Gauge, ThumbsUp, ThumbsDown, Timer
} from '@/components/icons';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#6366f1', '#ec4899', '#14b8a6',
];

const STATUS_LABELS: Record<string, string> = {
  open: 'Aberto',
  in_progress: 'Em andamento',
  waiting_customer: 'Aguardando cliente',
  waiting_vendor: 'Aguardando fornecedor',
  resolved: 'Resolvido',
  closed: 'Fechado',
  cancelled: 'Cancelado',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica',
};

const CHANNEL_LABELS: Record<string, string> = {
  email: 'Email',
  phone: 'Telefone',
  chat: 'Chat',
  whatsapp: 'WhatsApp',
  portal: 'Portal',
  social: 'Social',
  api: 'API',
};

export default function ServiceAnalytics() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [dateRange, setDateRange] = useState('30d');
  const [tab, setTab] = useState('overview');

  const dateFrom = useMemo(() => subDays(new Date(), parseInt(dateRange)).toISOString(), [dateRange]);

  // ======= QUERIES =======

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['svc-analytics-tickets', orgId, dateFrom],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('id, ticket_number, subject, status, priority, channel, created_at, updated_at, resolved_at, first_response_at, sla_first_response_due, sla_resolution_due, assigned_to, account_id, contact_id, subcategory')
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: conversations } = useQuery({
    queryKey: ['svc-analytics-conversations', orgId, dateFrom],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('id, channel, status, priority, created_at, first_response_at, closed_at, satisfaction_rating, satisfaction_comment, owner_id, queue_id, message_count')
        .gte('created_at', dateFrom)
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: qaReviews } = useQuery({
    queryKey: ['svc-analytics-qa', orgId, dateFrom],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qa_reviews')
        .select('id, percentage_score, overall_rating, reviewer_id, agent_id, created_at, status')
        .gte('created_at', dateFrom)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: npsResponses } = useQuery({
    queryKey: ['svc-analytics-nps', orgId, dateFrom],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nps_responses')
        .select('id, score, category, created_at')
        .gte('created_at', dateFrom)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: profiles } = useQuery({
    queryKey: ['svc-analytics-profiles', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('organization_id', orgId!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: queues } = useQuery({
    queryKey: ['svc-analytics-queues', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routing_queues')
        .select('id, name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  // ======= CÁLCULOS =======

  const profileMap = useMemo(() => {
    const map: Record<string, string> = {};
    profiles?.forEach(p => {
      map[p.id] = p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : p.email || 'N/A';
    });
    return map;
  }, [profiles]);

  const queueMap = useMemo(() => {
    const map: Record<string, string> = {};
    queues?.forEach(q => { map[q.id] = q.name; });
    return map;
  }, [queues]);

  // KPIs principais
  const kpis = useMemo(() => {
    if (!tickets) return null;

    const recent = tickets.filter(t => t.created_at >= dateFrom);
    const resolved = tickets.filter(t => t.resolved_at && t.resolved_at >= dateFrom);
    const openTickets = tickets.filter(t => !['resolved', 'closed', 'cancelled'].includes(t.status));
    const backlog = openTickets.length;

    // SLA compliance (response)
    const withSlaResponse = recent.filter(t => t.sla_first_response_due);
    const slaResponseMet = withSlaResponse.filter(t =>
      t.first_response_at && new Date(t.first_response_at) <= new Date(t.sla_first_response_due!)
    );
    const slaResponseRate = withSlaResponse.length > 0
      ? (slaResponseMet.length / withSlaResponse.length) * 100
      : 100;

    // SLA compliance (resolution)
    const withSlaResolution = resolved.filter(t => t.sla_resolution_due);
    const slaResolutionMet = withSlaResolution.filter(t =>
      t.resolved_at && new Date(t.resolved_at) <= new Date(t.sla_resolution_due!)
    );
    const slaResolutionRate = withSlaResolution.length > 0
      ? (slaResolutionMet.length / withSlaResolution.length) * 100
      : 100;

    // Tempo médio de primeira resposta (horas)
    const responseTimesH = recent
      .filter(t => t.first_response_at)
      .map(t => differenceInMinutes(new Date(t.first_response_at!), new Date(t.created_at)));
    const avgResponseMin = responseTimesH.length > 0
      ? responseTimesH.reduce((s, v) => s + v, 0) / responseTimesH.length
      : 0;

    // Tempo médio de resolução (horas)
    const resolutionTimesH = resolved
      .map(t => differenceInHours(new Date(t.resolved_at!), new Date(t.created_at)));
    const avgResolutionH = resolutionTimesH.length > 0
      ? resolutionTimesH.reduce((s, v) => s + v, 0) / resolutionTimesH.length
      : 0;

    // FCR (First Contact Resolution) - tickets resolvidos com <= 2 respostas
    // Simplificado: tickets resolvidos no mesmo dia
    const fcrTickets = resolved.filter(t => {
      const created = new Date(t.created_at);
      const resolvedAt = new Date(t.resolved_at!);
      return differenceInHours(resolvedAt, created) <= 4;
    });
    const fcrRate = resolved.length > 0 ? (fcrTickets.length / resolved.length) * 100 : 0;

    // CSAT de conversations
    const csatConvos = conversations?.filter(c => c.satisfaction_rating !== null) || [];
    const avgCsat = csatConvos.length > 0
      ? csatConvos.reduce((s, c) => s + (c.satisfaction_rating || 0), 0) / csatConvos.length
      : 0;

    // NPS
    const npsScores = npsResponses || [];
    const promoters = npsScores.filter(n => n.score >= 9).length;
    const detractors = npsScores.filter(n => n.score <= 6).length;
    const npsScore = npsScores.length > 0
      ? Math.round(((promoters - detractors) / npsScores.length) * 100)
      : 0;

    return {
      totalCreated: recent.length,
      totalResolved: resolved.length,
      backlog,
      slaResponseRate: Math.round(slaResponseRate),
      slaResolutionRate: Math.round(slaResolutionRate),
      avgResponseMin: Math.round(avgResponseMin),
      avgResolutionH: Math.round(avgResolutionH * 10) / 10,
      fcrRate: Math.round(fcrRate),
      avgCsat: Math.round(avgCsat * 10) / 10,
      npsScore,
      npsTotal: npsScores.length,
      promoters,
      detractors,
      passives: npsScores.length - promoters - detractors,
    };
  }, [tickets, conversations, npsResponses, dateFrom]);

  // Tickets por status
  const ticketsByStatus = useMemo(() => {
    if (!tickets) return [];
    const recent = tickets.filter(t => t.created_at >= dateFrom);
    const grouped: Record<string, number> = {};
    recent.forEach(t => {
      grouped[t.status] = (grouped[t.status] || 0) + 1;
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name: STATUS_LABELS[name] || name, value }))
      .sort((a, b) => b.value - a.value);
  }, [tickets, dateFrom]);

  // Tickets por canal
  const ticketsByChannel = useMemo(() => {
    if (!tickets) return [];
    const recent = tickets.filter(t => t.created_at >= dateFrom);
    const grouped: Record<string, number> = {};
    recent.forEach(t => {
      const ch = t.channel || 'email';
      grouped[ch] = (grouped[ch] || 0) + 1;
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name: CHANNEL_LABELS[name] || name, value }))
      .sort((a, b) => b.value - a.value);
  }, [tickets, dateFrom]);

  // Tickets por prioridade
  const ticketsByPriority = useMemo(() => {
    if (!tickets) return [];
    const recent = tickets.filter(t => t.created_at >= dateFrom);
    const grouped: Record<string, number> = {};
    recent.forEach(t => {
      grouped[t.priority] = (grouped[t.priority] || 0) + 1;
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name: PRIORITY_LABELS[name] || name, value }))
      .sort((a, b) => b.value - a.value);
  }, [tickets, dateFrom]);

  // Trend diário de tickets
  const dailyTrend = useMemo(() => {
    if (!tickets) return [];
    const recent = tickets.filter(t => t.created_at >= dateFrom);
    const days: Record<string, { created: number; resolved: number }> = {};

    const numDays = Math.min(parseInt(dateRange), 60);
    for (let i = numDays - 1; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const key = format(d, 'yyyy-MM-dd');
      days[key] = { created: 0, resolved: 0 };
    }

    recent.forEach(t => {
      const ck = format(new Date(t.created_at), 'yyyy-MM-dd');
      if (days[ck]) days[ck].created++;
    });

    const resolved = tickets.filter(t => t.resolved_at && t.resolved_at >= dateFrom);
    resolved.forEach(t => {
      const rk = format(new Date(t.resolved_at!), 'yyyy-MM-dd');
      if (days[rk]) days[rk].resolved++;
    });

    return Object.entries(days).map(([date, data]) => ({
      date: format(new Date(date), 'dd/MM', { locale: ptBR }),
      ...data,
    }));
  }, [tickets, dateFrom, dateRange]);

  // Performance por agente
  const agentPerformance = useMemo(() => {
    if (!tickets) return [];
    const resolved = tickets.filter(t => t.resolved_at && t.resolved_at >= dateFrom && t.assigned_to);
    const grouped: Record<string, { resolved: number; totalResponseMin: number; responseCount: number }> = {};

    resolved.forEach(t => {
      const oid = t.assigned_to!;
      if (!grouped[oid]) grouped[oid] = { resolved: 0, totalResponseMin: 0, responseCount: 0 };
      grouped[oid].resolved++;
      if (t.first_response_at) {
        grouped[oid].totalResponseMin += differenceInMinutes(new Date(t.first_response_at), new Date(t.created_at));
        grouped[oid].responseCount++;
      }
    });

    return Object.entries(grouped)
      .map(([agentId, data]) => ({
        agentId,
        name: profileMap[agentId] || 'N/A',
        resolved: data.resolved,
        avgResponseMin: data.responseCount > 0 ? Math.round(data.totalResponseMin / data.responseCount) : 0,
      }))
      .sort((a, b) => b.resolved - a.resolved);
  }, [tickets, profileMap, dateFrom]);

  // NPS distribuição
  const npsDistribution = useMemo(() => {
    if (!npsResponses || npsResponses.length === 0) return [];
    const counts = Array(11).fill(0);
    npsResponses.forEach(r => { counts[r.score]++; });
    return counts.map((count, score) => ({
      score: score.toString(),
      count,
      category: score >= 9 ? 'Promotor' : score >= 7 ? 'Passivo' : 'Detrator',
    }));
  }, [npsResponses]);

  // QA scores
  const qaStats = useMemo(() => {
    if (!qaReviews || qaReviews.length === 0) return null;
    const completed = qaReviews.filter(r => r.status === 'completed');
    const avgScore = completed.length > 0
      ? completed.reduce((s, r) => s + (r.percentage_score || 0), 0) / completed.length
      : 0;
    const ratingDist: Record<string, number> = {};
    completed.forEach(r => {
      const rt = r.overall_rating || 'N/A';
      ratingDist[rt] = (ratingDist[rt] || 0) + 1;
    });
    return {
      total: qaReviews.length,
      completed: completed.length,
      avgScore: Math.round(avgScore * 10) / 10,
      ratingDist: Object.entries(ratingDist).map(([name, value]) => ({ name, value })),
    };
  }, [qaReviews]);

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h${m > 0 ? `${m}m` : ''}`;
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Service Analytics</h1>
            <p className="text-muted-foreground mt-1">SLA, backlog, FCR, CSAT/NPS e performance operacional</p>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="14d">Últimos 14 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="60d">Últimos 60 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
        ) : kpis && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <Card>
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> Tickets Criados
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <p className="text-xl font-bold">{kpis.totalCreated}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" /> Resolvidos
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <p className="text-xl font-bold text-green-600">{kpis.totalResolved}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-amber-500" /> Backlog
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <p className="text-xl font-bold text-amber-600">{kpis.backlog}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                  <Timer className="h-3 w-3" /> Resp. Média
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <p className="text-xl font-bold">{formatTime(kpis.avgResponseMin)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Resolução
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <p className="text-xl font-bold">{kpis.avgResolutionH}h</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="text-xs text-muted-foreground">SLA Resp.</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <p className={`text-xl font-bold ${kpis.slaResponseRate >= 90 ? 'text-green-600' : kpis.slaResponseRate >= 75 ? 'text-amber-600' : 'text-red-600'}`}>
                  {kpis.slaResponseRate}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="text-xs text-muted-foreground">FCR</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <p className="text-xl font-bold">{kpis.fcrRate}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="text-xs text-muted-foreground">NPS</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <p className={`text-xl font-bold ${kpis.npsScore >= 50 ? 'text-green-600' : kpis.npsScore >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                  {kpis.npsScore}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="sla">SLA & Performance</TabsTrigger>
            <TabsTrigger value="nps">CSAT / NPS</TabsTrigger>
            <TabsTrigger value="agents">Agentes</TabsTrigger>
          </TabsList>

          {/* === OVERVIEW TAB === */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trend diário */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Volume Diário de Tickets</CardTitle>
                  <CardDescription>Criados vs resolvidos por dia</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.max(0, Math.floor(dailyTrend.length / 15))} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="created" name="Criados" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} />
                      <Area type="monotone" dataKey="resolved" name="Resolvidos" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.15} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Por status */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={ticketsByStatus} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {ticketsByStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Por canal */}
              <Card>
                <CardHeader>
                  <CardTitle>Tickets por Canal</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={ticketsByChannel}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" name="Tickets" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                        {ticketsByChannel.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* === SLA & PERFORMANCE TAB === */}
          <TabsContent value="sla" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">SLA Resposta</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className={`text-3xl font-bold ${(kpis?.slaResponseRate || 0) >= 90 ? 'text-green-600' : 'text-red-600'}`}>
                        {kpis?.slaResponseRate || 0}%
                      </p>
                      <Progress value={kpis?.slaResponseRate || 0} className="mt-2 h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">SLA Resolução</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className={`text-3xl font-bold ${(kpis?.slaResolutionRate || 0) >= 85 ? 'text-green-600' : 'text-red-600'}`}>
                        {kpis?.slaResolutionRate || 0}%
                      </p>
                      <Progress value={kpis?.slaResolutionRate || 0} className="mt-2 h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Tempo Médio Resposta</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{formatTime(kpis?.avgResponseMin || 0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Primeira resposta</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Tempo Médio Resolução</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{kpis?.avgResolutionH || 0}h</p>
                  <p className="text-xs text-muted-foreground mt-1">Criação → Resolução</p>
                </CardContent>
              </Card>
            </div>

            {/* Tickets por prioridade */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Prioridade</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={ticketsByPriority} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={80} />
                    <Tooltip />
                    <Bar dataKey="value" name="Tickets" radius={[0, 4, 4, 0]}>
                      {ticketsByPriority.map((entry, i) => (
                        <Cell key={i} fill={
                          entry.name === 'Crítica' ? '#ef4444' :
                          entry.name === 'Alta' ? '#f97316' :
                          entry.name === 'Média' ? '#eab308' : '#22c55e'
                        } />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === NPS / CSAT TAB === */}
          <TabsContent value="nps" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* NPS Score */}
              <Card>
                <CardHeader>
                  <CardTitle>Net Promoter Score</CardTitle>
                  <CardDescription>{kpis?.npsTotal || 0} respostas no período</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    <p className={`text-6xl font-bold ${(kpis?.npsScore || 0) >= 50 ? 'text-green-600' : (kpis?.npsScore || 0) >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                      {kpis?.npsScore || 0}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {(kpis?.npsScore || 0) >= 70 ? 'Excelente' : (kpis?.npsScore || 0) >= 50 ? 'Muito Bom' : (kpis?.npsScore || 0) >= 30 ? 'Bom' : (kpis?.npsScore || 0) >= 0 ? 'Neutro' : 'Precisa melhorar'}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 rounded bg-green-50 dark:bg-green-950/20">
                      <ThumbsUp className="h-5 w-5 mx-auto text-green-500 mb-1" />
                      <p className="text-lg font-bold text-green-600">{kpis?.promoters || 0}</p>
                      <p className="text-xs text-muted-foreground">Promotores</p>
                    </div>
                    <div className="p-3 rounded bg-amber-50 dark:bg-amber-950/20">
                      <p className="text-lg font-bold text-amber-600">{kpis?.passives || 0}</p>
                      <p className="text-xs text-muted-foreground">Passivos</p>
                    </div>
                    <div className="p-3 rounded bg-red-50 dark:bg-red-950/20">
                      <ThumbsDown className="h-5 w-5 mx-auto text-red-500 mb-1" />
                      <p className="text-lg font-bold text-red-600">{kpis?.detractors || 0}</p>
                      <p className="text-xs text-muted-foreground">Detratores</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* NPS distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Scores NPS</CardTitle>
                </CardHeader>
                <CardContent>
                  {npsDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={npsDistribution}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="score" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" name="Respostas" radius={[4, 4, 0, 0]}>
                          {npsDistribution.map((entry, i) => (
                            <Cell key={i} fill={
                              entry.category === 'Promotor' ? '#22c55e' :
                              entry.category === 'Passivo' ? '#eab308' : '#ef4444'
                            } />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-12">Nenhuma resposta NPS registrada no período.</p>
                  )}
                </CardContent>
              </Card>

              {/* CSAT */}
              <Card>
                <CardHeader>
                  <CardTitle>CSAT Médio</CardTitle>
                  <CardDescription>Satisfação média das conversas avaliadas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-5xl font-bold">{kpis?.avgCsat || 0}</p>
                    <p className="text-sm text-muted-foreground mt-1">de 5.0</p>
                    <div className="flex justify-center gap-1 mt-3">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} className={`text-2xl ${star <= Math.round(kpis?.avgCsat || 0) ? 'text-amber-400' : 'text-muted'}`}>★</span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* QA Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Quality Assurance</CardTitle>
                  <CardDescription>Avaliações de qualidade no período</CardDescription>
                </CardHeader>
                <CardContent>
                  {qaStats ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold">{qaStats.total}</p>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600">{qaStats.completed}</p>
                          <p className="text-xs text-muted-foreground">Concluídas</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{qaStats.avgScore}%</p>
                          <p className="text-xs text-muted-foreground">Score Médio</p>
                        </div>
                      </div>
                      {qaStats.ratingDist.length > 0 && (
                        <div className="space-y-2">
                          {qaStats.ratingDist.map(r => (
                            <div key={r.name} className="flex items-center justify-between text-sm">
                              <Badge variant="outline">{r.name}</Badge>
                              <span className="font-medium">{r.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Nenhuma avaliação QA no período.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* === AGENTS TAB === */}
          <TabsContent value="agents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance por Agente</CardTitle>
                <CardDescription>Tickets resolvidos e tempo de resposta por atendente</CardDescription>
              </CardHeader>
              <CardContent>
                {agentPerformance.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agente</TableHead>
                        <TableHead className="text-center">Resolvidos</TableHead>
                        <TableHead className="text-center">Resp. Média</TableHead>
                        <TableHead>Volume Relativo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agentPerformance.slice(0, 15).map(agent => {
                        const maxResolved = Math.max(...agentPerformance.map(a => a.resolved));
                        return (
                          <TableRow key={agent.agentId}>
                            <TableCell className="font-medium">{agent.name}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="default">{agent.resolved}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={agent.avgResponseMin <= 30 ? 'text-green-600' : agent.avgResponseMin <= 60 ? 'text-amber-600' : 'text-red-600'}>
                                {formatTime(agent.avgResponseMin)}
                              </span>
                            </TableCell>
                            <TableCell className="w-40">
                              <Progress value={(agent.resolved / maxResolved) * 100} className="h-2" />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Nenhum ticket resolvido por agentes no período.</p>
                )}
              </CardContent>
            </Card>

            {/* Gráfico de agentes */}
            {agentPerformance.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Comparativo de Agentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={agentPerformance.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="resolved" name="Resolvidos" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
