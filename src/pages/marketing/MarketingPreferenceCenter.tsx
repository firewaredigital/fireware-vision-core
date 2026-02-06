import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Settings, Eye } from 'lucide-react';

export default function MarketingPreferenceCenter() {
  const { profile } = useAuth();
  const { data: centers, isLoading } = useQuery({
    queryKey: ['preference-centers', profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase.from('preference_centers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.organization_id,
  });

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Centro de Preferências</h1>
            <p className="text-muted-foreground mt-1">Configure como seus contatos gerenciam preferências de comunicação</p>
          </div>
          <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Centro</Button>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-48" />)}</div>
        ) : centers?.length === 0 ? (
          <Card><CardContent className="p-12 text-center text-muted-foreground"><Settings className="h-12 w-12 mx-auto mb-3" /><p>Nenhum centro de preferências configurado.</p></CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {centers?.map((c) => {
              const config = c.config as { channels?: string[]; topics?: string[] } | null;
              return (
                <Card key={c.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{c.name}</CardTitle>
                      <div className="flex gap-2">
                        {c.is_default && <Badge>Padrão</Badge>}
                        <Button variant="outline" size="sm" className="gap-1"><Eye className="h-3 w-3" /> Preview</Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {c.public_url_slug && <p className="text-sm text-muted-foreground font-mono">/preferences/{c.public_url_slug}</p>}
                    <div className="flex flex-wrap gap-1">
                      {(config?.channels || []).map((ch: string) => <Badge key={ch} variant="outline">{ch}</Badge>)}
                    </div>
                    <p className="text-xs text-muted-foreground">{(config?.topics || []).length} tópicos configurados</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
    </div>
  );
}
