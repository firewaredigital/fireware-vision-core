import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Activity, AlertTriangle, CheckCircle, XCircle, 
  Clock, RefreshCw, Loader2, TrendingUp, Server
} from 'lucide-react';

type EventSeverity = 'info' | 'warning' | 'error' | 'critical';
type IntegrationStatus = 'pending' | 'running' | 'completed' | 'failed' | 'retrying';

const SEVERITY_CONFIG: Record<EventSeverity, { label: string; className: string; icon: React.ElementType }> = {
  info: { label: 'Info', className: 'bg-accent text-accent-foreground', icon: Activity },
  warning: { label: 'Aviso', className: 'bg-warning/20 text-warning-foreground', icon: AlertTriangle },
  error: { label: 'Erro', className: 'bg-destructive/20 text-destructive', icon: XCircle },
  critical: { label: 'Crítico', className: 'bg-destructive text-destructive-foreground', icon: XCircle },
};

const STATUS_CONFIG: Record<IntegrationStatus, { label: string; className: string; icon: React.ElementType }> = {
  pending: { label: 'Pendente', className: 'bg-muted text-muted-foreground', icon: Clock },
  running: { label: 'Executando', className: 'bg-primary/20 text-primary', icon: RefreshCw },
  completed: { label: 'Concluído', className: 'bg-accent text-accent-foreground', icon: CheckCircle },
  failed: { label: 'Falhou', className: 'bg-destructive/20 text-destructive', icon: XCircle },
  retrying: { label: 'Tentando', className: 'bg-warning/20 text-warning-foreground', icon: RefreshCw },
};

