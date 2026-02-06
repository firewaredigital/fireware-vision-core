import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useParams, useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserCircle, Building2, Mail, Phone, FileText, Link as LinkIcon, Shield, Clock } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function GoldenRecordDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['golden-profile', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('golden_profiles').select('*').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: links } = useQuery({
    queryKey: ['golden-profile-links', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('golden_profile_links').select('*').eq('golden_profile_id', id!).order('linked_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: mergeHistory } = useQuery({
    queryKey: ['profile-merge-history', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('profile_merge_history').select('*').eq('target_golden_profile_id', id!).order('merged_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return <AppLayout><div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-64" /></div></AppLayout>;
  }

  if (!profile) {
    return <AppLayout><div className="text-center py-12 text-muted-foreground">Perfil não encontrado.</div></AppLayout>;
  }

  const consolidated = profile.consolidated_data as Record<string, unknown> | null;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/data-hub/golden-records')}><ArrowLeft className="h-4 w-4" /></Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              {profile.profile_type === 'company' ? <Building2 className="h-7 w-7" /> : <UserCircle className="h-7 w-7" />}
              {profile.display_name || 'Sem nome'}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant="outline">{profile.profile_type === 'person' ? 'Pessoa' : 'Empresa'}</Badge>
              <Badge variant={Number(profile.confidence_score) >= 80 ? 'default' : 'secondary'}>Confiança: {Number(profile.confidence_score).toFixed(0)}%</Badge>
              <span className="text-sm text-muted-foreground">{profile.source_count} fontes vinculadas</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Mail className="h-4 w-4" /> Email</CardTitle></CardHeader>
            <CardContent><p className="text-sm">{profile.primary_email || '—'}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Phone className="h-4 w-4" /> Telefone</CardTitle></CardHeader>
            <CardContent><p className="text-sm">{profile.primary_phone || '—'}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> Documento</CardTitle></CardHeader>
            <CardContent><p className="text-sm">{profile.primary_document || '—'}</p></CardContent>
          </Card>
        </div>

        <Tabs defaultValue="links">
          <TabsList>
            <TabsTrigger value="links">Entidades Vinculadas ({links?.length || 0})</TabsTrigger>
            <TabsTrigger value="data">Dados Consolidados</TabsTrigger>
            <TabsTrigger value="history">Histórico de Merge ({mergeHistory?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="links">
            <Card>
              <CardContent className="p-0">
                {links?.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">Nenhuma entidade vinculada.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Fonte</TableHead>
                        <TableHead>Confiança</TableHead>
                        <TableHead>Primário</TableHead>
                        <TableHead>Vinculado em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {links?.map((link) => (
                        <TableRow key={link.id}>
                          <TableCell><Badge variant="outline">{link.entity_type}</Badge></TableCell>
                          <TableCell className="font-mono text-xs">{link.entity_id}</TableCell>
                          <TableCell className="text-sm">{link.source}</TableCell>
                          <TableCell><Badge variant="secondary">{Number(link.link_confidence).toFixed(0)}%</Badge></TableCell>
                          <TableCell>{link.is_primary ? <Shield className="h-4 w-4 text-primary" /> : '—'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(link.linked_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data">
            <Card>
              <CardContent className="pt-6">
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-[400px]">
                  {JSON.stringify(consolidated, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardContent className="p-0">
                {mergeHistory?.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">Nenhum merge realizado para este perfil.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Perfis Mesclados</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Pode Desfazer</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mergeHistory?.map((h) => (
                        <TableRow key={h.id}>
                          <TableCell>{h.merge_reason || '—'}</TableCell>
                          <TableCell className="text-sm">{(h.source_golden_profile_ids as string[])?.length || 0} perfis</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(h.merged_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </TableCell>
                          <TableCell>{h.can_undo ? <Badge>Sim</Badge> : <Badge variant="secondary">Não</Badge>}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
