import { useState, useEffect } from 'react';
import {
  Plus,
  Phone,
  Mail,
  Calendar,
  CheckSquare,
  FileText,
  Clock,
  CheckCircle2,
  MoreHorizontal,
  Edit,
  Trash2,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Database } from '@/integrations/supabase/types';

type ActivityType = Database['public']['Enums']['activity_type'];

interface ActivityRecord {
  id: string;
  type: ActivityType;
  subject: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  completed_at: string | null;
  duration_minutes: number | null;
  outcome: string | null;
  call_result: string | null;
  meeting_location: string | null;
  created_at: string;
  owner?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

interface ActivitiesWidgetProps {
  accountId?: string;
  contactId?: string;
  leadId?: string;
  opportunityId?: string;
  className?: string;
  compact?: boolean;
}

const activityTypeIcons: Record<ActivityType, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  task: CheckSquare,
  note: FileText,
};

const activityTypeLabels: Record<ActivityType, string> = {
  call: 'Ligação',
  email: 'Email',
  meeting: 'Reunião',
  task: 'Tarefa',
  note: 'Anotação',
};

const activityTypeColors: Record<ActivityType, string> = {
  call: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  email: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  meeting: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  task: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  note: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

const priorityLabels: Record<string, string> = {
  low: 'Baixa',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente',
};

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  normal: 'bg-info/10 text-info',
  high: 'bg-warning/10 text-warning',
  urgent: 'bg-destructive/10 text-destructive',
};

const callResultLabels: Record<string, string> = {
  connected: 'Conectado',
  voicemail: 'Caixa Postal',
  no_answer: 'Sem Resposta',
  busy: 'Ocupado',
  wrong_number: 'Número Errado',
};

