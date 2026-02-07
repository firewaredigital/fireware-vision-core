import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Target,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Calendar,
} from '@/components/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipProvider } from '@/components/ui/tooltip';
import { StaleDealAlerts } from '@/components/StaleDealAlerts';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
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
} from 'recharts';

interface PipelineStage {
  stage: string;
  value: number;
  count: number;
}

interface TopDeal {
  id: string;
  name: string;
  account_name: string;
  amount: number;
  stage: string;
  probability: number;
}

interface RecentActivity {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  event_type: string;
}

const stageLabels: Record<string, string> = {
  prospecting: 'Prospecção',
  qualification: 'Qualificação',
  proposal: 'Proposta',
  negotiation: 'Negociação',
  closed_won: 'Ganho',
  closed_lost: 'Perdido',
};

const stageColors: Record<string, string> = {
  prospecting: '#94a3b8',
  qualification: '#3b82f6',
  proposal: '#a855f7',
  negotiation: '#f97316',
  closed_won: '#22c55e',
  closed_lost: '#ef4444',
};

export default function Dashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pipelineData, setPipelineData] = useState<PipelineStage[]>([]);
  const [topDeals, setTopDeals] = useState<TopDeal[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [stats, setStats] = useState({
    totalPipeline: 0,
    openLeads: 0,
    closedWon: 0,
    activitiesCount: 0,
  });

  const fetchDashboardData = useCallback(async () => {
    if (!profile?.organization_id) return;
    
    setLoading(true);
    
    // Fetch all opportunities for pipeline calculation
    const { data: opportunities } = await supabase
      .from('opportunities')
      .select('id, name, amount, stage, probability, account:accounts!opportunities_account_id_fkey(name)')
      .eq('organization_id', profile.organization_id);

    if (opportunities) {
      // Calculate pipeline by stage
      const stageMap = new Map<string, { value: number; count: number }>();
      const openStages = ['prospecting', 'qualification', 'proposal', 'negotiation'];
      let totalPipeline = 0;
      let closedWon = 0;

      opportunities.forEach((opp) => {
        const current = stageMap.get(opp.stage) || { value: 0, count: 0 };
        stageMap.set(opp.stage, {
          value: current.value + (opp.amount || 0),
          count: current.count + 1,
        });

        if (openStages.includes(opp.stage)) {
          totalPipeline += opp.amount || 0;
        }
        if (opp.stage === 'closed_won') {
          closedWon += opp.amount || 0;
        }
      });

      // Convert to array for charts (excluding closed_lost from visual)
      const pipelineArray: PipelineStage[] = [];
      ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won'].forEach((stage) => {
        const data = stageMap.get(stage);
        if (data && data.count > 0) {
          pipelineArray.push({
            stage: stageLabels[stage],
            value: data.value,
            count: data.count,
          });
        }
      });
      setPipelineData(pipelineArray);

      // Top deals (open opportunities, sorted by amount)
      const openOpps = opportunities
        .filter((o) => openStages.includes(o.stage) && (o.amount || 0) > 0)
        .sort((a, b) => (b.amount || 0) - (a.amount || 0))
        .slice(0, 5)
        .map((o) => ({
          id: o.id,
          name: o.name,
          account_name: (o.account as { name: string } | null)?.name || 'Desconhecido',
          amount: o.amount || 0,
          stage: stageLabels[o.stage] || o.stage,
          probability: o.probability || 0,
        }));
      setTopDeals(openOpps);

      setStats((prev) => ({
        ...prev,
        totalPipeline,
        closedWon,
      }));
    }

    // Fetch open leads count
    const { count: leadsCount } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', profile.organization_id)
      .in('status', ['new', 'contacted', 'qualified']);

    setStats((prev) => ({
      ...prev,
      openLeads: leadsCount || 0,
    }));

    // Fetch recent timeline events
    const { data: activities } = await supabase
      .from('timeline_events')
      .select('id, title, description, created_at, event_type')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (activities) {
      setRecentActivities(activities);
      setStats((prev) => ({
        ...prev,
        activitiesCount: activities.length,
      }));
    }

    setLoading(false);
  }, [profile?.organization_id]);

  // Auth redirect removido — agora gerenciado pelo ProtectedLayout/AuthGuard

  useEffect(() => {
    if (profile?.organization_id) {
      fetchDashboardData();
    }
  }, [profile?.organization_id, fetchDashboardData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (authLoading) {
    return null;
  }

  const chartColors = ['#94a3b8', '#3b82f6', '#a855f7', '#f97316', '#22c55e'];

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Bem-vindo de volta, {profile?.first_name || 'Usuário'}
          </h1>
          <p className="text-muted-foreground">
            Veja o que está acontecendo com seu pipeline de vendas hoje.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pipeline Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{formatCurrency(stats.totalPipeline)}</div>
                  <p className="text-xs text-muted-foreground">Valor das oportunidades abertas</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads Abertos</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.openLeads}</div>
                  <p className="text-xs text-muted-foreground">Aguardando qualificação</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fechados Ganhos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{formatCurrency(stats.closedWon)}</div>
                  <p className="text-xs text-muted-foreground">Total de negócios ganhos</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atividades Recentes</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.activitiesCount}</div>
                  <p className="text-xs text-muted-foreground">Eventos na timeline</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 lg:grid-cols-7">
          {/* Pipeline Chart */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Pipeline por Estágio</CardTitle>
              <CardDescription>Distribuição de valor no seu pipeline de vendas</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : pipelineData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma oportunidade no pipeline ainda</p>
                    <Button
                      variant="link"
                      className="mt-2"
                      onClick={() => navigate('/opportunities/new')}
                    >
                      Criar sua primeira oportunidade
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pipelineData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" tickFormatter={(value) => `R$${value / 1000}k`} />
                      <YAxis type="category" dataKey="stage" width={100} />
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value), 'Valor']}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {pipelineData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stage Distribution */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Distribuição de Negócios</CardTitle>
              <CardDescription>Número de negócios por estágio</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : pipelineData.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  <p>Nenhum dado para exibir</p>
                </div>
              ) : (
                <>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pipelineData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          dataKey="count"
                          nameKey="stage"
                        >
                          {pipelineData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number, name: string) => [value, name]}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {pipelineData.map((item, index) => (
                      <div key={item.stage} className="flex items-center gap-2 text-sm">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: chartColors[index % chartColors.length] }}
                        />
                        <span className="truncate text-muted-foreground">{item.stage}</span>
                        <span className="ml-auto font-medium">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row - Now with 3 columns */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Top Deals */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Principais Negócios</CardTitle>
                <CardDescription>Oportunidades de maior valor no pipeline</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/opportunities')}>
                Ver Todos
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : topDeals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma oportunidade aberta</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="flex items-center gap-4 cursor-pointer hover:bg-muted/50 p-2 rounded-lg -mx-2"
                      onClick={() => navigate(`/opportunities/${deal.id}`)}
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{deal.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {deal.stage}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{deal.account_name}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(deal.amount)}</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Progress value={deal.probability} className="h-1 w-12" />
                          <span>{deal.probability}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Atividade Recente</CardTitle>
                <CardDescription>Últimas atualizações do CRM</CardDescription>
              </div>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma atividade recente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <Activity className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.event_type.replace(/_/g, ' ')} •{' '}
                          {format(new Date(activity.created_at), "d 'de' MMM, HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stale Deal Alerts Widget */}
          <StaleDealAlerts 
            thresholdDays={14} 
            maxItems={4} 
            showConfig={true}
          />
        </div>
      </div>
    </>
  );
}
