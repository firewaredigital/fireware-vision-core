import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Plus, Search, Filter, Settings2, Package, DollarSign, FileText,
  CheckCircle, AlertTriangle, Clock, XCircle, MoreHorizontal, Eye,
  Layers, ShieldCheck, Percent, Tag, ArrowUpDown
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

type CPQConfig = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  base_price: number;
  adjusted_price: number;
  discount_amount: number;
  discount_percent: number;
  final_price: number;
  currency: string;
  requires_approval: boolean;
  approval_status: string | null;
  version: number;
  valid_until: string | null;
  created_at: string;
  opportunity_id: string | null;
  quote_id: string | null;
};

type CPQRule = {
  id: string;
  name: string;
  description: string | null;
  rule_type: string;
  action: string;
  priority: number;
  is_active: boolean;
  created_at: string;
};

type CPQBundle = {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  bundle_price: number;
  discount_type: string;
  discount_value: number;
  is_active: boolean;
  created_at: string;
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  draft: { label: 'Rascunho', variant: 'secondary', icon: Clock },
  valid: { label: 'Válida', variant: 'default', icon: CheckCircle },
  invalid: { label: 'Inválida', variant: 'destructive', icon: XCircle },
  approved: { label: 'Aprovada', variant: 'default', icon: ShieldCheck },
  expired: { label: 'Expirada', variant: 'outline', icon: AlertTriangle },
};

