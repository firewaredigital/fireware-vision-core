
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, UserCircle, Building2, Mail, Phone, Link as LinkIcon } from '@/components/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function GoldenRecords() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['golden-profiles', profile?.organization_id, search],
    queryFn: async () => {
      let q = supabase
        .from('golden_profiles')
        .select('*')
        .order('last_activity_at', { ascending: false, nullsFirst: false })
        .limit(100);

      if (search) {
        q = q.or(`display_name.ilike.%${search}%,primary_email.ilike.%${search}%,primary_phone.ilike.%${search}%`);
      }

      const { data, error } = await q;
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
            <h1 className="text-3xl font-bold">Golden Records</h1>
            <p className="text-muted-foreground mt-1">Perfis unificados de clientes e empresas</p>
          </div>
          <Badge variant="secondary" className="text-sm">{profiles?.length || 0} perfis</Badge>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, email ou telefone..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : profiles?.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <UserCircle className="h-12 w-12 mx-auto mb-3" />
                <p>Nenhum golden record encontrado.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Confiança</TableHead>
                    <TableHead>Fontes</TableHead>
                    <TableHead>Última Atividade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles?.map((p) => (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/data-hub/golden-records/${p.id}`)}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {p.profile_type === 'company' ? <Building2 className="h-4 w-4 text-muted-foreground" /> : <UserCircle className="h-4 w-4 text-muted-foreground" />}
                          {p.display_name || 'Sem nome'}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{p.profile_type === 'person' ? 'Pessoa' : 'Empresa'}</Badge></TableCell>
                      <TableCell className="text-sm">{p.primary_email || '—'}</TableCell>
                      <TableCell className="text-sm">{p.primary_phone || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={Number(p.confidence_score) >= 80 ? 'default' : 'secondary'}>
                          {Number(p.confidence_score).toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{p.source_count}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.last_activity_at ? format(new Date(p.last_activity_at), 'dd/MM/yyyy', { locale: ptBR }) : '—'}
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
