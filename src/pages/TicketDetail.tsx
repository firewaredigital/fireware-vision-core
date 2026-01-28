import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
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
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  ArrowLeft, 
  Edit, 
  MoreHorizontal, 
  Send,
  MessageSquare,
  Clock,
  User,
  Building2,
  Mail,
  Phone,
  Globe,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Paperclip,
  RefreshCcw,
  UserPlus,
  Flag,
  Trash2
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { TicketStatusBadge } from '@/components/service/TicketStatusBadge';
import { TicketPriorityBadge } from '@/components/service/TicketPriorityBadge';
import { SLACountdown } from '@/components/service/SLACountdown';
import { TicketMessages } from '@/components/service/TicketMessages';
import { TicketTimeline } from '@/components/service/TicketTimeline';

type TicketStatus = 'new' | 'open' | 'pending' | 'on_hold' | 'resolved' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

const statusTransitions: Record<TicketStatus, TicketStatus[]> = {
  new: ['open', 'pending', 'on_hold', 'closed'],
  open: ['pending', 'on_hold', 'resolved', 'closed'],
  pending: ['open', 'on_hold', 'resolved', 'closed'],
  on_hold: ['open', 'pending', 'resolved', 'closed'],
  resolved: ['open', 'closed'],
  closed: ['open'],
};

