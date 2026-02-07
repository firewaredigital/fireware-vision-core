import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Heart,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Users,
  PlayCircle,
  BarChart3,
  Target,
  Clock,
  ArrowRight,
  Plus,
} from '@/components/icons';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function CustomerSuccess() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch health scores
  const { data: healthScores = [] } = useQuery({
    queryKey: ['health-scores', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data, error } = await supabase
        .from('customer_health_scores')
        .select(`
          *,
          account:accounts(id, name, industry)
        `)
        .eq('organization_id', profile.organization_id)
        .order('score', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.organization_id,
  });

  // Fetch playbooks
  const { data: playbooks = [] } = useQuery({
    queryKey: ['playbooks', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data, error } = await supabase
        .from('customer_playbooks')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.organization_id,
  });

  // Fetch active enrollments
  const { data: enrollments = [] } = useQuery({
    queryKey: ['playbook-enrollments', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data, error } = await supabase
        .from('playbook_enrollments')
        .select(`
          *,
          playbook:customer_playbooks(id, name, type),
          account:accounts(id, name)
        `)
        .eq('organization_id', profile.organization_id)
        .eq('status', 'active')
        .order('next_step_due', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.organization_id,
  });

  // Calculate metrics
  const metrics = {
    avgScore: healthScores.length > 0 
      ? Math.round(healthScores.reduce((sum, h: any) => sum + h.score, 0) / healthScores.length)
      : 0,
    atRisk: healthScores.filter((h: any) => h.risk_level === 'high' || h.risk_level === 'critical').length,
    healthy: healthScores.filter((h: any) => h.risk_level === 'low').length,
    activePlaybooks: enrollments.length,
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    const styles: Record<string, string> = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      low: 'Saudável',
      medium: 'Atenção',
      high: 'Risco',
      critical: 'Crítico',
    };
    return (
      <Badge className={styles[riskLevel] || 'bg-gray-100 text-gray-800'}>
        {labels[riskLevel] || riskLevel}
      </Badge>
    );
  };

  const getPlaybookTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      onboarding: 'bg-blue-100 text-blue-800',
      adoption: 'bg-purple-100 text-purple-800',
      renewal: 'bg-green-100 text-green-800',
      expansion: 'bg-indigo-100 text-indigo-800',
      risk_mitigation: 'bg-red-100 text-red-800',
      reactivation: 'bg-orange-100 text-orange-800',
      offboarding: 'bg-gray-100 text-gray-800',
    };
    const labels: Record<string, string> = {
      onboarding: 'Onboarding',
      adoption: 'Adoção',
      renewal: 'Renovação',
      expansion: 'Expansão',
      risk_mitigation: 'Mitigação de Risco',
      reactivation: 'Reativação',
      offboarding: 'Offboarding',
    };
    return (
      <Badge className={styles[type] || 'bg-gray-100 text-gray-800'}>
        {labels[type] || type}
      </Badge>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <>
      <div className="space-y-6">
        <ModuleHeroBanner
          module="service"
          title="Customer Success"
          subtitle="Monitore a saúde dos clientes e gerencie playbooks de sucesso"
          compact
          actions={
            <Button variant="outline" asChild className="gap-2 bg-white text-foreground hover:bg-white/90">
              <Link to="/customer-success/playbooks/new">
                <Plus className="h-4 w-4" /> Novo Playbook
              </Link>
            </Button>
          }
        />

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Health Score Médio</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(metrics.avgScore)}`}>
                {metrics.avgScore}%
              </div>
              <Progress value={metrics.avgScore} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes em Risco</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{metrics.atRisk}</div>
              <p className="text-xs text-muted-foreground">
                Requerem atenção imediata
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Saudáveis</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{metrics.healthy}</div>
              <p className="text-xs text-muted-foreground">
                Score acima de 80%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Playbooks Ativos</CardTitle>
              <PlayCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activePlaybooks}</div>
              <p className="text-xs text-muted-foreground">
                Clientes em jornadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="health">Health Scores</TabsTrigger>
            <TabsTrigger value="playbooks">Playbooks</TabsTrigger>
            <TabsTrigger value="enrollments">Jornadas Ativas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* At Risk Accounts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Clientes em Risco
                  </CardTitle>
                  <CardDescription>Contas que precisam de atenção</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {healthScores
                      .filter((h: any) => h.risk_level === 'high' || h.risk_level === 'critical')
                      .slice(0, 5)
                      .map((health: any) => (
                        <div
                          key={health.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`text-lg font-bold ${getScoreColor(health.score)}`}>
                              {health.score}
                            </div>
                            <div>
                              <p className="font-medium">{health.account?.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {health.account?.industry}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getTrendIcon(health.trend)}
                            {getRiskBadge(health.risk_level)}
                          </div>
                        </div>
                      ))}
                    {healthScores.filter((h: any) => h.risk_level === 'high' || h.risk_level === 'critical').length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-4">
                        Nenhum cliente em risco 🎉
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Active Journeys */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PlayCircle className="h-5 w-5" />
                    Jornadas em Andamento
                  </CardTitle>
                  <CardDescription>Próximas ações pendentes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {enrollments.slice(0, 5).map((enrollment: any) => (
                      <div
                        key={enrollment.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {getPlaybookTypeBadge(enrollment.playbook?.type)}
                          </div>
                          <p className="font-medium">{enrollment.account?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Step {enrollment.current_step} • {enrollment.progress_percent}% completo
                          </p>
                        </div>
                        {enrollment.next_step_due && (
                          <div className="text-right text-sm">
                            <p className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {format(new Date(enrollment.next_step_due), 'dd/MM', { locale: ptBR })}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                    {enrollments.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-4">
                        Nenhuma jornada ativa
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Playbooks Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Playbooks Disponíveis</CardTitle>
                <CardDescription>Modelos de jornada para Customer Success</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {playbooks.filter((p: any) => p.is_active).map((playbook: any) => (
                    <div key={playbook.id} className="rounded-lg border p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        {getPlaybookTypeBadge(playbook.type)}
                      </div>
                      <h4 className="font-medium">{playbook.name}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {playbook.description}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {playbook.enrollment_count} inscrições
                        </span>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/customer-success/playbooks/${playbook.id}`}>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                  {playbooks.length === 0 && (
                    <p className="col-span-full text-center text-sm text-muted-foreground py-4">
                      Nenhum playbook configurado
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Health Scores por Cliente</CardTitle>
                <CardDescription>
                  Monitoramento da saúde de cada conta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {healthScores.map((health: any) => (
                    <div
                      key={health.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 text-center">
                          <div className={`text-2xl font-bold ${getScoreColor(health.score)}`}>
                            {health.score}
                          </div>
                          <Progress value={health.score} className="h-1 mt-1" />
                        </div>
                        <div>
                          <p className="font-medium">{health.account?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {health.account?.industry}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getTrendIcon(health.trend)}
                          <span className="text-sm text-muted-foreground">
                            {health.trend === 'improving' ? 'Melhorando' : health.trend === 'declining' ? 'Declinando' : 'Estável'}
                          </span>
                        </div>
                        {getRiskBadge(health.risk_level)}
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/accounts/${health.account_id}`}>
                            Ver Conta
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                  {healthScores.length === 0 && (
                    <div className="text-center py-8">
                      <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-medium">Nenhum Health Score</h3>
                      <p className="text-sm text-muted-foreground">
                        Os health scores serão calculados automaticamente
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="playbooks" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Playbooks de Customer Success</CardTitle>
                    <CardDescription>
                      Jornadas e processos automatizados para sucesso do cliente
                    </CardDescription>
                  </div>
                  <Button asChild>
                    <Link to="/customer-success/playbooks/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Playbook
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {playbooks.map((playbook: any) => (
                    <div
                      key={playbook.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getPlaybookTypeBadge(playbook.type)}
                          <Badge variant={playbook.is_active ? 'default' : 'secondary'}>
                            {playbook.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                          {playbook.auto_enroll && (
                            <Badge variant="outline">Auto-inscrição</Badge>
                          )}
                        </div>
                        <h4 className="font-medium">{playbook.name}</h4>
                        <p className="text-sm text-muted-foreground">{playbook.description}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <p className="font-medium">{playbook.enrollment_count} inscrições</p>
                          <p className="text-muted-foreground">{playbook.success_count} sucessos</p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/customer-success/playbooks/${playbook.id}`}>
                            Editar
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                  {playbooks.length === 0 && (
                    <div className="text-center py-8">
                      <Target className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-medium">Nenhum Playbook</h3>
                      <p className="text-sm text-muted-foreground">
                        Crie playbooks para automatizar jornadas de sucesso
                      </p>
                      <Button className="mt-4" asChild>
                        <Link to="/customer-success/playbooks/new">
                          <Plus className="mr-2 h-4 w-4" />
                          Criar Playbook
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enrollments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Jornadas Ativas</CardTitle>
                <CardDescription>
                  Clientes inscritos em playbooks de sucesso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {enrollments.map((enrollment: any) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {getPlaybookTypeBadge(enrollment.playbook?.type)}
                          <span className="text-sm font-medium">{enrollment.playbook?.name}</span>
                        </div>
                        <p className="font-medium">{enrollment.account?.name}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Step {enrollment.current_step}</span>
                          <span>•</span>
                          <span>{enrollment.progress_percent}% completo</span>
                        </div>
                        <Progress value={enrollment.progress_percent} className="h-2 w-48" />
                      </div>
                      <div className="flex items-center gap-4">
                        {enrollment.next_step_due && (
                          <div className="text-right text-sm">
                            <p className="font-medium flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Próximo step
                            </p>
                            <p className="text-muted-foreground">
                              {format(new Date(enrollment.next_step_due), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          </div>
                        )}
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/accounts/${enrollment.account_id}`}>
                            Ver Conta
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                  {enrollments.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-medium">Nenhuma Jornada Ativa</h3>
                      <p className="text-sm text-muted-foreground">
                        Inscreva clientes em playbooks para acompanhar suas jornadas
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
