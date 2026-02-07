import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  CreditCard, 
  User, 
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  FileText,
  Building
} from '@/components/icons';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Timeline } from '@/components/Timeline';
import { ChangeHistory } from '@/components/ChangeHistory';

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

const statusConfig: Record<OrderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  pending: { label: 'Pendente', variant: 'secondary', color: 'text-yellow-600' },
  confirmed: { label: 'Confirmado', variant: 'default', color: 'text-blue-600' },
  processing: { label: 'Processando', variant: 'default', color: 'text-blue-600' },
  shipped: { label: 'Enviado', variant: 'default', color: 'text-purple-600' },
  delivered: { label: 'Entregue', variant: 'default', color: 'text-green-600' },
  cancelled: { label: 'Cancelado', variant: 'destructive', color: 'text-red-600' },
  refunded: { label: 'Reembolsado', variant: 'outline', color: 'text-gray-600' },
};

const statusFlow: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newStatus, setNewStatus] = useState<string>('');

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          account:accounts(id, name, email, phone),
          contact:contacts(id, first_name, last_name, email, phone)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: orderItems } = useQuery({
    queryKey: ['order-items', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          *,
          product:products(id, name, sku)
        `)
        .eq('order_id', id);

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: payments } = useQuery({
    queryKey: ['order-payments', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: shipments } = useQuery({
    queryKey: ['order-shipments', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('order_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: statusHistory } = useQuery({
    queryKey: ['order-status-history', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_status_history')
        .select(`
          *
        `)
        .eq('order_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase
        .from('orders')
        .update({ status: status as OrderStatus })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['order-status-history', id] });
      toast.success('Status atualizado com sucesso');
      setNewStatus('');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatAddress = (address: any) => {
    if (!address) return '-';
    return `${address.street || ''}, ${address.number || ''} - ${address.city || ''}, ${address.state || ''} - ${address.zip_code || ''}`;
  };

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Carregando...</div>
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="text-muted-foreground">Pedido não encontrado</div>
          <Button variant="outline" onClick={() => navigate('/orders')}>
            Voltar para Pedidos
          </Button>
        </div>
      </>
    );
  }

  const currentStatus = order.status as OrderStatus;
  const statusCfg = statusConfig[currentStatus] || statusConfig.pending;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/orders')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{order.order_number}</h1>
                <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
              </div>
              <p className="text-muted-foreground">
                Criado em {format(new Date(order.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentStatus !== 'cancelled' && currentStatus !== 'refunded' && (
              <>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Alterar Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusFlow.map((status) => (
                      <SelectItem key={status} value={status} disabled={status === currentStatus}>
                        {statusConfig[status].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {newStatus && (
                  <Button onClick={() => updateStatusMutation.mutate(newStatus)}>
                    Atualizar
                  </Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancelar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancelar Pedido</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Não</AlertDialogCancel>
                      <AlertDialogAction onClick={() => updateStatusMutation.mutate('cancelled')}>
                        Sim, cancelar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>

        {/* Status Progress */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              {statusFlow.map((status, index) => {
                const isCompleted = statusFlow.indexOf(currentStatus) >= index;
                const isCurrent = status === currentStatus;
                return (
                  <div key={status} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                        isCompleted 
                          ? 'bg-primary border-primary text-primary-foreground' 
                          : 'border-muted-foreground/30 text-muted-foreground'
                      } ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                        {status === 'pending' && <Clock className="h-5 w-5" />}
                        {status === 'confirmed' && <CheckCircle className="h-5 w-5" />}
                        {status === 'processing' && <Package className="h-5 w-5" />}
                        {status === 'shipped' && <Truck className="h-5 w-5" />}
                        {status === 'delivered' && <CheckCircle className="h-5 w-5" />}
                      </div>
                      <span className={`mt-2 text-xs font-medium ${isCompleted ? '' : 'text-muted-foreground'}`}>
                        {statusConfig[status].label}
                      </span>
                    </div>
                    {index < statusFlow.length - 1 && (
                      <div className={`h-1 flex-1 mx-2 ${
                        statusFlow.indexOf(currentStatus) > index ? 'bg-primary' : 'bg-muted'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Itens do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-center">Qtd</TableHead>
                      <TableHead className="text-right">Preço Unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderItems?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.product ? (
                            <Link to={`/products/${item.product.id}`} className="text-primary hover:underline">
                              {item.name}
                            </Link>
                          ) : (
                            item.name
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{item.sku || '-'}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(item.unit_price))}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(Number(item.total))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(Number(order.subtotal))}</span>
                  </div>
                  {Number(order.discount_total) > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Desconto</span>
                      <span>-{formatCurrency(Number(order.discount_total))}</span>
                    </div>
                  )}
                  {Number(order.shipping_total) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Frete</span>
                      <span>{formatCurrency(Number(order.shipping_total))}</span>
                    </div>
                  )}
                  {Number(order.tax_total) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Impostos</span>
                      <span>{formatCurrency(Number(order.tax_total))}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(Number(order.grand_total))}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for Payments, Shipments, History */}
            <Card>
              <Tabs defaultValue="payments">
                <CardHeader>
                  <TabsList>
                    <TabsTrigger value="payments">Pagamentos</TabsTrigger>
                    <TabsTrigger value="shipments">Envios</TabsTrigger>
                    <TabsTrigger value="history">Histórico</TabsTrigger>
                    <TabsTrigger value="audit">Alterações</TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent>
                  <TabsContent value="payments" className="mt-0">
                    {payments?.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">Nenhum pagamento registrado</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Método</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead>Data</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payments?.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell className="capitalize">{payment.method.replace('_', ' ')}</TableCell>
                              <TableCell>
                                <Badge variant={payment.status === 'captured' ? 'default' : 'secondary'}>
                                  {payment.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">{formatCurrency(Number(payment.amount))}</TableCell>
                              <TableCell>{format(new Date(payment.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </TabsContent>

                  <TabsContent value="shipments" className="mt-0">
                    {shipments?.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">Nenhum envio registrado</p>
                    ) : (
                      <div className="space-y-4">
                        {shipments?.map((shipment) => (
                          <div key={shipment.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Truck className="h-4 w-4" />
                                <span className="font-medium">{shipment.carrier || 'Transportadora'}</span>
                              </div>
                              <Badge>{shipment.status}</Badge>
                            </div>
                            {shipment.tracking_number && (
                              <p className="text-sm text-muted-foreground">
                                Rastreio: <span className="font-mono">{shipment.tracking_number}</span>
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="history" className="mt-0">
                    {statusHistory?.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">Nenhum histórico</p>
                    ) : (
                      <div className="space-y-3">
                        {statusHistory?.map((entry) => (
                          <div key={entry.id} className="flex items-start gap-3 text-sm">
                            <RefreshCw className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                              <p>
                                Status alterado de <Badge variant="outline" className="mx-1">{entry.old_status || 'N/A'}</Badge>
                                para <Badge variant="outline" className="mx-1">{entry.new_status}</Badge>
                              </p>
                              <p className="text-muted-foreground">
                                {format(new Date(entry.created_at), "dd/MM/yyyy 'às' HH:mm")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="audit" className="mt-0">
                    <ChangeHistory entityType="order" entityId={id!} />
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.account && (
                  <div>
                    <p className="text-sm text-muted-foreground">Empresa</p>
                    <Link to={`/accounts/${order.account.id}`} className="font-medium text-primary hover:underline flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      {order.account.name}
                    </Link>
                    {order.account.email && <p className="text-sm">{order.account.email}</p>}
                    {order.account.phone && <p className="text-sm">{order.account.phone}</p>}
                  </div>
                )}
                {order.contact && (
                  <div>
                    <p className="text-sm text-muted-foreground">Contato</p>
                    <Link to={`/contacts/${order.contact.id}`} className="font-medium text-primary hover:underline">
                      {order.contact.first_name} {order.contact.last_name}
                    </Link>
                    {order.contact.email && <p className="text-sm">{order.contact.email}</p>}
                    {order.contact.phone && <p className="text-sm">{order.contact.phone}</p>}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Endereço de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{formatAddress(order.shipping_address)}</p>
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Método</span>
                  <span className="text-sm capitalize">{order.payment_method?.replace('_', ' ') || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={order.payment_status === 'captured' ? 'default' : 'secondary'}>
                    {order.payment_status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {(order.customer_notes || order.internal_notes) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Notas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.customer_notes && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Notas do Cliente</p>
                      <p className="text-sm">{order.customer_notes}</p>
                    </div>
                  )}
                  {order.internal_notes && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Notas Internas</p>
                      <p className="text-sm">{order.internal_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
