import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Mail, MessageSquare, Send, Bell } from '@/components/icons';

const typeIcons: Record<string, React.ElementType> = { email: Mail, sms: Send, whatsapp: MessageSquare, push: Bell };

export default function MarketingProviders() {
  const { profile } = useAuth();
  const { data: providers, isLoading } = useQuery({
    queryKey: ['message-providers', profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase.from('message_providers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.organization_id,
  });

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Provedores de Mensageria</h1>
            <p className="text-muted-foreground mt-1">Configure provedores de email, SMS, WhatsApp e Push</p>
          </div>
          <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Provedor</Button>
        </div>
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : providers?.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground"><Mail className="h-12 w-12 mx-auto mb-3" /><p>Nenhum provedor configurado.</p></div>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>Status</TableHead><TableHead>Padrão</TableHead><TableHead>Uso Diário</TableHead></TableRow></TableHeader>
                <TableBody>
                  {providers?.map((p) => {
                    const Icon = typeIcons[p.provider_type] || Mail;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium flex items-center gap-2"><Icon className="h-4 w-4" />{p.name}</TableCell>
                        <TableCell><Badge variant="outline">{p.provider_type}</Badge></TableCell>
                        <TableCell><Badge variant={p.status === 'active' ? 'default' : 'secondary'}>{p.status}</Badge></TableCell>
                        <TableCell>{p.is_default ? 'Sim' : '—'}</TableCell>
                        <TableCell>{p.daily_usage}/{p.daily_limit || '∞'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
