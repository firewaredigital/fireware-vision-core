import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft, 
  Edit, 
  Clock, 
  User, 
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Send,
  Loader2,
  Calendar,
  Building
} from '@/components/icons';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ITIncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'work_note' | 'customer_note'>('work_note');

  // Fetch incident details
  const { data: incident, isLoading } = useQuery({
    queryKey: ['it-incident', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('it_incidents')
        .select(`
          *,
          assigned_to_profile:profiles!it_incidents_assigned_to_fkey(id, first_name, last_name, email),
          reported_by_profile:profiles!it_incidents_reported_by_fkey(id, first_name, last_name, email),
          resolved_by_profile:profiles!it_incidents_resolved_by_fkey(id, first_name, last_name),
          assignment_group:teams!it_incidents_assignment_group_id_fkey(id, name)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id)
  });

  // Fetch work notes
  const { data: workNotes } = useQuery({
    queryKey: ['it-work-notes', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('it_work_notes')
        .select(`
          *,
          created_by_profile:profiles!it_work_notes_created_by_fkey(first_name, last_name)
        `)
        .eq('entity_type', 'incident')
        .eq('entity_id', id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id)
  });

  // Add work note mutation
  const addNoteMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.organization_id || !id) throw new Error('Missing data');

      const { error } = await supabase
        .from('it_work_notes')
        .insert({
          organization_id: profile.organization_id,
          entity_type: 'incident',
          entity_id: id,
          content: newNote,
          note_type: noteType,
          is_internal: noteType === 'work_note',
          created_by: profile.id
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Nota adicionada!');
      setNewNote('');
      queryClient.invalidateQueries({ queryKey: ['it-work-notes', id] });
    },
    onError: () => {
      toast.error('Erro ao adicionar nota');
    }
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase
        .from('it_incidents')
        .update({ status: newStatus as unknown })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Status atualizado!');
      queryClient.invalidateQueries({ queryKey: ['it-incident', id] });
    },
    onError: () => {
      toast.error('Erro ao atualizar status');
    }
  });

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { variant: 'destructive' | 'default' | 'secondary', label: string, className?: string }> = {
      critical: { variant: 'destructive', label: 'Crítica', className: 'animate-pulse' },
      high: { variant: 'destructive', label: 'Alta' },
      medium: { variant: 'default', label: 'Média' },
      low: { variant: 'secondary', label: 'Baixa' }
    };
    const c = config[priority] || config.medium;
    return <Badge variant={c.variant} className={c.className}>{c.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const labels: Record<string, { label: string, className: string }> = {
      new: { label: 'Novo', className: 'bg-blue-100 text-blue-700' },
      acknowledged: { label: 'Reconhecido', className: 'bg-purple-100 text-purple-700' },
      in_progress: { label: 'Em Andamento', className: 'bg-yellow-100 text-yellow-700' },
      pending_info: { label: 'Aguardando Info', className: 'bg-orange-100 text-orange-700' },
      pending_vendor: { label: 'Aguardando Vendor', className: 'bg-orange-100 text-orange-700' },
      on_hold: { label: 'Em Espera', className: 'bg-gray-100 text-gray-700' },
      resolved: { label: 'Resolvido', className: 'bg-green-100 text-green-700' },
      closed: { label: 'Fechado', className: 'bg-slate-100 text-slate-700' },
      cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-700' }
    };
    const config = labels[status] || { label: status, className: '' };
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-semibold">Incidente não encontrado</h2>
        <Button asChild className="mt-4">
          <Link to="/it/incidents">Voltar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/it/incidents')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{incident.incident_number}</h1>
              {getStatusBadge(incident.status)}
              {getPriorityBadge(incident.priority)}
            </div>
            <p className="text-lg mt-1">{incident.title}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(incident.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
              {incident.category && (
                <span className="flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  {incident.category}
                </span>
              )}
            </div>
          </div>
        </div>
        <Button asChild>
          <Link to={`/it/incidents/${id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Descrição</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{incident.description || 'Sem descrição'}</p>
            </CardContent>
          </Card>

          {incident.workaround_available && incident.workaround && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-800">Workaround Disponível</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-yellow-900">{incident.workaround}</p>
              </CardContent>
            </Card>
          )}

          {incident.resolution && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800">Resolução</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-green-900">{incident.resolution}</p>
                {incident.resolved_at && (
                  <p className="mt-2 text-sm text-green-700">
                    Resolvido em {format(new Date(incident.resolved_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    {incident.resolved_by_profile && ` por ${incident.resolved_by_profile.first_name} ${incident.resolved_by_profile.last_name}`}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Work Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Notas de Trabalho
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Note Form */}
              <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                <div className="flex gap-2">
                  <Select value={noteType} onValueChange={(v: 'work_note' | 'customer_note') => setNoteType(v)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="work_note">Nota Interna</SelectItem>
                      <SelectItem value="customer_note">Nota para Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Adicionar nota..."
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button 
                    onClick={() => addNoteMutation.mutate()}
                    disabled={!newNote.trim() || addNoteMutation.isPending}
                  >
                    {addNoteMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Adicionar
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Notes List */}
              {workNotes && workNotes.length > 0 ? (
                <div className="space-y-4">
                  {workNotes.map((note) => (
                    <div key={note.id} className={`p-4 rounded-lg border ${note.is_internal ? 'bg-muted/30' : 'bg-blue-50 border-blue-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">
                            {note.created_by_profile?.first_name} {note.created_by_profile?.last_name}
                          </span>
                          {note.is_internal ? (
                            <Badge variant="secondary" className="text-xs">Interna</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs bg-blue-100">Cliente</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(note.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{note.content}</p>
                      {note.time_spent_minutes > 0 && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          <Clock className="inline h-3 w-3 mr-1" />
                          {note.time_spent_minutes} min
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">Nenhuma nota registrada</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select 
                value={incident.status} 
                onValueChange={(v) => updateStatusMutation.mutate(v)}
                disabled={updateStatusMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Novo</SelectItem>
                  <SelectItem value="acknowledged">Reconhecido</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="pending_info">Aguardando Info</SelectItem>
                  <SelectItem value="pending_vendor">Aguardando Vendor</SelectItem>
                  <SelectItem value="on_hold">Em Espera</SelectItem>
                  <SelectItem value="resolved">Resolvido</SelectItem>
                  <SelectItem value="closed">Fechado</SelectItem>
                </SelectContent>
              </Select>

              {incident.sla_breached && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-700 font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    SLA Violado
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Priorização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Prioridade</span>
                {getPriorityBadge(incident.priority)}
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Impacto</span>
                <Badge variant="outline">{incident.impact?.toUpperCase()}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Urgência</span>
                <Badge variant="outline">{incident.urgency?.toUpperCase()}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Atribuição</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">Grupo</span>
                <p className="font-medium">
                  {incident.assignment_group?.name || 'Não atribuído'}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Atribuído a</span>
                <p className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {incident.assigned_to_profile 
                    ? `${incident.assigned_to_profile.first_name} ${incident.assigned_to_profile.last_name}`
                    : 'Não atribuído'
                  }
                </p>
              </div>
              <Separator />
              <div>
                <span className="text-sm text-muted-foreground">Reportado por</span>
                <p className="font-medium">
                  {incident.reported_by_profile 
                    ? `${incident.reported_by_profile.first_name} ${incident.reported_by_profile.last_name}`
                    : 'Desconhecido'
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Datas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado</span>
                <span>{format(new Date(incident.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
              </div>
              {incident.acknowledged_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reconhecido</span>
                  <span>{format(new Date(incident.acknowledged_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                </div>
              )}
              {incident.first_response_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Primeira Resposta</span>
                  <span>{format(new Date(incident.first_response_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                </div>
              )}
              {incident.resolved_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resolvido</span>
                  <span>{format(new Date(incident.resolved_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
