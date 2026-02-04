import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type ContractStatus = 'draft' | 'pending_approval' | 'sent' | 'negotiating' | 'signed' | 'active' | 'expired' | 'terminated' | 'renewed';

interface Account {
  id: string;
  name: string;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  account_id: string | null;
}

interface Opportunity {
  id: string;
  name: string;
  account_id: string;
}

interface Quote {
  id: string;
  quote_number: string;
  name: string;
  account_id: string;
  total: number | null;
}

interface ContractForm {
  name: string;
  description: string;
  account_id: string;
  contact_id: string;
  opportunity_id: string;
  quote_id: string;
  status: ContractStatus;
  total_value: string;
  recurring_value: string;
  billing_frequency: string;
  payment_terms: string;
  start_date: string;
  end_date: string;
  auto_renewal: boolean;
  renewal_notice_days: string;
  terms_and_conditions: string;
  special_conditions: string;
}

const initialForm: ContractForm = {
  name: '',
  description: '',
  account_id: '',
  contact_id: '',
  opportunity_id: '',
  quote_id: '',
  status: 'draft',
  total_value: '',
  recurring_value: '',
  billing_frequency: 'monthly',
  payment_terms: 'Net 30',
  start_date: '',
  end_date: '',
  auto_renewal: false,
  renewal_notice_days: '30',
  terms_and_conditions: '',
  special_conditions: '',
};

