import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Play,
  Pause,
  Plus,
  Trash2,
  Settings,
  Mail,
  MessageSquare,
  Clock,
  Filter,
  GitBranch,
  Target,
  Users,
  Bell,
  Zap,
  RefreshCw,
  GripVertical,
  ArrowRight,
} from '@/components/icons';
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

interface Journey {
  id: string;
  name: string;
  description: string | null;
  status: string;
  trigger_type: string;
  trigger_segment_id: string | null;
  trigger_event_name: string | null;
  trigger_config: Record<string, unknown>;
  allow_reentry: boolean;
  reentry_wait_days: number;
  goal_type: string | null;
  entry_count: number;
  active_count: number;
  completed_count: number;
  goal_achieved_count: number;
  conversion_rate: number | null;
  created_at: string;
}

interface JourneyStep {
  id: string;
  journey_id: string;
  step_key: string;
  step_order: number;
  type: string;
  name: string;
  description: string | null;
  config: Record<string, unknown>;
  wait_duration_value: number | null;
  wait_duration_unit: string | null;
  conditions: unknown[];
  next_step_on_success: string | null;
  next_step_on_failure: string | null;
  is_entry_point: boolean;
  is_exit_point: boolean;
  entered_count: number;
  completed_count: number;
}

interface Segment {
  id: string;
  name: string;
  member_count: number;
}

const stepTypeConfig: Record<string, { label: string; icon: React.ReactNode; color: string; description: string }> = {
  email: { label: 'Enviar Email', icon: <Mail className="h-4 w-4" />, color: 'bg-pink-500', description: 'Envia um email para o contato' },
  sms: { label: 'Enviar SMS', icon: <MessageSquare className="h-4 w-4" />, color: 'bg-green-500', description: 'Envia um SMS' },
  whatsapp: { label: 'WhatsApp', icon: <MessageSquare className="h-4 w-4" />, color: 'bg-green-600', description: 'Envia mensagem WhatsApp' },
  wait: { label: 'Aguardar', icon: <Clock className="h-4 w-4" />, color: 'bg-gray-500', description: 'Aguarda um tempo antes de continuar' },
  condition: { label: 'Condição', icon: <Filter className="h-4 w-4" />, color: 'bg-yellow-500', description: 'Verifica uma condição' },
  split: { label: 'Divisão A/B', icon: <GitBranch className="h-4 w-4" />, color: 'bg-purple-500', description: 'Divide o fluxo em caminhos' },
  goal: { label: 'Meta', icon: <Target className="h-4 w-4" />, color: 'bg-blue-500', description: 'Define uma meta de conversão' },
  action: { label: 'Ação', icon: <Zap className="h-4 w-4" />, color: 'bg-orange-500', description: 'Executa uma ação' },
  add_to_segment: { label: 'Adicionar a Segmento', icon: <Users className="h-4 w-4" />, color: 'bg-indigo-500', description: 'Adiciona o contato a um segmento' },
  update_field: { label: 'Atualizar Campo', icon: <Settings className="h-4 w-4" />, color: 'bg-teal-500', description: 'Atualiza um campo do contato' },
  notify_owner: { label: 'Notificar Responsável', icon: <Bell className="h-4 w-4" />, color: 'bg-red-500', description: 'Envia notificação ao responsável' },
  create_task: { label: 'Criar Tarefa', icon: <Target className="h-4 w-4" />, color: 'bg-cyan-500', description: 'Cria uma tarefa de follow-up' },
};

const triggerTypeLabels: Record<string, string> = {
  segment_entry: 'Entrada em Segmento',
  event: 'Evento',
  manual: 'Manual',
  scheduled: 'Agendado',
  form_submit: 'Submissão de Formulário',
  page_visit: 'Visita à Página',
};

