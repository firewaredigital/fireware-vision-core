
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, RefreshCw, Settings, Trash2, CheckCircle, XCircle, AlertTriangle, Clock } from '@/components/icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  active: { icon: CheckCircle, color: 'text-green-600', label: 'Ativo' },
  inactive: { icon: Clock, color: 'text-muted-foreground', label: 'Inativo' },
  error: { icon: XCircle, color: 'text-destructive', label: 'Erro' },
  configuring: { icon: Settings, color: 'text-yellow-600', label: 'Configurando' },
};

export default function IntegrationsInstances() {
  const { profile } = useAuth();

  const { data: instances, isLoading } = useQuery({
    queryKey: ['connector-instances', profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('connector_instances')
        .select('*, connectors(name, connector_type)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.organization_id,
  });

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Instâncias de Conectores</h1>
            <p className="text-muted-foreground mt-1">Conectores configurados para sua organização</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Nova Instância
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{instances?.length || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{instances?.filter(i => i.status === 'active').length || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-destructive">Em Erro</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{instances?.filter(i => i.status === 'error').length || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-600">Configurando</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{instances?.filter(i => i.status === 'configuring').length || 0}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : instances?.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <p>Nenhuma instância configurada. Vá ao catálogo para criar uma.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Conector</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Saúde</TableHead>
                    <TableHead>Último Check</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instances?.map((instance) => {
                    const s = statusConfig[instance.status] || statusConfig.inactive;
                    const StatusIcon = s.icon;
                    const connector = instance.connectors as { name: string; connector_type: string } | null;
                    return (
                      <TableRow key={instance.id}>
                        <TableCell className="font-medium">{instance.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{connector?.name || '—'}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`h-4 w-4 ${s.color}`} />
                            <span className="text-sm">{s.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={instance.health_status === 'healthy' ? 'default' : 'secondary'}>
                            {instance.health_status || 'desconhecido'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {instance.last_health_check
                            ? format(new Date(instance.last_health_check), 'dd/MM HH:mm', { locale: ptBR })
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Settings className="h-4 w-4" />
                            </Button>
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
    </>
  );
}
