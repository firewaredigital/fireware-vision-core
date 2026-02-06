
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, CheckCircle, XCircle, Clock, BarChart3, Zap, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusIcons: Record<string, { icon: React.ElementType; color: string }> = {
  completed: { icon: CheckCircle, color: 'text-green-600' },
  failed: { icon: XCircle, color: 'text-destructive' },
  running: { icon: Zap, color: 'text-blue-600' },
  pending: { icon: Clock, color: 'text-muted-foreground' },
  retrying: { icon: AlertTriangle, color: 'text-yellow-600' },
  dead_letter: { icon: XCircle, color: 'text-destructive' },
};

export default function IntegrationsMonitoring() {
  const { profile } = useAuth();

  const { data: runs, isLoading } = useQuery({
    queryKey: ['integration-runs', profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_runs')
        .select('*, connector_instances(name)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.organization_id,
  });

  const stats = {
    total: runs?.length || 0,
    completed: runs?.filter(r => r.status === 'completed').length || 0,
    failed: runs?.filter(r => r.status === 'failed').length || 0,
    avgDuration: runs?.length
      ? Math.round((runs.filter(r => r.duration_ms).reduce((s, r) => s + (r.duration_ms || 0), 0)) / Math.max(runs.filter(r => r.duration_ms).length, 1))
      : 0,
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Monitoramento de Integrações</h1>
          <p className="text-muted-foreground mt-1">Dashboard de execuções e métricas de integrações</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total de Execuções</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{stats.total}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-green-600">Sucesso</CardTitle></CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">{stats.total ? ((stats.completed / stats.total) * 100).toFixed(1) : 0}% taxa de sucesso</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-destructive">Falhas</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{stats.failed}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Latência Média</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{stats.avgDuration}ms</p></CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Execuções Recentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
              </div>
            ) : runs?.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">Nenhuma execução registrada ainda.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ação</TableHead>
                    <TableHead>Conector</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Tentativas</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs?.map((run) => {
                    const s = statusIcons[run.status] || statusIcons.pending;
                    const StatusIcon = s.icon;
                    const ci = run.connector_instances as { name: string } | null;
                    return (
                      <TableRow key={run.id}>
                        <TableCell className="font-mono text-sm">{run.action_name}</TableCell>
                        <TableCell><Badge variant="outline">{ci?.name || '—'}</Badge></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <StatusIcon className={`h-4 w-4 ${s.color}`} />
                            <span className="text-sm capitalize">{run.status}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{run.duration_ms ? `${run.duration_ms}ms` : '—'}</TableCell>
                        <TableCell className="text-sm">{run.retry_count}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(run.created_at), 'dd/MM HH:mm:ss', { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
