import { PortalLayout } from './PortalLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShoppingCart, Eye } from '@/components/icons';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  processing: 'Processando',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  confirmed: 'secondary',
  processing: 'secondary',
  shipped: 'default',
  delivered: 'default',
  cancelled: 'destructive',
  refunded: 'destructive',
};

function getPortalSession() {
  try {
    const session = localStorage.getItem('portal_session');
    return session ? JSON.parse(session) : null;
  } catch { return null; }
}

export default function PortalOrders() {
  const session = getPortalSession();
  const accountId = session?.account_id;
  const orgId = session?.organization_id;
  const [selectedOrder, setSelectedOrder] = useState<unknown>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['portal-orders', accountId],
    queryFn: async () => {
      if (!accountId || !orgId) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('account_id', accountId)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!accountId && !!orgId,
  });

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <PortalLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Meus Pedidos</h1>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : orders && orders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rastreio</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono font-medium">{order.order_number}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(order.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>{(order.order_items as unknown[])?.length ?? 0}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(Number(order.grand_total))}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[order.status ?? 'pending'] || 'outline'}>
                          {STATUS_LABELS[order.status ?? 'pending'] || order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {order.tracking_number || '—'}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3" />
                <p className="text-lg font-medium">Nenhum pedido encontrado</p>
                <p className="text-sm mt-1">Seus pedidos aparecerão aqui assim que forem realizados.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pedido {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Status: </span>
                  <Badge variant={STATUS_VARIANT[selectedOrder.status ?? 'pending'] || 'outline'}>
                    {STATUS_LABELS[selectedOrder.status ?? 'pending'] || selectedOrder.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Data: </span>
                  {format(new Date(selectedOrder.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </div>
                {selectedOrder.tracking_number && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Rastreio: </span>
                    <span className="font-mono">{selectedOrder.tracking_number}</span>
                  </div>
                )}
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Itens</h4>
                <div className="space-y-2">
                  {(selectedOrder.order_items as unknown[])?.map((item: unknown) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="font-medium">{formatCurrency(Number(item.total))}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(Number(selectedOrder.subtotal))}</span></div>
                {Number(selectedOrder.discount_total) > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Desconto</span><span className="text-green-600">-{formatCurrency(Number(selectedOrder.discount_total))}</span></div>
                )}
                {Number(selectedOrder.tax_total) > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Impostos</span><span>{formatCurrency(Number(selectedOrder.tax_total))}</span></div>
                )}
                {Number(selectedOrder.shipping_total) > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span>{formatCurrency(Number(selectedOrder.shipping_total))}</span></div>
                )}
                <div className="flex justify-between font-bold text-base pt-1 border-t">
                  <span>Total</span><span>{formatCurrency(Number(selectedOrder.grand_total))}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PortalLayout>
  );
}
