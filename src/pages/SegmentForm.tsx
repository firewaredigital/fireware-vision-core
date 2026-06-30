import { useState, useEffect , useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Users,
  Target,
  RefreshCw,
  Filter,
  Database,
} from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SegmentFilter {
  id: string;
  field: string;
  operator: string;
  value: string;
  logic: 'and' | 'or';
}

interface SegmentForm {
  name: string;
  description: string;
  type: 'static' | 'dynamic';
  entity_type: 'contact' | 'lead' | 'account';
  filters: SegmentFilter[];
  filter_logic: string;
  auto_refresh: boolean;
  refresh_interval_hours: number;
  color: string;
}

const initialForm: SegmentForm = {
  name: '',
  description: '',
  type: 'dynamic',
  entity_type: 'contact',
  filters: [],
  filter_logic: 'and',
  auto_refresh: true,
  refresh_interval_hours: 24,
  color: '#3B82F6',
};

const fieldOptions: Record<string, { value: string; label: string }[]> = {
  contact: [
    { value: 'email', label: 'Email' },
    { value: 'first_name', label: 'Nome' },
    { value: 'last_name', label: 'Sobrenome' },
    { value: 'job_title', label: 'Cargo' },
    { value: 'department', label: 'Departamento' },
    { value: 'address_city', label: 'Cidade' },
    { value: 'address_state', label: 'Estado' },
    { value: 'address_country', label: 'País' },
    { value: 'tags', label: 'Tags' },
    { value: 'created_at', label: 'Data de Criação' },
  ],
  lead: [
    { value: 'email', label: 'Email' },
    { value: 'first_name', label: 'Nome' },
    { value: 'last_name', label: 'Sobrenome' },
    { value: 'company', label: 'Empresa' },
    { value: 'industry', label: 'Indústria' },
    { value: 'source', label: 'Origem' },
    { value: 'status', label: 'Status' },
    { value: 'score', label: 'Score' },
    { value: 'address_city', label: 'Cidade' },
    { value: 'address_state', label: 'Estado' },
    { value: 'tags', label: 'Tags' },
    { value: 'created_at', label: 'Data de Criação' },
  ],
  account: [
    { value: 'name', label: 'Nome' },
    { value: 'industry', label: 'Indústria' },
    { value: 'email', label: 'Email' },
    { value: 'website', label: 'Website' },
    { value: 'address_city', label: 'Cidade' },
    { value: 'address_state', label: 'Estado' },
    { value: 'address_country', label: 'País' },
    { value: 'annual_revenue', label: 'Receita Anual' },
    { value: 'employee_count', label: 'Número de Funcionários' },
    { value: 'tags', label: 'Tags' },
    { value: 'created_at', label: 'Data de Criação' },
  ],
};

const operatorOptions = [
  { value: 'equals', label: 'Igual a' },
  { value: 'not_equals', label: 'Diferente de' },
  { value: 'contains', label: 'Contém' },
  { value: 'not_contains', label: 'Não contém' },
  { value: 'starts_with', label: 'Começa com' },
  { value: 'ends_with', label: 'Termina com' },
  { value: 'greater_than', label: 'Maior que' },
  { value: 'less_than', label: 'Menor que' },
  { value: 'is_empty', label: 'Está vazio' },
  { value: 'is_not_empty', label: 'Não está vazio' },
];

