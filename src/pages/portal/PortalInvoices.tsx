import { PortalLayout } from './PortalLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText } from '@/components/icons';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  authorized: 'Autorizado',
  captured: 'Capturado',
  failed: 'Falhou',
  refunded: 'Reembolsado',
  partially_refunded: 'Reemb. Parcial',
};

const PAYMENT_STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  authorized: 'secondary',
  captured: 'default',
  failed: 'destructive',
  refunded: 'destructive',
  partially_refunded: 'secondary',
};

function getPortalSession() {
  try {
    const session = localStorage.getItem('portal_session');
    return session ? JSON.parse(session) : null;
  } catch { return null; }
}

export default function PortalInvoices() {
  const session = getPortalSession();
  const accountId = session?.account_id;
  const orgId = session?.organization_id;

  const { data: payments, isLoading } = useQuery({
    queryKey: ['portal-invoices', accountId],
    queryFn: async () => {
      if (!accountId || !orgId) return [];
      // Fetch payments through orders that belong to this account
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('account_id', accountId)
        .eq('organization_id', orgId);
      
      if (ordersError) throw ordersError;
      if (!orders || orders.length === 0) return [];

      const orderIds = orders.map(o => o.id);
      const { data, error } = await supabase
        .from('payments')
        .select('*, orders(order_number, grand_total)')
        .in('order_id', orderIds)
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
        <h1 className="text-3xl font-bold">Faturas & Pagamentos</h1>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : payments && payments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referência</TableHead>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Pagamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => {
                    const order = p.orders as unknown;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-sm">{p.payment_number || p.transaction_id || '—'}</TableCell>
                        <TableCell className="font-mono text-sm">{order?.order_number || '—'}</TableCell>
                        <TableCell className="capitalize">{p.method}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(Number(p.amount))}</TableCell>
                        <TableCell>
                          <Badge variant={PAYMENT_STATUS_VARIANT[p.status ?? 'pending'] || 'outline'}>
                            {PAYMENT_STATUS_LABELS[p.status ?? 'pending'] || p.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {p.paid_at ? format(new Date(p.paid_at), 'dd/MM/yyyy', { locale: ptBR }) : '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3" />
                <p className="text-lg font-medium">Nenhuma fatura encontrada</p>
                <p className="text-sm mt-1">Suas faturas e pagamentos aparecerão aqui conforme os pedidos forem processados.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
