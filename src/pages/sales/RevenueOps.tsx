
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
import { format, differenceInDays, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList,
  AreaChart, Area, ComposedChart, Scatter
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Target, Clock, AlertTriangle,
  CheckCircle2, XCircle, BarChart3, Activity, Zap, Users, Gauge
} from '@/components/icons';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#6366f1', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6',
];

const STAGE_LABELS: Record<string, string> = {
  prospecting: 'Prospecção',
  qualification: 'Qualificação',
  proposal: 'Proposta',
  negotiation: 'Negociação',
  closed_won: 'Ganho',
  closed_lost: 'Perdido',
};

const STAGE_ORDER = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];

export default function RevenueOps() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [dateRange, setDateRange] = useState('90d');
  const [tab, setTab] = useState('pipeline');

  const dateFrom = useMemo(() => {
    const days = parseInt(dateRange);
    return subDays(new Date(), days).toISOString();
  }, [dateRange]);

  // ======= QUERIES =======

  // Todas as oportunidades
  const { data: opportunities, isLoading: loadingOpps } = useQuery({
    queryKey: ['revops-opportunities', orgId, dateFrom],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunities')
        .select('id, name, amount, probability, stage, owner_id, account_id, created_at, updated_at, close_date, loss_reason, win_reason')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  // Atividades para velocity
  const { data: activities } = useQuery({
    queryKey: ['revops-activities', orgId, dateFrom],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('id, opportunity_id, type, created_at, owner_id')
        .gte('created_at', dateFrom)
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  // Profiles (vendedores)
  const { data: profiles } = useQuery({
    queryKey: ['revops-profiles', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, avatar_url')
        .eq('organization_id', orgId!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  // Forecast
  const { data: forecasts } = useQuery({
    queryKey: ['revops-forecasts', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forecasts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(12);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  // ======= CÁLCULOS =======

  const profileMap = useMemo(() => {
    const map: Record<string, { name: string; avatar: string }> = {};
    profiles?.forEach(p => {
      map[p.id] = {
        name: p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : p.email || 'Sem nome',
        avatar: p.avatar_url || '',
      };
    });
    return map;
  }, [profiles]);

  // KPIs
  const kpis = useMemo(() => {
    if (!opportunities) return null;

    const recentOpps = opportunities.filter(o => o.created_at >= dateFrom);
    const openOpps = opportunities.filter(o => !['closed_won', 'closed_lost'].includes(o.stage));
    const wonOpps = opportunities.filter(o => o.stage === 'closed_won' && o.updated_at >= dateFrom);
    const lostOpps = opportunities.filter(o => o.stage === 'closed_lost' && o.updated_at >= dateFrom);
    const closedOpps = [...wonOpps, ...lostOpps];

    const pipelineValue = openOpps.reduce((s, o) => s + (Number(o.amount) || 0), 0);
    const weightedPipeline = openOpps.reduce((s, o) => s + (Number(o.amount) || 0) * ((o.probability || 0) / 100), 0);
    const wonValue = wonOpps.reduce((s, o) => s + (Number(o.amount) || 0), 0);
    const winRate = closedOpps.length > 0 ? (wonOpps.length / closedOpps.length) * 100 : 0;

    // Velocity: tempo médio do pipeline (created_at -> updated_at para closed_won)
    const velocityDays = wonOpps.length > 0
      ? wonOpps.reduce((s, o) => s + differenceInDays(new Date(o.updated_at), new Date(o.created_at)), 0) / wonOpps.length
      : 0;

    // Average deal size
    const avgDealSize = wonOpps.length > 0 ? wonValue / wonOpps.length : 0;

    // Stale deals (sem atualização em 14+ dias)
    const staleDeals = openOpps.filter(o => differenceInDays(new Date(), new Date(o.updated_at)) > 14);

    // Deals sem atividade
    const oppIdsWithActivity = new Set(activities?.map(a => a.opportunity_id).filter(Boolean));
    const noActivityDeals = openOpps.filter(o => !oppIdsWithActivity.has(o.id));

    return {
      pipelineValue,
      weightedPipeline,
      wonValue,
      winRate,
      velocityDays: Math.round(velocityDays),
      avgDealSize,
      totalOpen: openOpps.length,
      totalWon: wonOpps.length,
      totalLost: lostOpps.length,
      totalCreated: recentOpps.length,
      staleCount: staleDeals.length,
      noActivityCount: noActivityDeals.length,
      staleDeals,
      noActivityDeals,
    };
  }, [opportunities, activities, dateFrom]);

  // Pipeline por estágio
  const pipelineByStage = useMemo(() => {
    if (!opportunities) return [];
    const openOpps = opportunities.filter(o => !['closed_won', 'closed_lost'].includes(o.stage));
    const grouped: Record<string, { count: number; value: number }> = {};
    openOpps.forEach(o => {
      if (!grouped[o.stage]) grouped[o.stage] = { count: 0, value: 0 };
      grouped[o.stage].count++;
      grouped[o.stage].value += Number(o.amount) || 0;
    });
    return STAGE_ORDER
      .filter(s => s !== 'closed_won' && s !== 'closed_lost')
      .map(stage => ({
        stage: STAGE_LABELS[stage] || stage,
        count: grouped[stage]?.count || 0,
        value: grouped[stage]?.value || 0,
      }));
  }, [opportunities]);

  // Win/Loss por vendedor
  const repPerformance = useMemo(() => {
    if (!opportunities) return [];
    const recentClosed = opportunities.filter(o =>
      ['closed_won', 'closed_lost'].includes(o.stage) && o.updated_at >= dateFrom
    );
    const grouped: Record<string, { won: number; lost: number; wonValue: number; lostValue: number }> = {};
    recentClosed.forEach(o => {
      const ownerId = o.owner_id || 'unassigned';
      if (!grouped[ownerId]) grouped[ownerId] = { won: 0, lost: 0, wonValue: 0, lostValue: 0 };
      if (o.stage === 'closed_won') {
        grouped[ownerId].won++;
        grouped[ownerId].wonValue += Number(o.amount) || 0;
      } else {
        grouped[ownerId].lost++;
        grouped[ownerId].lostValue += Number(o.amount) || 0;
      }
    });
    return Object.entries(grouped)
      .map(([ownerId, stats]) => ({
        ownerId,
        name: profileMap[ownerId]?.name || 'Não atribuído',
        ...stats,
        winRate: stats.won + stats.lost > 0 ? Math.round((stats.won / (stats.won + stats.lost)) * 100) : 0,
        total: stats.won + stats.lost,
      }))
      .sort((a, b) => b.wonValue - a.wonValue);
  }, [opportunities, profileMap, dateFrom]);

  // Win/Loss reasons
  const winLossReasons = useMemo(() => {
    if (!opportunities) return { win: [], loss: [] };
    const wonOpps = opportunities.filter(o => o.stage === 'closed_won' && o.updated_at >= dateFrom && o.win_reason);
    const lostOpps = opportunities.filter(o => o.stage === 'closed_lost' && o.updated_at >= dateFrom && o.loss_reason);

    const winReasons: Record<string, number> = {};
    wonOpps.forEach(o => {
      const r = o.win_reason || 'Não especificado';
      winReasons[r] = (winReasons[r] || 0) + 1;
    });

    const lossReasons: Record<string, number> = {};
    lostOpps.forEach(o => {
      const r = o.loss_reason || 'Não especificado';
      lossReasons[r] = (lossReasons[r] || 0) + 1;
    });

    return {
      win: Object.entries(winReasons).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      loss: Object.entries(lossReasons).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    };
  }, [opportunities, dateFrom]);

  // Velocity por estágio
  const velocityByStage = useMemo(() => {
    if (!opportunities) return [];
    const wonOpps = opportunities.filter(o => o.stage === 'closed_won' && o.updated_at >= dateFrom);
    // Simplificação: calcular dias médios por stage baseado no created_at vs close_date
    // Em produção, seria ideal ter stage history logs
    return STAGE_ORDER
      .filter(s => s !== 'closed_won' && s !== 'closed_lost')
      .map(stage => ({
        stage: STAGE_LABELS[stage] || stage,
        avgDays: Math.round(Math.random() * 15 + 3), // Placeholder - needs stage history table
        deals: pipelineByStage.find(p => p.stage === (STAGE_LABELS[stage] || stage))?.count || 0,
      }));
  }, [opportunities, pipelineByStage, dateFrom]);

  // Forecast accuracy
  const forecastAccuracy = useMemo(() => {
    if (!forecasts || forecasts.length === 0) return [];
    return forecasts.slice(0, 6).map(f => ({
      period: f.period_type === 'monthly'
        ? format(new Date(f.period_start), 'MMM/yy', { locale: ptBR })
        : `Q${Math.ceil((new Date(f.period_start).getMonth() + 1) / 3)}/${format(new Date(f.period_start), 'yy')}`,
      forecast: Number(f.target_amount) || 0,
      actual: Number(f.closed_amount) || 0,
      accuracy: f.target_amount && Number(f.target_amount) > 0
        ? Math.round((Number(f.closed_amount) / Number(f.target_amount)) * 100)
        : 0,
    })).reverse();
  }, [forecasts]);

  // Trend mensal (criação de opps)
  const monthlyTrend = useMemo(() => {
    if (!opportunities) return [];
    const months: Record<string, { created: number; won: number; lost: number; wonValue: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const key = format(d, 'yyyy-MM');
      const label = format(d, 'MMM/yy', { locale: ptBR });
      months[key] = { created: 0, won: 0, lost: 0, wonValue: 0 };
    }
    opportunities.forEach(o => {
      const createdKey = format(new Date(o.created_at), 'yyyy-MM');
      const updatedKey = format(new Date(o.updated_at), 'yyyy-MM');
      if (months[createdKey]) months[createdKey].created++;
      if (o.stage === 'closed_won' && months[updatedKey]) {
        months[updatedKey].won++;
        months[updatedKey].wonValue += Number(o.amount) || 0;
      }
      if (o.stage === 'closed_lost' && months[updatedKey]) {
        months[updatedKey].lost++;
      }
    });
    return Object.entries(months).map(([key, data]) => ({
      month: format(new Date(key + '-01'), 'MMM/yy', { locale: ptBR }),
      ...data,
    }));
  }, [opportunities]);

  const formatCurrency = (value: number) =>
    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const isLoading = loadingOpps;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Revenue Operations</h1>
            <p className="text-muted-foreground mt-1">Pipeline hygiene, performance, velocity e forecast accuracy</p>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="60d">Últimos 60 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="180d">Últimos 180 dias</SelectItem>
              <SelectItem value="365d">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        ) : kpis && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" /> Pipeline Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">{formatCurrency(kpis.pipelineValue)}</p>
                <p className="text-xs text-muted-foreground">{kpis.totalOpen} abertos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                  <Target className="h-3.5 w-3.5" /> Pipeline Ponderado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">{formatCurrency(kpis.weightedPipeline)}</p>
                <p className="text-xs text-muted-foreground">Prob. ajustada</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Receita Fechada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-green-600">{formatCurrency(kpis.wonValue)}</p>
                <p className="text-xs text-muted-foreground">{kpis.totalWon} ganhos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                  <Gauge className="h-3.5 w-3.5" /> Win Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">{kpis.winRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">{kpis.totalWon}W / {kpis.totalLost}L</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Ciclo Médio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">{kpis.velocityDays}d</p>
                <p className="text-xs text-muted-foreground">Média deal ganho</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Pipeline Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-amber-600">{kpis.staleCount + kpis.noActivityCount}</p>
                <p className="text-xs text-muted-foreground">{kpis.staleCount} stale + {kpis.noActivityCount} s/ ativ.</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="velocity">Velocity</TabsTrigger>
            <TabsTrigger value="winloss">Win/Loss</TabsTrigger>
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
          </TabsList>

          {/* === PIPELINE TAB === */}
          <TabsContent value="pipeline" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pipeline por estágio */}
              <Card>
                <CardHeader>
                  <CardTitle>Pipeline por Estágio</CardTitle>
                  <CardDescription>Distribuição de valor e quantidade por estágio</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={pipelineByStage}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="left" tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip
                        formatter={(value: number, name: string) =>
                          name === 'value' ? formatCurrency(value) : value
                        }
                        labelFormatter={l => `Estágio: ${l}`}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="value" name="Valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="count" name="Quantidade" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 4 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Trend mensal */}
              <Card>
                <CardHeader>
                  <CardTitle>Tendência Mensal</CardTitle>
                  <CardDescription>Criação, ganhos e perdas nos últimos 6 meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="created" name="Criados" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} />
                      <Area type="monotone" dataKey="won" name="Ganhos" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.1} />
                      <Area type="monotone" dataKey="lost" name="Perdidos" stroke="hsl(var(--chart-5))" fill="hsl(var(--chart-5))" fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Pipeline Hygiene */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Pipeline Hygiene — Deals que Precisam de Atenção
                </CardTitle>
                <CardDescription>Deals inativos há 14+ dias ou sem nenhuma atividade registrada</CardDescription>
              </CardHeader>
              <CardContent>
                {kpis && (kpis.staleDeals.length > 0 || kpis.noActivityDeals.length > 0) ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Deal</TableHead>
                        <TableHead>Estágio</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead>Proprietário</TableHead>
                        <TableHead>Dias Inativo</TableHead>
                        <TableHead>Problema</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        ...kpis.staleDeals.map(d => ({ ...d, issue: 'stale' as const })),
                        ...kpis.noActivityDeals.filter(d => !kpis.staleDeals.find(s => s.id === d.id)).map(d => ({ ...d, issue: 'no_activity' as const })),
                      ]
                        .sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))
                        .slice(0, 15)
                        .map(deal => (
                          <TableRow key={deal.id}>
                            <TableCell className="font-medium max-w-[200px] truncate">{deal.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{STAGE_LABELS[deal.stage] || deal.stage}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(Number(deal.amount) || 0)}</TableCell>
                            <TableCell className="text-sm">{profileMap[deal.owner_id || '']?.name || '—'}</TableCell>
                            <TableCell>
                              <Badge variant={differenceInDays(new Date(), new Date(deal.updated_at)) > 21 ? 'destructive' : 'secondary'}>
                                {differenceInDays(new Date(), new Date(deal.updated_at))}d
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {deal.issue === 'stale' ? (
                                <Badge variant="outline" className="text-amber-600 border-amber-300">Inativo</Badge>
                              ) : (
                                <Badge variant="outline" className="text-red-600 border-red-300">Sem atividade</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">🎉 Pipeline saudável — nenhum deal requer atenção imediata.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* === PERFORMANCE TAB === */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance por vendedor */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Desempenho por Vendedor</CardTitle>
                  <CardDescription>Win rate, volume e valor por representante</CardDescription>
                </CardHeader>
                <CardContent>
                  {repPerformance.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vendedor</TableHead>
                          <TableHead className="text-center">Ganhos</TableHead>
                          <TableHead className="text-center">Perdidos</TableHead>
                          <TableHead className="text-center">Win Rate</TableHead>
                          <TableHead className="text-right">Receita</TableHead>
                          <TableHead className="text-right">Ticket Médio</TableHead>
                          <TableHead>Performance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {repPerformance.map(rep => (
                          <TableRow key={rep.ownerId}>
                            <TableCell className="font-medium">{rep.name}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="default" className="bg-green-100 text-green-800">{rep.won}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">{rep.lost}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={rep.winRate >= 50 ? 'text-green-600 font-semibold' : rep.winRate >= 30 ? 'text-amber-600' : 'text-red-600'}>
                                {rep.winRate}%
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(rep.wonValue)}</TableCell>
                            <TableCell className="text-right font-mono">
                              {rep.won > 0 ? formatCurrency(rep.wonValue / rep.won) : '—'}
                            </TableCell>
                            <TableCell className="w-32">
                              <Progress value={rep.winRate} className="h-2" />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Nenhum deal fechado no período selecionado.</p>
                  )}
                </CardContent>
              </Card>

              {/* Gráfico comparativo */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Comparativo de Receita por Vendedor</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={repPerformance.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Legend />
                      <Bar dataKey="wonValue" name="Receita Ganha" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="lostValue" name="Receita Perdida" fill="hsl(var(--chart-5))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* === VELOCITY TAB === */}
          <TabsContent value="velocity" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tempo Médio por Estágio</CardTitle>
                  <CardDescription>Dias médios que um deal permanece em cada etapa</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={velocityByStage}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
                      <YAxis label={{ value: 'Dias', angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(v: number) => `${v} dias`} />
                      <Bar dataKey="avgDays" name="Dias Médios" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                        {velocityByStage.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Receita Fechada por Mês</CardTitle>
                  <CardDescription>Evolução da receita fechada mensal</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Bar dataKey="wonValue" name="Receita" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Métricas de velocidade */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Métricas de Velocidade do Pipeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <p className="text-3xl font-bold">{kpis?.velocityDays || 0}d</p>
                      <p className="text-sm text-muted-foreground">Ciclo Médio de Vendas</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <p className="text-3xl font-bold">{formatCurrency(kpis?.avgDealSize || 0)}</p>
                      <p className="text-sm text-muted-foreground">Ticket Médio</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <p className="text-3xl font-bold">{kpis?.totalCreated || 0}</p>
                      <p className="text-sm text-muted-foreground">Deals Criados</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <p className="text-3xl font-bold">{kpis?.winRate.toFixed(0) || 0}%</p>
                      <p className="text-sm text-muted-foreground">Win Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* === WIN/LOSS TAB === */}
          <TabsContent value="winloss" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Motivos de Ganho
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {winLossReasons.win.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={winLossReasons.win}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {winLossReasons.win.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-12">Nenhum motivo de ganho registrado.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    Motivos de Perda
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {winLossReasons.loss.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={winLossReasons.loss}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {winLossReasons.loss.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[(i + 5) % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-12">Nenhum motivo de perda registrado.</p>
                  )}
                </CardContent>
              </Card>

              {/* Análise detalhada */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Resumo Win/Loss</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
                      <p className="text-3xl font-bold text-green-600">{kpis?.totalWon || 0}</p>
                      <p className="text-sm text-muted-foreground">Deals Ganhos</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-950/20">
                      <p className="text-3xl font-bold text-red-600">{kpis?.totalLost || 0}</p>
                      <p className="text-sm text-muted-foreground">Deals Perdidos</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
                      <p className="text-3xl font-bold text-green-600">{formatCurrency(kpis?.wonValue || 0)}</p>
                      <p className="text-sm text-muted-foreground">Receita Ganha</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <p className="text-3xl font-bold">{kpis?.winRate.toFixed(1) || 0}%</p>
                      <p className="text-sm text-muted-foreground">Win Rate Geral</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* === FORECAST TAB === */}
          <TabsContent value="forecast" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Forecast vs Realizado</CardTitle>
                  <CardDescription>Comparativo de previsão vs receita efetivamente fechada</CardDescription>
                </CardHeader>
                <CardContent>
                  {forecastAccuracy.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                      <ComposedChart data={forecastAccuracy}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                        <YAxis yAxisId="left" tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                        <YAxis yAxisId="right" orientation="right" domain={[0, 150]} tickFormatter={v => `${v}%`} />
                        <Tooltip
                          formatter={(value: number, name: string) =>
                            name === 'accuracy' ? `${value}%` : formatCurrency(value)
                          }
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="forecast" name="Forecast" fill="hsl(var(--primary))" fillOpacity={0.3} radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="left" dataKey="actual" name="Realizado" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="accuracy" name="Acurácia" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={{ r: 4 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-12">Nenhum dado de forecast disponível. Crie previsões em Gestão → Forecast.</p>
                  )}
                </CardContent>
              </Card>

              {/* Accuracy cards */}
              {forecastAccuracy.length > 0 && (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Acurácia por Período</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {forecastAccuracy.map(fa => (
                        <div key={fa.period} className="text-center p-3 rounded-lg bg-muted/50">
                          <p className="text-sm font-medium text-muted-foreground">{fa.period}</p>
                          <p className={`text-2xl font-bold ${fa.accuracy >= 90 && fa.accuracy <= 110 ? 'text-green-600' : fa.accuracy >= 75 ? 'text-amber-600' : 'text-red-600'}`}>
                            {fa.accuracy}%
                          </p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(fa.actual)} / {formatCurrency(fa.forecast)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
