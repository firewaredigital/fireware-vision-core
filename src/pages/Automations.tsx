import { useState, useEffect } from 'react';
import { ModuleHeroBanner } from '@/components/ModuleHeroBanner';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Play,
  Pause,
  Settings,
  Trash2,
  Copy,
  MoreHorizontal,
  Zap,
  GitBranch,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Filter,
  History,
  FileText,
  Target,
  Mail,
  Bell,
  Users,
  ArrowRight,
} from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Workflow {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_entity: string;
  status: string;
  run_count: number;
  success_count: number;
  failure_count: number;
  last_run_at: string | null;
  created_at: string;
}

interface WorkflowRun {
  id: string;
  workflow_id: string;
  trigger_record_type: string | null;
  status: string;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  error_message: string | null;
  workflow?: { name: string };
}

const triggerTypeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  record_created: { label: 'Registro Criado', icon: <Plus className="h-4 w-4" /> },
  record_updated: { label: 'Registro Atualizado', icon: <RefreshCw className="h-4 w-4" /> },
  field_changed: { label: 'Campo Alterado', icon: <FileText className="h-4 w-4" /> },
  scheduled: { label: 'Agendado', icon: <Clock className="h-4 w-4" /> },
  manual: { label: 'Manual', icon: <Play className="h-4 w-4" /> },
  approval_completed: { label: 'Aprovação Concluída', icon: <CheckCircle className="h-4 w-4" /> },
  sla_breach: { label: 'SLA Violado', icon: <AlertTriangle className="h-4 w-4" /> },
  stage_changed: { label: 'Estágio Alterado', icon: <ArrowRight className="h-4 w-4" /> },
  score_changed: { label: 'Score Alterado', icon: <Target className="h-4 w-4" /> },
};

const entityLabels: Record<string, string> = {
  lead: 'Leads',
  opportunity: 'Oportunidades',
  account: 'Contas',
  contact: 'Contatos',
  ticket: 'Tickets',
  quote: 'Cotações',
  contract: 'Contratos',
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Rascunho', variant: 'secondary' },
  active: { label: 'Ativo', variant: 'default' },
  paused: { label: 'Pausado', variant: 'outline' },
  archived: { label: 'Arquivado', variant: 'destructive' },
};

const runStatusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending: { label: 'Pendente', icon: <Clock className="h-4 w-4" />, color: 'text-muted-foreground' },
  running: { label: 'Executando', icon: <RefreshCw className="h-4 w-4 animate-spin" />, color: 'text-blue-500' },
  completed: { label: 'Concluído', icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-500' },
  failed: { label: 'Falhou', icon: <XCircle className="h-4 w-4" />, color: 'text-destructive' },
  cancelled: { label: 'Cancelado', icon: <XCircle className="h-4 w-4" />, color: 'text-muted-foreground' },
  paused: { label: 'Pausado', icon: <Pause className="h-4 w-4" />, color: 'text-yellow-500' },
  waiting_approval: { label: 'Aguardando', icon: <Clock className="h-4 w-4" />, color: 'text-yellow-500' },
};