export function ActivitiesWidget({
  accountId,
  contactId,
  leadId,
  opportunityId,
  className = '',
  compact = false,
}: ActivitiesWidgetProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityRecord | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    type: 'call' as ActivityType,
    subject: '',
    description: '',
    priority: 'normal',
    due_date: '',
    duration_minutes: '',
    meeting_location: '',
    outcome: '',
    call_result: '',
  });

  useEffect(() => {
    fetchActivities();
  }, [accountId, contactId, leadId, opportunityId]);

  const fetchActivities = async () => {
    setLoading(true);
    let query = supabase
      .from('activities')
      .select(`
        *,
        owner:profiles!activities_owner_id_fkey(first_name, last_name, email)
      `)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (accountId) query = query.eq('account_id', accountId);
    if (contactId) query = query.eq('contact_id', contactId);
    if (leadId) query = query.eq('lead_id', leadId);
    if (opportunityId) query = query.eq('opportunity_id', opportunityId);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching activities:', error);
    } else {
      setActivities(data || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      type: 'call',
      subject: '',
      description: '',
      priority: 'normal',
      due_date: '',
      duration_minutes: '',
      meeting_location: '',
      outcome: '',
      call_result: '',
    });
  };

  const handleSave = async () => {
    if (!formData.subject.trim()) {
      toast({ variant: 'destructive', title: 'Erro', description: 'O assunto é obrigatório' });
      return;
    }

    setSaving(true);

    // Get user's profile for organization_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user?.id)
      .single();

    if (!profile?.organization_id) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Organização não encontrada' });
      setSaving(false);
      return;
    }

    const activityData = {
      type: formData.type,
      subject: formData.subject.trim(),
      description: formData.description.trim() || null,
      priority: formData.priority,
      due_date: formData.due_date || null,
      duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
      meeting_location: formData.meeting_location.trim() || null,
      outcome: formData.outcome.trim() || null,
      call_result: formData.call_result.trim() || null,
      organization_id: profile.organization_id,
      owner_id: user?.id || '',
      status: 'open',
      account_id: accountId || null,
      contact_id: contactId || null,
      lead_id: leadId || null,
      opportunity_id: opportunityId || null,
    };

    if (editingActivity) {
      const { error } = await supabase
        .from('activities')
        .update({
          type: activityData.type,
          subject: activityData.subject,
          description: activityData.description,
          priority: activityData.priority,
          due_date: activityData.due_date,
          duration_minutes: activityData.duration_minutes,
          meeting_location: activityData.meeting_location,
          outcome: activityData.outcome,
          call_result: activityData.call_result,
        })
        .eq('id', editingActivity.id);

      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao atualizar atividade' });
      } else {
        toast({ title: 'Atividade atualizada' });
        closeDialog();
        fetchActivities();
      }
    } else {
      const { error } = await supabase.from('activities').insert(activityData);

      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao criar atividade' });
      } else {
        toast({ title: 'Atividade criada' });
        closeDialog();
        fetchActivities();
      }
    }

    setSaving(false);
  };

  const completeActivity = async (activity: ActivityRecord) => {
    const { error } = await supabase
      .from('activities')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', activity.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao concluir atividade' });
    } else {
      toast({ title: 'Atividade concluída' });
      fetchActivities();
    }
  };

  const deleteActivity = async (activityId: string) => {
    const { error } = await supabase.from('activities').delete().eq('id', activityId);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao excluir atividade' });
    } else {
      toast({ title: 'Atividade excluída' });
      fetchActivities();
    }
  };

  const openEditDialog = (activity: ActivityRecord) => {
    setEditingActivity(activity);
    setFormData({
      type: activity.type,
      subject: activity.subject,
      description: activity.description || '',
      priority: activity.priority || 'normal',
      due_date: activity.due_date ? activity.due_date.split('T')[0] : '',
      duration_minutes: activity.duration_minutes?.toString() || '',
      meeting_location: activity.meeting_location || '',
      outcome: activity.outcome || '',
      call_result: activity.call_result || '',
    });
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingActivity(null);
    resetForm();
  };

  const getOwnerName = (activity: ActivityRecord) => {
    if (activity.owner) {
      if (activity.owner.first_name || activity.owner.last_name) {
        return `${activity.owner.first_name || ''} ${activity.owner.last_name || ''}`.trim();
      }
      return activity.owner.email;
    }
    return 'Desconhecido';
  };

  const openActivities = activities.filter((a) => a.status !== 'completed');
  const completedActivities = activities.filter((a) => a.status === 'completed');

  if (compact) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium">Atividades ({openActivities.length} em aberto)</h4>
          <Button size="sm" variant="ghost" onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : openActivities.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma atividade em aberto</p>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {openActivities.slice(0, 3).map((activity) => {
              const Icon = activityTypeIcons[activity.type];
              return (
                <div key={activity.id} className="flex items-center gap-2 text-sm">
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate flex-1">{activity.subject}</span>
                  {activity.due_date && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {format(new Date(activity.due_date), "d 'de' MMM", { locale: ptBR })}
                    </span>
                  )}
                </div>
              );
            })}
            {openActivities.length > 3 && (
              <p className="text-xs text-muted-foreground">+{openActivities.length - 3} mais</p>
            )}
          </div>
        )}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingActivity ? 'Editar Atividade' : 'Registrar Atividade'}</DialogTitle>
              <DialogDescription>
                Registre uma ligação, email, reunião ou tarefa.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData({ ...formData, type: v as ActivityType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">Ligação</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="meeting">Reunião</SelectItem>
                      <SelectItem value="task">Tarefa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(v) => setFormData({ ...formData, priority: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Assunto *</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Assunto da atividade"
                />
              </div>
              <div className="space-y-2">
                <Label>Data de Vencimento</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving || !formData.subject.trim()}>
                {saving ? 'Salvando...' : editingActivity ? 'Atualizar' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Atividades</CardTitle>
          <CardDescription>Ligações, reuniões, emails e tarefas</CardDescription>
        </div>
        <Button size="sm" onClick={() => setShowDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Registrar Atividade
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <p>Carregando atividades...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <Activity className="h-8 w-8 mb-2" />
            <p>Nenhuma atividade registrada</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Open Activities */}
            {openActivities.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Em Aberto ({openActivities.length})
                </h4>
                <div className="space-y-3">
                  {openActivities.map((activity) => {
                    const Icon = activityTypeIcons[activity.type];
                    const isOverdue = activity.due_date && new Date(activity.due_date) < new Date();
                    return (
                      <div
                        key={activity.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${
                          isOverdue ? 'border-destructive/50 bg-destructive/5' : 'bg-card'
                        }`}
                      >
                        <div className={`p-2 rounded-md ${activityTypeColors[activity.type]}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{activity.subject}</span>
                            <Badge variant="outline" className={priorityColors[activity.priority || 'normal']}>
                              {priorityLabels[activity.priority || 'normal']}
                            </Badge>
                          </div>
                          {activity.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {activity.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{getOwnerName(activity)}</span>
                            {activity.due_date && (
                              <span className={`flex items-center gap-1 ${isOverdue ? 'text-destructive' : ''}`}>
                                <Clock className="h-3 w-3" />
                                {isOverdue ? 'Atrasado: ' : 'Vence em: '}
                                {format(new Date(activity.due_date), "d 'de' MMM yyyy", { locale: ptBR })}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => completeActivity(activity)}
                          >
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(activity)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => deleteActivity(activity.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Completed Activities */}
            {completedActivities.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Concluídas ({completedActivities.length})
                </h4>
                <div className="space-y-3">
                  {completedActivities.slice(0, 5).map((activity) => {
                    const Icon = activityTypeIcons[activity.type];
                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30 opacity-75"
                      >
                        <div className={`p-2 rounded-md bg-muted`}>
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium line-through">{activity.subject}</span>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span>Concluída {activity.completed_at && formatDistanceToNow(new Date(activity.completed_at), { addSuffix: true, locale: ptBR })}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingActivity ? 'Editar Atividade' : 'Registrar Atividade'}</DialogTitle>
              <DialogDescription>
                Registre uma ligação, email, reunião ou tarefa.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData({ ...formData, type: v as ActivityType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">Ligação</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="meeting">Reunião</SelectItem>
                      <SelectItem value="task">Tarefa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(v) => setFormData({ ...formData, priority: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Assunto *</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Assunto da atividade"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de Vencimento</Label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duração (minutos)</Label>
                  <Input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                    placeholder="30"
                  />
                </div>
              </div>
              {formData.type === 'meeting' && (
                <div className="space-y-2">
                  <Label>Local</Label>
                  <Input
                    value={formData.meeting_location}
                    onChange={(e) => setFormData({ ...formData, meeting_location: e.target.value })}
                    placeholder="Local da reunião ou link"
                  />
                </div>
              )}
              {formData.type === 'call' && (
                <div className="space-y-2">
                  <Label>Resultado da Ligação</Label>
                  <Select
                    value={formData.call_result}
                    onValueChange={(v) => setFormData({ ...formData, call_result: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o resultado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="connected">Conectado</SelectItem>
                      <SelectItem value="voicemail">Caixa Postal</SelectItem>
                      <SelectItem value="no_answer">Sem Resposta</SelectItem>
                      <SelectItem value="busy">Ocupado</SelectItem>
                      <SelectItem value="wrong_number">Número Errado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Detalhes da atividade..."
                />
              </div>
              <div className="space-y-2">
                <Label>Resultado</Label>
                <Input
                  value={formData.outcome}
                  onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                  placeholder="Resultado ou próximos passos"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving || !formData.subject.trim()}>
                {saving ? 'Salvando...' : editingActivity ? 'Atualizar' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
