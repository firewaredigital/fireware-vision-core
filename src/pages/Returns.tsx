import { useState } from 'react';
import { ModuleHeroBanner } from '@/components/ModuleHeroBanner';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  RotateCcw, 
  Clock, 
  CheckCircle, 
  XCircle,
  Package,
  Eye,
  DollarSign
} from '@/components/icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type ReturnStatus = 'requested' | 'approved' | 'rejected' | 'received' | 'refunded' | 'completed';

const statusConfig: Record<ReturnStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  requested: { label: 'Solicitado', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  approved: { label: 'Aprovado', variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
  rejected: { label: 'Rejeitado', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
  received: { label: 'Recebido', variant: 'default', icon: <Package className="h-3 w-3" /> },
  refunded: { label: 'Reembolsado', variant: 'default', icon: <DollarSign className="h-3 w-3" /> },
  completed: { label: 'Concluído', variant: 'outline', icon: <CheckCircle className="h-3 w-3" /> },
};

const reasonCategoryLabels: Record<string, string> = {
  defective: 'Produto Defeituoso',
  wrong_item: 'Item Errado',
  not_as_described: 'Diferente da Descrição',
  changed_mind: 'Desistência',
  arrived_late: 'Chegou Atrasado',
  other: 'Outro',
};

export default function Returns() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: returns, isLoading } = useQuery({
    queryKey: ['returns', search, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('returns')
        .select(`
          *,
          order:orders!returns_order_id_fkey(id, order_number, account_id, contact_id, account:accounts(name), contact:contacts(first_name, last_name))
        `)
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`return_number.ilike.%${search}%`);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as unknown);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['return-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('returns')
        .select('status, refund_amount');
      
      if (error) throw error;

      const pending = data?.filter(r => r.status === 'requested').length || 0;
      const approved = data?.filter(r => r.status === 'approved').length || 0;
      const completed = data?.filter(r => ['refunded', 'completed'].includes(r.status as string)).length || 0;
      const totalRefunded = data?.filter(r => r.status === 'refunded' || r.status === 'completed')
        .reduce((sum, r) => sum + (Number(r.refund_amount) || 0), 0) || 0;

      return { pending, approved, completed, totalRefunded };
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <>
      <div className="space-y-6">
        <ModuleHeroBanner
          module="commerce"
          title="Devoluções"
          subtitle="Gerencie devoluções e reembolsos"
          compact
        />

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pending || 0}</div>
              <p className="text-xs text-muted-foreground">Aguardando análise</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.approved || 0}</div>
              <p className="text-xs text-muted-foreground">Aguardando recebimento</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.completed || 0}</div>
              <p className="text-xs text-muted-foreground">Finalizadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reembolsado</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats?.totalRefunded || 0)}</div>
              <p className="text-xs text-muted-foreground">Valor devolvido</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por número da devolução..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              {Object.entries(statusConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Returns Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Devolução</TableHead>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Reembolso</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : returns?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Nenhuma devolução encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  returns?.map((returnItem) => {
                    const status = returnItem.status as ReturnStatus;
                    const statusCfg = statusConfig[status] || statusConfig.requested;
                    
                    return (
                      <TableRow key={returnItem.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <RotateCcw className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{returnItem.return_number}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {returnItem.order && (
                            <Link 
                              to={`/orders/${returnItem.order.id}`}
                              className="text-primary hover:underline"
                            >
                              {returnItem.order.order_number}
                            </Link>
                          )}
                        </TableCell>
                        <TableCell>
                          {returnItem.order?.account ? (
                            <span>{returnItem.order.account.name}</span>
                          ) : returnItem.order?.contact ? (
                            <span>
                              {returnItem.order.contact.first_name} {returnItem.order.contact.last_name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {reasonCategoryLabels[returnItem.reason_category || ''] || returnItem.reason_category || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusCfg.variant} className="gap-1">
                            {statusCfg.icon}
                            {statusCfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {returnItem.refund_amount 
                            ? formatCurrency(Number(returnItem.refund_amount))
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          {format(new Date(returnItem.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/returns/${returnItem.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
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
      </div>
    </>
  );
}