export default function JourneyBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [steps, setSteps] = useState<JourneyStep[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedStep, setSelectedStep] = useState<JourneyStep | null>(null);
  const [stepSheetOpen, setStepSheetOpen] = useState(false);
  const [addStepDialogOpen, setAddStepDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stepToDelete, setStepToDelete] = useState<JourneyStep | null>(null);
  const isNew = id === 'new';

  useEffect(() => {
    fetchSegments();
    if (!isNew && id) {
      fetchJourney();
      fetchSteps();
    } else {
      setJourney({
        id: '',
        name: '',
        description: null,
        status: 'draft',
        trigger_type: 'segment_entry',
        trigger_segment_id: null,
        trigger_event_name: null,
        trigger_config: {},
        allow_reentry: false,
        reentry_wait_days: 30,
        goal_type: null,
        entry_count: 0,
        active_count: 0,
        completed_count: 0,
        goal_achieved_count: 0,
        conversion_rate: null,
        created_at: new Date().toISOString(),
      });
      setLoading(false);
    }
  }, [id]);

  const fetchSegments = async () => {
    if (!profile?.organization_id) return;

    const { data } = await supabase
      .from('segments')
      .select('id, name, member_count')
      .eq('organization_id', profile.organization_id)
      .eq('is_active', true)
      .order('name');

    if (data) {
      setSegments(data);
    }
  };

  const fetchJourney = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('journeys')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Jornada não encontrada',
      });
      navigate('/marketing');
      return;
    }

    setJourney(data as unknown as Journey);
    setLoading(false);
  };

  const fetchSteps = async () => {
    if (!id || isNew) return;

    const { data } = await supabase
      .from('journey_steps')
      .select('*')
      .eq('journey_id', id)
      .order('step_order');

    if (data) {
      setSteps(data as unknown as JourneyStep[]);
    }
  };

  const handleSave = async () => {
    if (!profile?.organization_id || !journey?.name) return;

    setSaving(true);

    const journeyData = {
      name: journey.name,
      description: journey.description,
      trigger_type: journey.trigger_type,
      trigger_segment_id: journey.trigger_segment_id || null,
      trigger_event_name: journey.trigger_event_name || null,
      trigger_config: journey.trigger_config as any,
      allow_reentry: journey.allow_reentry,
      reentry_wait_days: journey.reentry_wait_days,
      goal_type: journey.goal_type || null,
      organization_id: profile.organization_id,
      created_by: profile.id,
    };

    let error;
    let savedId = id;

    if (isNew) {
      const result = await supabase
        .from('journeys')
        .insert([journeyData])
        .select()
        .single();
      error = result.error;
      if (!error && result.data) {
        savedId = result.data.id;
        navigate(`/marketing/journeys/${savedId}`, { replace: true });
      }
    } else {
      const result = await supabase
        .from('journeys')
        .update(journeyData)
        .eq('id', id);
      error = result.error;
    }

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao salvar jornada',
      });
    } else {
      toast({
        title: 'Jornada salva',
        description: `"${journey.name}" foi salva com sucesso.`,
      });
    }

    setSaving(false);
  };

  const toggleJourneyStatus = async () => {
    if (!journey || isNew) return;

    const newStatus = journey.status === 'active' ? 'paused' : 'active';

    const { error } = await supabase
      .from('journeys')
      .update({ status: newStatus, published_at: newStatus === 'active' ? new Date().toISOString() : null })
      .eq('id', journey.id);

    if (!error) {
      setJourney({ ...journey, status: newStatus });
      toast({
        title: newStatus === 'active' ? 'Jornada ativada' : 'Jornada pausada',
        description: `A jornada foi ${newStatus === 'active' ? 'ativada' : 'pausada'}.`,
      });
    }
  };

  const addStep = async (type: string) => {
    if (!journey?.id || isNew) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Salve a jornada antes de adicionar steps',
      });
      return;
    }

    const stepConfig = stepTypeConfig[type];
    const stepKey = `step_${Date.now()}`;
    const stepOrder = steps.length + 1;

    const { data, error } = await supabase
      .from('journey_steps')
      .insert([{
        journey_id: journey.id,
        step_key: stepKey,
        step_order: stepOrder,
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
      setSteps([...steps, data as unknown as JourneyStep]);
      setAddStepDialogOpen(false);
      toast({
        title: 'Step adicionado',
        description: `"${stepConfig.label}" foi adicionado à jornada.`,
      });
    }
  };

  const updateStep = async (step: JourneyStep) => {
    const { error } = await supabase
      .from('journey_steps')
      .update({
        name: step.name,
        description: step.description,
        config: step.config as any,
        wait_duration_value: step.wait_duration_value,
        wait_duration_unit: step.wait_duration_unit,
        conditions: step.conditions as any,
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
      .from('journey_steps')
      .delete()
      .eq('id', stepToDelete.id);

    if (!error) {
      setSteps(steps.filter(s => s.id !== stepToDelete.id));
      setDeleteDialogOpen(false);
      setStepToDelete(null);
      toast({
        title: 'Step removido',
        description: 'O step foi removido da jornada.',
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

  if (!journey) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/marketing')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">
                {isNew ? 'Nova Jornada' : journey.name || 'Jornada sem nome'}
              </h1>
              {!isNew && (
                <Badge variant={journey.status === 'active' ? 'default' : 'secondary'}>
                  {journey.status === 'active' ? 'Ativa' : journey.status === 'paused' ? 'Pausada' : 'Rascunho'}
                </Badge>
              )}
            </div>
            {journey.description && (
              <p className="text-muted-foreground">{journey.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <Button variant="outline" onClick={toggleJourneyStatus}>
              {journey.status === 'active' ? (
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
          )}
          <Button onClick={handleSave} disabled={saving || !journey.name}>
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
          <TabsTrigger value="analytics" disabled={isNew}>Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Steps da Jornada</h2>
            <Button onClick={() => setAddStepDialogOpen(true)} disabled={isNew}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Step
            </Button>
          </div>

          {/* Trigger Card */}
          <Card className="border-l-4 border-l-primary">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <GitBranch className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Trigger: {triggerTypeLabels[journey.trigger_type]}</p>
                  {journey.trigger_segment_id && (
                    <p className="text-sm text-muted-foreground">
                      Segmento: {segments.find(s => s.id === journey.trigger_segment_id)?.name || 'Selecione'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Steps List */}
          <div className="space-y-3">
            {steps.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <GitBranch className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">
                    {isNew ? 'Salve a jornada para adicionar steps' : 'Nenhum step configurado'}
                  </p>
                  <Button onClick={() => setAddStepDialogOpen(true)} disabled={isNew}>
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
                          {step.type === 'wait' && step.wait_duration_value && (
                            <p className="text-sm text-muted-foreground">
                              Aguardar {step.wait_duration_value} {step.wait_duration_unit || 'dias'}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{step.entered_count} entradas</span>
                          <span>{step.completed_count} concluídos</span>
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
                Defina quando os contatos entram nesta jornada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Trigger</Label>
                <Select
                  value={journey.trigger_type}
                  onValueChange={(v) => setJourney({ ...journey, trigger_type: v })}
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

              {journey.trigger_type === 'segment_entry' && (
                <div className="space-y-2">
                  <Label>Segmento</Label>
                  <Select
                    value={journey.trigger_segment_id || ''}
                    onValueChange={(v) => setJourney({ ...journey, trigger_segment_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um segmento" />
                    </SelectTrigger>
                    <SelectContent>
                      {segments.map((segment) => (
                        <SelectItem key={segment.id} value={segment.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{segment.name}</span>
                            <Badge variant="secondary" className="ml-2">
                              {segment.member_count}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Contatos entrarão na jornada quando forem adicionados a este segmento
                  </p>
                </div>
              )}

              {journey.trigger_type === 'event' && (
                <div className="space-y-2">
                  <Label>Nome do Evento</Label>
                  <Input
                    value={journey.trigger_event_name || ''}
                    onChange={(e) => setJourney({ ...journey, trigger_event_name: e.target.value })}
                    placeholder="Ex: form_submitted, page_viewed"
                  />
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
                <Label>Nome da Jornada *</Label>
                <Input
                  value={journey.name}
                  onChange={(e) => setJourney({ ...journey, name: e.target.value })}
                  placeholder="Ex: Onboarding de Novos Clientes"
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={journey.description || ''}
                  onChange={(e) => setJourney({ ...journey, description: e.target.value })}
                  placeholder="Descreva o objetivo desta jornada..."
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
                  <Label>Permitir Re-entrada</Label>
                  <p className="text-sm text-muted-foreground">
                    Contatos podem entrar na jornada mais de uma vez
                  </p>
                </div>
                <Switch
                  checked={journey.allow_reentry}
                  onCheckedChange={(checked) => setJourney({ ...journey, allow_reentry: checked })}
                />
              </div>
              {journey.allow_reentry && (
                <div className="space-y-2">
                  <Label>Tempo mínimo entre re-entradas (dias)</Label>
                  <Input
                    type="number"
                    value={journey.reentry_wait_days}
                    onChange={(e) => setJourney({ ...journey, reentry_wait_days: parseInt(e.target.value) || 30 })}
                    min={1}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Meta de Conversão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Meta</Label>
                <Select
                  value={journey.goal_type || 'none'}
                  onValueChange={(v) => setJourney({ ...journey, goal_type: v === 'none' ? null : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sem meta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem meta</SelectItem>
                    <SelectItem value="segment_entry">Entrada em Segmento</SelectItem>
                    <SelectItem value="conversion">Conversão</SelectItem>
                    <SelectItem value="engagement">Engajamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Entradas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{journey.entry_count}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{journey.active_count}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{journey.completed_count}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Conversão</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{journey.conversion_rate || 0}%</div>
              </CardContent>
            </Card>
          </div>
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

              {selectedStep.type === 'wait' && (
                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tempo de Espera</Label>
                    <Input
                      type="number"
                      value={selectedStep.wait_duration_value || 1}
                      onChange={(e) => setSelectedStep({
                        ...selectedStep,
                        wait_duration_value: parseInt(e.target.value) || 1
                      })}
                      min={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unidade</Label>
                    <Select
                      value={selectedStep.wait_duration_unit || 'days'}
                      onValueChange={(v) => setSelectedStep({
                        ...selectedStep,
                        wait_duration_unit: v
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minutes">Minutos</SelectItem>
                        <SelectItem value="hours">Horas</SelectItem>
                        <SelectItem value="days">Dias</SelectItem>
                        <SelectItem value="weeks">Semanas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {selectedStep.type === 'email' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Assunto do Email</Label>
                    <Input
                      value={(selectedStep.config as any).subject || ''}
                      onChange={(e) => setSelectedStep({
                        ...selectedStep,
                        config: { ...selectedStep.config, subject: e.target.value }
                      })}
                      placeholder="Olá {{nome}}, temos novidades!"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Conteúdo</Label>
                    <Textarea
                      value={(selectedStep.config as any).content || ''}
                      onChange={(e) => setSelectedStep({
                        ...selectedStep,
                        config: { ...selectedStep.config, content: e.target.value }
                      })}
                      rows={6}
                      placeholder="Escreva o conteúdo do email..."
                    />
                  </div>
                </div>
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