export default function SegmentForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState<SegmentForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [estimatedCount, setEstimatedCount] = useState<number | null>(null);
  const isEditing = Boolean(id);

  

  const fetchSegment = useCallback( async () => {
    if (!id) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('segments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Segmento não encontrado',
      });
      navigate('/marketing');
      return;
    }

    setForm({
      name: data.name || '',
      description: data.description || '',
      type: data.type as 'static' | 'dynamic',
      entity_type: data.entity_type as 'contact' | 'lead' | 'account',
      filters: (data.filters as unknown as SegmentFilter[]) || [],
      filter_logic: data.filter_logic || 'and',
      auto_refresh: data.auto_refresh ?? true,
      refresh_interval_hours: data.refresh_interval_hours || 24,
      color: data.color || '#3B82F6',
    });
    setEstimatedCount(data.member_count);
    setLoading(false);
  }, [id, toast, navigate]);

  useEffect(() => {
    if (id) {
      fetchSegment();
    }
  }, [id, fetchSegment]);

  const addFilter = () => {
    const newFilter: SegmentFilter = {
      id: `filter_${Date.now()}`,
      field: '',
      operator: 'equals',
      value: '',
      logic: 'and',
    };
    setForm({ ...form, filters: [...form.filters, newFilter] });
  };

  const removeFilter = (filterId: string) => {
    setForm({
      ...form,
      filters: form.filters.filter(f => f.id !== filterId),
    });
  };

  const updateFilter = (filterId: string, updates: Partial<SegmentFilter>) => {
    setForm({
      ...form,
      filters: form.filters.map(f => f.id === filterId ? { ...f, ...updates } : f),
    });
  };

  const estimateCount = async () => {
    if (!profile?.organization_id) return;

    let count = 0;
    if (form.entity_type === 'contact') {
      const { count: c } = await supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('organization_id', profile.organization_id);
      count = c || 0;
    } else if (form.entity_type === 'lead') {
      const { count: c } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('organization_id', profile.organization_id);
      count = c || 0;
    } else {
      const { count: c } = await supabase.from('accounts').select('*', { count: 'exact', head: true }).eq('organization_id', profile.organization_id);
      count = c || 0;
    }

    if (count !== null) {
      // Apply rough filter estimation (simplified)
      const filterMultiplier = Math.max(0.1, 1 - (form.filters.length * 0.15));
      setEstimatedCount(Math.round(count * filterMultiplier));
    }
  };

  const handleSave = async () => {
    if (!profile?.organization_id || !form.name) return;

    setSaving(true);

    const segmentData = {
      name: form.name,
      description: form.description || null,
      type: form.type,
      entity_type: form.entity_type,
      filters: form.filters as unknown,
      filter_logic: form.filter_logic,
      auto_refresh: form.auto_refresh,
      refresh_interval_hours: form.refresh_interval_hours,
      color: form.color || null,
      organization_id: profile.organization_id,
      created_by: profile.id,
      member_count: estimatedCount || 0,
      last_calculated_at: new Date().toISOString(),
    };

    let error;
    if (id) {
      const result = await supabase
        .from('segments')
        .update(segmentData)
        .eq('id', id);
      error = result.error;
    } else {
      const result = await supabase
        .from('segments')
        .insert([segmentData])
        .select()
        .single();
      error = result.error;
      if (!error && result.data) {
        navigate(`/marketing/segments/${result.data.id}`);
      }
    }

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao salvar segmento',
      });
    } else {
      toast({
        title: 'Segmento salvo',
        description: `"${form.name}" foi salvo com sucesso.`,
      });
      if (!id) navigate('/marketing');
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/marketing')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? 'Editar Segmento' : 'Novo Segmento'}
            </h1>
            <p className="text-muted-foreground">
              Crie grupos de contatos baseados em critérios
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={estimateCount}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Estimar
          </Button>
          <Button onClick={handleSave} disabled={saving || !form.name}>
            {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome do Segmento *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex: Leads Qualificados SP"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm({ ...form, type: v as 'static' | 'dynamic' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dynamic">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4" />
                          <span>Dinâmico</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="static">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          <span>Estático</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Descreva o objetivo deste segmento..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Entidade Base</Label>
                <Select
                  value={form.entity_type}
                  onValueChange={(v) => setForm({ ...form, entity_type: v as 'contact' | 'lead' | 'account', filters: [] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contact">Contatos</SelectItem>
                    <SelectItem value="lead">Leads</SelectItem>
                    <SelectItem value="account">Contas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {form.type === 'dynamic' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Filtros</CardTitle>
                    <CardDescription>
                      Defina os critérios para incluir registros neste segmento
                    </CardDescription>
                  </div>
                  <Button onClick={addFilter} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Filtro
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {form.filters.length === 0 ? (
                  <div className="text-center py-8 border border-dashed rounded-lg">
                    <Filter className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground mb-4">Nenhum filtro configurado</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Sem filtros, todos os {form.entity_type === 'contact' ? 'contatos' : form.entity_type === 'lead' ? 'leads' : 'contas'} serão incluídos
                    </p>
                    <Button variant="outline" onClick={addFilter}>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Primeiro Filtro
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {form.filters.map((filter, index) => (
                      <div key={filter.id} className="flex items-center gap-3">
                        {index > 0 && (
                          <Select
                            value={filter.logic}
                            onValueChange={(v) => updateFilter(filter.id, { logic: v as 'and' | 'or' })}
                          >
                            <SelectTrigger className="w-[80px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="and">E</SelectItem>
                              <SelectItem value="or">OU</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        <Select
                          value={filter.field}
                          onValueChange={(v) => updateFilter(filter.id, { field: v })}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Campo" />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldOptions[form.entity_type].map((field) => (
                              <SelectItem key={field.value} value={field.value}>
                                {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={filter.operator}
                          onValueChange={(v) => updateFilter(filter.id, { operator: v })}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Operador" />
                          </SelectTrigger>
                          <SelectContent>
                            {operatorOptions.map((op) => (
                              <SelectItem key={op.value} value={op.value}>
                                {op.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {!['is_empty', 'is_not_empty'].includes(filter.operator) && (
                          <Input
                            value={filter.value}
                            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                            placeholder="Valor"
                            className="flex-1"
                          />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFilter(filter.id)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {form.type === 'dynamic' && (
            <Card>
              <CardHeader>
                <CardTitle>Atualização Automática</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Atualizar automaticamente</Label>
                    <p className="text-sm text-muted-foreground">
                      Recalcular membros periodicamente
                    </p>
                  </div>
                  <Switch
                    checked={form.auto_refresh}
                    onCheckedChange={(checked) => setForm({ ...form, auto_refresh: checked })}
                  />
                </div>
                {form.auto_refresh && (
                  <div className="space-y-2">
                    <Label>Intervalo (horas)</Label>
                    <Input
                      type="number"
                      value={form.refresh_interval_hours}
                      onChange={(e) => setForm({ ...form, refresh_interval_hours: parseInt(e.target.value) || 24 })}
                      min={1}
                      max={168}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estimativa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <Users className="h-12 w-12 mx-auto mb-2 text-primary opacity-50" />
                <p className="text-4xl font-bold">
                  {estimatedCount !== null ? estimatedCount.toLocaleString() : '—'}
                </p>
                <p className="text-muted-foreground">
                  {form.entity_type === 'contact' ? 'contatos' : form.entity_type === 'lead' ? 'leads' : 'contas'}
                </p>
              </div>
              <Button variant="outline" className="w-full" onClick={estimateCount}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Recalcular
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Personalização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tipo de Segmento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Badge variant={form.type === 'dynamic' ? 'default' : 'secondary'}>
                  {form.type === 'dynamic' ? 'Dinâmico' : 'Estático'}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {form.type === 'dynamic'
                    ? 'Membros são calculados automaticamente com base nos filtros definidos.'
                    : 'Membros são adicionados manualmente e não mudam automaticamente.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
