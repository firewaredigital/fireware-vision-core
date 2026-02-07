import { ModuleHeroBanner } from '@/components/ModuleHeroBanner';
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
import { format, subDays, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ComposedChart
} from 'recharts';
import {
  Bot, Zap, AlertTriangle, CheckCircle2, XCircle, Clock,
  Shield, Brain, Activity, DollarSign, TrendingUp, Eye
} from '@/components/icons';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#6366f1', '#ec4899', '#14b8a6',
];

const STATUS_COLORS: Record<string, string> = {
  completed: 'hsl(var(--chart-2))',
  failed: '#ef4444',
  running: 'hsl(var(--primary))',
  queued: '#eab308',
  cancelled: '#6b7280',
  awaiting_approval: '#f97316',
  rejected: '#dc2626',
};

const STATUS_LABELS: Record<string, string> = {
  completed: 'Concluído',
  failed: 'Falhou',
  running: 'Em execução',
  queued: 'Na fila',
  cancelled: 'Cancelado',
  awaiting_approval: 'Aguardando aprovação',
  rejected: 'Rejeitado',
};

export default function AIAnalytics() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [dateRange, setDateRange] = useState('30d');
  const [tab, setTab] = useState('overview');

  const dateFrom = useMemo(() => subDays(new Date(), parseInt(dateRange)).toISOString(), [dateRange]);

  // ======= QUERIES =======

  const { data: runs, isLoading } = useQuery({
    queryKey: ['ai-analytics-runs', orgId, dateFrom],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_runs')
        .select('id, agent_id, status, trigger_type, total_tokens_used, prompt_tokens, completion_tokens, cost_estimate, created_at, completed_at, started_at, triggered_by, model_used, error_message')
        .gte('created_at', dateFrom)
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: agents } = useQuery({
    queryKey: ['ai-analytics-agents', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('id, name, agent_type, status, icon');
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: approvals } = useQuery({
    queryKey: ['ai-analytics-approvals', orgId, dateFrom],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('approval_requests')
        .select('id, status, approval_type, created_at, decision_at, entity_type')
        .eq('entity_type', 'ai_run')
        .gte('created_at', dateFrom)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: policyViolations } = useQuery({
    queryKey: ['ai-analytics-audit', orgId, dateFrom],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_run_audit_receipts')
        .select('id, action_type, risk_level, requires_approval, approval_status, pii_detected, created_at, tool_used')
        .gte('created_at', dateFrom)
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: profiles } = useQuery({
    queryKey: ['ai-analytics-profiles', orgId],
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

  // ======= MAPS =======

  const agentMap = useMemo(() => {
    const map: Record<string, { name: string; type: string; icon: string | null }> = {};
    agents?.forEach(a => { map[a.id] = { name: a.name, type: a.agent_type, icon: a.icon }; });
    return map;
  }, [agents]);

  const profileMap = useMemo(() => {
    const map: Record<string, string> = {};
    profiles?.forEach(p => {
      map[p.id] = p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : p.email || 'N/A';
    });
    return map;
  }, [profiles]);

  // ======= CÁLCULOS =======

  const kpis = useMemo(() => {
    if (!runs) return null;

    const completed = runs.filter(r => r.status === 'completed');
    const failed = runs.filter(r => r.status === 'failed');
    const awaitingApproval = runs.filter(r => r.status === 'waiting_approval');

    const totalTokens = runs.reduce((s, r) => s + (r.total_tokens_used || 0), 0);
    const totalCost = runs.reduce((s, r) => s + (Number(r.cost_estimate) || 0), 0);
    const successRate = runs.length > 0 ? (completed.length / runs.length) * 100 : 0;

    // Avg duration (ms -> seconds)
    const durations = completed
      .filter(r => r.started_at && r.completed_at)
      .map(r => (new Date(r.completed_at!).getTime() - new Date(r.started_at!).getTime()) / 1000);
    const avgDuration = durations.length > 0 ? durations.reduce((s, v) => s + v, 0) / durations.length : 0;

    // Models used
    const modelCounts: Record<string, number> = {};
    runs.forEach(r => {
      const m = r.model_used || 'unknown';
      modelCounts[m] = (modelCounts[m] || 0) + 1;
    });

    // Unique agents
    const uniqueAgents = new Set(runs.map(r => r.agent_id)).size;

    // Unique users
    const uniqueUsers = new Set(runs.filter(r => r.triggered_by).map(r => r.triggered_by)).size;

    return {
      totalRuns: runs.length,
      completed: completed.length,
      failed: failed.length,
      awaitingApproval: awaitingApproval.length,
      successRate: Math.round(successRate),
      totalTokens,
      totalCost,
      avgDuration: Math.round(avgDuration * 10) / 10,
      modelCounts,
      uniqueAgents,
      uniqueUsers,
    };
  }, [runs]);

  // Runs por dia
  const dailyRuns = useMemo(() => {
    if (!runs) return [];
    const days: Record<string, { completed: number; failed: number; other: number; tokens: number }> = {};
    const numDays = Math.min(parseInt(dateRange), 60);
    for (let i = numDays - 1; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const key = format(d, 'yyyy-MM-dd');
      days[key] = { completed: 0, failed: 0, other: 0, tokens: 0 };
    }
    runs.forEach(r => {
      const key = format(new Date(r.created_at), 'yyyy-MM-dd');
      if (!days[key]) return;
      if (r.status === 'completed') days[key].completed++;
      else if (r.status === 'failed') days[key].failed++;
      else days[key].other++;
      days[key].tokens += r.total_tokens_used || 0;
    });
    return Object.entries(days).map(([date, data]) => ({
      date: format(new Date(date), 'dd/MM', { locale: ptBR }),
      ...data,
    }));
  }, [runs, dateRange]);

  // Runs por agente
  const runsByAgent = useMemo(() => {
    if (!runs) return [];
    const grouped: Record<string, { total: number; completed: number; failed: number; tokens: number; cost: number }> = {};
    runs.forEach(r => {
      if (!grouped[r.agent_id]) grouped[r.agent_id] = { total: 0, completed: 0, failed: 0, tokens: 0, cost: 0 };
      grouped[r.agent_id].total++;
      if (r.status === 'completed') grouped[r.agent_id].completed++;
      if (r.status === 'failed') grouped[r.agent_id].failed++;
      grouped[r.agent_id].tokens += r.total_tokens_used || 0;
      grouped[r.agent_id].cost += Number(r.cost_estimate) || 0;
    });
    return Object.entries(grouped)
      .map(([agentId, data]) => ({
        agentId,
        name: agentMap[agentId]?.name || 'Desconhecido',
        type: agentMap[agentId]?.type || 'custom',
        ...data,
        successRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [runs, agentMap]);

  // Runs por status (pie)
  const runsByStatus = useMemo(() => {
    if (!runs) return [];
    const grouped: Record<string, number> = {};
    runs.forEach(r => {
      grouped[r.status] = (grouped[r.status] || 0) + 1;
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name: STATUS_LABELS[name] || name, value, rawStatus: name }))
      .sort((a, b) => b.value - a.value);
  }, [runs]);

  // Runs por trigger type
  const runsByTrigger = useMemo(() => {
    if (!runs) return [];
    const triggerLabels: Record<string, string> = {
      manual: 'Manual',
      workflow: 'Workflow',
      api: 'API',
      scheduled: 'Agendado',
      event: 'Evento',
    };
    const grouped: Record<string, number> = {};
    runs.forEach(r => {
      grouped[r.trigger_type] = (grouped[r.trigger_type] || 0) + 1;
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name: triggerLabels[name] || name, value }))
      .sort((a, b) => b.value - a.value);
  }, [runs]);

  // Policy / Audit
  const auditStats = useMemo(() => {
    if (!policyViolations) return null;
    const total = policyViolations.length;
    const requireApproval = policyViolations.filter(v => v.requires_approval).length;
    const piiDetected = policyViolations.filter(v => v.pii_detected).length;
    const riskHigh = policyViolations.filter(v => v.risk_level === 'high' || v.risk_level === 'critical').length;
    const toolUsage: Record<string, number> = {};
    policyViolations.forEach(v => {
      if (v.tool_used) toolUsage[v.tool_used] = (toolUsage[v.tool_used] || 0) + 1;
    });
    return {
      total,
      requireApproval,
      piiDetected,
      riskHigh,
      toolUsage: Object.entries(toolUsage)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
    };
  }, [policyViolations]);

  // Top users
  const topUsers = useMemo(() => {
    if (!runs) return [];
    const grouped: Record<string, number> = {};
    runs.filter(r => r.triggered_by).forEach(r => {
      grouped[r.triggered_by!] = (grouped[r.triggered_by!] || 0) + 1;
    });
    return Object.entries(grouped)
      .map(([userId, count]) => ({ userId, name: profileMap[userId] || 'N/A', count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [runs, profileMap]);

  // Models
  const modelData = useMemo(() => {
    if (!kpis?.modelCounts) return [];
    return Object.entries(kpis.modelCounts)
      .map(([name, value]) => ({ name: name.replace('openai/', '').replace('google/', ''), value }))
      .sort((a, b) => b.value - a.value);
  }, [kpis]);

  const formatTokens = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  return (
    <>
      <div className="space-y-6">
        <ModuleHeroBanner
          module="ai"
          title="AI Analytics"
          subtitle="Execuções, tokens, custos, aprovações e compliance de IA"
          compact
          actions={
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
          }
        />

        {/* KPI Cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
        ) : kpis && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <Card>
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                  <Zap className="h-3 w-3" /> Total Runs
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <p className="text-xl font-bold">{kpis.totalRuns}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" /> Sucesso
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <p className="text-xl font-bold text-green-600">{kpis.successRate}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                  <XCircle className="h-3 w-3 text-red-500" /> Falhas
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <p className="text-xl font-bold text-red-600">{kpis.failed}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                  <Brain className="h-3 w-3" /> Tokens
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <p className="text-xl font-bold">{formatTokens(kpis.totalTokens)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" /> Custo
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <p className="text-xl font-bold">R$ {kpis.totalCost.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Duração Média
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <p className="text-xl font-bold">{kpis.avgDuration}s</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                  <Shield className="h-3 w-3 text-amber-500" /> Aprovações
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <p className="text-xl font-bold text-amber-600">{kpis.awaitingApproval}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="agents">Por Agente</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="usage">Uso & Custos</TabsTrigger>
          </TabsList>

          {/* === OVERVIEW === */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily runs */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Execuções Diárias</CardTitle>
                  <CardDescription>Volume de runs de IA por dia</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dailyRuns}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.max(0, Math.floor(dailyRuns.length / 15))} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="completed" name="Concluídos" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.15} stackId="1" />
                      <Area type="monotone" dataKey="failed" name="Falhas" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} stackId="1" />
                      <Area type="monotone" dataKey="other" name="Outros" stroke="hsl(var(--chart-4))" fill="hsl(var(--chart-4))" fillOpacity={0.15} stackId="1" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Status distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={runsByStatus} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {runsByStatus.map((entry, i) => (
                          <Cell key={i} fill={STATUS_COLORS[entry.rawStatus] || CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Trigger type */}
              <Card>
                <CardHeader>
                  <CardTitle>Tipo de Gatilho</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={runsByTrigger}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" name="Runs" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                        {runsByTrigger.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* === POR AGENTE === */}
          <TabsContent value="agents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance por Agente</CardTitle>
                <CardDescription>Execuções, taxa de sucesso e consumo de tokens por agente de IA</CardDescription>
              </CardHeader>
              <CardContent>
                {runsByAgent.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agente</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead className="text-center">Sucesso</TableHead>
                        <TableHead className="text-center">Falhas</TableHead>
                        <TableHead className="text-center">Taxa</TableHead>
                        <TableHead className="text-right">Tokens</TableHead>
                        <TableHead className="text-right">Custo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {runsByAgent.map(agent => (
                        <TableRow key={agent.agentId}>
                          <TableCell className="font-medium">{agent.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{agent.type}</Badge>
                          </TableCell>
                          <TableCell className="text-center">{agent.total}</TableCell>
                          <TableCell className="text-center text-green-600">{agent.completed}</TableCell>
                          <TableCell className="text-center text-red-600">{agent.failed}</TableCell>
                          <TableCell className="text-center">
                            <span className={agent.successRate >= 90 ? 'text-green-600' : agent.successRate >= 70 ? 'text-amber-600' : 'text-red-600'}>
                              {agent.successRate}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono">{formatTokens(agent.tokens)}</TableCell>
                          <TableCell className="text-right font-mono">R$ {agent.cost.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Nenhuma execução de agente no período.</p>
                )}
              </CardContent>
            </Card>

            {/* Chart */}
            {runsByAgent.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Volume por Agente</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={runsByAgent.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completed" name="Sucesso" fill="hsl(var(--chart-2))" stackId="a" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="failed" name="Falha" fill="#ef4444" stackId="a" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* === COMPLIANCE === */}
          <TabsContent value="compliance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Audit Receipts</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{auditStats?.total || 0}</p>
                  <p className="text-xs text-muted-foreground">Ações auditadas</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Requerem Aprovação</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-amber-600">{auditStats?.requireApproval || 0}</p>
                  <p className="text-xs text-muted-foreground">Human-in-the-loop</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">PII Detectada</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-600">{auditStats?.piiDetected || 0}</p>
                  <p className="text-xs text-muted-foreground">Dados sensíveis</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Risco Alto/Crítico</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-600">{auditStats?.riskHigh || 0}</p>
                  <p className="text-xs text-muted-foreground">Ações de alto risco</p>
                </CardContent>
              </Card>
            </div>

            {/* Tools used */}
            {auditStats && auditStats.toolUsage.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Ferramentas Mais Utilizadas</CardTitle>
                  <CardDescription>Tools chamadas pelos agentes de IA</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={auditStats.toolUsage.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" name="Chamadas" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* === USO & CUSTOS === */}
          <TabsContent value="usage" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Token consumption trend */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Consumo de Tokens Diário</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dailyRuns}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.max(0, Math.floor(dailyRuns.length / 15))} />
                      <YAxis tickFormatter={v => formatTokens(v)} />
                      <Tooltip formatter={(v: number) => formatTokens(v)} />
                      <Area type="monotone" dataKey="tokens" name="Tokens" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Models */}
              <Card>
                <CardHeader>
                  <CardTitle>Modelos Utilizados</CardTitle>
                </CardHeader>
                <CardContent>
                  {modelData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={modelData} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {modelData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-12">Nenhum dado de modelo disponível.</p>
                  )}
                </CardContent>
              </Card>

              {/* Top users */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Usuários</CardTitle>
                  <CardDescription>Usuários que mais utilizam agentes de IA</CardDescription>
                </CardHeader>
                <CardContent>
                  {topUsers.length > 0 ? (
                    <div className="space-y-3">
                      {topUsers.map((user, i) => (
                        <div key={user.userId} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-muted-foreground w-6">{i + 1}.</span>
                            <span className="text-sm font-medium">{user.name}</span>
                          </div>
                          <Badge variant="secondary">{user.count} runs</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Nenhum dado de uso disponível.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
