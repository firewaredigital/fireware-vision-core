import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, GripVertical, Plus, Edit, Trash2, Check, X, Users, Tag, Target, Award, ChevronDown, ChevronUp, Save, UserPlus } from '@/components/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface OpportunityStage {
  id: string;
  name: string;
  probability: number;
  display_order: number;
  is_closed: boolean;
  is_won: boolean;
  organization_id: string;
}

interface WinLossReason {
  id: string;
  name: string;
  type: 'win' | 'loss';
  is_active: boolean;
  organization_id: string;
}

interface LeadSource {
  id: string;
  name: string;
  is_active: boolean;
  organization_id: string;
}

interface TeamMember {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'user' | 'manager' | 'admin';
  is_active: boolean;
  team_id: string | null;
  job_title: string | null;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  organization_id: string;
}

export default function Settings() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('pipeline');
  
  // Stage form
  const [stageFormOpen, setStageFormOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<OpportunityStage | null>(null);
  const [stageForm, setStageForm] = useState({ name: '', probability: 0, is_closed: false, is_won: false });
  
  // Reason form
  const [reasonFormOpen, setReasonFormOpen] = useState(false);
  const [editingReason, setEditingReason] = useState<WinLossReason | null>(null);
  const [reasonForm, setReasonForm] = useState({ name: '', type: 'win' as 'win' | 'loss' });
  
  // Source form
  const [sourceFormOpen, setSourceFormOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<LeadSource | null>(null);
  const [sourceForm, setSourceForm] = useState({ name: '' });
  
  // Team member form
  const [memberFormOpen, setMemberFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [memberForm, setMemberForm] = useState({ email: '', first_name: '', last_name: '', role: 'user' as 'user' | 'manager' | 'admin', job_title: '', team_id: '' });
  
  // Team form
  const [teamFormOpen, setTeamFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamForm, setTeamForm] = useState({ name: '', description: '' });

  // Fetch organization ID
  const { data: profile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Fetch stages
  const { data: stages = [], isLoading: stagesLoading } = useQuery({
    queryKey: ['opportunity-stages'],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data, error } = await supabase
        .from('opportunity_stages')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('display_order');
      if (error) throw error;
      return data as OpportunityStage[];
    },
    enabled: !!profile?.organization_id
  });

  // Fetch win/loss reasons
  const { data: reasons = [] } = useQuery({
    queryKey: ['win-loss-reasons'],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data, error } = await supabase
        .from('win_loss_reasons')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('name');
      if (error) throw error;
      return data as WinLossReason[];
    },
    enabled: !!profile?.organization_id
  });

  // Fetch lead sources
  const { data: sources = [] } = useQuery({
    queryKey: ['lead-sources'],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data, error } = await supabase
        .from('lead_sources')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('name');
      if (error) throw error;
      return data as LeadSource[];
    },
    enabled: !!profile?.organization_id
  });

  // Fetch team members
  const { data: members = [] } = useQuery({
    queryKey: ['team-members-settings'],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('first_name');
      if (error) throw error;
      return data as TeamMember[];
    },
    enabled: !!profile?.organization_id
  });

  // Fetch teams
  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('name');
      if (error) throw error;
      return data as Team[];
    },
    enabled: !!profile?.organization_id
  });

  // Stage mutations
  const saveStage = useMutation({
    mutationFn: async (data: typeof stageForm & { id?: string; display_order: number }) => {
      const payload = {
        name: data.name,
        probability: data.probability,
        is_closed: data.is_closed,
        is_won: data.is_won,
        display_order: data.display_order,
        organization_id: profile!.organization_id
      };
      
      if (data.id) {
        const { error } = await supabase.from('opportunity_stages').update(payload).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('opportunity_stages').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-stages'] });
      setStageFormOpen(false);
      setEditingStage(null);
      setStageForm({ name: '', probability: 0, is_closed: false, is_won: false });
      toast({ title: 'Estágio salvo' });
    },
    onError: (error: any) => toast({ title: 'Erro', description: error.message, variant: 'destructive' })
  });

  const deleteStage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('opportunity_stages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-stages'] });
      toast({ title: 'Estágio excluído' });
    }
  });

  const reorderStages = useMutation({
    mutationFn: async (reordered: OpportunityStage[]) => {
      for (let i = 0; i < reordered.length; i++) {
        await supabase.from('opportunity_stages').update({ display_order: i }).eq('id', reordered[i].id);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['opportunity-stages'] })
  });

  // Reason mutations
  const saveReason = useMutation({
    mutationFn: async (data: typeof reasonForm & { id?: string }) => {
      const payload = { name: data.name, type: data.type, organization_id: profile!.organization_id, is_active: true };
      
      if (data.id) {
        const { error } = await supabase.from('win_loss_reasons').update(payload).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('win_loss_reasons').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['win-loss-reasons'] });
      setReasonFormOpen(false);
      setEditingReason(null);
      setReasonForm({ name: '', type: 'win' });
      toast({ title: 'Motivo salvo' });
    },
    onError: (error: any) => toast({ title: 'Erro', description: error.message, variant: 'destructive' })
  });

  const toggleReason = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('win_loss_reasons').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['win-loss-reasons'] })
  });

  // Source mutations
  const saveSource = useMutation({
    mutationFn: async (data: typeof sourceForm & { id?: string }) => {
      const payload = { name: data.name, organization_id: profile!.organization_id, is_active: true };
      
      if (data.id) {
        const { error } = await supabase.from('lead_sources').update(payload).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('lead_sources').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-sources'] });
      setSourceFormOpen(false);
      setEditingSource(null);
      setSourceForm({ name: '' });
      toast({ title: 'Fonte salva' });
    },
    onError: (error: any) => toast({ title: 'Erro', description: error.message, variant: 'destructive' })
  });

  const toggleSource = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('lead_sources').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lead-sources'] })
  });

  // Team mutations
  const saveTeam = useMutation({
    mutationFn: async (data: typeof teamForm & { id?: string }) => {
      const payload = { name: data.name, description: data.description || null, organization_id: profile!.organization_id };
      
      if (data.id) {
        const { error } = await supabase.from('teams').update(payload).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('teams').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setTeamFormOpen(false);
      setEditingTeam(null);
      setTeamForm({ name: '', description: '' });
      toast({ title: 'Equipe salva' });
    },
    onError: (error: any) => toast({ title: 'Erro', description: error.message, variant: 'destructive' })
  });

  // Member mutations
  const updateMember = useMutation({
    mutationFn: async (data: { id: string; role?: 'user' | 'manager' | 'admin'; team_id?: string | null; is_active?: boolean }) => {
      const { error } = await supabase.from('profiles').update(data).eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members-settings'] });
      toast({ title: 'Membro atualizado' });
    },
    onError: (error: any) => toast({ title: 'Erro', description: error.message, variant: 'destructive' })
  });

  const handleDragEndStages = (result: any) => {
    if (!result.destination) return;
    const items = Array.from(stages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    reorderStages.mutate(items);
  };

  const openEditStage = (stage: OpportunityStage) => {
    setEditingStage(stage);
    setStageForm({ name: stage.name, probability: stage.probability, is_closed: stage.is_closed, is_won: stage.is_won });
    setStageFormOpen(true);
  };

  const openEditReason = (reason: WinLossReason) => {
    setEditingReason(reason);
    setReasonForm({ name: reason.name, type: reason.type });
    setReasonFormOpen(true);
  };

  const openEditSource = (source: LeadSource) => {
    setEditingSource(source);
    setSourceForm({ name: source.name });
    setSourceFormOpen(true);
  };

  const openEditTeam = (team: Team) => {
    setEditingTeam(team);
    setTeamForm({ name: team.name, description: team.description || '' });
    setTeamFormOpen(true);
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">Configure seu CRM</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pipeline">Estágios do Pipeline</TabsTrigger>
            <TabsTrigger value="reasons">Motivos de Ganho/Perda</TabsTrigger>
            <TabsTrigger value="sources">Fontes de Lead</TabsTrigger>
            <TabsTrigger value="team">Gestão de Equipe</TabsTrigger>
          </TabsList>

          {/* Pipeline Stages */}
          <TabsContent value="pipeline">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Estágios do Pipeline de Oportunidades</CardTitle>
                  <CardDescription>Arraste para reordenar. Defina a probabilidade para cada estágio.</CardDescription>
                </div>
                <Dialog open={stageFormOpen} onOpenChange={(open) => {
                  setStageFormOpen(open);
                  if (!open) { setEditingStage(null); setStageForm({ name: '', probability: 0, is_closed: false, is_won: false }); }
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm" disabled={!isAdmin}>
                      <Plus className="h-4 w-4 mr-1" /> Adicionar Estágio
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingStage ? 'Editar Estágio' : 'Adicionar Estágio'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Nome do Estágio *</Label>
                        <Input value={stageForm.name} onChange={(e) => setStageForm({ ...stageForm, name: e.target.value })} placeholder="ex: Descoberta" />
                      </div>
                      <div className="space-y-2">
                        <Label>Probabilidade de Ganho (%)</Label>
                        <Input type="number" min="0" max="100" value={stageForm.probability} onChange={(e) => setStageForm({ ...stageForm, probability: parseInt(e.target.value) || 0 })} />
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Switch checked={stageForm.is_closed} onCheckedChange={(checked) => setStageForm({ ...stageForm, is_closed: checked })} />
                          <Label>Estágio Fechado</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={stageForm.is_won} onCheckedChange={(checked) => setStageForm({ ...stageForm, is_won: checked, is_closed: checked ? true : stageForm.is_closed })} />
                          <Label>Estágio Ganho</Label>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setStageFormOpen(false)}>Cancelar</Button>
                      <Button onClick={() => saveStage.mutate({ ...stageForm, id: editingStage?.id, display_order: editingStage?.display_order ?? stages.length })} disabled={!stageForm.name}>
                        {editingStage ? 'Atualizar' : 'Criar'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {stagesLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                ) : stages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-8 w-8 mx-auto mb-2" />
                    <p>Nenhum estágio definido</p>
                  </div>
                ) : (
                  <DragDropContext onDragEnd={handleDragEndStages}>
                    <Droppable droppableId="stages">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                          {stages.map((stage, index) => (
                            <Draggable key={stage.id} draggableId={stage.id} index={index} isDragDisabled={!isAdmin}>
                              {(provided) => (
                                <div ref={provided.innerRef} {...provided.draggableProps} className="flex items-center gap-3 p-3 border rounded-lg bg-background">
                                  <div {...provided.dragHandleProps} className="cursor-grab">
                                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{stage.name}</span>
                                      {stage.is_won && <Badge variant="default">Won</Badge>}
                                      {stage.is_closed && !stage.is_won && <Badge variant="secondary">Closed</Badge>}
                                    </div>
                                    <span className="text-sm text-muted-foreground">{stage.probability}% probability</span>
                                  </div>
                                  {isAdmin && (
                                    <div className="flex gap-1">
                                      <Button variant="ghost" size="sm" onClick={() => openEditStage(stage)}>
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="sm" onClick={() => deleteStage.mutate(stage.id)}>
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Win/Loss Reasons */}
          <TabsContent value="reasons">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Win Reasons */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-green-600">Win Reasons</CardTitle>
                    <CardDescription>Why deals are won</CardDescription>
                  </div>
                  <Dialog open={reasonFormOpen && reasonForm.type === 'win'} onOpenChange={(open) => {
                    if (!open) { setReasonFormOpen(false); setEditingReason(null); setReasonForm({ name: '', type: 'win' }); }
                  }}>
                    <DialogTrigger asChild>
                      <Button size="sm" disabled={!isAdmin} onClick={() => setReasonForm({ name: '', type: 'win' })}>
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingReason ? 'Edit' : 'Add'} Win Reason</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Reason Name *</Label>
                          <Input value={reasonForm.name} onChange={(e) => setReasonForm({ ...reasonForm, name: e.target.value })} placeholder="e.g., Best price" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setReasonFormOpen(false)}>Cancel</Button>
                        <Button onClick={() => saveReason.mutate({ ...reasonForm, id: editingReason?.id })} disabled={!reasonForm.name}>Save</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {reasons.filter(r => r.type === 'win').map(reason => (
                      <div key={reason.id} className="flex items-center gap-3 p-2 border rounded">
                        <Award className="h-4 w-4 text-green-600" />
                        <span className={`flex-1 ${!reason.is_active ? 'text-muted-foreground line-through' : ''}`}>{reason.name}</span>
                        {isAdmin && (
                          <>
                            <Switch checked={reason.is_active} onCheckedChange={(checked) => toggleReason.mutate({ id: reason.id, is_active: checked })} />
                            <Button variant="ghost" size="sm" onClick={() => { openEditReason(reason); setReasonFormOpen(true); }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    ))}
                    {reasons.filter(r => r.type === 'win').length === 0 && (
                      <p className="text-center text-muted-foreground py-4">No win reasons defined</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Loss Reasons */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-red-600">Loss Reasons</CardTitle>
                    <CardDescription>Why deals are lost</CardDescription>
                  </div>
                  <Dialog open={reasonFormOpen && reasonForm.type === 'loss'} onOpenChange={(open) => {
                    if (!open) { setReasonFormOpen(false); setEditingReason(null); setReasonForm({ name: '', type: 'loss' }); }
                  }}>
                    <DialogTrigger asChild>
                      <Button size="sm" disabled={!isAdmin} onClick={() => { setReasonForm({ name: '', type: 'loss' }); setReasonFormOpen(true); }}>
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingReason ? 'Edit' : 'Add'} Loss Reason</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Reason Name *</Label>
                          <Input value={reasonForm.name} onChange={(e) => setReasonForm({ ...reasonForm, name: e.target.value })} placeholder="e.g., Lost to competitor" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setReasonFormOpen(false)}>Cancel</Button>
                        <Button onClick={() => saveReason.mutate({ ...reasonForm, id: editingReason?.id })} disabled={!reasonForm.name}>Save</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {reasons.filter(r => r.type === 'loss').map(reason => (
                      <div key={reason.id} className="flex items-center gap-3 p-2 border rounded">
                        <X className="h-4 w-4 text-red-600" />
                        <span className={`flex-1 ${!reason.is_active ? 'text-muted-foreground line-through' : ''}`}>{reason.name}</span>
                        {isAdmin && (
                          <>
                            <Switch checked={reason.is_active} onCheckedChange={(checked) => toggleReason.mutate({ id: reason.id, is_active: checked })} />
                            <Button variant="ghost" size="sm" onClick={() => { openEditReason(reason); setReasonFormOpen(true); }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    ))}
                    {reasons.filter(r => r.type === 'loss').length === 0 && (
                      <p className="text-center text-muted-foreground py-4">No loss reasons defined</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Lead Sources */}
          <TabsContent value="sources">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Lead Sources</CardTitle>
                  <CardDescription>Track where your leads come from</CardDescription>
                </div>
                <Dialog open={sourceFormOpen} onOpenChange={(open) => {
                  setSourceFormOpen(open);
                  if (!open) { setEditingSource(null); setSourceForm({ name: '' }); }
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm" disabled={!isAdmin}>
                      <Plus className="h-4 w-4 mr-1" /> Add Source
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingSource ? 'Edit' : 'Add'} Lead Source</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Source Name *</Label>
                        <Input value={sourceForm.name} onChange={(e) => setSourceForm({ ...sourceForm, name: e.target.value })} placeholder="e.g., Website, Referral, Event" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setSourceFormOpen(false)}>Cancel</Button>
                      <Button onClick={() => saveSource.mutate({ ...sourceForm, id: editingSource?.id })} disabled={!sourceForm.name}>Save</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {sources.map(source => (
                    <div key={source.id} className="flex items-center gap-3 p-3 border rounded">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className={`flex-1 ${!source.is_active ? 'text-muted-foreground line-through' : ''}`}>{source.name}</span>
                      {isAdmin && (
                        <>
                          <Switch checked={source.is_active} onCheckedChange={(checked) => toggleSource.mutate({ id: source.id, is_active: checked })} />
                          <Button variant="ghost" size="sm" onClick={() => openEditSource(source)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                  {sources.length === 0 && (
                    <p className="col-span-full text-center text-muted-foreground py-8">No lead sources defined</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Management */}
          <TabsContent value="team">
            <div className="space-y-6">
              {/* Teams */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Teams</CardTitle>
                    <CardDescription>Organize users into teams</CardDescription>
                  </div>
                  <Dialog open={teamFormOpen} onOpenChange={(open) => {
                    setTeamFormOpen(open);
                    if (!open) { setEditingTeam(null); setTeamForm({ name: '', description: '' }); }
                  }}>
                    <DialogTrigger asChild>
                      <Button size="sm" disabled={!isAdmin}>
                        <Plus className="h-4 w-4 mr-1" /> Add Team
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingTeam ? 'Edit' : 'Create'} Team</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Team Name *</Label>
                          <Input value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} placeholder="e.g., Enterprise Sales" />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Input value={teamForm.description} onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })} placeholder="Team description..." />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setTeamFormOpen(false)}>Cancel</Button>
                        <Button onClick={() => saveTeam.mutate({ ...teamForm, id: editingTeam?.id })} disabled={!teamForm.name}>Save</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {teams.map(team => {
                      const teamMembers = members.filter(m => m.team_id === team.id);
                      return (
                        <Card key={team.id} className="bg-muted/30">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{team.name}</h4>
                              {isAdmin && (
                                <Button variant="ghost" size="sm" onClick={() => openEditTeam(team)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            {team.description && <p className="text-sm text-muted-foreground mb-2">{team.description}</p>}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>{teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}</span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                    {teams.length === 0 && (
                      <p className="col-span-full text-center text-muted-foreground py-4">No teams created</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Members */}
              <Card>
                <CardHeader>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>Manage users and their roles</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map(member => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">
                            {member.first_name || '-'} {member.last_name || ''}
                            {member.job_title && <div className="text-xs text-muted-foreground">{member.job_title}</div>}
                          </TableCell>
                          <TableCell>{member.email}</TableCell>
                          <TableCell>
                            {isAdmin ? (
                              <Select
                                value={member.role}
                                onValueChange={(value: 'user' | 'manager' | 'admin') => updateMember.mutate({ id: member.id, role: value })}
                              >
                                <SelectTrigger className="w-28 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="manager">Manager</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge variant="outline">{member.role}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {isAdmin ? (
                              <Select
                                value={member.team_id || ''}
                                onValueChange={(value) => updateMember.mutate({ id: member.id, team_id: value || null })}
                              >
                                <SelectTrigger className="w-32 h-8">
                                  <SelectValue placeholder="No team" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">No team</SelectItem>
                                  {teams.map(team => (
                                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span>{teams.find(t => t.id === member.team_id)?.name || '-'}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={member.is_active ? 'default' : 'secondary'}>
                              {member.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {isAdmin && member.id !== user?.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateMember.mutate({ id: member.id, is_active: !member.is_active })}
                              >
                                {member.is_active ? 'Deactivate' : 'Activate'}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
