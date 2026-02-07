import { useState } from 'react';
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
  Plus, 
  Search, 
  Package, 
  DollarSign, 
  Truck, 
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  FileText
} from '@/components/icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
type PaymentStatus = 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded' | 'partially_refunded';

const statusConfig: Record<OrderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  pending: { label: 'Pendente', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  confirmed: { label: 'Confirmado', variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
  processing: { label: 'Processando', variant: 'default', icon: <Package className="h-3 w-3" /> },
  shipped: { label: 'Enviado', variant: 'default', icon: <Truck className="h-3 w-3" /> },
  delivered: { label: 'Entregue', variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
  cancelled: { label: 'Cancelado', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
  refunded: { label: 'Reembolsado', variant: 'outline', icon: <DollarSign className="h-3 w-3" /> },
};

const paymentStatusConfig: Record<PaymentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  authorized: { label: 'Autorizado', variant: 'default' },
  captured: { label: 'Capturado', variant: 'default' },
  failed: { label: 'Falhou', variant: 'destructive' },
  refunded: { label: 'Reembolsado', variant: 'outline' },
  partially_refunded: { label: 'Parcial', variant: 'outline' },
};

export default function Orders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', search, statusFilter, paymentFilter],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          account:accounts(id, name),
          contact:contacts(id, first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`order_number.ilike.%${search}%`);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }
      if (paymentFilter !== 'all') {
        query = query.eq('payment_status', paymentFilter as any);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['order-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('status, grand_total, payment_status');
      
      if (error) throw error;

      const pending = data?.filter(o => o.status === 'pending').length || 0;
      const processing = data?.filter(o => ['confirmed', 'processing'].includes(o.status as string)).length || 0;
      const shipped = data?.filter(o => o.status === 'shipped').length || 0;
      const totalRevenue = data?.filter(o => o.payment_status === 'captured')
        .reduce((sum, o) => sum + (Number(o.grand_total) || 0), 0) || 0;

      return { pending, processing, shipped, totalRevenue };
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
          title="Pedidos"
          subtitle="Gerencie todos os pedidos do e-commerce"
          compact
          actions={
            <Button asChild className="gap-2 bg-white text-foreground hover:bg-white/90">
              <Link to="/orders/new">
                <Plus className="h-4 w-4" /> Novo Pedido
              </Link>
            </Button>
          }
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
              <p className="text-xs text-muted-foreground">Aguardando processamento</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Processamento</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.processing || 0}</div>
              <p className="text-xs text-muted-foreground">Sendo preparados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enviados</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.shipped || 0}</div>
              <p className="text-xs text-muted-foreground">Em trânsito</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
              <p className="text-xs text-muted-foreground">Pagamentos capturados</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por número do pedido..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status do Pedido" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              {Object.entries(statusConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status Pagamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(paymentStatusConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Orders Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : orders?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Nenhum pedido encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  orders?.map((order) => {
                    const status = order.status as OrderStatus;
                    const paymentStatus = order.payment_status as PaymentStatus;
                    const statusCfg = statusConfig[status] || statusConfig.pending;
                    const paymentCfg = paymentStatusConfig[paymentStatus] || paymentStatusConfig.pending;
                    
                    return (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{order.order_number}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {order.account ? (
                            <Link 
                              to={`/accounts/${order.account.id}`}
                              className="text-primary hover:underline"
                            >
                              {order.account.name}
                            </Link>
                          ) : order.contact ? (
                            <Link 
                              to={`/contacts/${order.contact.id}`}
                              className="text-primary hover:underline"
                            >
                              {order.contact.first_name} {order.contact.last_name}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusCfg.variant} className="gap-1">
                            {statusCfg.icon}
                            {statusCfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={paymentCfg.variant}>
                            {paymentCfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Number(order.grand_total) || 0)}
                        </TableCell>
                        <TableCell>
                          {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/orders/${order.id}`}>
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
