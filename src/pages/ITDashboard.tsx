import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Server, 
  Ticket, 
  GitBranch,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  FileText,
  Plus,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, subDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ITDashboard() {
  // Fetch incidents statistics
  const { data: incidentStats } = useQuery({
    queryKey: ['it-incident-stats'],
    queryFn: async () => {
      const { data: incidents, error } = await supabase
        .from('it_incidents')
        .select('id, status, priority, created_at');
      
      if (error) throw error;
      
      const total = incidents?.length || 0;
      const open = incidents?.filter(i => !['resolved', 'closed', 'cancelled'].includes(i.status)).length || 0;
      const critical = incidents?.filter(i => i.priority === 'critical' && !['resolved', 'closed'].includes(i.status)).length || 0;
      const todayCount = incidents?.filter(i => 
        new Date(i.created_at) >= startOfDay(new Date())
      ).length || 0;
      
      return { total, open, critical, todayCount };
    }
  });

  // Fetch changes statistics
  const { data: changeStats } = useQuery({
    queryKey: ['it-change-stats'],
    queryFn: async () => {
      const { data: changes, error } = await supabase
        .from('it_changes')
        .select('id, status, change_type, scheduled_start');
      
      if (error) throw error;
      
      const total = changes?.length || 0;
      const pending = changes?.filter(c => ['draft', 'submitted', 'pending_approval'].includes(c.status)).length || 0;
      const scheduled = changes?.filter(c => c.status === 'scheduled').length || 0;
      const emergency = changes?.filter(c => c.change_type === 'emergency' && c.status !== 'completed').length || 0;
      
      return { total, pending, scheduled, emergency };
    }
  });

  // Fetch problems statistics
  const { data: problemStats } = useQuery({
    queryKey: ['it-problem-stats'],
    queryFn: async () => {
      const { data: problems, error } = await supabase
        .from('it_problems')
        .select('id, status');
      
      if (error) throw error;
      
      const total = problems?.length || 0;
      const open = problems?.filter(p => !['resolved', 'closed'].includes(p.status)).length || 0;
      const knownErrors = problems?.filter(p => p.status === 'known_error').length || 0;
      
      return { total, open, knownErrors };
    }
  });

  // Fetch assets statistics
  const { data: assetStats } = useQuery({
    queryKey: ['it-asset-stats'],
    queryFn: async () => {
      const { data: assets, error } = await supabase
        .from('it_assets')
        .select('id, status, warranty_end_date');
      
      if (error) throw error;
      
      const total = assets?.length || 0;
      const inUse = assets?.filter(a => a.status === 'in_use').length || 0;
      const warrantyExpiring = assets?.filter(a => {
        if (!a.warranty_end_date) return false;
        const warrantyDate = new Date(a.warranty_end_date);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return warrantyDate <= thirtyDaysFromNow && warrantyDate >= new Date();
      }).length || 0;
      
      return { total, inUse, warrantyExpiring };
    }
  });

  // Fetch CMDB statistics
  const { data: cmdbStats } = useQuery({
    queryKey: ['it-cmdb-stats'],
    queryFn: async () => {
      const { data: items, error } = await supabase
        .from('cmdb_items')
        .select('id, status, ci_type');
      
      if (error) throw error;
      
      const total = items?.length || 0;
      const active = items?.filter(i => i.status === 'active').length || 0;
      const byType = items?.reduce((acc, item) => {
        acc[item.ci_type] = (acc[item.ci_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      return { total, active, byType };
    }
  });

  // Fetch recent incidents
  const { data: recentIncidents } = useQuery({
    queryKey: ['it-recent-incidents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('it_incidents')
        .select(`
          id,
          incident_number,
          title,
          status,
          priority,
          created_at,
          assigned_to
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch upcoming changes
  const { data: upcomingChanges } = useQuery({
    queryKey: ['it-upcoming-changes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('it_changes')
        .select(`
          id,
          change_number,
          title,
          status,
          change_type,
          risk_level,
          scheduled_start
        `)
        .in('status', ['approved', 'scheduled'])
        .order('scheduled_start', { ascending: true })
        .limit(5);
      
      if (error) throw error;
      return data;
    }
  });

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { variant: 'destructive' | 'default' | 'secondary' | 'outline', label: string }> = {
      critical: { variant: 'destructive', label: 'Crítica' },
      high: { variant: 'destructive', label: 'Alta' },
      medium: { variant: 'default', label: 'Média' },
      low: { variant: 'secondary', label: 'Baixa' }
    };
    const config = variants[priority] || variants.medium;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statusLabels: Record<string, string> = {
      new: 'Novo',
      acknowledged: 'Reconhecido',
      in_progress: 'Em Andamento',
      pending_info: 'Aguardando Info',
      resolved: 'Resolvido',
      closed: 'Fechado',
      draft: 'Rascunho',
      submitted: 'Submetido',
      approved: 'Aprovado',
      scheduled: 'Agendado',
      implementing: 'Implementando',
      completed: 'Concluído'
    };
    return <Badge variant="outline">{statusLabels[status] || status}</Badge>;
  };

  const getRiskBadge = (risk: string) => {
    const variants: Record<string, 'destructive' | 'default' | 'secondary'> = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    };
    return <Badge variant={variants[risk] || 'secondary'}>{risk?.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IT Service Management</h1>
          <p className="text-muted-foreground">
            Visão geral de incidentes, mudanças, problemas e ativos de TI
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/it/incidents/new">
              <Plus className="mr-2 h-4 w-4" />
              Novo Incidente
            </Link>
          </Button>
          <Button asChild>
            <Link to="/it/changes/new">
              <Plus className="mr-2 h-4 w-4" />
              Nova Mudança
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incidentes Abertos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incidentStats?.open || 0}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {incidentStats?.critical ? (
                <span className="flex items-center text-destructive">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  {incidentStats.critical} críticos
                </span>
              ) : (
                <span className="flex items-center text-green-600">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Nenhum crítico
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mudanças Pendentes</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{changeStats?.pending || 0}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="mr-1 h-3 w-3" />
              {changeStats?.scheduled || 0} agendadas
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Problemas Abertos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{problemStats?.open || 0}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="mr-1 h-3 w-3" />
              {problemStats?.knownErrors || 0} erros conhecidos
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos em Uso</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assetStats?.inUse || 0}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {assetStats?.warrantyExpiring ? (
                <span className="flex items-center text-orange-600">
                  <Clock className="mr-1 h-3 w-3" />
                  {assetStats.warrantyExpiring} garantias expirando
                </span>
              ) : (
                <span>de {assetStats?.total || 0} total</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="incidents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="incidents">Incidentes Recentes</TabsTrigger>
          <TabsTrigger value="changes">Mudanças Agendadas</TabsTrigger>
          <TabsTrigger value="cmdb">CMDB</TabsTrigger>
        </TabsList>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Últimos Incidentes</CardTitle>
                <CardDescription>Incidentes mais recentes registrados no sistema</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/it/incidents">
                  Ver Todos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentIncidents && recentIncidents.length > 0 ? (
                <div className="space-y-4">
                  {recentIncidents.map((incident) => (
                    <div key={incident.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div className="space-y-1">
                        <Link 
                          to={`/it/incidents/${incident.id}`}
                          className="font-medium hover:underline"
                        >
                          {incident.incident_number} - {incident.title}
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{format(new Date(incident.created_at), "dd/MM HH:mm", { locale: ptBR })}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getPriorityBadge(incident.priority)}
                        {getStatusBadge(incident.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <AlertTriangle className="mx-auto h-12 w-12 opacity-50" />
                  <p className="mt-2">Nenhum incidente registrado</p>
                  <Button asChild className="mt-4" variant="outline">
                    <Link to="/it/incidents/new">Registrar Incidente</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="changes" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Mudanças Agendadas</CardTitle>
                <CardDescription>Próximas mudanças aprovadas e agendadas</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/it/changes">
                  Ver Todas
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {upcomingChanges && upcomingChanges.length > 0 ? (
                <div className="space-y-4">
                  {upcomingChanges.map((change) => (
                    <div key={change.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div className="space-y-1">
                        <Link 
                          to={`/it/changes/${change.id}`}
                          className="font-medium hover:underline"
                        >
                          {change.change_number} - {change.title}
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {change.scheduled_start && (
                            <span>
                              <Clock className="mr-1 inline h-3 w-3" />
                              {format(new Date(change.scheduled_start), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={change.change_type === 'emergency' ? 'destructive' : 'outline'}>
                          {change.change_type === 'emergency' ? 'Emergência' : change.change_type === 'standard' ? 'Padrão' : 'Normal'}
                        </Badge>
                        {getRiskBadge(change.risk_level)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <GitBranch className="mx-auto h-12 w-12 opacity-50" />
                  <p className="mt-2">Nenhuma mudança agendada</p>
                  <Button asChild className="mt-4" variant="outline">
                    <Link to="/it/changes/new">Criar Mudança</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cmdb" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Itens de Configuração</CardTitle>
                <CardDescription>Visão geral do CMDB</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total de CIs</span>
                    <span className="font-medium">{cmdbStats?.total || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">CIs Ativos</span>
                    <span className="font-medium text-green-600">{cmdbStats?.active || 0}</span>
                  </div>
                  {cmdbStats?.byType && Object.entries(cmdbStats.byType).slice(0, 5).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm capitalize text-muted-foreground">{type.replace('_', ' ')}</span>
                      <Badge variant="secondary">{count as number}</Badge>
                    </div>
                  ))}
                </div>
                <Button asChild className="mt-4 w-full" variant="outline">
                  <Link to="/it/cmdb">
                    Explorar CMDB
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>Operações frequentes de ITSM</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/it/incidents/new">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Registrar Incidente
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/it/requests/new">
                    <Ticket className="mr-2 h-4 w-4" />
                    Nova Requisição de Serviço
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/it/changes/new">
                    <GitBranch className="mr-2 h-4 w-4" />
                    Solicitar Mudança
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/it/problems/new">
                    <FileText className="mr-2 h-4 w-4" />
                    Registrar Problema
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/it/assets/new">
                    <Package className="mr-2 h-4 w-4" />
                    Cadastrar Ativo
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/it/catalog">
                    <Server className="mr-2 h-4 w-4" />
                    Catálogo de Serviços
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
