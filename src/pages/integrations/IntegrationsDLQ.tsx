import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, RotateCcw, CheckCircle, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const dlqStatusConfig: Record<string, { color: string; label: string }> = {
  pending_review: { color: 'bg-yellow-100 text-yellow-800', label: 'Pendente' },
  retrying: { color: 'bg-blue-100 text-blue-800', label: 'Retentando' },
  resolved: { color: 'bg-green-100 text-green-800', label: 'Resolvido' },
  expired: { color: 'bg-muted text-muted-foreground', label: 'Expirado' },
  manually_resolved: { color: 'bg-green-100 text-green-800', label: 'Resolvido Manual' },
};

export default function IntegrationsDLQ() {
  const { profile } = useAuth();

  const { data: dlqMessages, isLoading, refetch } = useQuery({
    queryKey: ['dlq-messages', profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dlq_messages')
        .select('*, connector_instances(name)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.organization_id,
  });

  const handleRetry = async (id: string) => {
    const { error } = await supabase
      .from('dlq_messages')
      .update({ status: 'retrying' as any, last_retry_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      toast.error('Erro ao retentar');
    } else {
      toast.success('Mensagem reenfileirada para retentativa');
      refetch();
    }
  };

  const handleResolve = async (id: string) => {
    const { error } = await supabase
      .from('dlq_messages')
      .update({
        status: 'manually_resolved' as any,
        resolved_at: new Date().toISOString(),
        resolved_by: profile?.id,
      })
      .eq('id', id);
    if (error) {
      toast.error('Erro ao resolver');
    } else {
      toast.success('Mensagem marcada como resolvida');
      refetch();
    }
  };

  const pendingCount = dlqMessages?.filter(m => m.status === 'pending_review').length || 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              Dead Letter Queue
            </h1>
            <p className="text-muted-foreground mt-1">Mensagens que falharam após todas as tentativas</p>
          </div>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="text-sm px-3 py-1">
              {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : dlqMessages?.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p className="text-lg font-medium">Nenhuma mensagem na DLQ</p>
                <p className="text-sm">Todas as integrações estão funcionando corretamente.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ação</TableHead>
                    <TableHead>Conector</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tentativas</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Última Tentativa</TableHead>
                    <TableHead className="w-[120px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dlqMessages?.map((msg) => {
                    const s = dlqStatusConfig[msg.status] || dlqStatusConfig.pending_review;
                    const ci = msg.connector_instances as { name: string } | null;
                    return (
                      <TableRow key={msg.id}>
                        <TableCell className="font-mono text-sm">{msg.action_name}</TableCell>
                        <TableCell><Badge variant="outline">{ci?.name || '—'}</Badge></TableCell>
                        <TableCell><Badge className={s.color}>{s.label}</Badge></TableCell>
                        <TableCell>{msg.retry_count}/{msg.max_retries}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(msg.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {msg.last_retry_at ? format(new Date(msg.last_retry_at), 'dd/MM HH:mm', { locale: ptBR }) : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {msg.status === 'pending_review' && (
                              <>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRetry(msg.id)} title="Retentar">
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleResolve(msg.id)} title="Resolver">
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
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
