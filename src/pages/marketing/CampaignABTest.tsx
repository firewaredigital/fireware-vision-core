import { useState, useEffect , useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Award, BarChart3, Send, RefreshCw,
  Eye, Mail, Percent, Users, Clock, Zap,
} from '@/components/icons';
import { Trophy } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

interface ABVariant {
  id: string;
  campaign_id: string;
  variant_key: string;
  name: string;
  subject: string | null;
  preview_text: string | null;
  content: string | null;
  content_html: string | null;
  from_name: string | null;
  from_email: string | null;
  traffic_percentage: number;
  sent_count: number;
  delivered_count: number;
  open_count: number;
  unique_opens: number;
  click_count: number;
  unique_clicks: number;
  conversion_count: number;
  unsubscribe_count: number;
  bounce_count: number;
  open_rate: number | null;
  click_rate: number | null;
  is_winner: boolean;
  is_control: boolean;
  won_at: string | null;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  is_ab_test: boolean;
  ab_winner_criteria: string | null;
  ab_test_duration_hours: number | null;
  ab_winner_variant_id: string | null;
  subject: string | null;
  content: string | null;
  from_name: string | null;
  from_email: string | null;
}

const WINNER_CRITERIA = [
  { value: 'open_rate', label: 'Taxa de Abertura', description: 'Variante com maior % de aberturas únicas' },
  { value: 'click_rate', label: 'Taxa de Clique', description: 'Variante com maior % de cliques únicos' },
  { value: 'conversion_rate', label: 'Taxa de Conversão', description: 'Variante com mais conversões' },
  { value: 'lowest_unsubscribe', label: 'Menor Descadastro', description: 'Variante com menos descadastros' },
];

const VARIANT_COLORS = ['#3b82f6', '#f97316', '#22c55e', '#a855f7', '#ef4444'];

