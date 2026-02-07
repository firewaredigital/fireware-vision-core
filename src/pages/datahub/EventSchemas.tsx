
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Code, Eye } from '@/components/icons';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';

export default function EventSchemas() {
  const { profile } = useAuth();
  const [selectedSchema, setSelectedSchema] = useState<any>(null);

  const { data: schemas, isLoading } = useQuery({
    queryKey: ['event-schemas', profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase.from('event_schemas').select('*').order('event_name');
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
            <h1 className="text-3xl font-bold">Event Schemas</h1>
            <p className="text-muted-foreground mt-1">Registry de schemas de eventos comportamentais</p>
          </div>
          <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Schema</Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : schemas?.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Code className="h-12 w-12 mx-auto mb-3" />
                <p>Nenhum schema de evento registrado.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Evento</TableHead>
                    <TableHead>Versão</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]">Schema</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schemas?.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-sm">{s.event_name}</TableCell>
                      <TableCell><Badge variant="outline">v{s.schema_version}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.description || '—'}</TableCell>
                      <TableCell>{s.is_active ? <Badge>Ativo</Badge> : <Badge variant="secondary">Inativo</Badge>}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedSchema(s)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader><DialogTitle>{s.event_name} v{s.schema_version}</DialogTitle></DialogHeader>
                            <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-[400px]">
                              {JSON.stringify(s.properties_schema, null, 2)}
                            </pre>
                          </DialogContent>
                        </Dialog>
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
