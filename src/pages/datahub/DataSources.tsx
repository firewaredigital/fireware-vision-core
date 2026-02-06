import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Database, RefreshCw, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const typeLabels: Record<string, string> = {
  internal: 'Interno',
  api: 'API',
  file_upload: 'Arquivo',
  webhook: 'Webhook',
  connector: 'Conector',
};

export default function DataSources() {
  const { profile } = useAuth();

  const { data: sources, isLoading } = useQuery({
    queryKey: ['data-sources', profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase.from('data_sources').select('*').order('created_at', { ascending: false });
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
            <h1 className="text-3xl font-bold">Fontes de Dados</h1>
            <p className="text-muted-foreground mt-1">Catálogo de origens de dados do Data Hub</p>
          </div>
          <Button className="gap-2"><Plus className="h-4 w-4" /> Nova Fonte</Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : sources?.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-3" />
                <p>Nenhuma fonte de dados configurada.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registros</TableHead>
                    <TableHead>Última Sync</TableHead>
                    <TableHead>Frequência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sources?.map((src) => (
                    <TableRow key={src.id}>
                      <TableCell className="font-medium">{src.name}</TableCell>
                      <TableCell><Badge variant="outline">{typeLabels[src.source_type] || src.source_type}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={src.status === 'active' ? 'default' : 'secondary'}>{src.status}</Badge>
                      </TableCell>
                      <TableCell>{src.record_count.toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {src.last_sync_at ? format(new Date(src.last_sync_at), 'dd/MM HH:mm', { locale: ptBR }) : '—'}
                      </TableCell>
                      <TableCell className="text-sm">{src.sync_frequency || 'Manual'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
