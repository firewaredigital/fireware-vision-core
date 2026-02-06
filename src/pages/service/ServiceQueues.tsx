import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Layers, Plus, Settings, Users, Activity, Inbox,
  CheckCircle, Clock, AlertTriangle, Zap, Trash2,
  UserPlus, Shield, BarChart3, Search, RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const routingMethodLabels: Record<string, string> = {
  round_robin: 'Round Robin',
  skill_based: 'Baseado em Skills',
  load_balanced: 'Balanceamento de Carga',
  manual: 'Manual',
  broadcast: 'Broadcast',
};

export default function ServiceQueues() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [newQueue, setNewQueue] = useState({
    name: '',
    description: '',
    routing_method: 'round_robin',
    priority: 50,
    max_capacity: 100,
    skills_required: '',
    auto_accept_enabled: false,
    auto_accept_delay_seconds: 30,
    wrap_up_time_seconds: 60,
    is_default: false,
  });

  // === QUERIES ===

  const { data: queues = [], isLoading } = useQuery({
    queryKey: ['routing-queues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routing_queues')
        .select('*')
        .order('priority', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: queueMembers = [] } = useQuery({
    queryKey: ['queue-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('queue_members')
        .select(`
          *,
          user:profiles!queue_members_user_id_fkey(id, first_name, last_name, email),
          queue:routing_queues!queue_members_queue_id_fkey(id, name)
        `)
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['queue-conversations-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('id, queue_id, status')
        .not('queue_id', 'is', null);
      if (error) throw error;
      return data;
    },
  });

  const { data: agentStatuses = [] } = useQuery({
    queryKey: ['agent-statuses-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_status')
        .select(`
          *,
          user:profiles!agent_status_user_id_fkey(id, first_name, last_name, email)
        `);
      if (error) throw error;
      return data;
    },
  });

  const { data: availableAgents = [] } = useQuery({
    queryKey: ['available-agents-for-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .not('organization_id', 'is', null)
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Members of selected queue
  const selectedQueueMembers = selectedQueue
    ? queueMembers.filter(m => m.queue_id === selectedQueue.id)
    : [];

  // === MUTATIONS ===

  const createQueueMutation = useMutation({
    mutationFn: async (data: typeof newQueue) => {
      const { error } = await supabase.from('routing_queues').insert({
        organization_id: profile?.organization_id,
        name: data.name,
        description: data.description || null,
        routing_method: data.routing_method as any,
        priority: data.priority,
        max_capacity: data.max_capacity,
        skills_required: data.skills_required ? data.skills_required.split(',').map(s => s.trim()) : [],
        auto_accept_enabled: data.auto_accept_enabled,
        auto_accept_delay_seconds: data.auto_accept_delay_seconds,
        wrap_up_time_seconds: data.wrap_up_time_seconds,
        is_default: data.is_default,
        created_by: profile?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routing-queues'] });
      setShowCreateDialog(false);
      toast.success('Fila criada com sucesso');
      setNewQueue({
        name: '', description: '', routing_method: 'round_robin', priority: 50,
        max_capacity: 100, skills_required: '', auto_accept_enabled: false,
        auto_accept_delay_seconds: 30, wrap_up_time_seconds: 60, is_default: false,
      });
    },
    onError: (e: any) => toast.error('Erro: ' + e.message),
  });

  const addMemberMutation = useMutation({
    mutationFn: async ({ queueId, userId }: { queueId: string; userId: string }) => {
      const { error } = await supabase.from('queue_members').insert({
        organization_id: profile?.organization_id,
        queue_id: queueId,
        user_id: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-members'] });
      toast.success('Membro adicionado');
    },
    onError: (e: any) => toast.error('Erro: ' + e.message),
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.from('queue_members')
        .update({ is_active: false, left_at: new Date().toISOString() })
        .eq('id', memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-members'] });
      toast.success('Membro removido');
    },
    onError: (e: any) => toast.error('Erro: ' + e.message),
  });

  const toggleQueueActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('routing_queues')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routing-queues'] });
      toast.success('Status da fila atualizado');
    },
    onError: (e: any) => toast.error('Erro: ' + e.message),
  });

  // === COMPUTED ===

  const getQueueStats = (queueId: string) => {
    const queueConvs = conversations.filter(c => c.queue_id === queueId);
    const open = queueConvs.filter(c => c.status === 'open' || c.status === 'waiting_agent').length;
    const total = queueConvs.length;
    const members = queueMembers.filter(m => m.queue_id === queueId).length;
    return { open, total, members };
  };

  const totalOpenConversations = conversations.filter(c =>
    c.status === 'open' || c.status === 'waiting_agent'
  ).length;

  const totalAgentsOnline = agentStatuses.filter(a => a.status === 'available').length;
  const totalQueues = queues.length;
  const activeQueues = queues.filter(q => q.is_active).length;

  const filteredQueues = queues.filter(q => {
    if (!searchQuery) return true;
    return q.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const agentsNotInQueue = selectedQueue
    ? availableAgents.filter(a => !selectedQueueMembers.some(m => m.user_id === a.id))
    : [];

  return (
    <>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Layers className="h-8 w-8 text-primary" />
              Filas de Atendimento
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie filas, membros, roteamento e capacidade dos agentes
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => queryClient.invalidateQueries()}>
              <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" /> Nova Fila
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Criar Nova Fila</DialogTitle>
                  <DialogDescription>Configure uma nova fila de roteamento para distribuição de conversas.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome da Fila</Label>
                    <Input
                      value={newQueue.name}
                      onChange={e => setNewQueue(p => ({ ...p, name: e.target.value }))}
                      placeholder="Ex: Suporte Nível 1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={newQueue.description}
                      onChange={e => setNewQueue(p => ({ ...p, description: e.target.value }))}
                      placeholder="Descrição da fila..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Método de Roteamento</Label>
                      <Select
                        value={newQueue.routing_method}
                        onValueChange={v => setNewQueue(p => ({ ...p, routing_method: v }))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="round_robin">Round Robin</SelectItem>
                          <SelectItem value="skill_based">Baseado em Skills</SelectItem>
                          <SelectItem value="load_balanced">Balanceamento de Carga</SelectItem>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="broadcast">Broadcast</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Prioridade (0-100)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={newQueue.priority}
                        onChange={e => setNewQueue(p => ({ ...p, priority: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Capacidade Máxima</Label>
                      <Input
                        type="number"
                        min={1}
                        value={newQueue.max_capacity}
                        onChange={e => setNewQueue(p => ({ ...p, max_capacity: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Skills (separadas por vírgula)</Label>
                      <Input
                        value={newQueue.skills_required}
                        onChange={e => setNewQueue(p => ({ ...p, skills_required: e.target.value }))}
                        placeholder="billing, technical"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Delay Auto-Accept (s)</Label>
                      <Input
                        type="number"
                        value={newQueue.auto_accept_delay_seconds}
                        onChange={e => setNewQueue(p => ({ ...p, auto_accept_delay_seconds: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Wrap-up Time (s)</Label>
                      <Input
                        type="number"
                        value={newQueue.wrap_up_time_seconds}
                        onChange={e => setNewQueue(p => ({ ...p, wrap_up_time_seconds: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between border rounded-lg p-3">
                    <div>
                      <Label>Auto-Accept</Label>
                      <p className="text-xs text-muted-foreground">Aceitar conversas automaticamente</p>
                    </div>
                    <Switch
                      checked={newQueue.auto_accept_enabled}
                      onCheckedChange={v => setNewQueue(p => ({ ...p, auto_accept_enabled: v }))}
                    />
                  </div>
                  <div className="flex items-center justify-between border rounded-lg p-3">
                    <div>
                      <Label>Fila Padrão</Label>
                      <p className="text-xs text-muted-foreground">Fila padrão para novas conversas</p>
                    </div>
                    <Switch
                      checked={newQueue.is_default}
                      onCheckedChange={v => setNewQueue(p => ({ ...p, is_default: v }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
                  <Button
                    onClick={() => createQueueMutation.mutate(newQueue)}
                    disabled={!newQueue.name || createQueueMutation.isPending}
                  >
                    {createQueueMutation.isPending ? 'Criando...' : 'Criar Fila'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Filas Ativas</p>
                  <p className="text-3xl font-bold">{activeQueues}/{totalQueues}</p>
                </div>
                <Layers className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversas Abertas</p>
                  <p className="text-3xl font-bold">{totalOpenConversations}</p>
                </div>
                <Inbox className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Agentes Online</p>
                  <p className="text-3xl font-bold text-green-600">{totalAgentsOnline}</p>
                </div>
                <Users className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Membros</p>
                  <p className="text-3xl font-bold">{queueMembers.length}</p>
                </div>
                <UserPlus className="h-8 w-8 text-muted-foreground opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar filas..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Queues Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fila</TableHead>
                  <TableHead>Roteamento</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Membros</TableHead>
                  <TableHead>Conversas Abertas</TableHead>
                  <TableHead>Capacidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Carregando filas...
                    </TableCell>
                  </TableRow>
                ) : filteredQueues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      Nenhuma fila encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQueues.map(queue => {
                    const stats = getQueueStats(queue.id);
                    const capacityPct = queue.max_capacity ? (stats.open / queue.max_capacity) * 100 : 0;
                    return (
                      <TableRow key={queue.id}>
                        <TableCell>
                          <div>
                            <span className="font-medium">{queue.name}</span>
                            {queue.is_default && (
                              <Badge variant="outline" className="ml-2 text-xs">Padrão</Badge>
                            )}
                            {queue.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {queue.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {routingMethodLabels[queue.routing_method] || queue.routing_method}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{queue.priority}</span>
                            <Progress value={queue.priority} className="h-2 w-16" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold">{stats.members}</span>
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            'font-bold',
                            stats.open > 20 ? 'text-red-600' : stats.open > 10 ? 'text-yellow-600' : 'text-green-600'
                          )}>
                            {stats.open}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Progress value={Math.min(capacityPct, 100)} className="h-2 w-20" />
                            <span className="text-xs text-muted-foreground">
                              {stats.open}/{queue.max_capacity}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={queue.is_active}
                            onCheckedChange={v => toggleQueueActiveMutation.mutate({ id: queue.id, is_active: v })}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedQueue(queue);
                              setShowMembersDialog(true);
                            }}
                          >
                            <Users className="h-3 w-3 mr-1" />
                            Membros
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Members Dialog */}
        <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Membros: {selectedQueue?.name}</DialogTitle>
              <DialogDescription>
                Gerencie os agentes atribuídos a esta fila.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Current members */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Membros Atuais ({selectedQueueMembers.length})</Label>
                {selectedQueueMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum membro nesta fila</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedQueueMembers.map(member => (
                      <div key={member.id} className="flex items-center justify-between border rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-xs">
                              {member.user?.first_name?.[0]}{member.user?.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {member.user?.first_name} {member.user?.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{member.user?.email}</p>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive"
                          onClick={() => removeMemberMutation.mutate(member.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add member */}
              {selectedQueue && agentsNotInQueue.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Adicionar Membro</Label>
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {agentsNotInQueue.map(agent => (
                      <div key={agent.id} className="flex items-center justify-between border rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-xs">
                              {agent.first_name?.[0]}{agent.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{agent.first_name} {agent.last_name}</p>
                            <p className="text-xs text-muted-foreground">{agent.email}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addMemberMutation.mutate({ queueId: selectedQueue.id, userId: agent.id })}
                          disabled={addMemberMutation.isPending}
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
