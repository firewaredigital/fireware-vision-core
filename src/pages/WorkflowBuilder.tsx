import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Play,
  Pause,
  Plus,
  Trash2,
  Settings,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  Bell,
  Users,
  FileText,
  Target,
  GitBranch,
  ArrowRight,
  Filter,
  RotateCcw,
  AlertTriangle,
  RefreshCw,
  GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
  trigger_conditions: Record<string, unknown>;
  trigger_fields: string[] | null;
  status: string;
  version: number;
  run_count: number;
  success_count: number;
  failure_count: number;
  last_run_at: string | null;
  retry_on_failure: boolean;
  max_retries: number;
  notify_on_failure: boolean;
  timeout_minutes: number;
  created_at: string;
  updated_at: string;
}

interface WorkflowStep {
  id: string;
  workflow_id: string;
  step_order: number;
  step_key: string;
  type: string;
  name: string;
  description: string | null;
  config: Record<string, unknown>;
  conditions: unknown[];
  next_step_on_success: string | null;
  next_step_on_failure: string | null;
  is_entry_point: boolean;
  is_exit_point: boolean;
  continue_on_error: boolean;
  position_x: number;
  position_y: number;
}

const stepTypeConfig: Record<string, { label: string; icon: React.ReactNode; color: string; description: string }> = {
  condition: { label: 'Condição', icon: <Filter className="h-4 w-4" />, color: 'bg-yellow-500', description: 'Verifica uma condição antes de continuar' },
  action: { label: 'Ação', icon: <Zap className="h-4 w-4" />, color: 'bg-blue-500', description: 'Executa uma ação genérica' },
  delay: { label: 'Delay', icon: <Clock className="h-4 w-4" />, color: 'bg-gray-500', description: 'Aguarda um tempo antes de continuar' },
  approval: { label: 'Aprovação', icon: <CheckCircle className="h-4 w-4" />, color: 'bg-purple-500', description: 'Solicita aprovação de um usuário' },
  notification: { label: 'Notificação', icon: <Bell className="h-4 w-4" />, color: 'bg-green-500', description: 'Envia uma notificação' },
  field_update: { label: 'Atualizar Campo', icon: <FileText className="h-4 w-4" />, color: 'bg-orange-500', description: 'Atualiza um campo do registro' },
  send_email: { label: 'Enviar Email', icon: <Mail className="h-4 w-4" />, color: 'bg-pink-500', description: 'Envia um email' },
  assign_owner: { label: 'Atribuir Responsável', icon: <Users className="h-4 w-4" />, color: 'bg-indigo-500', description: 'Atribui um novo responsável' },
  create_task: { label: 'Criar Tarefa', icon: <Target className="h-4 w-4" />, color: 'bg-teal-500', description: 'Cria uma nova tarefa' },
  create_record: { label: 'Criar Registro', icon: <Plus className="h-4 w-4" />, color: 'bg-cyan-500', description: 'Cria um novo registro' },
  webhook: { label: 'Webhook', icon: <ArrowRight className="h-4 w-4" />, color: 'bg-red-500', description: 'Chama uma URL externa' },
};

const triggerTypeLabels: Record<string, string> = {
  record_created: 'Registro Criado',
  record_updated: 'Registro Atualizado',
  field_changed: 'Campo Alterado',
  scheduled: 'Agendado',
  manual: 'Manual',
  approval_completed: 'Aprovação Concluída',
  sla_breach: 'SLA Violado',
  stage_changed: 'Estágio Alterado',
  score_changed: 'Score Alterado',
};

const entityLabels: Record<string, string> = {
  lead: 'Lead',
  opportunity: 'Oportunidade',
  account: 'Conta',
  contact: 'Contato',
  ticket: 'Ticket',
  quote: 'Cotação',
  contract: 'Contrato',
};

