import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Phone,
  Mail,
  Globe,
  Headphones,
  RefreshCcw,
  Download,
  Upload,
  Users
} from '@/components/icons';
import { formatDistanceToNow, format, differenceInMinutes, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SLACountdown } from '@/components/service/SLACountdown';
import { TicketStatusBadge } from '@/components/service/TicketStatusBadge';
import { TicketPriorityBadge } from '@/components/service/TicketPriorityBadge';
import { ModuleHeroBanner } from '@/components/ModuleHeroBanner';

type TicketStatus = 'new' | 'open' | 'pending' | 'on_hold' | 'resolved' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
type TicketChannel = 'email' | 'chat' | 'phone' | 'whatsapp' | 'portal' | 'form';

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  type: string;
  priority: TicketPriority;
  status: TicketStatus;
  channel: TicketChannel;
  created_at: string;
  updated_at: string;
  sla_first_response_due: string | null;
  sla_first_response_at: string | null;
  sla_first_response_breached: boolean;
  sla_resolution_due: string | null;
  sla_resolution_breached: boolean;
  assigned_to: string | null;
  account_id: string | null;
  contact_id: string | null;
  accounts?: { name: string } | null;
  contacts?: { first_name: string; last_name: string; email: string } | null;
  assignee?: { first_name: string; last_name: string } | null;
  queue?: { name: string } | null;
}

const channelIcons: Record<TicketChannel, React.ReactNode> = {
  email: <Mail className="h-4 w-4" />,
  chat: <MessageSquare className="h-4 w-4" />,
  phone: <Phone className="h-4 w-4" />,
  whatsapp: <MessageSquare className="h-4 w-4 text-green-500" />,
  portal: <Globe className="h-4 w-4" />,
  form: <Globe className="h-4 w-4" />,
};

const channelLabels: Record<TicketChannel, string> = {
  email: 'E-mail',
  chat: 'Chat',
  phone: 'Telefone',
  whatsapp: 'WhatsApp',
  portal: 'Portal',
  form: 'Formulário',
};

