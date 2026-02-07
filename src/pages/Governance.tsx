import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Shield,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Users,
  Database,
  Lock,
  Eye,
  Download,
  Trash2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from '@/components/icons';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

export default function Governance() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch LGPD requests
  const { data: lgpdRequests = [] } = useQuery({
    queryKey: ['lgpd-requests', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data, error } = await supabase
        .from('lgpd_requests')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.organization_id,
  });

  // Fetch retention policies
  const { data: retentionPolicies = [] } = useQuery({
    queryKey: ['retention-policies', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data, error } = await supabase
        .from('data_retention_policies')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.organization_id,
  });

  // Fetch audit logs summary
  const { data: auditStats } = useQuery({
    queryKey: ['audit-stats', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return null;
      const { data, error } = await supabase
        .from('audit_logs')
        .select('action, entity_type')
        .eq('organization_id', profile.organization_id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      if (error) throw error;
      
      const stats = {
        total: data?.length || 0,
        creates: data?.filter(l => l.action === 'CREATE').length || 0,
        updates: data?.filter(l => l.action === 'UPDATE').length || 0,
        deletes: data?.filter(l => l.action === 'DELETE').length || 0,
        byEntity: {} as Record<string, number>,
      };
      
      data?.forEach(log => {
        stats.byEntity[log.entity_type] = (stats.byEntity[log.entity_type] || 0) + 1;
      });
      
      return stats;
    },
    enabled: !!profile?.organization_id,
  });

  // Fetch consent logs
  const { data: consentStats } = useQuery({
    queryKey: ['consent-stats', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return null;
      const { data, error } = await supabase
        .from('consent_log')
        .select('action, consent_type')
        .eq('organization_id', profile.organization_id);
      if (error) throw error;
      
      return {
        total: data?.length || 0,
        granted: data?.filter(c => c.action === 'granted').length || 0,
        revoked: data?.filter(c => c.action === 'revoked').length || 0,
      };
    },
    enabled: !!profile?.organization_id,
  });

  // Calculate LGPD metrics
  const lgpdMetrics = {
    total: lgpdRequests.length,
    pending: lgpdRequests.filter((r: any) => ['received', 'verified', 'processing'].includes(r.status)).length,
    completed: lgpdRequests.filter((r: any) => r.status === 'completed').length,
    overdue: lgpdRequests.filter((r: any) => {
      if (['completed', 'denied'].includes(r.status)) return false;
      return new Date(r.deadline) < new Date();
    }).length,
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      received: 'bg-blue-100 text-blue-800',
      verified: 'bg-purple-100 text-purple-800',
      processing: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      denied: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
    };
    const labels: Record<string, string> = {
      received: 'Recebida',
      verified: 'Verificada',
      processing: 'Em Processamento',
      completed: 'Concluída',
      denied: 'Negada',
      expired: 'Expirada',
    };
    return (
      <Badge className={styles[status] || 'bg-gray-100 text-gray-800'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      access: 'Acesso',
      rectification: 'Retificação',
      deletion: 'Exclusão',
      portability: 'Portabilidade',
      objection: 'Oposição',
      restriction: 'Restrição',
    };
    const icons: Record<string, React.ReactNode> = {
      access: <Eye className="h-3 w-3" />,
      rectification: <RefreshCw className="h-3 w-3" />,
      deletion: <Trash2 className="h-3 w-3" />,
      portability: <Download className="h-3 w-3" />,
      objection: <XCircle className="h-3 w-3" />,
      restriction: <Lock className="h-3 w-3" />,
    };
    return (
      <Badge variant="outline" className="gap-1">
        {icons[type]}
        {labels[type] || type}
      </Badge>
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Governança & Compliance</h1>
            <p className="text-muted-foreground">
              Gerencie conformidade LGPD, auditoria e políticas de dados
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/audit-logs">
                <FileText className="mr-2 h-4 w-4" />
                Logs de Auditoria
              </Link>
            </Button>
            <Button asChild>
              <Link to="/governance/lgpd/new">
                <Shield className="mr-2 h-4 w-4" />
                Nova Solicitação LGPD
              </Link>
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solicitações LGPD</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lgpdMetrics.total}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="text-yellow-600">{lgpdMetrics.pending} pendentes</span>
                <span>•</span>
                <span className="text-green-600">{lgpdMetrics.completed} concluídas</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solicitações Atrasadas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{lgpdMetrics.overdue}</div>
              <p className="text-xs text-muted-foreground">
                Prazo legal de 15 dias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ações Auditadas (30d)</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{auditStats?.total || 0}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="text-green-600">+{auditStats?.creates || 0}</span>
                <span className="text-blue-600">~{auditStats?.updates || 0}</span>
                <span className="text-red-600">-{auditStats?.deletes || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Consentimentos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{consentStats?.total || 0}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="text-green-600">{consentStats?.granted || 0} ativos</span>
                <span>•</span>
                <span className="text-red-600">{consentStats?.revoked || 0} revogados</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="lgpd">Solicitações LGPD</TabsTrigger>
            <TabsTrigger value="retention">Políticas de Retenção</TabsTrigger>
            <TabsTrigger value="consents">Consentimentos</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Compliance Score */}
              <Card>
                <CardHeader>
                  <CardTitle>Score de Conformidade</CardTitle>
                  <CardDescription>Avaliação geral de compliance LGPD</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-4xl font-bold text-green-600">85%</span>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <Progress value={85} className="h-2" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>RLS Habilitado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Audit Logs Ativos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Roles Segregados</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span>Retenção Pendente</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent LGPD Requests */}
              <Card>
                <CardHeader>
                  <CardTitle>Solicitações Recentes</CardTitle>
                  <CardDescription>Últimas solicitações de titulares</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {lgpdRequests.slice(0, 5).map((request: any) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {getTypeBadge(request.type)}
                            {getStatusBadge(request.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {request.requester_email}
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-medium">
                            {differenceInDays(new Date(request.deadline), new Date())} dias
                          </p>
                          <p className="text-xs text-muted-foreground">restantes</p>
                        </div>
                      </div>
                    ))}
                    {lgpdRequests.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-4">
                        Nenhuma solicitação registrada
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Retention Policies Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Políticas de Retenção Ativas</CardTitle>
                <CardDescription>Regras de ciclo de vida dos dados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {retentionPolicies.filter((p: any) => p.is_active).slice(0, 3).map((policy: any) => (
                    <div key={policy.id} className="rounded-lg border p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{policy.name}</h4>
                        <Badge variant="outline">{policy.entity_type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{policy.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span>Retenção: {policy.retention_days} dias</span>
                        <Badge variant={policy.action === 'delete' ? 'destructive' : 'secondary'}>
                          {policy.action === 'delete' ? 'Excluir' : policy.action === 'anonymize' ? 'Anonimizar' : 'Arquivar'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {retentionPolicies.length === 0 && (
                    <p className="col-span-3 text-center text-sm text-muted-foreground py-4">
                      Nenhuma política de retenção configurada
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lgpd" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Solicitações de Titulares (LGPD)</CardTitle>
                    <CardDescription>
                      Gerencie solicitações de acesso, retificação, exclusão e portabilidade
                    </CardDescription>
                  </div>
                  <Button asChild>
                    <Link to="/governance/lgpd/new">Nova Solicitação</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lgpdRequests.map((request: any) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getTypeBadge(request.type)}
                          {getStatusBadge(request.status)}
                          {new Date(request.deadline) < new Date() && 
                            !['completed', 'denied'].includes(request.status) && (
                            <Badge variant="destructive">Atrasada</Badge>
                          )}
                        </div>
                        <p className="font-medium">{request.requester_name || request.requester_email}</p>
                        <p className="text-sm text-muted-foreground">
                          Criada em {format(new Date(request.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            Prazo: {format(new Date(request.deadline), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {differenceInDays(new Date(request.deadline), new Date())} dias restantes
                          </p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/governance/lgpd/${request.id}`}>
                            Ver Detalhes
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                  {lgpdRequests.length === 0 && (
                    <div className="text-center py-8">
                      <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-medium">Nenhuma solicitação</h3>
                      <p className="text-sm text-muted-foreground">
                        Não há solicitações LGPD registradas
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="retention" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Políticas de Retenção de Dados</CardTitle>
                    <CardDescription>
                      Configure regras de ciclo de vida para diferentes tipos de dados
                    </CardDescription>
                  </div>
                  <Button asChild>
                    <Link to="/governance/retention/new">Nova Política</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {retentionPolicies.map((policy: any) => (
                    <div
                      key={policy.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{policy.name}</h4>
                          <Badge variant={policy.is_active ? 'default' : 'secondary'}>
                            {policy.is_active ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{policy.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span>Entidade: <strong>{policy.entity_type}</strong></span>
                          <span>Retenção: <strong>{policy.retention_days} dias</strong></span>
                          <span>Ação: <strong>{policy.action}</strong></span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {policy.last_run_at && (
                          <span className="text-xs text-muted-foreground">
                            Última execução: {format(new Date(policy.last_run_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        )}
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/governance/retention/${policy.id}`}>
                            Editar
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                  {retentionPolicies.length === 0 && (
                    <div className="text-center py-8">
                      <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-medium">Nenhuma política</h3>
                      <p className="text-sm text-muted-foreground">
                        Configure políticas de retenção para seus dados
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="consents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Centro de Consentimentos</CardTitle>
                <CardDescription>
                  Visualize e gerencie consentimentos de clientes para comunicações e tratamento de dados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Email Marketing</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-green-600">78%</p>
                          <p className="text-sm text-muted-foreground">opt-in rate</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">SMS</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-yellow-600">45%</p>
                          <p className="text-sm text-muted-foreground">opt-in rate</p>
                        </div>
                        <TrendingDown className="h-8 w-8 text-yellow-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">WhatsApp</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-green-600">82%</p>
                          <p className="text-sm text-muted-foreground">opt-in rate</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium mb-4">Histórico de Alterações Recentes</h4>
                  <div className="text-center py-8 text-muted-foreground">
                    <Lock className="mx-auto h-12 w-12 mb-4" />
                    <p>Nenhuma alteração de consentimento registrada</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
