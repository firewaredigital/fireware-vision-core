import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, Plus, Search, Play, Pause, Trash2, Edit, Users, Mail, Phone, Linkedin, CheckSquare, Clock, MoreHorizontal, ChevronDown, ChevronUp, GripVertical } from '@/components/icons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { Database } from '@/integrations/supabase/types';

type CadenceStepType = Database['public']['Enums']['cadence_step_type'];

interface Cadence {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  total_steps: number;
  organization_id: string;
  owner_id: string | null;
  created_at: string;
  owner?: { first_name: string | null; last_name: string | null; email: string } | null;
}

interface CadenceStep {
  id: string;
  cadence_id: string;
  step_number: number;
  type: CadenceStepType;
  subject: string | null;
  body: string | null;
  delay_days: number;
}

interface CadenceEnrollment {
  id: string;
  cadence_id: string;
  lead_id: string | null;
  contact_id: string | null;
  current_step: number;
  status: string;
  enrolled_at: string;
  next_step_due: string | null;
  lead?: { first_name: string; last_name: string; email: string | null } | null;
  contact?: { first_name: string; last_name: string; email: string | null } | null;
}

const stepTypeConfig: Record<CadenceStepType, { icon: any; label: string; color: string }> = {
  email: { icon: Mail, label: 'Email', color: 'bg-blue-100 text-blue-800' },
  call: { icon: Phone, label: 'Ligação', color: 'bg-green-100 text-green-800' },
  linkedin: { icon: Linkedin, label: 'LinkedIn', color: 'bg-sky-100 text-sky-800' },
  task: { icon: CheckSquare, label: 'Tarefa', color: 'bg-purple-100 text-purple-800' }
};

