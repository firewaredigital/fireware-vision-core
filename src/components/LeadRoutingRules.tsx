import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  RefreshCw,
  Settings,
  Zap,
  Users,
  MapPin,
  Target,
  RotateCcw,
  GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type RuleType = 'round_robin' | 'territory' | 'segment' | 'load_balance' | 'skill_based' | 'priority';

interface RoutingRule {
  id: string;
  name: string;
  description: string | null;
  rule_type: RuleType;
  entity_type: string;
  conditions: unknown[];
  actions: Record<string, unknown>;
  target_user_ids: string[] | null;
  target_team_id: string | null;
  target_territory_id: string | null;
  priority: number;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
}

interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
}

interface Team {
  id: string;
  name: string;
}

interface Territory {
  id: string;
  name: string;
  region: string | null;
}

interface RuleForm {
  name: string;
  description: string;
  rule_type: RuleType;
  entity_type: string;
  target_user_ids: string[];
  target_team_id: string;
  target_territory_id: string;
  priority: string;
  is_active: boolean;
  is_default: boolean;
  conditions: Array<{
    field: string;
    operator: string;
    value: string;
  }>;
}

const initialForm: RuleForm = {
  name: '',
  description: '',
  rule_type: 'round_robin',
  entity_type: 'lead',
  target_user_ids: [],
  target_team_id: '',
  target_territory_id: '',
  priority: '100',
  is_active: true,
  is_default: false,
  conditions: [],
};

const ruleTypeConfig: Record<RuleType, { label: string; icon: React.ReactNode; description: string }> = {
  round_robin: {
    label: 'Round Robin',
    icon: <RotateCcw className="h-4 w-4" />,
    description: 'Distribui leads igualmente entre usuários selecionados',
  },
  territory: {
    label: 'Por Território',
    icon: <MapPin className="h-4 w-4" />,
    description: 'Direciona baseado na localização geográfica',
  },
  segment: {
    label: 'Por Segmento',
    icon: <Target className="h-4 w-4" />,
    description: 'Direciona baseado nas características do lead',
  },
  load_balance: {
    label: 'Balanceamento de Carga',
    icon: <Zap className="h-4 w-4" />,
    description: 'Distribui baseado na carga de trabalho atual',
  },
  skill_based: {
    label: 'Por Habilidade',
    icon: <Users className="h-4 w-4" />,
    description: 'Direciona para usuários com habilidades compatíveis',
  },
  priority: {
    label: 'Prioridade',
    icon: <Target className="h-4 w-4" />,
    description: 'Direciona leads de alto valor para top performers',
  },
};

const conditionFields = [
  { value: 'source', label: 'Origem do Lead' },
  { value: 'industry', label: 'Segmento' },
  { value: 'company', label: 'Empresa' },
  { value: 'score', label: 'Pontuação do Lead' },
  { value: 'address_state', label: 'Estado' },
  { value: 'address_country', label: 'País' },
];

const conditionOperators = [
  { value: 'equals', label: 'Igual a' },
  { value: 'not_equals', label: 'Diferente de' },
  { value: 'contains', label: 'Contém' },
  { value: 'greater_than', label: 'Maior que' },
  { value: 'less_than', label: 'Menor que' },
];

const entityTypeLabels: Record<string, string> = {
  lead: 'Lead',
  opportunity: 'Oportunidade',
  ticket: 'Ticket',
  account: 'Conta',
};

