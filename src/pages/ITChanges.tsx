import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus, Search, GitBranch, User, Calendar } from '@/components/icons';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ITChanges() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const { data: changes, isLoading } = useQuery({
    queryKey: ['it-changes', statusFilter, typeFilter],
    queryFn: async () => {
      let query = supabase
        .from('it_changes')
        .select(`
          *,
          assigned_to_profile:profiles!it_changes_assigned_to_fkey(first_name, last_name),
          requested_by_profile:profiles!it_changes_requested_by_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }
      if (typeFilter !== 'all') {
        query = query.eq('change_type', typeFilter as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const filteredChanges = changes?.filter(change => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      change.change_number?.toLowerCase().includes(search) ||
      change.title?.toLowerCase().includes(search)
    );
  });

  const getTypeBadge = (type: string) => {
    const config: Record<string, { variant: 'destructive' | 'default' | 'secondary', label: string }> = {
      emergency: { variant: 'destructive', label: 'Emergência' },
      normal: { variant: 'default', label: 'Normal' },
      standard: { variant: 'secondary', label: 'Padrão' }
    };
    const c = config[type] || config.normal;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const getRiskBadge = (risk: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-green-100 text-green-700'
    };
    return <Badge variant="outline" className={colors[risk]}>{risk?.toUpperCase()}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const labels: Record<string, { label: string, className: string }> = {
      draft: { label: 'Rascunho', className: 'bg-gray-100 text-gray-700' },
      submitted: { label: 'Submetida', className: 'bg-blue-100 text-blue-700' },
      under_assessment: { label: 'Em Avaliação', className: 'bg-purple-100 text-purple-700' },
      pending_approval: { label: 'Aguardando Aprovação', className: 'bg-yellow-100 text-yellow-700' },
      approved: { label: 'Aprovada', className: 'bg-green-100 text-green-700' },
      rejected: { label: 'Rejeitada', className: 'bg-red-100 text-red-700' },
      scheduled: { label: 'Agendada', className: 'bg-indigo-100 text-indigo-700' },
      implementing: { label: 'Implementando', className: 'bg-orange-100 text-orange-700' },
      under_review: { label: 'Em Revisão', className: 'bg-purple-100 text-purple-700' },
      completed: { label: 'Concluída', className: 'bg-green-100 text-green-700' },
      cancelled: { label: 'Cancelada', className: 'bg-gray-100 text-gray-700' },
      failed: { label: 'Falhou', className: 'bg-red-100 text-red-700' },
      rolled_back: { label: 'Revertida', className: 'bg-red-100 text-red-700' }
    };
    const config = labels[status] || { label: status, className: '' };
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  // Stats
  const pendingApproval = changes?.filter(c => c.status === 'pending_approval').length || 0;
  const scheduled = changes?.filter(c => c.status === 'scheduled').length || 0;
  const implementing = changes?.filter(c => c.status === 'implementing').length || 0;

  return (
    <div className="space-y-6">
      <ModuleHeroBanner
        module="itsm"
        title="Gestão de Mudanças"
        subtitle="Change Management - Controle de mudanças em TI"
        compact
        actions={
          <Button asChild className="gap-2 bg-white text-foreground hover:bg-white/90">
            <Link to="/it/changes/new">
              <Plus className="h-4 w-4" /> Nova Mudança
            </Link>
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{changes?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aguardando Aprovação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingApproval}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Agendadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{scheduled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Em Implementação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{implementing}</div>
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
                placeholder="Buscar por número ou título..."
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
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="submitted">Submetida</SelectItem>
                <SelectItem value="pending_approval">Aguardando Aprovação</SelectItem>
                <SelectItem value="approved">Aprovada</SelectItem>
                <SelectItem value="scheduled">Agendada</SelectItem>
                <SelectItem value="implementing">Implementando</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="standard">Padrão</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="emergency">Emergência</SelectItem>
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
                <TableHead>Tipo</TableHead>
                <TableHead>Risco</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Agendamento</TableHead>
                <TableHead>Responsável</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredChanges && filteredChanges.length > 0 ? (
                filteredChanges.map((change) => (
                  <TableRow key={change.id}>
                    <TableCell>
                      <Link 
                        to={`/it/changes/${change.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {change.change_number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">{change.title}</div>
                    </TableCell>
                    <TableCell>{getTypeBadge(change.change_type)}</TableCell>
                    <TableCell>{getRiskBadge(change.risk_level)}</TableCell>
                    <TableCell>{getStatusBadge(change.status)}</TableCell>
                    <TableCell>
                      {change.scheduled_start ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(change.scheduled_start), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Não agendada</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {change.assigned_to_profile ? (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span className="text-sm">
                            {change.assigned_to_profile.first_name} {change.assigned_to_profile.last_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Não atribuído</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <GitBranch className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <p className="mt-2 text-muted-foreground">Nenhuma mudança encontrada</p>
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
