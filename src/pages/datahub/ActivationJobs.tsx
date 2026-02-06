import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Zap, CheckCircle, Clock, XCircle, Pause } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-muted-foreground', label: 'Pendente' },
  running: { icon: Zap, color: 'text-blue-600', label: 'Executando' },
  completed: { icon: CheckCircle, color: 'text-green-600', label: 'Concluído' },
  failed: { icon: XCircle, color: 'text-destructive', label: 'Falhou' },
  paused: { icon: Pause, color: 'text-yellow-600', label: 'Pausado' },
};

export default function ActivationJobs() {
  const { profile } = useAuth();

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['activation-jobs', profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activation_jobs')
        .select('*, segments(name), activation_destinations(name, destination_type)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.organization_id,
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Activation Jobs</h1>
            <p className="text-muted-foreground mt-1">Publicação de segmentos para destinos de ativação</p>
          </div>
          <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Job</Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : jobs?.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Zap className="h-12 w-12 mx-auto mb-3" />
                <p>Nenhum job de ativação configurado.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Segmento</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registros</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Próxima Exec.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs?.map((job) => {
                    const s = statusConfig[job.status] || statusConfig.pending;
                    const StatusIcon = s.icon;
                    const seg = job.segments as { name: string } | null;
                    const dest = job.activation_destinations as { name: string; destination_type: string } | null;
                    return (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{seg?.name || '—'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{dest?.name || '—'}</span>
                            {dest?.destination_type && <Badge variant="outline" className="text-xs">{dest.destination_type}</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <StatusIcon className={`h-4 w-4 ${s.color}`} />
                            <span className="text-sm">{s.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>{job.records_synced.toLocaleString()}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {job.started_at ? format(new Date(job.started_at), 'dd/MM HH:mm', { locale: ptBR }) : '—'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {job.next_run_at ? format(new Date(job.next_run_at), 'dd/MM HH:mm', { locale: ptBR }) : '—'}
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
    </AppLayout>
  );
}