export default function CampaignABTest() {
  const { id: campaignId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [variants, setVariants] = useState<ABVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [winnerCriteria, setWinnerCriteria] = useState('open_rate');
  const [testDuration, setTestDuration] = useState(24);
  const [confirmWinner, setConfirmWinner] = useState<string | null>(null);

  useEffect(() => {
    if (campaignId) fetchData();
  }, [campaignId, fetchData]);

  const fetchData = useCallback( async () => {
    if (!campaignId) return;
    setLoading(true);

    const [campaignRes, variantsRes] = await Promise.all([
      supabase.from('campaigns').select('id, name, status, is_ab_test, ab_winner_criteria, ab_test_duration_hours, ab_winner_variant_id, subject, content, from_name, from_email').eq('id', campaignId).single(),
      supabase.from('campaign_ab_variants').select('*').eq('campaign_id', campaignId).order('variant_key'),
    ]);

    if (campaignRes.data) {
      setCampaign(campaignRes.data as Campaign);
      setWinnerCriteria(campaignRes.data.ab_winner_criteria || 'open_rate');
      setTestDuration(campaignRes.data.ab_test_duration_hours || 24);
    }
    if (variantsRes.data) setVariants(variantsRes.data as ABVariant[]);
    setLoading(false);
  }, [id, campaignId]);

  const addVariant = async () => {
    if (!campaignId || !profile?.organization_id || variants.length >= 5) return;
    const keys = ['A', 'B', 'C', 'D', 'E'];
    const nextKey = keys[variants.length] || `V${variants.length + 1}`;
    const trafficPct = Math.floor(100 / (variants.length + 1));

    const { data, error } = await supabase.from('campaign_ab_variants').insert({
      campaign_id: campaignId,
      organization_id: profile.organization_id,
      variant_key: nextKey,
      name: `Variante ${nextKey}`,
      subject: campaign?.subject || '',
      from_name: campaign?.from_name || '',
      from_email: campaign?.from_email || '',
      traffic_percentage: trafficPct,
      is_control: variants.length === 0,
    }).select().single();

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao criar variante' });
    } else if (data) {
      setVariants(prev => [...prev, data as ABVariant]);
      // Rebalancear tráfego
      const total = variants.length + 1;
      const balanced = Math.floor(100 / total);
      await Promise.all(
        [...variants, data].map(v =>
          supabase.from('campaign_ab_variants').update({ traffic_percentage: balanced }).eq('id', v.id)
        )
      );
      fetchData();
    }
  };

  const removeVariant = async (variantId: string) => {
    const { error } = await supabase.from('campaign_ab_variants').delete().eq('id', variantId);
    if (!error) {
      setVariants(prev => prev.filter(v => v.id !== variantId));
      toast({ title: 'Variante removida' });
    }
  };

  const updateVariant = async (variantId: string, field: string, value: unknown) => {
    setVariants(prev => prev.map(v => v.id === variantId ? { ...v, [field]: value } : v));
    await supabase.from('campaign_ab_variants').update({ [field]: value }).eq('id', variantId);
  };

  const saveConfig = async () => {
    if (!campaignId) return;
    setSaving(true);
    await supabase.from('campaigns').update({
      is_ab_test: true,
      ab_winner_criteria: winnerCriteria,
      ab_test_duration_hours: testDuration,
    }).eq('id', campaignId);
    toast({ title: 'Configuração salva', description: 'Teste A/B configurado com sucesso.' });
    setSaving(false);
  };

  const declareWinner = async (variantId: string) => {
    if (!campaignId) return;
    const { error } = await supabase.rpc('declare_ab_winner', {
      p_campaign_id: campaignId,
      p_variant_id: variantId,
    });
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao declarar vencedor' });
    } else {
      toast({ title: '🏆 Vencedor declarado!', description: 'A variante vencedora foi selecionada.' });
      fetchData();
    }
    setConfirmWinner(null);
  };

  const getMetricValue = (variant: ABVariant, criteria: string): number => {
    switch (criteria) {
      case 'open_rate': return variant.sent_count > 0 ? (variant.unique_opens / variant.sent_count) * 100 : 0;
      case 'click_rate': return variant.unique_opens > 0 ? (variant.unique_clicks / variant.unique_opens) * 100 : 0;
      case 'conversion_rate': return variant.sent_count > 0 ? (variant.conversion_count / variant.sent_count) * 100 : 0;
      case 'lowest_unsubscribe': return variant.sent_count > 0 ? (variant.unsubscribe_count / variant.sent_count) * 100 : 0;
      default: return 0;
    }
  };

  const chartData = variants.map(v => ({
    name: `${v.variant_key}: ${v.name}`,
    opens: v.unique_opens,
    clicks: v.unique_clicks,
    conversions: v.conversion_count,
    sent: v.sent_count,
    openRate: v.sent_count > 0 ? ((v.unique_opens / v.sent_count) * 100).toFixed(1) : '0',
    clickRate: v.unique_opens > 0 ? ((v.unique_clicks / v.unique_opens) * 100).toFixed(1) : '0',
  }));

  if (loading) {
    return <div className="flex items-center justify-center h-64"><RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/marketing/campaigns/${campaignId}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              Teste A/B — {campaign?.name}
            </h1>
            <p className="text-muted-foreground">Configure e monitore variantes da campanha</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={saveConfig} disabled={saving}>
            {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
            Salvar Configuração
          </Button>
          {variants.length < 5 && (
            <Button onClick={addVariant}>
              <Plus className="mr-2 h-4 w-4" />Adicionar Variante
            </Button>
          )}
        </div>
      </div>

      {/* Config */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Critério de Vitória</CardTitle>
            <CardDescription>Como será determinada a variante vencedora</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={winnerCriteria} onValueChange={setWinnerCriteria}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {WINNER_CRITERIA.map(c => (
                  <SelectItem key={c.value} value={c.value}>
                    <div>
                      <p className="font-medium">{c.label}</p>
                      <p className="text-xs text-muted-foreground">{c.description}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Duração do Teste</CardTitle>
            <CardDescription>Período antes de selecionar automaticamente o vencedor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Slider value={[testDuration]} onValueChange={v => setTestDuration(v[0])} min={1} max={168} step={1} className="flex-1" />
              <span className="text-sm font-medium w-16 text-right">{testDuration}h</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {testDuration < 24 ? `${testDuration} horas` : `${Math.floor(testDuration / 24)} dias e ${testDuration % 24} horas`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Variants */}
      {variants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Zap className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
            <p className="font-medium mb-1">Nenhuma variante criada</p>
            <p className="text-sm text-muted-foreground mb-4">Adicione pelo menos 2 variantes para iniciar o teste A/B</p>
            <Button onClick={addVariant}><Plus className="mr-2 h-4 w-4" />Criar Primeira Variante</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {variants.map((variant, idx) => (
            <Card key={variant.id} className={`relative ${variant.is_winner ? 'ring-2 ring-yellow-500 border-yellow-500' : ''}`}>
              {variant.is_winner && (
                <div className="absolute -top-3 left-4">
                  <Badge className="bg-yellow-500 text-yellow-950 gap-1"><Trophy className="h-3 w-3" />Vencedor</Badge>
                </div>
              )}
              {variant.is_control && (
                <div className="absolute -top-3 right-4">
                  <Badge variant="outline" className="text-xs">Controle</Badge>
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: VARIANT_COLORS[idx] }}>
                      {variant.variant_key}
                    </div>
                    <Input value={variant.name} onChange={e => updateVariant(variant.id, 'name', e.target.value)} className="h-8 text-sm font-medium max-w-[150px]" />
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeVariant(variant.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Assunto</Label>
                  <Input value={variant.subject || ''} onChange={e => updateVariant(variant.id, 'subject', e.target.value)} className="h-8 text-xs" placeholder="Assunto do email" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Preview Text</Label>
                  <Input value={variant.preview_text || ''} onChange={e => updateVariant(variant.id, 'preview_text', e.target.value)} className="h-8 text-xs" placeholder="Texto de preview" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tráfego: {variant.traffic_percentage}%</Label>
                  <Progress value={variant.traffic_percentage} className="h-2" />
                </div>
                <Separator />
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold">{variant.sent_count}</p>
                    <p className="text-xs text-muted-foreground">Enviados</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{variant.unique_opens}</p>
                    <p className="text-xs text-muted-foreground">Aberturas</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{variant.unique_clicks}</p>
                    <p className="text-xs text-muted-foreground">Cliques</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <p className="text-sm font-bold text-blue-600">
                      {variant.sent_count > 0 ? ((variant.unique_opens / variant.sent_count) * 100).toFixed(1) : '0'}%
                    </p>
                    <p className="text-xs text-muted-foreground">Abertura</p>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <p className="text-sm font-bold text-green-600">
                      {variant.unique_opens > 0 ? ((variant.unique_clicks / variant.unique_opens) * 100).toFixed(1) : '0'}%
                    </p>
                    <p className="text-xs text-muted-foreground">CTR</p>
                  </div>
                </div>
                {!variant.is_winner && campaign?.ab_winner_variant_id === null && (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setConfirmWinner(variant.id)}>
                    <Trophy className="mr-2 h-3 w-3" />Declarar Vencedor
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Comparison Chart */}
      {variants.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Comparação de Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="opens" name="Aberturas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="clicks" name="Cliques" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="conversions" name="Conversões" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirm Winner Dialog */}
      <Dialog open={!!confirmWinner} onOpenChange={() => setConfirmWinner(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-500" />Confirmar Vencedor</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Ao declarar esta variante como vencedora, o conteúdo dela será aplicado ao restante da audiência. Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmWinner(null)}>Cancelar</Button>
            <Button onClick={() => confirmWinner && declareWinner(confirmWinner)} className="bg-yellow-500 hover:bg-yellow-600 text-yellow-950">
              <Trophy className="mr-2 h-4 w-4" />Confirmar Vencedor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
