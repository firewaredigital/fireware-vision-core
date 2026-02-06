
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Globe, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function IntegrationsWebhooks() {
  const { profile } = useAuth();

  const { data: endpoints, isLoading } = useQuery({
    queryKey: ['webhook-endpoints', profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_endpoints')
        .select('*')
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
            <h1 className="text-3xl font-bold">Webhooks de Saída</h1>
            <p className="text-muted-foreground mt-1">Endpoints configurados para receber eventos do sistema</p>
          </div>
          <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Webhook</Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : endpoints?.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Globe className="h-12 w-12 mx-auto mb-3" />
                <p>Nenhum webhook configurado.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead>Eventos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Falhas</TableHead>
                    <TableHead>Último Disparo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {endpoints?.map((ep) => (
                    <TableRow key={ep.id}>
                      <TableCell className="font-mono text-sm max-w-[300px] truncate">{ep.url}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(ep.events || []).slice(0, 2).map((e: string) => (
                            <Badge key={e} variant="outline" className="text-xs">{e}</Badge>
                          ))}
                          {(ep.events || []).length > 2 && (
                            <Badge variant="outline" className="text-xs">+{(ep.events || []).length - 2}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {ep.is_active ? (
                          <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </TableCell>
                      <TableCell>{ep.failure_count}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {ep.last_triggered_at
                          ? format(new Date(ep.last_triggered_at), 'dd/MM HH:mm', { locale: ptBR })
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
