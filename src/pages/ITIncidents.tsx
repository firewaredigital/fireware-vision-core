import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, AlertTriangle, Clock, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ITIncidents() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const { data: incidents, isLoading } = useQuery({
    queryKey: ['it-incidents', statusFilter, priorityFilter],
    queryFn: async () => {
      let query = supabase
        .from('it_incidents')
        .select(`
          *,
          assigned_to_profile:profiles!it_incidents_assigned_to_fkey(first_name, last_name),
          reported_by_profile:profiles!it_incidents_reported_by_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }
      if (priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const filteredIncidents = incidents?.filter(incident => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      incident.incident_number?.toLowerCase().includes(search) ||
      incident.title?.toLowerCase().includes(search) ||
      incident.category?.toLowerCase().includes(search)
    );
  });

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { variant: 'destructive' | 'default' | 'secondary' | 'outline', label: string, className?: string }> = {
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

  const getImpactUrgencyBadge = (value: string) => {
    const colors: Record<string, string> = {
      critical: 'text-red-600',
      high: 'text-orange-600',
      medium: 'text-yellow-600',
      low: 'text-green-600'
    };
    return <span className={`text-xs ${colors[value] || ''}`}>{value?.toUpperCase()}</span>;
  };

  // Stats
  const openCount = incidents?.filter(i => !['resolved', 'closed', 'cancelled'].includes(i.status)).length || 0;
  const criticalCount = incidents?.filter(i => i.priority === 'critical' && !['resolved', 'closed'].includes(i.status)).length || 0;
  const breachedCount = incidents?.filter(i => i.sla_breached).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incidentes</h1>
          <p className="text-muted-foreground">
            Gerenciamento de incidentes de TI
          </p>
        </div>
        <Button asChild>
          <Link to="/it/incidents/new">
            <Plus className="mr-2 h-4 w-4" />
            Novo Incidente
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incidents?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Abertos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{openCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Críticos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">SLA Violado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{breachedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, título ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="new">Novo</SelectItem>
                <SelectItem value="acknowledged">Reconhecido</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="pending_info">Aguardando Info</SelectItem>
                <SelectItem value="resolved">Resolvido</SelectItem>
                <SelectItem value="closed">Fechado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Prioridades</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Impacto/Urgência</TableHead>
                <TableHead>Atribuído</TableHead>
                <TableHead>Criado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredIncidents && filteredIncidents.length > 0 ? (
                filteredIncidents.map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell>
                      <Link 
                        to={`/it/incidents/${incident.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {incident.incident_number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">{incident.title}</div>
                      {incident.category && (
                        <div className="text-xs text-muted-foreground">{incident.category}</div>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(incident.status)}</TableCell>
                    <TableCell>{getPriorityBadge(incident.priority)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs">I: {getImpactUrgencyBadge(incident.impact)}</span>
                        <span className="text-xs">U: {getImpactUrgencyBadge(incident.urgency)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {incident.assigned_to_profile ? (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span className="text-sm">
                            {incident.assigned_to_profile.first_name} {incident.assigned_to_profile.last_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Não atribuído</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3" />
                        {format(new Date(incident.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <p className="mt-2 text-muted-foreground">Nenhum incidente encontrado</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