export default function CPQConfigurations() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const organizationId = profile?.organization_id;

  const [activeTab, setActiveTab] = useState('configurations');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewConfigDialog, setShowNewConfigDialog] = useState(false);
  const [showNewRuleDialog, setShowNewRuleDialog] = useState(false);
  const [showNewBundleDialog, setShowNewBundleDialog] = useState(false);

  // Form states
  const [newConfig, setNewConfig] = useState({ name: '', description: '', base_price: '' });
  const [newRule, setNewRule] = useState({ name: '', description: '', rule_type: 'compatibility', action: 'require', priority: '100' });
  const [newBundle, setNewBundle] = useState({ name: '', description: '', sku: '', bundle_price: '', discount_type: 'percent', discount_value: '' });

  // Queries
  const { data: configurations = [], isLoading: loadingConfigs } = useQuery({
    queryKey: ['cpq-configurations', organizationId, statusFilter, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('cpq_product_configurations')
        .select('*')
        .eq('organization_id', organizationId!)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') query = query.eq('status', statusFilter as any);
      if (searchTerm) query = query.ilike('name', `%${searchTerm}%`);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CPQConfig[];
    },
    enabled: !!organizationId,
  });

  const { data: rules = [], isLoading: loadingRules } = useQuery({
    queryKey: ['cpq-rules', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cpq_rules')
        .select('*')
        .eq('organization_id', organizationId!)
        .order('priority', { ascending: true });
      if (error) throw error;
      return (data || []) as CPQRule[];
    },
    enabled: !!organizationId,
  });

  const { data: bundles = [], isLoading: loadingBundles } = useQuery({
    queryKey: ['cpq-bundles', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cpq_bundles')
        .select('*')
        .eq('organization_id', organizationId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as CPQBundle[];
    },
    enabled: !!organizationId,
  });

  const { data: discountPolicies = [] } = useQuery({
    queryKey: ['cpq-discount-policies', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cpq_discount_policies')
        .select('*')
        .eq('organization_id', organizationId!)
        .order('tier', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Mutations
  const createConfig = useMutation({
    mutationFn: async (values: typeof newConfig) => {
      const { error } = await supabase.from('cpq_product_configurations').insert({
        organization_id: organizationId!,
        name: values.name,
        description: values.description || null,
        base_price: parseFloat(values.base_price) || 0,
        adjusted_price: parseFloat(values.base_price) || 0,
        final_price: parseFloat(values.base_price) || 0,
        created_by: profile?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cpq-configurations'] });
      setShowNewConfigDialog(false);
      setNewConfig({ name: '', description: '', base_price: '' });
      toast.success('Configuração CPQ criada com sucesso');
    },
    onError: () => toast.error('Erro ao criar configuração'),
  });

  const createRule = useMutation({
    mutationFn: async (values: typeof newRule) => {
      const { error } = await supabase.from('cpq_rules').insert({
        organization_id: organizationId!,
        name: values.name,
        description: values.description || null,
        rule_type: values.rule_type as any,
        action: values.action as any,
        priority: parseInt(values.priority) || 100,
        created_by: profile?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cpq-rules'] });
      setShowNewRuleDialog(false);
      setNewRule({ name: '', description: '', rule_type: 'compatibility', action: 'require', priority: '100' });
      toast.success('Regra CPQ criada com sucesso');
    },
    onError: () => toast.error('Erro ao criar regra'),
  });

  const createBundle = useMutation({
    mutationFn: async (values: typeof newBundle) => {
      const { error } = await supabase.from('cpq_bundles').insert({
        organization_id: organizationId!,
        name: values.name,
        description: values.description || null,
        sku: values.sku || null,
        bundle_price: parseFloat(values.bundle_price) || 0,
        discount_type: values.discount_type,
        discount_value: parseFloat(values.discount_value) || 0,
        created_by: profile?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cpq-bundles'] });
      setShowNewBundleDialog(false);
      setNewBundle({ name: '', description: '', sku: '', bundle_price: '', discount_type: 'percent', discount_value: '' });
      toast.success('Bundle criado com sucesso');
    },
    onError: () => toast.error('Erro ao criar bundle'),
  });

  // Stats
  const totalConfigs = configurations.length;
  const activeConfigs = configurations.filter(c => c.status === 'valid' || c.status === 'approved').length;
  const pendingApproval = configurations.filter(c => c.requires_approval && c.approval_status === 'pending').length;
  const totalValue = configurations.reduce((sum, c) => sum + (c.final_price || 0), 0);

  const ruleTypeLabels: Record<string, string> = {
    compatibility: 'Compatibilidade',
    restriction: 'Restrição',
    dependency: 'Dependência',
    pricing: 'Precificação',
    validation: 'Validação',
  };

  const actionLabels: Record<string, string> = {
    require: 'Obrigatório',
    exclude: 'Excluir',
    suggest: 'Sugerir',
    price_override: 'Override de Preço',
    warn: 'Aviso',
  };

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">CPQ — Configure, Price, Quote</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie configurações de produtos, regras de precificação e pacotes comerciais.
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Configurações</CardTitle>
              <Settings2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalConfigs}</div>
              <p className="text-xs text-muted-foreground">{activeConfigs} ativas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Regras Ativas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rules.filter(r => r.is_active).length}</div>
              <p className="text-xs text-muted-foreground">de {rules.length} regras</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pendentes Aprovação</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingApproval}</div>
              <p className="text-xs text-muted-foreground">{bundles.filter(b => b.is_active).length} bundles ativos</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="configurations">
              <Settings2 className="h-4 w-4 mr-2" />Configurações
            </TabsTrigger>
            <TabsTrigger value="rules">
              <ArrowUpDown className="h-4 w-4 mr-2" />Regras
            </TabsTrigger>
            <TabsTrigger value="bundles">
              <Layers className="h-4 w-4 mr-2" />Bundles
            </TabsTrigger>
            <TabsTrigger value="discounts">
              <Percent className="h-4 w-4 mr-2" />Políticas de Desconto
            </TabsTrigger>
          </TabsList>

          {/* Configurations Tab */}
          <TabsContent value="configurations" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar configurações..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="valid">Válida</SelectItem>
                  <SelectItem value="invalid">Inválida</SelectItem>
                  <SelectItem value="approved">Aprovada</SelectItem>
                  <SelectItem value="expired">Expirada</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setShowNewConfigDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />Nova Configuração
              </Button>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Preço Base</TableHead>
                    <TableHead className="text-right">Desconto</TableHead>
                    <TableHead className="text-right">Preço Final</TableHead>
                    <TableHead>Versão</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingConfigs ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                  ) : configurations.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma configuração encontrada</TableCell></TableRow>
                  ) : configurations.map(config => {
                    const st = statusConfig[config.status] || statusConfig.draft;
                    const Icon = st.icon;
                    return (
                      <TableRow key={config.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/sales/cpq/${config.id}`)}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{config.name}</p>
                            {config.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{config.description}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={st.variant} className="gap-1">
                            <Icon className="h-3 w-3" />{st.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: config.currency }).format(config.base_price)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-destructive">
                          {config.discount_percent > 0 ? `-${config.discount_percent}%` : '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: config.currency }).format(config.final_price)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">v{config.version}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(config.created_at), 'dd/MM/yy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                              <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/sales/cpq/${config.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />Ver Detalhes
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Rules Tab */}
          <TabsContent value="rules" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Regras de compatibilidade, restrição e precificação aplicadas automaticamente.</p>
              <Button onClick={() => setShowNewRuleDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />Nova Regra
              </Button>
            </div>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingRules ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                  ) : rules.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma regra cadastrada</TableCell></TableRow>
                  ) : rules.map(rule => (
                    <TableRow key={rule.id}>
                      <TableCell><Badge variant="outline">{rule.priority}</Badge></TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{rule.name}</p>
                          {rule.description && <p className="text-xs text-muted-foreground">{rule.description}</p>}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary">{ruleTypeLabels[rule.rule_type] || rule.rule_type}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{actionLabels[rule.action] || rule.action}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                          {rule.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(rule.created_at), 'dd/MM/yy', { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Bundles Tab */}
          <TabsContent value="bundles" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Pacotes de produtos com preço e desconto especiais.</p>
              <Button onClick={() => setShowNewBundleDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />Novo Bundle
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {loadingBundles ? (
                <p className="col-span-full text-center py-8 text-muted-foreground">Carregando...</p>
              ) : bundles.length === 0 ? (
                <p className="col-span-full text-center py-8 text-muted-foreground">Nenhum bundle cadastrado</p>
              ) : bundles.map(bundle => (
                <Card key={bundle.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{bundle.name}</CardTitle>
                      <Badge variant={bundle.is_active ? 'default' : 'secondary'}>
                        {bundle.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    {bundle.sku && <p className="text-xs text-muted-foreground">SKU: {bundle.sku}</p>}
                    {bundle.description && <CardDescription>{bundle.description}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Preço do Bundle</p>
                        <p className="text-xl font-bold">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bundle.bundle_price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Desconto</p>
                        <p className="text-lg font-semibold text-destructive">
                          {bundle.discount_type === 'percent' ? `${bundle.discount_value}%` :
                            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bundle.discount_value)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Discount Policies Tab */}
          <TabsContent value="discounts" className="space-y-4">
            <p className="text-sm text-muted-foreground">Políticas de desconto por alçada com aprovação hierárquica.</p>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tier</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Desc. Máximo (%)</TableHead>
                    <TableHead>Desc. Máximo (R$)</TableHead>
                    <TableHead>Aprovação</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discountPolicies.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma política cadastrada</TableCell></TableRow>
                  ) : discountPolicies.map((policy: any) => (
                    <TableRow key={policy.id}>
                      <TableCell><Badge variant="outline">{policy.tier?.replace('_', ' ').toUpperCase()}</Badge></TableCell>
                      <TableCell className="font-medium">{policy.name}</TableCell>
                      <TableCell className="font-mono">{policy.max_discount_percent}%</TableCell>
                      <TableCell className="font-mono">
                        {policy.max_discount_amount ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(policy.max_discount_amount) : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={policy.requires_approval ? 'destructive' : 'secondary'}>
                          {policy.requires_approval ? 'Obrigatória' : 'Não'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={policy.is_active ? 'default' : 'secondary'}>
                          {policy.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>

        {/* New Configuration Dialog */}
        <Dialog open={showNewConfigDialog} onOpenChange={setShowNewConfigDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Configuração CPQ</DialogTitle>
              <DialogDescription>Crie uma nova configuração de produto com precificação.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input value={newConfig.name} onChange={e => setNewConfig(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Config Enterprise 2026" />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={newConfig.description} onChange={e => setNewConfig(p => ({ ...p, description: e.target.value }))} placeholder="Detalhes da configuração..." />
              </div>
              <div>
                <Label>Preço Base (R$)</Label>
                <Input type="number" step="0.01" value={newConfig.base_price} onChange={e => setNewConfig(p => ({ ...p, base_price: e.target.value }))} placeholder="0,00" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewConfigDialog(false)}>Cancelar</Button>
              <Button onClick={() => createConfig.mutate(newConfig)} disabled={!newConfig.name || createConfig.isPending}>
                {createConfig.isPending ? 'Criando...' : 'Criar Configuração'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Rule Dialog */}
        <Dialog open={showNewRuleDialog} onOpenChange={setShowNewRuleDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Regra CPQ</DialogTitle>
              <DialogDescription>Defina regras de compatibilidade, restrição ou precificação.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input value={newRule.name} onChange={e => setNewRule(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Licença Enterprise requer suporte Premium" />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={newRule.description} onChange={e => setNewRule(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo</Label>
                  <Select value={newRule.rule_type} onValueChange={v => setNewRule(p => ({ ...p, rule_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compatibility">Compatibilidade</SelectItem>
                      <SelectItem value="restriction">Restrição</SelectItem>
                      <SelectItem value="dependency">Dependência</SelectItem>
                      <SelectItem value="pricing">Precificação</SelectItem>
                      <SelectItem value="validation">Validação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Ação</Label>
                  <Select value={newRule.action} onValueChange={v => setNewRule(p => ({ ...p, action: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="require">Obrigatório</SelectItem>
                      <SelectItem value="exclude">Excluir</SelectItem>
                      <SelectItem value="suggest">Sugerir</SelectItem>
                      <SelectItem value="price_override">Override de Preço</SelectItem>
                      <SelectItem value="warn">Aviso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Prioridade (menor = executada primeiro)</Label>
                <Input type="number" value={newRule.priority} onChange={e => setNewRule(p => ({ ...p, priority: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewRuleDialog(false)}>Cancelar</Button>
              <Button onClick={() => createRule.mutate(newRule)} disabled={!newRule.name || createRule.isPending}>
                {createRule.isPending ? 'Criando...' : 'Criar Regra'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Bundle Dialog */}
        <Dialog open={showNewBundleDialog} onOpenChange={setShowNewBundleDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Bundle</DialogTitle>
              <DialogDescription>Crie pacotes de produtos com preço e desconto especiais.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input value={newBundle.name} onChange={e => setNewBundle(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Pacote Starter" />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={newBundle.description} onChange={e => setNewBundle(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>SKU</Label>
                  <Input value={newBundle.sku} onChange={e => setNewBundle(p => ({ ...p, sku: e.target.value }))} placeholder="BDL-001" />
                </div>
                <div>
                  <Label>Preço do Bundle (R$)</Label>
                  <Input type="number" step="0.01" value={newBundle.bundle_price} onChange={e => setNewBundle(p => ({ ...p, bundle_price: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Desconto</Label>
                  <Select value={newBundle.discount_type} onValueChange={v => setNewBundle(p => ({ ...p, discount_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percentual</SelectItem>
                      <SelectItem value="fixed">Fixo (R$)</SelectItem>
                      <SelectItem value="tiered">Por Faixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valor do Desconto</Label>
                  <Input type="number" step="0.01" value={newBundle.discount_value} onChange={e => setNewBundle(p => ({ ...p, discount_value: e.target.value }))} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewBundleDialog(false)}>Cancelar</Button>
              <Button onClick={() => createBundle.mutate(newBundle)} disabled={!newBundle.name || createBundle.isPending}>
                {createBundle.isPending ? 'Criando...' : 'Criar Bundle'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
