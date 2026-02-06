import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, TrendingUp, DollarSign, Users, Target } from 'lucide-react';

export default function MarketingIntelligence() {
  const { profile } = useAuth();

  const { data: adSpend } = useQuery({
    queryKey: ['ad-spend-summary', profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase.from('ad_spend').select('*').order('date', { ascending: false }).limit(30);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.organization_id,
  });

  const { data: sends } = useQuery({
    queryKey: ['message-sends-summary', profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase.from('message_sends').select('status').limit(1000);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.organization_id,
  });

  const totalSpend = adSpend?.reduce((s, r) => s + Number(r.spend), 0) || 0;
  const totalImpressions = adSpend?.reduce((s, r) => s + (r.impressions || 0), 0) || 0;
  const totalClicks = adSpend?.reduce((s, r) => s + (r.clicks || 0), 0) || 0;
  const totalConversions = adSpend?.reduce((s, r) => s + (r.conversions || 0), 0) || 0;
  const deliveredCount = sends?.filter(s => ['delivered', 'opened', 'clicked'].includes(s.status)).length || 0;

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Marketing Intelligence</h1>
          <p className="text-muted-foreground mt-1">ROI, CAC, performance de mídia e coortes</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><DollarSign className="h-4 w-4" />Investimento</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">R$ {totalSpend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Users className="h-4 w-4" />Impressões</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{totalImpressions.toLocaleString()}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Target className="h-4 w-4" />Cliques</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{totalClicks.toLocaleString()}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><TrendingUp className="h-4 w-4" />Conversões</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{totalConversions}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Msgs Entregues</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{deliveredCount}</p></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>CAC (Custo de Aquisição)</CardTitle></CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">R$ {totalConversions > 0 ? (totalSpend / totalConversions).toFixed(2) : '—'}</p>
              <p className="text-sm text-muted-foreground mt-1">Custo médio por conversão nos últimos 30 dias</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>CTR (Click-Through Rate)</CardTitle></CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0'}%</p>
              <p className="text-sm text-muted-foreground mt-1">Taxa de cliques sobre impressões</p>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