export default function Automations() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    trigger_type: 'record_created',
    trigger_entity: 'lead',
  });

  useEffect(() => {
    if (profile?.organization_id) {
      fetchWorkflows();
      fetchRuns();
    }
  }, [profile?.organization_id]);

  const fetchWorkflows = async () => {
    if (!profile?.organization_id) return;

    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setWorkflows(data as Workflow[]);
    }
    setLoading(false);
  };

  const fetchRuns = async () => {
    if (!profile?.organization_id) return;

    const { data, error } = await supabase
      .from('workflow_runs')
      .select(`
        *,
        workflow:workflows(name)
      `)
      .eq('organization_id', profile.organization_id)
      .order('started_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setRuns(data as unknown as WorkflowRun[]);
    }
  };

  const handleCreateWorkflow = async () => {
    if (!profile?.organization_id || !newWorkflow.name) return;

    const { data, error } = await supabase
      .from('workflows')
      .insert([{
        name: newWorkflow.name,
        description: newWorkflow.description || null,
        trigger_type: newWorkflow.trigger_type as any,
        trigger_entity: newWorkflow.trigger_entity,
        organization_id: profile.organization_id,
        created_by: profile.id,
      }])
      .select()
      .single();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao criar workflow',
      });
    } else {
      toast({
        title: 'Workflow criado',
        description: `"${newWorkflow.name}" foi criado com sucesso.`,
      });
      setCreateDialogOpen(false);
      setNewWorkflow({ name: '', description: '', trigger_type: 'record_created', trigger_entity: 'lead' });
      navigate(`/automations/${data.id}`);
    }
  };

  const toggleWorkflowStatus = async (workflow: Workflow) => {
    const newStatus = workflow.status === 'active' ? 'paused' : 'active';
    
    const { error } = await supabase
      .from('workflows')
      .update({ status: newStatus })
      .eq('id', workflow.id);

    if (!error) {
      toast({
        title: newStatus === 'active' ? 'Workflow ativado' : 'Workflow pausado',
        description: `"${workflow.name}" foi ${newStatus === 'active' ? 'ativado' : 'pausado'}.`,
      });
      fetchWorkflows();
    }
  };

  const deleteWorkflow = async (workflow: Workflow) => {
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', workflow.id);

    if (!error) {
      toast({
        title: 'Workflow excluído',
        description: `"${workflow.name}" foi excluído.`,
      });
      fetchWorkflows();
    }
  };

  const duplicateWorkflow = async (workflow: Workflow) => {
    if (!profile?.organization_id) return;

    const { error } = await supabase
      .from('workflows')
      .insert([{
        name: `${workflow.name} (Cópia)`,
        description: workflow.description,
        trigger_type: workflow.trigger_type as any,
        trigger_entity: workflow.trigger_entity,
        organization_id: profile.organization_id,
        created_by: profile.id,
        status: 'draft',
      }]);

    if (!error) {
      toast({
        title: 'Workflow duplicado',
        description: `Cópia de "${workflow.name}" foi criada.`,
      });
      fetchWorkflows();
    }
  };

  const filteredWorkflows = workflows.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         w.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
    const matchesEntity = entityFilter === 'all' || w.trigger_entity === entityFilter;
    return matchesSearch && matchesStatus && matchesEntity;
  });

  // Stats
  const activeWorkflows = workflows.filter(w => w.status === 'active').length;
  const totalRuns = workflows.reduce((sum, w) => sum + w.run_count, 0);
  const successRate = totalRuns > 0 
    ? Math.round((workflows.reduce((sum, w) => sum + w.success_count, 0) / totalRuns) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <ModuleHeroBanner
        module="admin"
        title="Automações"
        subtitle="Gerencie workflows e automações do sistema"
        compact
        actions={
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2 bg-white text-foreground hover:bg-white/90">
            <Plus className="h-4 w-4" /> Novo Workflow
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <Play className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeWorkflows}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Execuções Totais</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRuns}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="runs">Execuções Recentes</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar workflows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="paused">Pausado</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="archived">Arquivado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Entidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Entidades</SelectItem>
                {Object.entries(entityLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Workflows Table */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredWorkflows.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Zap className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <p className="text-muted-foreground mb-4">Nenhum workflow encontrado</p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Workflow
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Execuções</TableHead>
                    <TableHead>Última Execução</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkflows.map((workflow) => {
                    const triggerConfig = triggerTypeLabels[workflow.trigger_type] || { label: workflow.trigger_type, icon: <Zap className="h-4 w-4" /> };
                    const status = statusConfig[workflow.status] || statusConfig.draft;
                    
                    return (
                      <TableRow 
                        key={workflow.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/automations/${workflow.id}`)}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{workflow.name}</p>
                            {workflow.description && (
                              <p className="text-sm text-muted-foreground truncate max-w-[250px]">
                                {workflow.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {triggerConfig.icon}
                            <span className="text-sm">{triggerConfig.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {entityLabels[workflow.trigger_entity] || workflow.trigger_entity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{workflow.run_count}</span>
                            {workflow.run_count > 0 && (
                              <span className="text-xs text-muted-foreground">
                                ({Math.round((workflow.success_count / workflow.run_count) * 100)}% sucesso)
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {workflow.last_run_at ? (
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(workflow.last_run_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Nunca</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/automations/${workflow.id}`)}>
                                <Settings className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleWorkflowStatus(workflow)}>
                                {workflow.status === 'active' ? (
                                  <>
                                    <Pause className="mr-2 h-4 w-4" />
                                    Pausar
                                  </>
                                ) : (
                                  <>
                                    <Play className="mr-2 h-4 w-4" />
                                    Ativar
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => duplicateWorkflow(workflow)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => deleteWorkflow(workflow)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
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
          )}
        </TabsContent>

        <TabsContent value="runs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Execuções Recentes</CardTitle>
              <CardDescription>Últimas 50 execuções de workflows</CardDescription>
            </CardHeader>
            <CardContent>
              {runs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma execução encontrada
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Workflow</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Iniciado</TableHead>
                      <TableHead>Duração</TableHead>
                      <TableHead>Erro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runs.map((run) => {
                      const statusCfg = runStatusConfig[run.status] || runStatusConfig.pending;
                      return (
                        <TableRow key={run.id}>
                          <TableCell className="font-medium">
                            {run.workflow?.name || 'Workflow Desconhecido'}
                          </TableCell>
                          <TableCell>
                            <div className={`flex items-center gap-2 ${statusCfg.color}`}>
                              {statusCfg.icon}
                              <span>{statusCfg.label}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(run.started_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            {run.duration_ms ? `${run.duration_ms}ms` : '-'}
                          </TableCell>
                          <TableCell>
                            {run.error_message ? (
                              <span className="text-sm text-destructive truncate max-w-[200px] block">
                                {run.error_message}
                              </span>
                            ) : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Templates de Workflow</CardTitle>
              <CardDescription>
                Use templates pré-configurados para criar workflows rapidamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  {
                    name: 'Lead Nurturing',
                    description: 'Sequência automática de follow-up para novos leads',
                    icon: <Users className="h-8 w-8" />,
                    category: 'Sales',
                  },
                  {
                    name: 'Notificação de SLA',
                    description: 'Alerta quando um ticket está próximo de violar o SLA',
                    icon: <Bell className="h-8 w-8" />,
                    category: 'Service',
                  },
                  {
                    name: 'Boas-vindas',
                    description: 'Email automático de boas-vindas para novos contatos',
                    icon: <Mail className="h-8 w-8" />,
                    category: 'Marketing',
                  },
                  {
                    name: 'Aprovação de Desconto',
                    description: 'Fluxo de aprovação para descontos acima de 20%',
                    icon: <CheckCircle className="h-8 w-8" />,
                    category: 'Sales',
                  },
                  {
                    name: 'Escalonamento',
                    description: 'Escalonamento automático de tickets de alta prioridade',
                    icon: <AlertTriangle className="h-8 w-8" />,
                    category: 'Service',
                  },
                  {
                    name: 'Atualização de Score',
                    description: 'Recalcula score do lead baseado em atividades',
                    icon: <Target className="h-8 w-8" />,
                    category: 'Sales',
                  },
                ].map((template, index) => (
                  <Card key={index} className="cursor-pointer hover:border-primary transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          {template.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{template.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {template.description}
                          </p>
                          <Badge variant="secondary">{template.category}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Workflow</DialogTitle>
            <DialogDescription>
              Crie uma nova automação para seu sistema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={newWorkflow.name}
                onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                placeholder="Ex: Notificar equipe de vendas"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={newWorkflow.description}
                onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                placeholder="Descreva o que este workflow faz..."
                rows={2}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Trigger</Label>
                <Select
                  value={newWorkflow.trigger_type}
                  onValueChange={(v) => setNewWorkflow({ ...newWorkflow, trigger_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(triggerTypeLabels).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {config.icon}
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Entidade</Label>
                <Select
                  value={newWorkflow.trigger_entity}
                  onValueChange={(v) => setNewWorkflow({ ...newWorkflow, trigger_entity: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(entityLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateWorkflow} disabled={!newWorkflow.name}>
              Criar Workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