export default function ContractForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState<ContractForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);

  const isEditing = !!id;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAccounts();
      fetchOpportunities();
      fetchQuotes();
      if (id) {
        fetchContract();
      }
    }
  }, [user, id]);

  useEffect(() => {
    if (form.account_id) {
      fetchContacts(form.account_id);
    }
  }, [form.account_id]);

  const fetchAccounts = async () => {
    const { data } = await supabase
      .from('accounts')
      .select('id, name')
      .order('name');
    if (data) setAccounts(data);
  };

  const fetchContacts = async (accountId: string) => {
    const { data } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, account_id')
      .eq('account_id', accountId)
      .order('first_name');
    if (data) setContacts(data);
  };

  const fetchOpportunities = async () => {
    const { data } = await supabase
      .from('opportunities')
      .select('id, name, account_id')
      .order('name');
    if (data) setOpportunities(data);
  };

  const fetchQuotes = async () => {
    const { data } = await supabase
      .from('quotes')
      .select('id, quote_number, name, account_id, total')
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });
    if (data) setQuotes(data);
  };

  const fetchContract = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao carregar contrato',
      });
      navigate('/contracts');
    } else if (data) {
      setForm({
        name: data.name || '',
        description: data.description || '',
        account_id: data.account_id || '',
        contact_id: data.contact_id || '',
        opportunity_id: data.opportunity_id || '',
        quote_id: data.quote_id || '',
        status: data.status || 'draft',
        total_value: data.total_value?.toString() || '',
        recurring_value: data.recurring_value?.toString() || '',
        billing_frequency: data.billing_frequency || 'monthly',
        payment_terms: data.payment_terms || '',
        start_date: data.start_date || '',
        end_date: data.end_date || '',
        auto_renewal: data.auto_renewal || false,
        renewal_notice_days: data.renewal_notice_days?.toString() || '30',
        terms_and_conditions: data.terms_and_conditions || '',
        special_conditions: data.special_conditions || '',
      });
    }
    setLoading(false);
  };

  const handleQuoteSelect = (quoteId: string) => {
    const quote = quotes.find(q => q.id === quoteId);
    if (quote) {
      setForm(prev => ({
        ...prev,
        quote_id: quoteId,
        account_id: quote.account_id,
        total_value: quote.total?.toString() || prev.total_value,
        name: prev.name || `Contract for ${quote.name}`,
      }));
    }
  };

  const handleOpportunitySelect = (opportunityId: string) => {
    const opportunity = opportunities.find(o => o.id === opportunityId);
    if (opportunity) {
      setForm(prev => ({
        ...prev,
        opportunity_id: opportunityId,
        account_id: opportunity.account_id,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.organization_id) return;

    if (!form.name || !form.account_id) {
      toast({
        variant: 'destructive',
        title: 'Erro de Validação',
        description: 'Por favor, preencha todos os campos obrigatórios',
      });
      return;
    }

    setSaving(true);

    const contractData = {
      name: form.name,
      description: form.description || null,
      account_id: form.account_id,
      contact_id: form.contact_id || null,
      opportunity_id: form.opportunity_id || null,
      quote_id: form.quote_id || null,
      status: form.status,
      total_value: form.total_value ? parseFloat(form.total_value) : null,
      recurring_value: form.recurring_value ? parseFloat(form.recurring_value) : null,
      billing_frequency: form.billing_frequency || null,
      payment_terms: form.payment_terms || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      auto_renewal: form.auto_renewal,
      renewal_notice_days: form.renewal_notice_days ? parseInt(form.renewal_notice_days) : 30,
      terms_and_conditions: form.terms_and_conditions || null,
      special_conditions: form.special_conditions || null,
      organization_id: profile.organization_id,
      owner_id: profile.id,
    };

    if (isEditing) {
      const { error } = await supabase
        .from('contracts')
        .update(contractData)
        .eq('id', id);

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Falha ao atualizar contrato',
        });
      } else {
        toast({
          title: 'Contrato atualizado',
          description: 'O contrato foi atualizado com sucesso.',
        });
        navigate(`/contracts/${id}`);
      }
    } else {
      // Generate contract number
      const contractNumber = `CTR-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;

      const { data, error } = await supabase
        .from('contracts')
        .insert([{ ...contractData, contract_number: contractNumber }])
        .select()
        .single();

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Falha ao criar contrato',
        });
      } else {
        // Create timeline event
        await supabase.from('timeline_events').insert([{
          organization_id: profile.organization_id,
          event_type: 'note_added',
          title: 'Contrato Criado',
          description: `Contrato "${form.name}" foi criado.`,
          account_id: form.account_id,
          opportunity_id: form.opportunity_id || null,
          created_by: profile.id,
        }]);

        toast({
          title: 'Contrato criado',
          description: 'O contrato foi criado com sucesso.',
        });
        navigate(`/contracts/${data.id}`);
      }
    }

    setSaving(false);
  };

  const filteredContacts = contacts.filter(c => 
    !form.account_id || c.account_id === form.account_id
  );

  const filteredOpportunities = opportunities.filter(o => 
    !form.account_id || o.account_id === form.account_id
  );

  const filteredQuotes = quotes.filter(q => 
    !form.account_id || q.account_id === form.account_id
  );

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => navigate('/contracts')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditing ? 'Editar Contrato' : 'Novo Contrato'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? 'Atualizar detalhes do contrato' : 'Criar um novo contrato de cliente'}
            </p>
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isEditing ? 'Atualizar Contrato' : 'Criar Contrato'}
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>Nome e descrição do contrato</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Contrato *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Acordo de Licenciamento Empresarial"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Breve descrição do contrato..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Relationships */}
            <Card>
              <CardHeader>
                <CardTitle>Relacionamentos</CardTitle>
                <CardDescription>Vincule a conta, contato, oportunidade e proposta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="account">Conta *</Label>
                    <Select
                      value={form.account_id}
                      onValueChange={(value) => setForm({ ...form, account_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma conta" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact">Contato</Label>
                    <Select
                      value={form.contact_id}
                      onValueChange={(value) => setForm({ ...form, contact_id: value })}
                      disabled={!form.account_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um contato" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredContacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.first_name} {contact.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="opportunity">Oportunidade</Label>
                    <Select
                      value={form.opportunity_id}
                      onValueChange={handleOpportunitySelect}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma oportunidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredOpportunities.map((opp) => (
                          <SelectItem key={opp.id} value={opp.id}>
                            {opp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quote">Proposta (Aceita)</Label>
                    <Select
                      value={form.quote_id}
                      onValueChange={handleQuoteSelect}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma proposta" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredQuotes.map((quote) => (
                          <SelectItem key={quote.id} value={quote.id}>
                            {quote.quote_number} - {quote.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhes Financeiros</CardTitle>
                <CardDescription>Valor do contrato e informações de cobrança</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="total_value">Valor Total (R$)</Label>
                    <Input
                      id="total_value"
                      type="number"
                      step="0.01"
                      value={form.total_value}
                      onChange={(e) => setForm({ ...form, total_value: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recurring_value">Valor Recorrente (R$)</Label>
                    <Input
                      id="recurring_value"
                      type="number"
                      step="0.01"
                      value={form.recurring_value}
                      onChange={(e) => setForm({ ...form, recurring_value: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing_frequency">Frequência de Cobrança</Label>
                    <Select
                      value={form.billing_frequency}
                      onValueChange={(value) => setForm({ ...form, billing_frequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="quarterly">Trimestral</SelectItem>
                        <SelectItem value="semi-annual">Semestral</SelectItem>
                        <SelectItem value="annual">Anual</SelectItem>
                        <SelectItem value="one-time">Única</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_terms">Condições de Pagamento</Label>
                    <Select
                      value={form.payment_terms}
                      onValueChange={(value) => setForm({ ...form, payment_terms: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Net 15">15 dias</SelectItem>
                        <SelectItem value="Net 30">30 dias</SelectItem>
                        <SelectItem value="Net 45">45 dias</SelectItem>
                        <SelectItem value="Net 60">60 dias</SelectItem>
                        <SelectItem value="Due on Receipt">No Recebimento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Terms */}
            <Card>
              <CardHeader>
                <CardTitle>Termos e Condições</CardTitle>
                <CardDescription>Termos padrão e condições especiais do contrato</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="terms">Termos Padrão</Label>
                  <Textarea
                    id="terms"
                    value={form.terms_and_conditions}
                    onChange={(e) => setForm({ ...form, terms_and_conditions: e.target.value })}
                    placeholder="Digite os termos e condições padrão..."
                    rows={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="special">Condições Especiais</Label>
                  <Textarea
                    id="special"
                    value={form.special_conditions}
                    onChange={(e) => setForm({ ...form, special_conditions: e.target.value })}
                    placeholder="Digite quaisquer condições ou exceções especiais..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={form.status}
                  onValueChange={(value) => setForm({ ...form, status: value as ContractStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="pending_approval">Aguardando Aprovação</SelectItem>
                    <SelectItem value="sent">Enviado</SelectItem>
                    <SelectItem value="negotiating">Em Negociação</SelectItem>
                    <SelectItem value="signed">Assinado</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="expired">Expirado</SelectItem>
                    <SelectItem value="terminated">Rescindido</SelectItem>
                    <SelectItem value="renewed">Renovado</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle>Período do Contrato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Data de Início</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">Data de Término</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Renewal */}
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Renovação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto_renewal">Renovação Automática</Label>
                  <Switch
                    id="auto_renewal"
                    checked={form.auto_renewal}
                    onCheckedChange={(checked) => setForm({ ...form, auto_renewal: checked })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="renewal_notice">Período de Aviso (dias)</Label>
                  <Input
                    id="renewal_notice"
                    type="number"
                    value={form.renewal_notice_days}
                    onChange={(e) => setForm({ ...form, renewal_notice_days: e.target.value })}
                    placeholder="30"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </AppLayout>
  );
}
