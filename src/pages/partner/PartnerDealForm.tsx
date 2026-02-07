import { PartnerLayout } from './PartnerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from '@/components/icons';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

function getPartnerSession() {
  try {
    const session = localStorage.getItem('partner_session');
    return session ? JSON.parse(session) : null;
  } catch { return null; }
}

interface DealFormData {
  deal_type: 'lead_referral' | 'co_sell' | 'resale';
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  company_name: string;
  deal_value: string;
  notes: string;
}

export default function PartnerDealForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = getPartnerSession();
  const partnerId = session?.partner_id;
  const orgId = session?.organization_id;

  const [formData, setFormData] = useState<DealFormData>({
    deal_type: 'lead_referral',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    company_name: '',
    deal_value: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof DealFormData, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof DealFormData, string>> = {};
    if (!formData.contact_name.trim()) newErrors.contact_name = 'Nome do contato é obrigatório';
    if (!formData.contact_email.trim()) {
      newErrors.contact_email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Email inválido';
    }
    if (!formData.company_name.trim()) newErrors.company_name = 'Nome da empresa é obrigatório';
    if (!formData.deal_value || Number(formData.deal_value) <= 0) {
      newErrors.deal_value = 'Valor estimado deve ser maior que zero';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!partnerId || !orgId) throw new Error('Sessão inválida');
      const { error } = await supabase.from('partner_deals').insert({
        organization_id: orgId,
        partner_id: partnerId,
        deal_type: formData.deal_type,
        deal_value: Number(formData.deal_value),
        notes: [
          `Contato: ${formData.contact_name}`,
          `Email: ${formData.contact_email}`,
          formData.contact_phone ? `Telefone: ${formData.contact_phone}` : '',
          `Empresa: ${formData.company_name}`,
          formData.notes ? `\nObservações: ${formData.notes}` : '',
        ].filter(Boolean).join('\n'),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-deals'] });
      queryClient.invalidateQueries({ queryKey: ['partner-deals-stats'] });
      toast.success('Indicação registrada com sucesso!');
      navigate('/partner/deals');
    },
    onError: (err) => {
      toast.error(`Erro ao registrar indicação: ${err.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      mutation.mutate();
    }
  };

  const updateField = (field: keyof DealFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  return (
    <PartnerLayout>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/partner/deals')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Nova Indicação</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Deal</Label>
                <Select value={formData.deal_type} onValueChange={(v) => updateField('deal_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead_referral">Indicação de Lead</SelectItem>
                    <SelectItem value="co_sell">Co-Sell</SelectItem>
                    <SelectItem value="resale">Revenda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Contato *</Label>
                  <Input
                    placeholder="Nome completo"
                    value={formData.contact_name}
                    onChange={(e) => updateField('contact_name', e.target.value)}
                    className={errors.contact_name ? 'border-destructive' : ''}
                  />
                  {errors.contact_name && <p className="text-xs text-destructive">{errors.contact_name}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    placeholder="email@empresa.com"
                    value={formData.contact_email}
                    onChange={(e) => updateField('contact_email', e.target.value)}
                    className={errors.contact_email ? 'border-destructive' : ''}
                  />
                  {errors.contact_email && <p className="text-xs text-destructive">{errors.contact_email}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Empresa *</Label>
                  <Input
                    placeholder="Nome da empresa"
                    value={formData.company_name}
                    onChange={(e) => updateField('company_name', e.target.value)}
                    className={errors.company_name ? 'border-destructive' : ''}
                  />
                  {errors.company_name && <p className="text-xs text-destructive">{errors.company_name}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Valor Estimado (R$) *</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={formData.deal_value}
                    onChange={(e) => updateField('deal_value', e.target.value)}
                    className={errors.deal_value ? 'border-destructive' : ''}
                  />
                  {errors.deal_value && <p className="text-xs text-destructive">{errors.deal_value}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  placeholder="(11) 99999-9999"
                  value={formData.contact_phone}
                  onChange={(e) => updateField('contact_phone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  placeholder="Descreva o contexto da indicação..."
                  value={formData.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={mutation.isPending} className="gap-2">
                  {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Registrar Indicação
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/partner/deals')}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PartnerLayout>
  );
}