const statusLabels: Record<TicketStatus, string> = {
  new: 'Novo',
  open: 'Aberto',
  pending: 'Pendente',
  on_hold: 'Em Espera',
  resolved: 'Resolvido',
  closed: 'Fechado',
};

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newMessage, setNewMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [activeTab, setActiveTab] = useState('conversation');

  // Fetch ticket details
  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          accounts:account_id(id, name, phone, email, website),
          contacts:contact_id(id, first_name, last_name, email, phone, job_title),
          queue:queue_id(id, name),
          category:category_id(id, name),
          sla:sla_id(id, name)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      // Fetch related profiles separately
      let assignee = null;
      let reporter = null;
      
      if (data.assigned_to) {
        const { data: assigneeData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, avatar_url')
          .eq('id', data.assigned_to)
          .single();
        assignee = assigneeData;
      }
      
      if (data.reporter_id) {
        const { data: reporterData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .eq('id', data.reporter_id)
          .single();
        reporter = reporterData;
      }
      
      return { ...data, assignee, reporter };
    },
    enabled: !!id,
  });

  // Fetch messages
  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['ticket-messages', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('ticket_messages')
        .select(`
          *,
          sender:sender_id(id, first_name, last_name, email, avatar_url)
        `)
        .eq('ticket_id', id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch status history
  const { data: statusHistory = [] } = useQuery({
    queryKey: ['ticket-status-history', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('ticket_status_history')
        .select(`
          *,
          changed_by_user:changed_by(first_name, last_name)
        `)
        .eq('ticket_id', id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch team members for assignment
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, avatar_url')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.organization_id,
  });

  // Update ticket mutation
  const updateTicketMutation = useMutation({
    mutationFn: async (updates: Partial<typeof ticket>) => {
      const { error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['ticket-status-history', id] });
      toast({
        title: 'Ticket atualizado',
        description: 'As alterações foram salvas com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, isInternal }: { content: string; isInternal: boolean }) => {
      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: id,
          sender_type: 'agent',
          sender_id: profile?.id,
          sender_name: `${profile?.first_name} ${profile?.last_name}`,
          sender_email: profile?.email,
          content,
          is_internal: isInternal,
        });
      
      if (error) throw error;

      // Update ticket status to open if it's new and this is an agent response
      if (ticket?.status === 'new' && !isInternal) {
        await supabase
          .from('tickets')
          .update({ status: 'open' })
          .eq('id', id);
      }
    },
    onSuccess: () => {
      setNewMessage('');
      setIsInternalNote(false);
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      toast({
        title: isInternalNote ? 'Nota interna adicionada' : 'Mensagem enviada',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao enviar mensagem',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleStatusChange = (newStatus: TicketStatus) => {
    updateTicketMutation.mutate({ status: newStatus });
  };

  const handlePriorityChange = (newPriority: TicketPriority) => {
    updateTicketMutation.mutate({ priority: newPriority });
  };

  const handleAssigneeChange = (newAssignee: string) => {
    updateTicketMutation.mutate({ 
      assigned_to: newAssignee === 'unassigned' ? null : newAssignee,
      assigned_at: newAssignee === 'unassigned' ? null : new Date().toISOString(),
    });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate({ content: newMessage, isInternal: isInternalNote });
  };

  const handleAssignToMe = () => {
    if (profile?.id) {
      handleAssigneeChange(profile.id);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <RefreshCcw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!ticket) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold">Ticket não encontrado</h2>
          <Button className="mt-4" onClick={() => navigate('/tickets')}>
            Voltar para Tickets
          </Button>
        </div>
      </AppLayout>
    );
  }

  const allowedTransitions = statusTransitions[ticket.status as TicketStatus] || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/tickets')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight font-mono">
                  {ticket.ticket_number}
                </h1>
                <TicketStatusBadge status={ticket.status as TicketStatus} size="md" />
                <TicketPriorityBadge priority={ticket.priority as TicketPriority} size="md" />
              </div>
              <h2 className="text-xl text-muted-foreground mt-1">
                {ticket.subject}
              </h2>
            </div>
          </div>
          
          <div className="flex gap-2">
            {!ticket.assigned_to && (
              <Button variant="outline" onClick={handleAssignToMe}>
                <UserPlus className="mr-2 h-4 w-4" />
                Assumir
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate(`/tickets/${id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Flag className="mr-2 h-4 w-4" />
                  Escalar
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Paperclip className="mr-2 h-4 w-4" />
                  Adicionar Anexo
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Ticket
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  {ticket.description}
                </div>
              </CardContent>
            </Card>

            {/* Conversation / Timeline Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="conversation">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Conversação ({messages.filter(m => !m.is_internal).length})
                </TabsTrigger>
                <TabsTrigger value="internal">
                  <EyeOff className="mr-2 h-4 w-4" />
                  Notas Internas ({messages.filter(m => m.is_internal).length})
                </TabsTrigger>
                <TabsTrigger value="timeline">
                  <Clock className="mr-2 h-4 w-4" />
                  Histórico
                </TabsTrigger>
              </TabsList>

              <TabsContent value="conversation" className="mt-4">
                <Card>
                  <CardContent className="p-4">
                    <TicketMessages 
                      messages={messages.filter(m => !m.is_internal)} 
                      currentUserId={profile?.id}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="internal" className="mt-4">
                <Card>
                  <CardContent className="p-4">
                    <TicketMessages 
                      messages={messages.filter(m => m.is_internal)} 
                      currentUserId={profile?.id}
                      isInternal
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timeline" className="mt-4">
                <Card>
                  <CardContent className="p-4">
                    <TicketTimeline 
                      statusHistory={statusHistory}
                      ticket={ticket}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Reply Box */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="internal"
                      checked={isInternalNote}
                      onCheckedChange={(checked) => setIsInternalNote(!!checked)}
                    />
                    <label 
                      htmlFor="internal" 
                      className="text-sm font-medium leading-none cursor-pointer flex items-center gap-1"
                    >
                      <EyeOff className="h-3.5 w-3.5" />
                      Nota interna (não visível para o cliente)
                    </label>
                  </div>
                  
                  <Textarea
                    placeholder={isInternalNote ? "Escreva uma nota interna..." : "Escreva sua resposta..."}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="min-h-[120px]"
                  />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Paperclip className="mr-2 h-4 w-4" />
                        Anexar
                      </Button>
                    </div>
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {isInternalNote ? 'Adicionar Nota' : 'Enviar Resposta'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Status do Ticket</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {allowedTransitions.map((status) => (
                    <Button
                      key={status}
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(status)}
                      disabled={updateTicketMutation.isPending}
                    >
                      {statusLabels[status]}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* SLA Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">SLA</CardTitle>
                {ticket.sla && (
                  <CardDescription>{ticket.sla.name}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Primeira Resposta</p>
                  <SLACountdown
                    dueAt={ticket.sla_first_response_due}
                    completedAt={ticket.sla_first_response_at}
                    breached={ticket.sla_first_response_breached}
                    createdAt={ticket.created_at}
                    showProgress
                    compact={false}
                  />
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Resolução</p>
                  <SLACountdown
                    dueAt={ticket.sla_resolution_due}
                    completedAt={ticket.resolved_at}
                    breached={ticket.sla_resolution_breached}
                    createdAt={ticket.created_at}
                    showProgress
                    compact={false}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Ticket Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Detalhes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Responsável</p>
                  <Select 
                    value={ticket.assigned_to || 'unassigned'} 
                    onValueChange={handleAssigneeChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {ticket.assignee ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={ticket.assignee.avatar_url || ''} />
                              <AvatarFallback className="text-[10px]">
                                {ticket.assignee.first_name?.[0]}{ticket.assignee.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span>{ticket.assignee.first_name} {ticket.assignee.last_name}</span>
                          </div>
                        ) : (
                          'Não atribuído'
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Não atribuído</SelectItem>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={member.avatar_url || ''} />
                              <AvatarFallback className="text-[10px]">
                                {member.first_name?.[0]}{member.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span>{member.first_name} {member.last_name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Prioridade</p>
                  <Select 
                    value={ticket.priority} 
                    onValueChange={(v) => handlePriorityChange(v as TicketPriority)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        <TicketPriorityBadge priority={ticket.priority as TicketPriority} />
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        <TicketPriorityBadge priority="low" />
                      </SelectItem>
                      <SelectItem value="medium">
                        <TicketPriorityBadge priority="medium" />
                      </SelectItem>
                      <SelectItem value="high">
                        <TicketPriorityBadge priority="high" />
                      </SelectItem>
                      <SelectItem value="critical">
                        <TicketPriorityBadge priority="critical" />
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Tipo</p>
                    <p className="capitalize">{ticket.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Canal</p>
                    <p className="capitalize">{ticket.channel}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Categoria</p>
                    <p>{ticket.category?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fila</p>
                    <p>{ticket.queue?.name || '-'}</p>
                  </div>
                </div>

                <Separator />

                <div className="text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Criado em {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <Clock className="h-4 w-4" />
                    Atualizado {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true, locale: ptBR })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {ticket.contacts && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {ticket.contacts.first_name?.[0]}{ticket.contacts.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Link 
                          to={`/contacts/${ticket.contacts.id}`}
                          className="font-medium hover:underline"
                        >
                          {ticket.contacts.first_name} {ticket.contacts.last_name}
                        </Link>
                        {ticket.contacts.job_title && (
                          <p className="text-xs text-muted-foreground">
                            {ticket.contacts.job_title}
                          </p>
                        )}
                      </div>
                    </div>
                    {ticket.contacts.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <a href={`mailto:${ticket.contacts.email}`} className="hover:underline">
                          {ticket.contacts.email}
                        </a>
                      </div>
                    )}
                    {ticket.contacts.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <a href={`tel:${ticket.contacts.phone}`} className="hover:underline">
                          {ticket.contacts.phone}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {ticket.accounts && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <Link 
                          to={`/accounts/${ticket.accounts.id}`}
                          className="font-medium hover:underline"
                        >
                          {ticket.accounts.name}
                        </Link>
                      </div>
                      {ticket.accounts.website && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Globe className="h-4 w-4" />
                          <a 
                            href={ticket.accounts.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {ticket.accounts.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {!ticket.contacts && !ticket.accounts && (
                  <div className="text-center text-muted-foreground py-4">
                    <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum cliente vinculado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