export function LeadRoutingRules() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RoutingRule | null>(null);
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null);
  const [form, setForm] = useState<RuleForm>(initialForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRules();
    fetchUsers();
    fetchTeams();
    fetchTerritories();
  }, [profile?.organization_id]);

  const fetchRules = async () => {
    if (!profile?.organization_id) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('routing_rules')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('priority');

    if (!error && data) {
      setRules(data as unknown as RoutingRule[]);
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .order('first_name');
    if (data) setUsers(data);
  };

  const fetchTeams = async () => {
    const { data } = await supabase
      .from('teams')
      .select('id, name')
      .order('name');
    if (data) setTeams(data);
  };

  const fetchTerritories = async () => {
    const { data } = await supabase
      .from('territories')
      .select('id, name, region')
      .order('name');
    if (data) setTerritories(data);
  };

  const openDialog = (rule?: RoutingRule) => {
    if (rule) {
      setEditingRule(rule);
      setForm({
        name: rule.name,
        description: rule.description || '',
        rule_type: rule.rule_type,
        entity_type: rule.entity_type,
        target_user_ids: rule.target_user_ids || [],
        target_team_id: rule.target_team_id || '',
        target_territory_id: rule.target_territory_id || '',
        priority: rule.priority.toString(),
        is_active: rule.is_active,
        is_default: rule.is_default,
        conditions: (rule.conditions as Array<{ field: string; operator: string; value: string }>) || [],
      });
    } else {
      setEditingRule(null);
      setForm(initialForm);
    }
    setDialogOpen(true);
  };

  const addCondition = () => {
    setForm(prev => ({
      ...prev,
      conditions: [...prev.conditions, { field: '', operator: 'equals', value: '' }],
    }));
  };

  const removeCondition = (index: number) => {
    setForm(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
    }));
  };

  const updateCondition = (index: number, field: keyof typeof form.conditions[0], value: string) => {
    setForm(prev => ({
      ...prev,
      conditions: prev.conditions.map((c, i) => i === index ? { ...c, [field]: value } : c),
    }));
  };

  const handleSave = async () => {
    if (!profile?.organization_id || !form.name) return;

    setSaving(true);

    const ruleData = {
      name: form.name,
      description: form.description || null,
      rule_type: form.rule_type,
      entity_type: form.entity_type,
      conditions: form.conditions,
      target_user_ids: form.target_user_ids.length > 0 ? form.target_user_ids : null,
      target_team_id: form.target_team_id || null,
      target_territory_id: form.target_territory_id || null,
      priority: parseInt(form.priority) || 100,
      is_active: form.is_active,
      is_default: form.is_default,
      organization_id: profile.organization_id,
    };

    let error;
    if (editingRule) {
      const result = await supabase
        .from('routing_rules')
        .update(ruleData)
        .eq('id', editingRule.id);
      error = result.error;
    } else {
      const result = await supabase.from('routing_rules').insert([ruleData]);
      error = result.error;
    }

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao salvar regra de roteamento.',
      });
    } else {
      toast({
        title: editingRule ? 'Regra atualizada' : 'Regra criada',
        description: `A regra de roteamento "${form.name}" foi salva com sucesso.`,
      });
      setDialogOpen(false);
      fetchRules();
    }

    setSaving(false);
  };

  const deleteRule = async (id: string) => {
    const { error } = await supabase.from('routing_rules').delete().eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao excluir regra de roteamento.',
      });
    } else {
      toast({
        title: 'Regra excluída',
        description: 'A regra de roteamento foi excluída com sucesso.',
      });
      fetchRules();
    }
    setDeleteRuleId(null);
  };

  const toggleRuleActive = async (rule: RoutingRule) => {
    const { error } = await supabase
      .from('routing_rules')
      .update({ is_active: !rule.is_active })
      .eq('id', rule.id);

    if (!error) {
      fetchRules();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Regras de Roteamento de Leads
            </CardTitle>
            <CardDescription>
              Configure a atribuição automática de leads baseada em regras
            </CardDescription>
          </div>
          <Button onClick={() => openDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Regra
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-8">
            <Settings className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Nenhuma regra de roteamento configurada</p>
            <p className="text-sm text-muted-foreground mb-4">
              Crie regras para atribuir leads automaticamente à sua equipe.
            </p>
            <Button variant="outline" onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeira Regra
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => {
                const config = ruleTypeConfig[rule.rule_type];
                return (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        {rule.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {rule.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {config.icon}
                        <span>{config.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{entityTypeLabels[rule.entity_type] || rule.entity_type}</Badge>
                    </TableCell>
                    <TableCell>{rule.priority}</TableCell>
                    <TableCell>
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={() => toggleRuleActive(rule)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDialog(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteRuleId(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {/* Rule Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRule ? 'Editar Regra de Roteamento' : 'Criar Regra de Roteamento'}
              </DialogTitle>
              <DialogDescription>
                Configure como os leads devem ser atribuídos automaticamente.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Nome da Regra *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex.: Leads Enterprise para Reps Seniores"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Descreva quando esta regra se aplica..."
                    rows={2}
                  />
                </div>
              </div>

              {/* Rule Type */}
              <div className="space-y-2">
                <Label>Tipo de Regra</Label>
                <Select
                  value={form.rule_type}
                  onValueChange={(value) => setForm({ ...form, rule_type: value as RuleType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ruleTypeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {config.icon}
                          <div>
                            <span>{config.label}</span>
                            <p className="text-xs text-muted-foreground">
                              {config.description}
                            </p>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Conditions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Condições (Quando aplicar esta regra)</Label>
                  <Button variant="outline" size="sm" onClick={addCondition}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Condição
                  </Button>
                </div>

                {form.conditions.length === 0 ? (
                  <div className="text-center py-4 border border-dashed rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Sem condições - a regra se aplica a todos os leads
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {form.conditions.map((condition, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Select
                          value={condition.field}
                          onValueChange={(v) => updateCondition(index, 'field', v)}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Campo" />
                          </SelectTrigger>
                          <SelectContent>
                            {conditionFields.map((f) => (
                              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={condition.operator}
                          onValueChange={(v) => updateCondition(index, 'operator', v)}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Operador" />
                          </SelectTrigger>
                          <SelectContent>
                            {conditionOperators.map((o) => (
                              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          value={condition.value}
                          onChange={(e) => updateCondition(index, 'value', e.target.value)}
                          placeholder="Valor"
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCondition(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Target Assignment */}
              <div className="space-y-4">
                <Label>Atribuir Para</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm">Equipe</Label>
                    <Select
                      value={form.target_team_id}
                      onValueChange={(v) => setForm({ ...form, target_team_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma equipe" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Território</Label>
                    <Select
                      value={form.target_territory_id}
                      onValueChange={(v) => setForm({ ...form, target_territory_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um território" />
                      </SelectTrigger>
                      <SelectContent>
                        {territories.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name} {t.region && `(${t.region})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Prioridade (menor = maior prioridade)</Label>
                  <Input
                    type="number"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    placeholder="100"
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Ativa</Label>
                    <p className="text-sm text-muted-foreground">Habilitar esta regra</p>
                  </div>
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!form.name || saving}>
                {saving ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {editingRule ? 'Atualizar Regra' : 'Criar Regra'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteRuleId} onOpenChange={() => setDeleteRuleId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Regra de Roteamento</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza de que deseja excluir esta regra? Leads futuros não serão roteados usando esta regra.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteRuleId && deleteRule(deleteRuleId)}>
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
