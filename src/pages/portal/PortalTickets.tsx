import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Plus,
  Search,
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MessageSquare,
  ChevronRight,
  RefreshCcw,
  Filter,
  Flame,
  LogOut,
  User,
  BookOpen,
  HelpCircle,
} from '@/components/icons';
import { PortalLayout } from './PortalLayout';

type TicketStatus = 'new' | 'open' | 'pending' | 'on_hold' | 'resolved' | 'closed';

const statusConfig: Record<TicketStatus, { label: string; icon: any; color: string }> = {
  new: { label: 'Novo', icon: AlertCircle, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  open: { label: 'Em Andamento', icon: Clock, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  pending: { label: 'Aguardando', icon: Clock, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  on_hold: { label: 'Em Espera', icon: XCircle, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
  resolved: { label: 'Resolvido', icon: CheckCircle2, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  closed: { label: 'Fechado', icon: CheckCircle2, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
};

export default function PortalTickets() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('open');

  // Mock data for demo - in real implementation, fetch from portal_user session
  const mockTickets = [
    {
      id: '1',
      ticket_number: 'TK-001234',
      subject: 'Problema com login no sistema',
      status: 'open' as TicketStatus,
      priority: 'high',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      last_message: 'Nossa equipe está analisando o problema...',
      unread_count: 2,
    },
    {
      id: '2',
      ticket_number: 'TK-001235',
      subject: 'Dúvida sobre faturamento',
      status: 'pending' as TicketStatus,
      priority: 'medium',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      last_message: 'Aguardando informações adicionais...',
      unread_count: 0,
    },
    {
      id: '3',
      ticket_number: 'TK-001236',
      subject: 'Solicitação de nova funcionalidade',
      status: 'resolved' as TicketStatus,
      priority: 'low',
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      last_message: 'Funcionalidade implementada na versão 2.5',
      unread_count: 0,
    },
  ];

  const tickets = mockTickets;

  const openTickets = tickets.filter(t => !['resolved', 'closed'].includes(t.status));
  const closedTickets = tickets.filter(t => ['resolved', 'closed'].includes(t.status));

  const filteredTickets = (activeTab === 'open' ? openTickets : closedTickets).filter(ticket => {
    const matchesSearch = 
      ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Meus Tickets</h1>
            <p className="text-muted-foreground">
              Acompanhe o status das suas solicitações de suporte
            </p>
          </div>
          <Button onClick={() => navigate('/portal/tickets/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Ticket
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Aberto</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openTickets.length}</div>
              <p className="text-xs text-muted-foreground">
                tickets aguardando resolução
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolvidos</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{closedTickets.length}</div>
              <p className="text-xs text-muted-foreground">
                tickets finalizados
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Novas Mensagens</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tickets.reduce((sum, t) => sum + t.unread_count, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                respostas não lidas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por número ou assunto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="new">Novo</SelectItem>
              <SelectItem value="open">Em Andamento</SelectItem>
              <SelectItem value="pending">Aguardando</SelectItem>
              <SelectItem value="resolved">Resolvido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="open">
              Em Aberto ({openTickets.length})
            </TabsTrigger>
            <TabsTrigger value="closed">
              Finalizados ({closedTickets.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 space-y-4">
            {filteredTickets.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Ticket className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold">Nenhum ticket encontrado</h3>
                  <p className="text-muted-foreground text-center mt-1">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Tente ajustar os filtros de busca.'
                      : activeTab === 'open'
                        ? 'Você não tem tickets em aberto no momento.'
                        : 'Você ainda não tem tickets finalizados.'}
                  </p>
                  {activeTab === 'open' && !searchTerm && statusFilter === 'all' && (
                    <Button className="mt-4" onClick={() => navigate('/portal/tickets/new')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Abrir Novo Ticket
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredTickets.map((ticket) => {
                  const statusInfo = statusConfig[ticket.status];
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <Card
                      key={ticket.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/portal/tickets/${ticket.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-sm text-muted-foreground">
                                {ticket.ticket_number}
                              </span>
                              <Badge className={statusInfo.color}>
                                <StatusIcon className="mr-1 h-3 w-3" />
                                {statusInfo.label}
                              </Badge>
                              {ticket.unread_count > 0 && (
                                <Badge variant="destructive" className="rounded-full">
                                  {ticket.unread_count} nova{ticket.unread_count > 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-semibold mt-1 truncate">
                              {ticket.subject}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                              {ticket.last_message}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Criado {formatDistanceToNow(new Date(ticket.created_at), {
                                  addSuffix: true,
                                  locale: ptBR,
                                })}
                              </span>
                              <span>
                                Atualizado {formatDistanceToNow(new Date(ticket.updated_at), {
                                  addSuffix: true,
                                  locale: ptBR,
                                })}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PortalLayout>
  );
}