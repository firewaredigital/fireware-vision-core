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
import { Plus, Search, Package, Monitor, HardDrive, Cpu, User, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ITAssets() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: assets, isLoading } = useQuery({
    queryKey: ['it-assets', typeFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('it_assets')
        .select(`
          *,
          assigned_to_profile:profiles!it_assets_assigned_to_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (typeFilter !== 'all') {
        query = query.eq('asset_type', typeFilter as any);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const filteredAssets = assets?.filter(asset => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      asset.asset_tag?.toLowerCase().includes(search) ||
      asset.name?.toLowerCase().includes(search) ||
      asset.serial_number?.toLowerCase().includes(search) ||
      asset.manufacturer?.toLowerCase().includes(search)
    );
  });

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      hardware: <Monitor className="h-4 w-4" />,
      software: <HardDrive className="h-4 w-4" />,
      license: <Package className="h-4 w-4" />,
      subscription: <Cpu className="h-4 w-4" />
    };
    return icons[type] || <Package className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string, label: string }> = {
      available: { className: 'bg-green-100 text-green-700', label: 'Disponível' },
      in_use: { className: 'bg-blue-100 text-blue-700', label: 'Em Uso' },
      in_repair: { className: 'bg-yellow-100 text-yellow-700', label: 'Em Reparo' },
      maintenance: { className: 'bg-orange-100 text-orange-700', label: 'Manutenção' },
      retired: { className: 'bg-gray-100 text-gray-700', label: 'Aposentado' },
      disposed: { className: 'bg-slate-100 text-slate-700', label: 'Descartado' },
      lost: { className: 'bg-red-100 text-red-700', label: 'Perdido' },
      stolen: { className: 'bg-red-100 text-red-700', label: 'Roubado' }
    };
    const c = config[status] || { className: '', label: status };
    return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
  };

  const getWarrantyStatus = (warrantyEndDate: string | null) => {
    if (!warrantyEndDate) return null;
    const days = differenceInDays(new Date(warrantyEndDate), new Date());
    
    if (days < 0) {
      return <Badge variant="outline" className="bg-red-100 text-red-700">Expirada</Badge>;
    } else if (days <= 30) {
      return <Badge variant="outline" className="bg-orange-100 text-orange-700">Expira em {days}d</Badge>;
    } else if (days <= 90) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-700">Expira em {days}d</Badge>;
    }
    return <Badge variant="outline" className="bg-green-100 text-green-700">Válida</Badge>;
  };

  // Stats
  const inUseCount = assets?.filter(a => a.status === 'in_use').length || 0;
  const availableCount = assets?.filter(a => a.status === 'available').length || 0;
  const warrantyExpiring = assets?.filter(a => {
    if (!a.warranty_end_date) return false;
    const days = differenceInDays(new Date(a.warranty_end_date), new Date());
    return days >= 0 && days <= 30;
  }).length || 0;
  const totalValue = assets?.reduce((sum, a) => sum + (a.purchase_cost || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ativos de TI</h1>
          <p className="text-muted-foreground">
            Inventário de hardware, software e licenças
          </p>
        </div>
        <Button asChild>
          <Link to="/it/assets/new">
            <Plus className="mr-2 h-4 w-4" />
            Novo Ativo
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assets?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Em Uso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inUseCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{availableCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Garantias Expirando
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{warrantyExpiring}</div>
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
                placeholder="Buscar por tag, nome, serial ou fabricante..."
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
                <SelectItem value="hardware">Hardware</SelectItem>
                <SelectItem value="software">Software</SelectItem>
                <SelectItem value="license">Licença</SelectItem>
                <SelectItem value="subscription">Assinatura</SelectItem>
                <SelectItem value="virtual">Virtual</SelectItem>
                <SelectItem value="cloud_resource">Cloud</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="available">Disponível</SelectItem>
                <SelectItem value="in_use">Em Uso</SelectItem>
                <SelectItem value="in_repair">Em Reparo</SelectItem>
                <SelectItem value="maintenance">Manutenção</SelectItem>
                <SelectItem value="retired">Aposentado</SelectItem>
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
                <TableHead>Tag</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Fabricante/Modelo</TableHead>
                <TableHead>Atribuído a</TableHead>
                <TableHead>Garantia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredAssets && filteredAssets.length > 0 ? (
                filteredAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <Link 
                        to={`/it/assets/${asset.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {asset.asset_tag}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(asset.asset_type)}
                        <span>{asset.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize text-sm">{asset.asset_type?.replace('_', ' ')}</span>
                    </TableCell>
                    <TableCell>{getStatusBadge(asset.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {asset.manufacturer && <div>{asset.manufacturer}</div>}
                        {asset.model && <div className="text-muted-foreground">{asset.model}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {asset.assigned_to_profile ? (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span className="text-sm">
                            {asset.assigned_to_profile.first_name} {asset.assigned_to_profile.last_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getWarrantyStatus(asset.warranty_end_date)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <p className="mt-2 text-muted-foreground">Nenhum ativo encontrado</p>
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