export default function Cadences() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isCadenceFormOpen, setIsCadenceFormOpen] = useState(false);
  const [isStepFormOpen, setIsStepFormOpen] = useState(false);
  const [selectedCadence, setSelectedCadence] = useState<Cadence | null>(null);
  const [editingCadence, setEditingCadence] = useState<Cadence | null>(null);
  const [editingStep, setEditingStep] = useState<CadenceStep | null>(null);
  const [activeTab, setActiveTab] = useState('cadences');
  
  // Cadence form state
  const [cadenceForm, setCadenceForm] = useState({
    name: '',
    description: ''
  });
  
  // Step form state
  const [stepForm, setStepForm] = useState({
    type: 'email' as CadenceStepType,
    subject: '',
    body: '',
    delay_days: 0
  });

  // Fetch cadences
  const { data: cadences = [], isLoading: cadencesLoading } = useQuery({
    queryKey: ['cadences'],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user?.id)
        .single();
      
      if (!profile?.organization_id) return [];

      const { data, error } = await supabase
        .from('cadences')
        .select(`
          *,
          owner:profiles!cadences_owner_id_fkey(first_name, last_name, email)
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Cadence[];
    },
    enabled: !!user
  });

  // Fetch steps for selected cadence
  const { data: steps = [] } = useQuery({
    queryKey: ['cadence-steps', selectedCadence?.id],
    queryFn: async () => {
      if (!selectedCadence) return [];

      const { data, error } = await supabase
        .from('cadence_steps')
        .select('*')
        .eq('cadence_id', selectedCadence.id)
        .order('step_number');
      
      if (error) throw error;
      return data as CadenceStep[];
    },
    enabled: !!selectedCadence
  });

  // Fetch enrollments for selected cadence
  const { data: enrollments = [] } = useQuery({
    queryKey: ['cadence-enrollments', selectedCadence?.id],
    queryFn: async () => {
      if (!selectedCadence) return [];

      const { data, error } = await supabase
        .from('cadence_enrollments')
        .select(`
          *,
          lead:leads(first_name, last_name, email),
          contact:contacts(first_name, last_name, email)
        `)
        .eq('cadence_id', selectedCadence.id)
        .order('enrolled_at', { ascending: false });
      
      if (error) throw error;
      return data as CadenceEnrollment[];
    },
    enabled: !!selectedCadence
  });

  // Fetch enrollment counts per cadence
  const { data: enrollmentCounts = {} } = useQuery({
    queryKey: ['enrollment-counts'],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user?.id)
        .single();
      
      if (!profile?.organization_id) return {};

      const { data, error } = await supabase
        .from('cadence_enrollments')
        .select('cadence_id, status')
        .eq('organization_id', profile.organization_id);
      
      if (error) throw error;

      const counts: Record<string, { active: number; completed: number; total: number }> = {};
      data.forEach(e => {
        if (!counts[e.cadence_id]) {
          counts[e.cadence_id] = { active: 0, completed: 0, total: 0 };
        }
        counts[e.cadence_id].total++;
        if (e.status === 'active') counts[e.cadence_id].active++;
        if (e.status === 'completed') counts[e.cadence_id].completed++;
      });

      return counts;
    },
    enabled: !!user
  });

  // Save cadence mutation
  const saveCadenceMutation = useMutation({
    mutationFn: async (data: typeof cadenceForm & { id?: string }) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user?.id)
        .single();
      
      if (!profile?.organization_id) throw new Error('No organization');

      const payload = {
        name: data.name,
        description: data.description || null,
        organization_id: profile.organization_id,
        owner_id: user?.id
      };

      if (data.id) {
        const { error } = await supabase
          .from('cadences')
          .update(payload)
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cadences')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cadences'] });
      setIsCadenceFormOpen(false);
      setEditingCadence(null);
      setCadenceForm({ name: '', description: '' });
      toast({
        title: editingCadence ? 'Cadência atualizada' : 'Cadência criada',
        description: 'Alterações salvas com sucesso.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Toggle cadence active status
  const toggleCadenceMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('cadences')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cadences'] });
    }
  });

  // Delete cadence mutation
  const deleteCadenceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cadences')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cadences'] });
      if (selectedCadence) setSelectedCadence(null);
      toast({
        title: 'Cadência excluída',
        description: 'A cadência foi removida.'
      });
    }
  });

  // Save step mutation
  const saveStepMutation = useMutation({
    mutationFn: async (data: typeof stepForm & { id?: string; cadence_id: string; step_number: number }) => {
      const payload = {
        cadence_id: data.cadence_id,
        step_number: data.step_number,
        type: data.type,
        subject: data.subject || null,
        body: data.body || null,
        delay_days: data.delay_days
      };

      if (data.id) {
        const { error } = await supabase
          .from('cadence_steps')
          .update(payload)
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cadence_steps')
          .insert(payload);
        if (error) throw error;
        
        // Update total_steps count
        await supabase
          .from('cadences')
          .update({ total_steps: (selectedCadence?.total_steps || 0) + 1 })
          .eq('id', data.cadence_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cadence-steps', selectedCadence?.id] });
      queryClient.invalidateQueries({ queryKey: ['cadences'] });
      setIsStepFormOpen(false);
      setEditingStep(null);
      setStepForm({ type: 'email', subject: '', body: '', delay_days: 0 });
      toast({
        title: editingStep ? 'Etapa atualizada' : 'Etapa adicionada',
        description: 'Alterações salvas com sucesso.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Delete step mutation
  const deleteStepMutation = useMutation({
    mutationFn: async (step: CadenceStep) => {
      const { error } = await supabase
        .from('cadence_steps')
        .delete()
        .eq('id', step.id);
      if (error) throw error;

      // Reorder remaining steps
      const remainingSteps = steps.filter(s => s.id !== step.id);
      for (let i = 0; i < remainingSteps.length; i++) {
        if (remainingSteps[i].step_number !== i + 1) {
          await supabase
            .from('cadence_steps')
            .update({ step_number: i + 1 })
            .eq('id', remainingSteps[i].id);
        }
      }

      // Update total_steps count
      await supabase
        .from('cadences')
        .update({ total_steps: Math.max(0, (selectedCadence?.total_steps || 1) - 1) })
        .eq('id', step.cadence_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cadence-steps', selectedCadence?.id] });
      queryClient.invalidateQueries({ queryKey: ['cadences'] });
      toast({
        title: 'Etapa excluída',
        description: 'A etapa foi removida.'
      });
    }
  });

  // Reorder steps
  const reorderStepsMutation = useMutation({
    mutationFn: async (reorderedSteps: CadenceStep[]) => {
      for (let i = 0; i < reorderedSteps.length; i++) {
        await supabase
          .from('cadence_steps')
          .update({ step_number: i + 1 })
          .eq('id', reorderedSteps[i].id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cadence-steps', selectedCadence?.id] });
    }
  });

  // Update enrollment status
  const updateEnrollmentMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === 'completed') updates.completed_at = new Date().toISOString();
      if (status === 'paused') updates.paused_at = new Date().toISOString();
      
      const { error } = await supabase
        .from('cadence_enrollments')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cadence-enrollments', selectedCadence?.id] });
      queryClient.invalidateQueries({ queryKey: ['enrollment-counts'] });
    }
  });

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(steps);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    reorderStepsMutation.mutate(items);
  };

  const openEditCadence = (cadence: Cadence) => {
    setEditingCadence(cadence);
    setCadenceForm({
      name: cadence.name,
      description: cadence.description || ''
    });
    setIsCadenceFormOpen(true);
  };

  const openEditStep = (step: CadenceStep) => {
    setEditingStep(step);
    setStepForm({
      type: step.type,
      subject: step.subject || '',
      body: step.body || '',
      delay_days: step.delay_days || 0
    });
    setIsStepFormOpen(true);
  };

  const filteredCadences = cadences.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Cadências</h1>
            <p className="text-muted-foreground">Sequências de prospecção automatizadas</p>
          </div>
          <Dialog open={isCadenceFormOpen} onOpenChange={(open) => {
            setIsCadenceFormOpen(open);
            if (!open) {
              setEditingCadence(null);
              setCadenceForm({ name: '', description: '' });
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Cadência
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCadence ? 'Editar Cadência' : 'Criar Cadência'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={cadenceForm.name}
                    onChange={(e) => setCadenceForm({ ...cadenceForm, name: e.target.value })}
                    placeholder="ex: Prospecção Outbound"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={cadenceForm.description}
                    onChange={(e) => setCadenceForm({ ...cadenceForm, description: e.target.value })}
                    placeholder="Descreva esta cadência..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCadenceFormOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={() => saveCadenceMutation.mutate({ ...cadenceForm, id: editingCadence?.id })}
                  disabled={!cadenceForm.name || saveCadenceMutation.isPending}
                >
                  {saveCadenceMutation.isPending ? 'Salvando...' : editingCadence ? 'Atualizar' : 'Criar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{cadences.length}</div>
              <div className="text-sm text-muted-foreground">Total Cadences</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{cadences.filter(c => c.is_active).length}</div>
              <div className="text-sm text-muted-foreground">Active Cadences</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {Object.values(enrollmentCounts).reduce((sum, c) => sum + c.active, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Active Enrollments</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {Object.values(enrollmentCounts).reduce((sum, c) => sum + c.completed, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-6">
          {/* Cadences List */}
          <Card className="col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cadences</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-8"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {cadencesLoading ? (
                <div className="p-4 text-center text-muted-foreground">Loading...</div>
              ) : filteredCadences.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Zap className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No cadences yet</p>
                </div>
              ) : (
                <div className="divide-y max-h-[500px] overflow-y-auto">
                  {filteredCadences.map(cadence => {
                    const counts = enrollmentCounts[cadence.id] || { active: 0, completed: 0, total: 0 };
                    return (
                      <div
                        key={cadence.id}
                        className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                          selectedCadence?.id === cadence.id ? 'bg-muted' : ''
                        }`}
                        onClick={() => setSelectedCadence(cadence)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium truncate">{cadence.name}</span>
                          <Switch
                            checked={cadence.is_active}
                            onCheckedChange={(checked) => {
                              toggleCadenceMutation.mutate({ id: cadence.id, is_active: checked });
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{cadence.total_steps || 0} steps</span>
                          <span>{counts.active} active</span>
                          <span>{counts.completed} done</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cadence Detail */}
          <Card className="col-span-2">
            {selectedCadence ? (
              <>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedCadence.name}</CardTitle>
                      <CardDescription>{selectedCadence.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditCadence(selectedCadence)}>
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteCadenceMutation.mutate(selectedCadence.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-4">
                      <TabsTrigger value="steps">Steps ({steps.length})</TabsTrigger>
                      <TabsTrigger value="enrollments">Enrollments ({enrollments.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="steps">
                      <div className="space-y-4">
                        <Dialog open={isStepFormOpen} onOpenChange={(open) => {
                          setIsStepFormOpen(open);
                          if (!open) {
                            setEditingStep(null);
                            setStepForm({ type: 'email', subject: '', body: '', delay_days: 0 });
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button size="sm">
                              <Plus className="h-4 w-4 mr-1" /> Add Step
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{editingStep ? 'Edit Step' : 'Add Step'}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Step Type</Label>
                                <Select
                                  value={stepForm.type}
                                  onValueChange={(value: CadenceStepType) => setStepForm({ ...stepForm, type: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(stepTypeConfig).map(([key, config]) => (
                                      <SelectItem key={key} value={key}>
                                        <div className="flex items-center gap-2">
                                          <config.icon className="h-4 w-4" />
                                          {config.label}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>Delay (days after previous step)</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={stepForm.delay_days}
                                  onChange={(e) => setStepForm({ ...stepForm, delay_days: parseInt(e.target.value) || 0 })}
                                />
                              </div>

                              {(stepForm.type === 'email' || stepForm.type === 'linkedin') && (
                                <div className="space-y-2">
                                  <Label>Subject</Label>
                                  <Input
                                    value={stepForm.subject}
                                    onChange={(e) => setStepForm({ ...stepForm, subject: e.target.value })}
                                    placeholder="Message subject..."
                                  />
                                </div>
                              )}

                              <div className="space-y-2">
                                <Label>{stepForm.type === 'task' ? 'Task Description' : 'Body / Notes'}</Label>
                                <Textarea
                                  value={stepForm.body}
                                  onChange={(e) => setStepForm({ ...stepForm, body: e.target.value })}
                                  placeholder={stepForm.type === 'call' ? 'Call script / talking points...' : 'Message body...'}
                                  rows={5}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsStepFormOpen(false)}>
                                Cancel
                              </Button>
                              <Button
                                onClick={() => saveStepMutation.mutate({
                                  ...stepForm,
                                  id: editingStep?.id,
                                  cadence_id: selectedCadence.id,
                                  step_number: editingStep?.step_number || steps.length + 1
                                })}
                                disabled={saveStepMutation.isPending}
                              >
                                {saveStepMutation.isPending ? 'Saving...' : editingStep ? 'Update' : 'Add'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        {steps.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Zap className="h-8 w-8 mx-auto mb-2" />
                            <p>No steps yet. Add your first step.</p>
                          </div>
                        ) : (
                          <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="steps">
                              {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                  {steps.map((step, index) => {
                                    const config = stepTypeConfig[step.type];
                                    return (
                                      <Draggable key={step.id} draggableId={step.id} index={index}>
                                        {(provided) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className="flex items-start gap-3 p-3 border rounded-lg bg-background"
                                          >
                                            <div {...provided.dragHandleProps} className="mt-1 cursor-grab">
                                              <GripVertical className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                                              {step.step_number}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2 mb-1">
                                                <Badge className={config.color}>
                                                  <config.icon className="h-3 w-3 mr-1" />
                                                  {config.label}
                                                </Badge>
                                                {step.delay_days > 0 && (
                                                  <span className="text-xs text-muted-foreground flex items-center">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    {step.delay_days} day{step.delay_days > 1 ? 's' : ''} delay
                                                  </span>
                                                )}
                                              </div>
                                              {step.subject && (
                                                <p className="font-medium text-sm">{step.subject}</p>
                                              )}
                                              {step.body && (
                                                <p className="text-sm text-muted-foreground line-clamp-2">{step.body}</p>
                                              )}
                                            </div>
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                  <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openEditStep(step)}>
                                                  <Edit className="h-4 w-4 mr-2" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                  onClick={() => deleteStepMutation.mutate(step)}
                                                  className="text-destructive"
                                                >
                                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                </DropdownMenuItem>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          </div>
                                        )}
                                      </Draggable>
                                    );
                                  })}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </DragDropContext>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="enrollments">
                      {enrollments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="h-8 w-8 mx-auto mb-2" />
                          <p>No enrollments yet</p>
                          <p className="text-sm">Enroll leads or contacts from their detail pages</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {enrollments.map(enrollment => {
                            const person = enrollment.lead || enrollment.contact;
                            return (
                              <div key={enrollment.id} className="flex items-center gap-3 p-3 border rounded-lg">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium">
                                    {person?.first_name} {person?.last_name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">{person?.email}</p>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Step {enrollment.current_step} of {selectedCadence.total_steps || steps.length}
                                </div>
                                <Badge variant={
                                  enrollment.status === 'active' ? 'default' :
                                  enrollment.status === 'completed' ? 'secondary' :
                                  'outline'
                                }>
                                  {enrollment.status}
                                </Badge>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {enrollment.status === 'active' && (
                                      <DropdownMenuItem onClick={() => updateEnrollmentMutation.mutate({ id: enrollment.id, status: 'paused' })}>
                                        <Pause className="h-4 w-4 mr-2" /> Pause
                                      </DropdownMenuItem>
                                    )}
                                    {enrollment.status === 'paused' && (
                                      <DropdownMenuItem onClick={() => updateEnrollmentMutation.mutate({ id: enrollment.id, status: 'active' })}>
                                        <Play className="h-4 w-4 mr-2" /> Resume
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => updateEnrollmentMutation.mutate({ id: enrollment.id, status: 'completed' })}>
                                      <CheckSquare className="h-4 w-4 mr-2" /> Complete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                <Zap className="h-12 w-12 mb-4" />
                <p>Select a cadence to view details</p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