export default function WorkflowBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [stepSheetOpen, setStepSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stepToDelete, setStepToDelete] = useState<WorkflowStep | null>(null);
  const [addStepDialogOpen, setAddStepDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchWorkflow();
      fetchSteps();
    }
  }, [id]);

  const fetchWorkflow = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Workflow não encontrado',
      });
      navigate('/automations');
      return;
    }

    setWorkflow(data as unknown as Workflow);
    setLoading(false);
  };

  const fetchSteps = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('workflow_steps')
      .select('*')
      .eq('workflow_id', id)
      .order('step_order');

    if (!error && data) {
      setSteps(data as unknown as WorkflowStep[]);
    }
  };

  const handleSaveWorkflow = async () => {
    if (!workflow) return;

    setSaving(true);

    const { error } = await supabase
      .from('workflows')
      .update({
        name: workflow.name,
        description: workflow.description,
        trigger_type: workflow.trigger_type as any,
        trigger_entity: workflow.trigger_entity,
        trigger_conditions: workflow.trigger_conditions as any,
        trigger_fields: workflow.trigger_fields,
        retry_on_failure: workflow.retry_on_failure,
        max_retries: workflow.max_retries,
        notify_on_failure: workflow.notify_on_failure,
        timeout_minutes: workflow.timeout_minutes,
        updated_by: profile?.id,
      })
      .eq('id', workflow.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao salvar workflow',
      });
    } else {
      toast({
        title: 'Workflow salvo',
        description: 'As alterações foram salvas com sucesso.',
      });
    }

    setSaving(false);
  };

  const toggleWorkflowStatus = async () => {
    if (!workflow) return;

    const newStatus = workflow.status === 'active' ? 'paused' : 'active';

    const { error } = await supabase
      .from('workflows')
      .update({ status: newStatus })
      .eq('id', workflow.id);

    if (!error) {
      setWorkflow({ ...workflow, status: newStatus });
      toast({
        title: newStatus === 'active' ? 'Workflow ativado' : 'Workflow pausado',
        description: `O workflow foi ${newStatus === 'active' ? 'ativado' : 'pausado'}.`,
      });
    }
  };

  const addStep = async (type: string) => {
    if (!workflow || !profile?.organization_id) return;

    const stepConfig = stepTypeConfig[type];
    const stepKey = `step_${Date.now()}`;
    const stepOrder = steps.length + 1;

    const { data, error } = await supabase
      .from('workflow_steps')
      .insert([{
        workflow_id: workflow.id,
        step_order: stepOrder,
        step_key: stepKey,
        type: type as any,
        name: stepConfig.label,
        config: {} as any,
        is_entry_point: steps.length === 0,
        position_x: 100,
        position_y: stepOrder * 120,
      }])
      .select()
      .single();

    if (!error && data) {
      setSteps([...steps, data as unknown as WorkflowStep]);
      setAddStepDialogOpen(false);
      toast({
        title: 'Step adicionado',
        description: `"${stepConfig.label}" foi adicionado ao workflow.`,
      });
    }
  };

  const updateStep = async (step: WorkflowStep) => {
    const { error } = await supabase
      .from('workflow_steps')
      .update({
        name: step.name,
        description: step.description,
        config: step.config as any,
        conditions: step.conditions as any,
        next_step_on_success: step.next_step_on_success,
        next_step_on_failure: step.next_step_on_failure,
        continue_on_error: step.continue_on_error,
      })
      .eq('id', step.id);

    if (!error) {
      setSteps(steps.map(s => s.id === step.id ? step : s));
      toast({
        title: 'Step atualizado',
        description: 'As alterações foram salvas.',
      });
    }
  };

  const deleteStep = async () => {
    if (!stepToDelete) return;

    const { error } = await supabase
      .from('workflow_steps')
      .delete()
      .eq('id', stepToDelete.id);

    if (!error) {
      setSteps(steps.filter(s => s.id !== stepToDelete.id));
      setDeleteDialogOpen(false);
      setStepToDelete(null);
      toast({
        title: 'Step removido',
        description: 'O step foi removido do workflow.',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!workflow) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/automations')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{workflow.name}</h1>
              <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                {workflow.status === 'active' ? 'Ativo' : workflow.status === 'paused' ? 'Pausado' : 'Rascunho'}
              </Badge>
            </div>
            {workflow.description && (
              <p className="text-muted-foreground">{workflow.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={toggleWorkflowStatus}>
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
          </Button>
          <Button onClick={handleSaveWorkflow} disabled={saving}>
            {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="builder" className="space-y-4">
        <TabsList>
          <TabsTrigger value="builder">Builder</TabsTrigger>
          <TabsTrigger value="trigger">Trigger</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Steps do Workflow</h2>
            <Button onClick={() => setAddStepDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Step
            </Button>
          </div>

          {/* Trigger Card */}
          <Card className="border-l-4 border-l-primary">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Zap className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Trigger: {triggerTypeLabels[workflow.trigger_type]}</p>
                  <p className="text-sm text-muted-foreground">
                    Quando um {entityLabels[workflow.trigger_entity]} for {workflow.trigger_type === 'record_created' ? 'criado' : 'atualizado'}
                  </p>
                </div>
                <Badge variant="outline">{entityLabels[workflow.trigger_entity]}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Steps List */}
          <div className="space-y-3">
            {steps.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <GitBranch className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">Nenhum step configurado</p>
                  <Button onClick={() => setAddStepDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Primeiro Step
                  </Button>
                </CardContent>
              </Card>
            ) : (
              steps.map((step, index) => {
                const config = stepTypeConfig[step.type] || { label: step.type, icon: <Zap className="h-4 w-4" />, color: 'bg-gray-500' };
                return (
                  <Card 
                    key={step.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => {
                      setSelectedStep(step);
                      setStepSheetOpen(true);
                    }}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <GripVertical className="h-4 w-4" />
                          <span className="text-sm font-medium">{index + 1}</span>
                        </div>
                        <div className={`p-2 rounded-lg text-white ${config.color}`}>
                          {config.icon}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{step.name}</p>
                          {step.description && (
                            <p className="text-sm text-muted-foreground">{step.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {step.is_entry_point && <Badge variant="outline">Início</Badge>}
                          {step.is_exit_point && <Badge variant="outline">Fim</Badge>}
                          {step.continue_on_error && (
                            <Badge variant="secondary">Continua em erro</Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStepToDelete(step);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {steps.length > 0 && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => setAddStepDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Step
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="trigger" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuração do Trigger</CardTitle>
              <CardDescription>
                Defina quando este workflow deve ser executado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo de Trigger</Label>
                  <Select
                    value={workflow.trigger_type}
                    onValueChange={(v) => setWorkflow({ ...workflow, trigger_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(triggerTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Entidade</Label>
                  <Select
                    value={workflow.trigger_entity}
                    onValueChange={(v) => setWorkflow({ ...workflow, trigger_entity: v })}
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

              {workflow.trigger_type === 'field_changed' && (
                <div className="space-y-2">
                  <Label>Campos Monitorados</Label>
                  <Input
                    placeholder="status, score, owner_id (separados por vírgula)"
                    value={workflow.trigger_fields?.join(', ') || ''}
                    onChange={(e) => setWorkflow({
                      ...workflow,
                      trigger_fields: e.target.value.split(',').map(f => f.trim()).filter(Boolean)
                    })}
                  />
                  <p className="text-sm text-muted-foreground">
                    O workflow será executado quando qualquer um desses campos for alterado
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={workflow.name}
                  onChange={(e) => setWorkflow({ ...workflow, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={workflow.description || ''}
                  onChange={(e) => setWorkflow({ ...workflow, description: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comportamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Retentar em Falha</Label>
                  <p className="text-sm text-muted-foreground">
                    Tentar executar novamente se houver erro
                  </p>
                </div>
                <Switch
                  checked={workflow.retry_on_failure}
                  onCheckedChange={(checked) => setWorkflow({ ...workflow, retry_on_failure: checked })}
                />
              </div>

              {workflow.retry_on_failure && (
                <div className="space-y-2">
                  <Label>Máximo de Retentativas</Label>
                  <Input
                    type="number"
                    value={workflow.max_retries}
                    onChange={(e) => setWorkflow({ ...workflow, max_retries: parseInt(e.target.value) || 3 })}
                    min={1}
                    max={10}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label>Notificar em Falha</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar notificação quando o workflow falhar
                  </p>
                </div>
                <Switch
                  checked={workflow.notify_on_failure}
                  onCheckedChange={(checked) => setWorkflow({ ...workflow, notify_on_failure: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label>Timeout (minutos)</Label>
                <Input
                  type="number"
                  value={workflow.timeout_minutes}
                  onChange={(e) => setWorkflow({ ...workflow, timeout_minutes: parseInt(e.target.value) || 60 })}
                  min={1}
                  max={1440}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Versão</p>
                  <p className="text-2xl font-bold">{workflow.version}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Execuções</p>
                  <p className="text-2xl font-bold">{workflow.run_count}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sucesso</p>
                  <p className="text-2xl font-bold text-green-600">{workflow.success_count}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Falhas</p>
                  <p className="text-2xl font-bold text-red-600">{workflow.failure_count}</p>
                </div>
              </div>
              {workflow.last_run_at && (
                <p className="text-sm text-muted-foreground mt-4">
                  Última execução: {format(new Date(workflow.last_run_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Execuções</CardTitle>
              <CardDescription>
                Veja as últimas execuções deste workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                O histórico de execuções será exibido aqui
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Step Editor Sheet */}
      <Sheet open={stepSheetOpen} onOpenChange={setStepSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Editar Step</SheetTitle>
            <SheetDescription>
              Configure as propriedades deste step
            </SheetDescription>
          </SheetHeader>
          {selectedStep && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={selectedStep.name}
                  onChange={(e) => setSelectedStep({ ...selectedStep, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={selectedStep.description || ''}
                  onChange={(e) => setSelectedStep({ ...selectedStep, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Continuar em Erro</Label>
                  <p className="text-sm text-muted-foreground">
                    Prosseguir mesmo se houver erro
                  </p>
                </div>
                <Switch
                  checked={selectedStep.continue_on_error}
                  onCheckedChange={(checked) => setSelectedStep({ ...selectedStep, continue_on_error: checked })}
                />
              </div>

              {/* Config específica por tipo de step */}
              {selectedStep.type === 'delay' && (
                <div className="space-y-2">
                  <Label>Tempo de Espera (minutos)</Label>
                  <Input
                    type="number"
                    value={(selectedStep.config as any).delay_minutes || 0}
                    onChange={(e) => setSelectedStep({
                      ...selectedStep,
                      config: { ...selectedStep.config, delay_minutes: parseInt(e.target.value) || 0 }
                    })}
                  />
                </div>
              )}

              {selectedStep.type === 'notification' && (
                <>
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input
                      value={(selectedStep.config as any).title || ''}
                      onChange={(e) => setSelectedStep({
                        ...selectedStep,
                        config: { ...selectedStep.config, title: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mensagem</Label>
                    <Textarea
                      value={(selectedStep.config as any).message || ''}
                      onChange={(e) => setSelectedStep({
                        ...selectedStep,
                        config: { ...selectedStep.config, message: e.target.value }
                      })}
                      rows={3}
                    />
                  </div>
                </>
              )}

              {selectedStep.type === 'field_update' && (
                <>
                  <div className="space-y-2">
                    <Label>Campo</Label>
                    <Input
                      value={(selectedStep.config as any).field || ''}
                      onChange={(e) => setSelectedStep({
                        ...selectedStep,
                        config: { ...selectedStep.config, field: e.target.value }
                      })}
                      placeholder="Ex: status"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Novo Valor</Label>
                    <Input
                      value={(selectedStep.config as any).value || ''}
                      onChange={(e) => setSelectedStep({
                        ...selectedStep,
                        config: { ...selectedStep.config, value: e.target.value }
                      })}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStepSheetOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    updateStep(selectedStep);
                    setStepSheetOpen(false);
                  }}
                >
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Step Dialog */}
      <AlertDialog open={addStepDialogOpen} onOpenChange={setAddStepDialogOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Adicionar Step</AlertDialogTitle>
            <AlertDialogDescription>
              Escolha o tipo de step que deseja adicionar
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-3 md:grid-cols-2 py-4">
            {Object.entries(stepTypeConfig).map(([type, config]) => (
              <Card
                key={type}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => addStep(type)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg text-white ${config.color}`}>
                      {config.icon}
                    </div>
                    <div>
                      <p className="font-medium">{config.label}</p>
                      <p className="text-xs text-muted-foreground">{config.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Step Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Step</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este step? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteStep}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
