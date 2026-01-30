import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Percent, DollarSign, Gift, Truck } from 'lucide-react';
import { toast } from 'sonner';

type PromotionType = 'percentage' | 'fixed' | 'buy_x_get_y' | 'free_shipping';

export default function PromotionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    type: 'percentage' as PromotionType,
    value: 0,
    min_purchase: 0,
    max_discount: 0,
    min_items: 0,
    buy_quantity: 0,
    get_quantity: 0,
    usage_limit: 0,
    usage_limit_per_customer: 0,
    start_date: '',
    end_date: '',
    is_active: true,
    is_automatic: false,
    can_combine: false,
    first_purchase_only: false,
    new_customers_only: false,
    applies_to: 'all',
  });

  const { data: existingPromo } = useQuery({
    queryKey: ['promotion-edit', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingPromo) {
      setFormData({
        name: existingPromo.name || '',
        description: existingPromo.description || '',
        code: existingPromo.code || '',
        type: existingPromo.type as PromotionType,
        value: Number(existingPromo.value) || 0,
        min_purchase: Number(existingPromo.min_purchase) || 0,
        max_discount: Number(existingPromo.max_discount) || 0,
        min_items: existingPromo.min_items || 0,
        buy_quantity: existingPromo.buy_quantity || 0,
        get_quantity: existingPromo.get_quantity || 0,
        usage_limit: existingPromo.usage_limit || 0,
        usage_limit_per_customer: existingPromo.usage_limit_per_customer || 0,
        start_date: existingPromo.start_date ? existingPromo.start_date.split('T')[0] : '',
        end_date: existingPromo.end_date ? existingPromo.end_date.split('T')[0] : '',
        is_active: existingPromo.is_active ?? true,
        is_automatic: existingPromo.is_automatic ?? false,
        can_combine: existingPromo.can_combine ?? false,
        first_purchase_only: existingPromo.first_purchase_only ?? false,
        new_customers_only: existingPromo.new_customers_only ?? false,
        applies_to: existingPromo.applies_to || 'all',
      });
    }
  }, [existingPromo]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.organization_id) throw new Error('Organização não encontrada');
      if (!formData.name) throw new Error('Nome é obrigatório');
      if (!formData.type) throw new Error('Tipo é obrigatório');

      const payload = {
        organization_id: profile.organization_id,
        name: formData.name,
        description: formData.description || null,
        code: formData.code || null,
        type: formData.type,
        value: formData.type !== 'free_shipping' ? formData.value : null,
        min_purchase: formData.min_purchase || null,
        max_discount: formData.max_discount || null,
        min_items: formData.min_items || null,
        buy_quantity: formData.type === 'buy_x_get_y' ? formData.buy_quantity : null,
        get_quantity: formData.type === 'buy_x_get_y' ? formData.get_quantity : null,
        usage_limit: formData.usage_limit || null,
        usage_limit_per_customer: formData.usage_limit_per_customer || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        is_active: formData.is_active,
        is_automatic: formData.is_automatic,
        can_combine: formData.can_combine,
        first_purchase_only: formData.first_purchase_only,
        new_customers_only: formData.new_customers_only,
        applies_to: formData.applies_to,
        created_by: isEditing ? undefined : profile.id,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('promotions')
          .update(payload)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('promotions')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast.success(isEditing ? 'Promoção atualizada!' : 'Promoção criada!');
      navigate('/promotions');
    },
    onError: (error) => {
      toast.error('Erro: ' + error.message);
    },
  });

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/promotions')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? 'Editar Promoção' : 'Nova Promoção'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? 'Atualize os dados da promoção' : 'Configure uma nova promoção ou cupom'}
            </p>
          </div>
        </div>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Black Friday 2024"
                />
              </div>
              <div className="space-y-2">
                <Label>Código do Cupom</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="BLACKFRIDAY"
                    className="font-mono"
                  />
                  <Button type="button" variant="outline" onClick={generateCode}>
                    Gerar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Deixe vazio para promoções automáticas
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição da promoção..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Discount Type */}
        <Card>
          <CardHeader>
            <CardTitle>Tipo de Desconto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              {[
                { type: 'percentage', label: 'Porcentagem', icon: <Percent className="h-5 w-5" /> },
                { type: 'fixed', label: 'Valor Fixo', icon: <DollarSign className="h-5 w-5" /> },
                { type: 'buy_x_get_y', label: 'Compre X Leve Y', icon: <Gift className="h-5 w-5" /> },
                { type: 'free_shipping', label: 'Frete Grátis', icon: <Truck className="h-5 w-5" /> },
              ].map(({ type, label, icon }) => (
                <div
                  key={type}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    formData.type === type 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:border-muted-foreground/50'
                  }`}
                  onClick={() => setFormData({ ...formData, type: type as PromotionType })}
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    {icon}
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                </div>
              ))}
            </div>

            {(formData.type === 'percentage' || formData.type === 'fixed') && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>
                    {formData.type === 'percentage' ? 'Porcentagem de Desconto' : 'Valor do Desconto'}
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      step={formData.type === 'percentage' ? '1' : '0.01'}
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                      className="pl-8"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {formData.type === 'percentage' ? '%' : 'R$'}
                    </span>
                  </div>
                </div>
                {formData.type === 'percentage' && (
                  <div className="space-y-2">
                    <Label>Desconto Máximo (R$)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.max_discount}
                      onChange={(e) => setFormData({ ...formData, max_discount: parseFloat(e.target.value) || 0 })}
                      placeholder="Sem limite"
                    />
                  </div>
                )}
              </div>
            )}

            {formData.type === 'buy_x_get_y' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Compre (quantidade)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.buy_quantity}
                    onChange={(e) => setFormData({ ...formData, buy_quantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Leve (quantidade adicional grátis)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.get_quantity}
                    onChange={(e) => setFormData({ ...formData, get_quantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conditions */}
        <Card>
          <CardHeader>
            <CardTitle>Condições</CardTitle>
            <CardDescription>Defina as regras para uso da promoção</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Valor Mínimo de Compra</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.min_purchase}
                  onChange={(e) => setFormData({ ...formData, min_purchase: parseFloat(e.target.value) || 0 })}
                  placeholder="Sem mínimo"
                />
              </div>
              <div className="space-y-2">
                <Label>Quantidade Mínima de Itens</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.min_items}
                  onChange={(e) => setFormData({ ...formData, min_items: parseInt(e.target.value) || 0 })}
                  placeholder="Sem mínimo"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Limits */}
        <Card>
          <CardHeader>
            <CardTitle>Limites de Uso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Limite Total de Uso</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({ ...formData, usage_limit: parseInt(e.target.value) || 0 })}
                  placeholder="Sem limite"
                />
              </div>
              <div className="space-y-2">
                <Label>Limite por Cliente</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.usage_limit_per_customer}
                  onChange={(e) => setFormData({ ...formData, usage_limit_per_customer: parseInt(e.target.value) || 0 })}
                  placeholder="Sem limite"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Data de Início</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data de Término</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Options */}
        <Card>
          <CardHeader>
            <CardTitle>Opções</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Promoção Ativa</Label>
                <p className="text-sm text-muted-foreground">A promoção pode ser usada</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Aplicar Automaticamente</Label>
                <p className="text-sm text-muted-foreground">Aplica sem necessidade de código</p>
              </div>
              <Switch
                checked={formData.is_automatic}
                onCheckedChange={(checked) => setFormData({ ...formData, is_automatic: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Pode Combinar</Label>
                <p className="text-sm text-muted-foreground">Pode ser usada com outras promoções</p>
              </div>
              <Switch
                checked={formData.can_combine}
                onCheckedChange={(checked) => setFormData({ ...formData, can_combine: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Somente Primeira Compra</Label>
                <p className="text-sm text-muted-foreground">Válido apenas para novos clientes</p>
              </div>
              <Switch
                checked={formData.first_purchase_only}
                onCheckedChange={(checked) => setFormData({ ...formData, first_purchase_only: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate('/promotions')}>
            Cancelar
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar Promoção'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
