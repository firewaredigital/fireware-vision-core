import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, List, LayoutGrid, DollarSign, Calendar, Building, User } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ModuleHeroBanner } from '@/components/ModuleHeroBanner';
import { format } from 'date-fns';
import { Database } from '@/integrations/supabase/types';

type OpportunityStage = Database['public']['Enums']['opportunity_stage'];

interface Opportunity {
  id: string;
  name: string;
  amount: number | null;
  stage: OpportunityStage;
  close_date: string | null;
  probability: number | null;
  account: { id: string; name: string } | null;
  owner: { id: string; first_name: string | null; last_name: string | null } | null;
}

const STAGES: { key: OpportunityStage; label: string; color: string }[] = [
  { key: 'prospecting', label: 'Prospecção', color: 'bg-slate-500' },
  { key: 'qualification', label: 'Qualificação', color: 'bg-blue-500' },
  { key: 'proposal', label: 'Proposta', color: 'bg-purple-500' },
  { key: 'negotiation', label: 'Negociação', color: 'bg-orange-500' },
  { key: 'closed_won', label: 'Ganho', color: 'bg-green-500' },
  { key: 'closed_lost', label: 'Perdido', color: 'bg-red-500' },
];

export default function Opportunities() {
  const { user, loading: authLoading, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);


  const fetchOpportunities = useCallback(async () => {
    if (!profile?.organization_id) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('opportunities')
      .select(`
        id, name, amount, stage, close_date, probability,
        account:accounts!opportunities_account_id_fkey(id, name),
        owner:profiles!opportunities_owner_id_fkey(id, first_name, last_name)
      `)
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Erro ao carregar oportunidades', description: error.message, variant: 'destructive' });
    } else {
      setOpportunities(data as Opportunity[]);
    }
    setLoading(false);
  }, [profile?.organization_id, toast]);

  useEffect(() => {
    if (profile?.organization_id) fetchOpportunities();
  }, [profile?.organization_id, fetchOpportunities]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    
    const { draggableId, destination } = result;
    const newStage = destination.droppableId as OpportunityStage;
    
    // Optimistic update
    setOpportunities(prev => 
      prev.map(opp => opp.id === draggableId ? { ...opp, stage: newStage } : opp)
    );

    const { error } = await supabase
      .from('opportunities')
      .update({ stage: newStage })
      .eq('id', draggableId);

    if (error) {
      toast({ title: 'Erro ao atualizar estágio', description: error.message, variant: 'destructive' });
      fetchOpportunities(); // Revert on error
    } else {
      const stageLabel = STAGES.find(s => s.key === newStage)?.label || newStage;
      toast({ title: 'Estágio atualizado', description: `Oportunidade movida para ${stageLabel}` });
    }
  };

  const getOpportunitiesByStage = (stage: OpportunityStage) => 
    opportunities.filter(o => o.stage === stage);

  const getStageTotal = (stage: OpportunityStage) => 
    getOpportunitiesByStage(stage).reduce((sum, o) => sum + (o.amount || 0), 0);

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(amount);

  if (authLoading || !user) return null;

  return (
    
      <div className="space-y-6">
        <ModuleHeroBanner
          module="sales"
          title="Oportunidades"
          subtitle="Gerencie seu pipeline de vendas"
          actions={
            <div className="flex items-center gap-3">
              <Tabs value={view} onValueChange={(v) => setView(v as 'kanban' | 'list')}>
                <TabsList className="bg-white/10">
                  <TabsTrigger value="kanban" className="data-[state=active]:bg-white/20 text-white"><LayoutGrid className="h-4 w-4 mr-1" />Kanban</TabsTrigger>
                  <TabsTrigger value="list" className="data-[state=active]:bg-white/20 text-white"><List className="h-4 w-4 mr-1" />Lista</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button onClick={() => navigate('/opportunities/new')} className="bg-white text-foreground hover:bg-white/90">
                <Plus className="mr-2 h-4 w-4" />Nova Oportunidade
              </Button>
            </div>
          }
        />

        {view === 'kanban' ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {STAGES.map((stage) => (
                <div key={stage.key} className="flex-shrink-0 w-72">
                  <div className="bg-muted/50 rounded-lg">
                    <div className="p-3 border-b bg-background rounded-t-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                          <span className="font-medium text-sm">{stage.label}</span>
                          <Badge variant="secondary" className="text-xs">
                            {getOpportunitiesByStage(stage.key).length}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatCurrency(getStageTotal(stage.key))}
                      </p>
                    </div>
                    
                    <Droppable droppableId={stage.key}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`p-2 min-h-[200px] ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}`}
                        >
                          {getOpportunitiesByStage(stage.key).map((opp, index) => (
                            <Draggable key={opp.id} draggableId={opp.id} index={index}>
                              {(provided, snapshot) => (
                                <Card
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`mb-2 cursor-pointer hover:shadow-md transition-shadow ${
                                    snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                                  }`}
                                  onClick={() => navigate(`/opportunities/${opp.id}`)}
                                >
                                  <CardContent className="p-3">
                                    <h4 className="font-medium text-sm line-clamp-2">{opp.name}</h4>
                                    
                                    {opp.account && (
                                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                        <Building className="h-3 w-3" />
                                        <span className="truncate">{opp.account.name}</span>
                                      </div>
                                    )}
                                    
                                    <div className="flex items-center justify-between mt-2">
                                      {opp.amount && (
                                        <div className="flex items-center gap-1 text-xs font-medium text-primary">
                                          <DollarSign className="h-3 w-3" />
                                          {formatCurrency(opp.amount)}
                                        </div>
                                      )}
                                      {opp.close_date && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <Calendar className="h-3 w-3" />
                                          {format(new Date(opp.close_date), 'MMM d')}
                                        </div>
                                      )}
                                    </div>
                                    
                                    {opp.owner && (
                                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                        <User className="h-3 w-3" />
                                        {opp.owner.first_name} {opp.owner.last_name}
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                </div>
              ))}
            </div>
          </DragDropContext>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Todas as Oportunidades</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : opportunities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma oportunidade ainda. Crie seu primeiro negócio!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {opportunities.map((opp) => (
                    <div
                      key={opp.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigate(`/opportunities/${opp.id}`)}
                    >
                      <div>
                        <h4 className="font-medium">{opp.name}</h4>
                        <p className="text-sm text-muted-foreground">{opp.account?.name}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">{opp.stage.replace('_', ' ')}</Badge>
                        {opp.amount && (
                          <span className="font-medium">{formatCurrency(opp.amount)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    
  );
}
