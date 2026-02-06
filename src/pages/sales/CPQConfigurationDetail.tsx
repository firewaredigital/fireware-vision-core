import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft, Save, CheckCircle, XCircle, Clock, ShieldCheck,
  AlertTriangle, DollarSign, FileText, History, Settings2, Package
} from 'lucide-react';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  draft: { label: 'Rascunho', variant: 'secondary', icon: Clock },
  valid: { label: 'Válida', variant: 'default', icon: CheckCircle },
  invalid: { label: 'Inválida', variant: 'destructive', icon: XCircle },
  approved: { label: 'Aprovada', variant: 'default', icon: ShieldCheck },
  expired: { label: 'Expirada', variant: 'outline', icon: AlertTriangle },
};

export default function CPQConfigurationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const organizationId = profile?.organization_id;

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});

  const { data: config, isLoading } = useQuery({
    queryKey: ['cpq-config', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cpq_product_configurations')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: calculations = [] } = useQuery({
    queryKey: ['cpq-calculations', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cpq_price_calculations')
        .select('*')
        .eq('configuration_id', id!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const updateConfig = useMutation({
    mutationFn: async (values: Record<string, any>) => {
      const { error } = await supabase
        .from('cpq_product_configurations')
        .update({ ...values, updated_by: profile?.id })
        .eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cpq-config', id] });
      setIsEditing(false);
      toast.success('Configuração atualizada');
    },
    onError: () => toast.error('Erro ao atualizar'),
  });

  const recalculate = useMutation({
    mutationFn: async () => {
      if (!config) return;
      const adjustedPrice = config.base_price - config.discount_amount;
      const finalPrice = adjustedPrice > 0 ? adjustedPrice : 0;

      // Log the calculation
      await supabase.from('cpq_price_calculations').insert({
        organization_id: organizationId!,
        configuration_id: id!,
        calculation_type: 'recalculation',
        input_data: { base_price: config.base_price, discount_percent: config.discount_percent },
        list_price: config.base_price,
        calculated_price: finalPrice,
        margin_percent: config.base_price > 0 ? ((finalPrice / config.base_price) * 100) : 0,
        calculated_by: profile?.id,
      });

      // Update config
      await supabase.from('cpq_product_configurations').update({
        adjusted_price: adjustedPrice,
        final_price: finalPrice,
        updated_by: profile?.id,
      }).eq('id', id!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cpq-config', id] });
      queryClient.invalidateQueries({ queryKey: ['cpq-calculations', id] });
      toast.success('Preço recalculado');
    },
    onError: () => toast.error('Erro ao recalcular'),
  });

  const changeStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase
        .from('cpq_product_configurations')
        .update({ status: newStatus as any, updated_by: profile?.id })
        .eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cpq-config', id] });
      toast.success('Status atualizado');
    },
    onError: () => toast.error('Erro ao mudar status'),
  });

  if (isLoading || !config) {
    return <AppLayout><div className="flex items-center justify-center min-h-[400px] text-muted-foreground">Carregando configuração...</div></AppLayout>;
  }

  const st = statusConfig[config.status] || statusConfig.draft;
  const StatusIcon = st.icon;
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: config.currency || 'BRL' }).format(v);

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/sales/cpq')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{config.name}</h1>
                <Badge variant={st.variant} className="gap-1">
                  <StatusIcon className="h-3 w-3" />{st.label}
                </Badge>
                <Badge variant="outline">v{config.version}</Badge>
              </div>
              {config.description && <p className="text-muted-foreground mt-1">{config.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {config.status === 'draft' && (
              <Button variant="outline" onClick={() => changeStatus.mutate('valid')}>
                <CheckCircle className="h-4 w-4 mr-2" />Validar
              </Button>
            )}
            {config.status === 'valid' && (
              <Button onClick={() => changeStatus.mutate('approved')}>
                <ShieldCheck className="h-4 w-4 mr-2" />Aprovar
              </Button>
            )}
            <Button variant="outline" onClick={() => recalculate.mutate()} disabled={recalculate.isPending}>
              <DollarSign className="h-4 w-4 mr-2" />Recalcular
            </Button>
          </div>
        </div>

        {/* Price Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Preço Base</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{fmt(config.base_price)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Desconto</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-destructive">
                {config.discount_percent > 0 ? `-${config.discount_percent}%` : '—'}
              </p>
              {config.discount_amount > 0 && <p className="text-sm text-muted-foreground">{fmt(config.discount_amount)}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Preço Ajustado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{fmt(config.adjusted_price)}</p>
            </CardContent>
          </Card>
          <Card className="border-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-primary">Preço Final</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{fmt(config.final_price)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details"><Settings2 className="h-4 w-4 mr-2" />Detalhes</TabsTrigger>
            <TabsTrigger value="options"><Package className="h-4 w-4 mr-2" />Opções Selecionadas</TabsTrigger>
            <TabsTrigger value="history"><History className="h-4 w-4 mr-2" />Histórico de Cálculos</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Configuração</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Nome</Label>
                        <Input value={editData.name || config.name} onChange={e => setEditData((p: any) => ({ ...p, name: e.target.value }))} />
                      </div>
                      <div>
                        <Label>Preço Base</Label>
                        <Input type="number" step="0.01" value={editData.base_price ?? config.base_price} onChange={e => setEditData((p: any) => ({ ...p, base_price: parseFloat(e.target.value) }))} />
                      </div>
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea value={editData.description ?? config.description ?? ''} onChange={e => setEditData((p: any) => ({ ...p, description: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Desconto (%)</Label>
                        <Input type="number" step="0.01" value={editData.discount_percent ?? config.discount_percent} onChange={e => setEditData((p: any) => ({ ...p, discount_percent: parseFloat(e.target.value) }))} />
                      </div>
                      <div>
                        <Label>Desconto (R$)</Label>
                        <Input type="number" step="0.01" value={editData.discount_amount ?? config.discount_amount} onChange={e => setEditData((p: any) => ({ ...p, discount_amount: parseFloat(e.target.value) }))} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => updateConfig.mutate(editData)} disabled={updateConfig.isPending}>
                        <Save className="h-4 w-4 mr-2" />{updateConfig.isPending ? 'Salvando...' : 'Salvar'}
                      </Button>
                      <Button variant="outline" onClick={() => { setIsEditing(false); setEditData({}); }}>Cancelar</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge variant={st.variant} className="gap-1 mt-1"><StatusIcon className="h-3 w-3" />{st.label}</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Versão</p>
                        <p className="font-medium">v{config.version}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Criado em</p>
                        <p className="font-medium">{format(new Date(config.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Válido até</p>
                        <p className="font-medium">{config.valid_until ? format(new Date(config.valid_until), 'dd/MM/yyyy', { locale: ptBR }) : '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Requer Aprovação</p>
                        <p className="font-medium">{config.requires_approval ? 'Sim' : 'Não'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Moeda</p>
                        <p className="font-medium">{config.currency}</p>
                      </div>
                    </div>
                    <Separator />
                    <Button variant="outline" onClick={() => { setIsEditing(true); setEditData({}); }}>Editar</Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="options">
            <Card>
              <CardHeader>
                <CardTitle>Opções Selecionadas</CardTitle>
                <CardDescription>Opções e componentes incluídos nesta configuração.</CardDescription>
              </CardHeader>
              <CardContent>
                {Array.isArray(config.selected_options) && (config.selected_options as any[]).length > 0 ? (
                  <div className="space-y-2">
                    {(config.selected_options as any[]).map((opt: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{opt.name || `Opção ${i + 1}`}</p>
                          {opt.description && <p className="text-sm text-muted-foreground">{opt.description}</p>}
                        </div>
                        {opt.price && <p className="font-mono">{fmt(opt.price)}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground py-8 text-center">Nenhuma opção selecionada ainda.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Cálculos</CardTitle>
                <CardDescription>Auditoria de todas as recalculações de preço.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Preço Lista</TableHead>
                      <TableHead className="text-right">Preço Calculado</TableHead>
                      <TableHead className="text-right">Margem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculations.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum cálculo registrado</TableCell></TableRow>
                    ) : calculations.map((calc: any) => (
                      <TableRow key={calc.id}>
                        <TableCell className="text-sm">{format(new Date(calc.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}</TableCell>
                        <TableCell><Badge variant="outline">{calc.calculation_type}</Badge></TableCell>
                        <TableCell className="text-right font-mono">{fmt(calc.list_price)}</TableCell>
                        <TableCell className="text-right font-mono font-semibold">{fmt(calc.calculated_price)}</TableCell>
                        <TableCell className="text-right font-mono">{calc.margin_percent ? `${calc.margin_percent.toFixed(1)}%` : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
