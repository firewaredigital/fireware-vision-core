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
    description: 'Distribute leads evenly among selected users',
  },
  territory: {
    label: 'Territory Based',
    icon: <MapPin className="h-4 w-4" />,
    description: 'Route based on geographic territory',
  },
  segment: {
    label: 'Segment Based',
    icon: <Target className="h-4 w-4" />,
    description: 'Route based on lead characteristics',
  },
  load_balance: {
    label: 'Load Balance',
    icon: <Zap className="h-4 w-4" />,
    description: 'Distribute based on current workload',
  },
  skill_based: {
    label: 'Skill Based',
    icon: <Users className="h-4 w-4" />,
    description: 'Route to users with matching skills',
  },
  priority: {
    label: 'Priority',
    icon: <Target className="h-4 w-4" />,
    description: 'Route high-value leads to top performers',
  },
};

const conditionFields = [
  { value: 'source', label: 'Lead Source' },
  { value: 'industry', label: 'Industry' },
  { value: 'company', label: 'Company' },
  { value: 'score', label: 'Lead Score' },
  { value: 'address_state', label: 'State' },
  { value: 'address_country', label: 'Country' },
];

const conditionOperators = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Does not equal' },
  { value: 'contains', label: 'Contains' },
  { value: 'greater_than', label: 'Greater than' },
  { value: 'less_than', label: 'Less than' },
];

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
        title: 'Error',
        description: 'Failed to save routing rule',
      });
    } else {
      toast({
        title: editingRule ? 'Rule updated' : 'Rule created',
        description: `Routing rule "${form.name}" has been saved.`,
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
        title: 'Error',
        description: 'Failed to delete routing rule',
      });
    } else {
      toast({
        title: 'Rule deleted',
        description: 'The routing rule has been deleted.',
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
              Lead Routing Rules
            </CardTitle>
            <CardDescription>
              Configure automatic lead assignment based on rules
            </CardDescription>
          </div>
          <Button onClick={() => openDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Rule
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
            <p className="text-muted-foreground">No routing rules configured</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create rules to automatically assign leads to your team.
            </p>
            <Button variant="outline" onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Rule
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Priority</TableHead>
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
                      <Badge variant="outline">{rule.entity_type}</Badge>
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
                {editingRule ? 'Edit Routing Rule' : 'Create Routing Rule'}
              </DialogTitle>
              <DialogDescription>
                Configure how leads should be automatically assigned.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Rule Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Enterprise Leads to Senior Reps"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe when this rule applies..."
                    rows={2}
                  />
                </div>
              </div>

              {/* Rule Type */}
              <div className="space-y-2">
                <Label>Rule Type</Label>
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
                  <Label>Conditions (When to apply this rule)</Label>
                  <Button variant="outline" size="sm" onClick={addCondition}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Condition
                  </Button>
                </div>

                {form.conditions.length === 0 ? (
                  <div className="text-center py-4 border border-dashed rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      No conditions - rule applies to all leads
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
                            <SelectValue placeholder="Field" />
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
                            <SelectValue placeholder="Operator" />
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
                          placeholder="Value"
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
                <Label>Assign To</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm">Team</Label>
                    <Select
                      value={form.target_team_id}
                      onValueChange={(v) => setForm({ ...form, target_team_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Territory</Label>
                    <Select
                      value={form.target_territory_id}
                      onValueChange={(v) => setForm({ ...form, target_territory_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select territory" />
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
                  <Label>Priority (lower = higher priority)</Label>
                  <Input
                    type="number"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    placeholder="100"
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Active</Label>
                    <p className="text-sm text-muted-foreground">Enable this rule</p>
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
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!form.name || saving}>
                {saving ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {editingRule ? 'Update Rule' : 'Create Rule'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteRuleId} onOpenChange={() => setDeleteRuleId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Routing Rule</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this rule? Future leads will not be routed using this rule.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteRuleId && deleteRule(deleteRuleId)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