export default function PlatformObservability() {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;
  const [severityFilter, setSeverityFilter] = useState<EventSeverity | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<IntegrationStatus | 'all'>('all');

  const { data: events, isLoading: eventsLoading, refetch: refetchEvents } = useQuery({
    queryKey: ['system-events', organizationId, severityFilter],
    queryFn: async () => {
      let query = supabase
        .from('system_events')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (severityFilter !== 'all') {
        query = query.eq('severity', severityFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  const { data: integrationLogs, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['integration-logs', organizationId, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('integration_run_logs')
        .select('*')
        .eq('organization_id', organizationId)
        .order('started_at', { ascending: false })
        .limit(100);
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  const { data: metrics } = useQuery({
    queryKey: ['system-metrics-summary', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_metrics')
        .select('metric_type, metric_value')
        .eq('organization_id', organizationId)
        .gte('recorded_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('recorded_at', { ascending: false })
        .limit(1000);
      
      if (error) throw error;
      
      // Agregar métricas por tipo
      const aggregated: Record<string, { count: number; sum: number; avg: number }> = {};
      data?.forEach(m => {
        if (!aggregated[m.metric_type]) {
          aggregated[m.metric_type] = { count: 0, sum: 0, avg: 0 };
        }
        aggregated[m.metric_type].count++;
        aggregated[m.metric_type].sum += Number(m.metric_value);
        aggregated[m.metric_type].avg = aggregated[m.metric_type].sum / aggregated[m.metric_type].count;
      });
      
      return aggregated;
    },
    enabled: !!organizationId,
  });

  const eventCounts = {
    total: events?.length || 0,
    critical: events?.filter(e => e.severity === 'critical').length || 0,
    errors: events?.filter(e => e.severity === 'error').length || 0,
    warnings: events?.filter(e => e.severity === 'warning').length || 0,
  };

  const integrationStats = {
    total: integrationLogs?.length || 0,
    completed: integrationLogs?.filter(l => l.status === 'completed').length || 0,
    failed: integrationLogs?.filter(l => l.status === 'failed').length || 0,
    avgDuration: integrationLogs?.filter(l => l.duration_ms)
      .reduce((acc, l, _, arr) => acc + (l.duration_ms || 0) / arr.length, 0) || 0,
  };

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Observabilidade</h1>
            <p className="text-muted-foreground mt-1">
              Monitore eventos, métricas e execuções do sistema
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => { refetchEvents(); refetchLogs(); }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Cards de resumo */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Eventos (24h)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{eventCounts.total}</div>
              <div className="flex gap-2 mt-2 text-xs">
                {eventCounts.critical > 0 && (
                  <Badge variant="destructive">{eventCounts.critical} críticos</Badge>
                )}
                {eventCounts.errors > 0 && (
                  <Badge variant="secondary" className="bg-destructive/20 text-destructive">{eventCounts.errors} erros</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Integrações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{integrationStats.total}</div>
              <div className="flex gap-2 mt-2 text-xs">
                <Badge variant="secondary" className="bg-accent text-accent-foreground">
                  {integrationStats.completed} OK
                </Badge>
                {integrationStats.failed > 0 && (
                  <Badge variant="destructive">{integrationStats.failed} falhas</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tempo Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {integrationStats.avgDuration.toFixed(0)}ms
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Duração média das integrações
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de Sucesso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {integrationStats.total > 0 
                  ? ((integrationStats.completed / integrationStats.total) * 100).toFixed(1)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Integrações bem-sucedidas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de dados */}
        <Tabs defaultValue="events" className="space-y-4">
          <TabsList>
            <TabsTrigger value="events">Eventos do Sistema</TabsTrigger>
            <TabsTrigger value="integrations">Execuções de Integrações</TabsTrigger>
            <TabsTrigger value="metrics">Métricas</TabsTrigger>
          </TabsList>

          <TabsContent value="events">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Eventos do Sistema</CardTitle>
                  <CardDescription>Últimos 100 eventos registrados</CardDescription>
                </div>
                <Select 
                  value={severityFilter} 
                  onValueChange={(value) => setSeverityFilter(value as EventSeverity | 'all')}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filtrar por severidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Aviso</SelectItem>
                    <SelectItem value="error">Erro</SelectItem>
                    <SelectItem value="critical">Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                {eventsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Severidade</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Mensagem</TableHead>
                        <TableHead>Módulo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events?.map(event => {
                        const config = SEVERITY_CONFIG[event.severity as EventSeverity];
                        const Icon = config?.icon || Activity;
                        return (
                          <TableRow key={event.id}>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {format(new Date(event.created_at), "dd/MM HH:mm:ss", { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              <Badge className={config?.className}>
                                <Icon className="h-3 w-3 mr-1" />
                                {config?.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{event.event_type}</TableCell>
                            <TableCell className="max-w-[300px] truncate">{event.message}</TableCell>
                            <TableCell>
                              {event.source_module && (
                                <Badge variant="outline">{event.source_module}</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {(!events || events.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Nenhum evento registrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Execuções de Integrações</CardTitle>
                  <CardDescription>Histórico de chamadas a conectores</CardDescription>
                </div>
                <Select 
                  value={statusFilter} 
                  onValueChange={(value) => setStatusFilter(value as IntegrationStatus | 'all')}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="running">Executando</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="failed">Falhou</SelectItem>
                    <SelectItem value="retrying">Tentando</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Conector</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Duração</TableHead>
                        <TableHead>Tentativas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {integrationLogs?.map(log => {
                        const config = STATUS_CONFIG[log.status as IntegrationStatus];
                        const Icon = config?.icon || Clock;
                        return (
                          <TableRow key={log.id}>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {format(new Date(log.started_at), "dd/MM HH:mm:ss", { locale: ptBR })}
                            </TableCell>
                            <TableCell className="font-medium">{log.connector_name}</TableCell>
                            <TableCell className="font-mono text-xs">{log.action_name || '-'}</TableCell>
                            <TableCell>
                              <Badge className={config?.className}>
                                <Icon className="h-3 w-3 mr-1" />
                                {config?.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {log.duration_ms ? `${log.duration_ms}ms` : '-'}
                            </TableCell>
                            <TableCell>{log.retry_count}</TableCell>
                          </TableRow>
                        );
                      })}
                      {(!integrationLogs || integrationLogs.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Nenhuma execução registrada
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Métricas do Sistema
                </CardTitle>
                <CardDescription>Agregação das últimas 24 horas</CardDescription>
              </CardHeader>
              <CardContent>
                {metrics && Object.keys(metrics).length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-3">
                    {Object.entries(metrics).map(([type, data]) => (
                      <Card key={type}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">{type}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{data.avg.toFixed(2)}</div>
                          <p className="text-xs text-muted-foreground">
                            {data.count} registros | Total: {data.sum.toFixed(2)}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Server className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Nenhuma métrica registrada nas últimas 24 horas
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}