export default function Tickets() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');

  // Fetch tickets
  const { data: tickets = [], isLoading, refetch } = useQuery({
    queryKey: ['tickets', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          accounts:account_id(name),
          contacts:contact_id(first_name, last_name, email),
          queue:queue_id(name)
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch assignee info separately to avoid relationship hint issue
      const ticketsWithAssignees = await Promise.all(
        (data || []).map(async (ticket) => {
          let assignee = null;
          if (ticket.assigned_to) {
            const { data: assigneeData } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', ticket.assigned_to)
              .single();
            assignee = assigneeData;
          }
          return { ...ticket, assignee } as Ticket;
        })
      );
      
      return ticketsWithAssignees;
    },
    enabled: !!profile?.organization_id,
  });

  // Fetch metrics
  const { data: metrics } = useQuery({
    queryKey: ['ticket-metrics', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return null;
      
      const { data, error } = await supabase
        .from('tickets')
        .select('status, priority, sla_first_response_breached, sla_resolution_breached')
        .eq('organization_id', profile.organization_id);
      
      if (error) throw error;
      
      const allTickets = data || [];
      const openTickets = allTickets.filter(t => !['resolved', 'closed'].includes(t.status));
      const breachedSLA = openTickets.filter(t => t.sla_first_response_breached || t.sla_resolution_breached);
      const criticalTickets = openTickets.filter(t => t.priority === 'critical');
      const resolvedToday = allTickets.filter(t => t.status === 'resolved');
      
      return {
        total: allTickets.length,
        open: openTickets.length,
        breached: breachedSLA.length,
        critical: criticalTickets.length,
        resolvedToday: resolvedToday.length,
        byStatus: {
          new: allTickets.filter(t => t.status === 'new').length,
          open: allTickets.filter(t => t.status === 'open').length,
          pending: allTickets.filter(t => t.status === 'pending').length,
          on_hold: allTickets.filter(t => t.status === 'on_hold').length,
          resolved: allTickets.filter(t => t.status === 'resolved').length,
          closed: allTickets.filter(t => t.status === 'closed').length,
        }
      };
    },
    enabled: !!profile?.organization_id,
  });

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.contacts?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.accounts?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    const matchesChannel = channelFilter === 'all' || ticket.channel === channelFilter;
    const matchesAssignee = 
      assigneeFilter === 'all' || 
      (assigneeFilter === 'unassigned' && !ticket.assigned_to) ||
      (assigneeFilter === 'mine' && ticket.assigned_to === profile?.id) ||
      ticket.assigned_to === assigneeFilter;
    
    // Tab filters
    let matchesTab = true;
    if (activeTab === 'mine') {
      matchesTab = ticket.assigned_to === profile?.id;
    } else if (activeTab === 'unassigned') {
      matchesTab = !ticket.assigned_to;
    } else if (activeTab === 'breached') {
      matchesTab = ticket.sla_first_response_breached || ticket.sla_resolution_breached;
    } else if (activeTab === 'open') {
      matchesTab = !['resolved', 'closed'].includes(ticket.status);
    }
    
    return matchesSearch && matchesStatus && matchesPriority && matchesChannel && matchesAssignee && matchesTab;
  });

  const handleRowClick = (ticketId: string) => {
    navigate(`/tickets/${ticketId}`);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Hero Banner */}
        <ModuleHeroBanner
          module="service"
          title="Tickets de Suporte"
          subtitle="Gerencie solicitações, incidentes e atendimentos"
          actions={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Atualizar
              </Button>
              <Button onClick={() => navigate('/tickets/new')} className="bg-white text-foreground hover:bg-white/90">
                <Plus className="mr-2 h-4 w-4" />
                Novo Ticket
              </Button>
            </div>
          }
        />

        {/* Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Abertos</CardTitle>
              <Headphones className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.open || 0}</div>
              <p className="text-xs text-muted-foreground">
                de {metrics?.total || 0} tickets
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SLA Violado</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{metrics?.breached || 0}</div>
              <p className="text-xs text-muted-foreground">
                precisam de atenção urgente
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Críticos</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{metrics?.critical || 0}</div>
              <p className="text-xs text-muted-foreground">
                prioridade máxima
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Novos</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{metrics?.byStatus?.new || 0}</div>
              <p className="text-xs text-muted-foreground">
                aguardando triagem
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolvidos</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{metrics?.byStatus?.resolved || 0}</div>
              <p className="text-xs text-muted-foreground">
                aguardando fechamento
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs and Filters */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <TabsList>
              <TabsTrigger value="all">
                Todos ({tickets.length})
              </TabsTrigger>
              <TabsTrigger value="open">
                Abertos ({tickets.filter(t => !['resolved', 'closed'].includes(t.status)).length})
              </TabsTrigger>
              <TabsTrigger value="mine">
                Meus ({tickets.filter(t => t.assigned_to === profile?.id).length})
              </TabsTrigger>
              <TabsTrigger value="unassigned">
                Não Atribuídos ({tickets.filter(t => !t.assigned_to).length})
              </TabsTrigger>
              <TabsTrigger value="breached" className="text-destructive">
                SLA Violado ({tickets.filter(t => t.sla_first_response_breached || t.sla_resolution_breached).length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, assunto, cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="new">Novo</SelectItem>
                <SelectItem value="open">Aberto</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="on_hold">Em Espera</SelectItem>
                <SelectItem value="resolved">Resolvido</SelectItem>
                <SelectItem value="closed">Fechado</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Canais</SelectItem>
                <SelectItem value="email">E-mail</SelectItem>
                <SelectItem value="chat">Chat</SelectItem>
                <SelectItem value="phone">Telefone</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="portal">Portal</SelectItem>
                <SelectItem value="form">Formulário</SelectItem>
              </SelectContent>
            </Select>

            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="mine">Meus Tickets</SelectItem>
                <SelectItem value="unassigned">Não Atribuídos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TabsContent value={activeTab} className="mt-4">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCcw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredTickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Headphones className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">Nenhum ticket encontrado</h3>
                    <p className="text-muted-foreground">
                      Ajuste os filtros ou crie um novo ticket
                    </p>
                    <Button className="mt-4" onClick={() => navigate('/tickets/new')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Ticket
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Número</TableHead>
                        <TableHead>Assunto</TableHead>
                        <TableHead className="w-[120px]">Status</TableHead>
                        <TableHead className="w-[100px]">Prioridade</TableHead>
                        <TableHead className="w-[80px]">Canal</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Responsável</TableHead>
                        <TableHead className="w-[150px]">SLA Resposta</TableHead>
                        <TableHead className="w-[150px]">Criado</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTickets.map((ticket) => (
                        <TableRow
                          key={ticket.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleRowClick(ticket.id)}
                        >
                          <TableCell className="font-mono text-sm">
                            {ticket.ticket_number}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium line-clamp-1">
                                {ticket.subject}
                              </span>
                              {ticket.accounts?.name && (
                                <span className="text-xs text-muted-foreground">
                                  {ticket.accounts.name}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <TicketStatusBadge status={ticket.status} />
                          </TableCell>
                          <TableCell>
                            <TicketPriorityBadge priority={ticket.priority} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1" title={channelLabels[ticket.channel]}>
                              {channelIcons[ticket.channel]}
                            </div>
                          </TableCell>
                          <TableCell>
                            {ticket.contacts ? (
                              <div className="flex flex-col">
                                <span className="text-sm">
                                  {ticket.contacts.first_name} {ticket.contacts.last_name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {ticket.contacts.email}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {ticket.assignee ? (
                              <span className="text-sm">
                                {ticket.assignee.first_name} {ticket.assignee.last_name}
                              </span>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                <Users className="h-3 w-3 mr-1" />
                                Não atribuído
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <SLACountdown
                              dueAt={ticket.sla_first_response_due}
                              completedAt={ticket.sla_first_response_at}
                              breached={ticket.sla_first_response_breached}
                            />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(ticket.created_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/tickets/${ticket.id}`);
                                }}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Visualizar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/tickets/${ticket.id}/edit`);
                                }}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
