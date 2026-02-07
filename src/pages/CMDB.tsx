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
import { Plus, Search, Server, Cpu, Database, Network, Globe } from '@/components/icons';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CMDB() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [environmentFilter, setEnvironmentFilter] = useState<string>('all');

  const { data: items, isLoading } = useQuery({
    queryKey: ['cmdb-items', typeFilter, statusFilter, environmentFilter],
    queryFn: async () => {
      let query = supabase
        .from('cmdb_items')
        .select(`
          *,
          owner:profiles!cmdb_items_owner_id_fkey(first_name, last_name),
          support_team:teams!cmdb_items_support_team_id_fkey(name)
        `)
        .order('name');

      if (typeFilter !== 'all') {
        query = query.eq('ci_type', typeFilter as any);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }
      if (environmentFilter !== 'all') {
        query = query.eq('environment', environmentFilter as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const filteredItems = items?.filter(item => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      item.ci_number?.toLowerCase().includes(search) ||
      item.name?.toLowerCase().includes(search) ||
      item.hostname?.toLowerCase().includes(search) ||
      item.ip_address?.toLowerCase().includes(search)
    );
  });

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      server: <Server className="h-4 w-4" />,
      virtual_machine: <Cpu className="h-4 w-4" />,
      database: <Database className="h-4 w-4" />,
      network_device: <Network className="h-4 w-4" />,
      application: <Globe className="h-4 w-4" />
    };
    return icons[type] || <Server className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string, label: string }> = {
      active: { className: 'bg-green-100 text-green-700', label: 'Ativo' },
      inactive: { className: 'bg-gray-100 text-gray-700', label: 'Inativo' },
      maintenance: { className: 'bg-yellow-100 text-yellow-700', label: 'Manutenção' },
      degraded: { className: 'bg-orange-100 text-orange-700', label: 'Degradado' },
      retired: { className: 'bg-slate-100 text-slate-700', label: 'Aposentado' },
      planned: { className: 'bg-blue-100 text-blue-700', label: 'Planejado' }
    };
    const c = config[status] || { className: '', label: status };
    return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
  };

  const getEnvironmentBadge = (env: string) => {
    const config: Record<string, { variant: 'destructive' | 'default' | 'secondary' | 'outline', label: string }> = {
      production: { variant: 'destructive', label: 'Produção' },
      staging: { variant: 'default', label: 'Staging' },
      development: { variant: 'secondary', label: 'Desenvolvimento' },
      testing: { variant: 'outline', label: 'Teste' },
      disaster_recovery: { variant: 'outline', label: 'DR' }
    };
    const c = config[env] || { variant: 'outline', label: env };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  // Stats by type
  const statsByType = items?.reduce((acc, item) => {
    acc[item.ci_type] = (acc[item.ci_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const activeCount = items?.filter(i => i.status === 'active').length || 0;

  return (
    <div className="space-y-6">
      <ModuleHeroBanner
        module="itsm"
        title="CMDB"
        subtitle="Configuration Management Database - Itens de Configuração"
        compact
        actions={
          <Button asChild className="gap-2 bg-white text-foreground hover:bg-white/90">
            <Link to="/it/cmdb/new">
              <Plus className="h-4 w-4" /> Novo CI
            </Link>
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total CIs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Servidores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(statsByType['server'] || 0) + (statsByType['virtual_machine'] || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aplicações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsByType['application'] || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Bancos de Dados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsByType['database'] || 0}</div>
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
                placeholder="Buscar por nome, número, hostname ou IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="server">Servidor</SelectItem>
                <SelectItem value="virtual_machine">VM</SelectItem>
                <SelectItem value="container">Container</SelectItem>
                <SelectItem value="application">Aplicação</SelectItem>
                <SelectItem value="database">Banco de Dados</SelectItem>
                <SelectItem value="network_device">Rede</SelectItem>
                <SelectItem value="storage">Storage</SelectItem>
                <SelectItem value="service">Serviço</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="maintenance">Manutenção</SelectItem>
                <SelectItem value="degraded">Degradado</SelectItem>
                <SelectItem value="retired">Aposentado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={environmentFilter} onValueChange={setEnvironmentFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Ambiente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Ambientes</SelectItem>
                <SelectItem value="production">Produção</SelectItem>
                <SelectItem value="staging">Staging</SelectItem>
                <SelectItem value="development">Desenvolvimento</SelectItem>
                <SelectItem value="testing">Teste</SelectItem>
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
                <TableHead>CI</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ambiente</TableHead>
                <TableHead>IP/Hostname</TableHead>
                <TableHead>Owner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredItems && filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Link 
                        to={`/it/cmdb/${item.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {item.ci_number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.ci_type)}
                        <span>{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize text-sm">{item.ci_type?.replace('_', ' ')}</span>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{getEnvironmentBadge(item.environment)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {item.ip_address && <div>{item.ip_address}</div>}
                        {item.hostname && <div className="text-muted-foreground">{item.hostname}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.owner ? (
                        <span className="text-sm">{item.owner.first_name} {item.owner.last_name}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Server className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <p className="mt-2 text-muted-foreground">Nenhum item de configuração encontrado</p>
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
