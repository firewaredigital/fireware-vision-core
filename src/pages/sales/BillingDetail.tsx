import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft, CheckCircle, XCircle, Send, DollarSign, FileText,
  Building2, Calendar, Receipt
} from '@/components/icons';

const invoiceStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Rascunho', variant: 'secondary' },
  pending: { label: 'Pendente', variant: 'outline' },
  sent: { label: 'Enviada', variant: 'outline' },
  paid: { label: 'Paga', variant: 'default' },
  partial: { label: 'Parcial', variant: 'outline' },
  overdue: { label: 'Vencida', variant: 'destructive' },
  cancelled: { label: 'Cancelada', variant: 'secondary' },
  void: { label: 'Anulada', variant: 'secondary' },
  refunded: { label: 'Reembolsada', variant: 'outline' },
};

export default function BillingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`*, accounts:account_id (name, email, phone)`)
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: items = [] } = useQuery({
    queryKey: ['invoice-items', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', id!)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['invoice-payments', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_ledger')
        .select('*')
        .eq('invoice_id', id!)
        .order('transaction_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const updateStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus as any })
        .eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      toast.success('Status da fatura atualizado');
    },
    onError: () => toast.error('Erro ao atualizar status'),
  });

  const recordPayment = useMutation({
    mutationFn: async () => {
      if (!invoice) return;
      const { error } = await supabase.from('payment_ledger').insert({
        organization_id: invoice.organization_id,
        account_id: invoice.account_id,
        invoice_id: id!,
        entry_type: 'payment',
        description: `Pagamento da fatura ${invoice.invoice_number}`,
        amount: invoice.amount_due,
        status: 'completed',
        payment_method: 'manual',
        created_by: profile?.id,
      });
      if (error) throw error;

      // Mark invoice as paid
      await supabase.from('invoices').update({
        status: 'paid',
        amount_paid: invoice.total,
        amount_due: 0,
      }).eq('id', id!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoice-payments', id] });
      toast.success('Pagamento registrado');
    },
    onError: () => toast.error('Erro ao registrar pagamento'),
  });

  if (isLoading || !invoice) {
    return <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">Carregando fatura...</div>;
  }

  const st = invoiceStatusConfig[invoice.status] || invoiceStatusConfig.draft;
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: invoice.currency || 'BRL' }).format(v);

  return (
    <>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/sales/billing')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{invoice.invoice_number}</h1>
                <Badge variant={st.variant}>{st.label}</Badge>
              </div>
              <p className="text-muted-foreground">{invoice.accounts?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {invoice.status === 'draft' && (
              <Button variant="outline" onClick={() => updateStatus.mutate('sent')}>
                <Send className="h-4 w-4 mr-2" />Enviar
              </Button>
            )}
            {(invoice.status === 'sent' || invoice.status === 'pending' || invoice.status === 'overdue') && (
              <Button onClick={() => recordPayment.mutate()} disabled={recordPayment.isPending}>
                <DollarSign className="h-4 w-4 mr-2" />
                {recordPayment.isPending ? 'Registrando...' : 'Registrar Pagamento'}
              </Button>
            )}
            {invoice.status !== 'void' && invoice.status !== 'paid' && (
              <Button variant="destructive" size="sm" onClick={() => updateStatus.mutate('void')}>
                <XCircle className="h-4 w-4 mr-2" />Anular
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Invoice Info */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Detalhes da Fatura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Emissão</p>
                  <p className="font-medium">{format(new Date(invoice.issue_date), 'dd/MM/yyyy', { locale: ptBR })}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vencimento</p>
                  <p className="font-medium">{format(new Date(invoice.due_date), 'dd/MM/yyyy', { locale: ptBR })}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Método de Pagamento</p>
                  <p className="font-medium">{invoice.payment_method || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Referência</p>
                  <p className="font-medium">{invoice.payment_reference || '—'}</p>
                </div>
              </div>

              {invoice.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Observações</p>
                    <p className="text-sm">{invoice.notes}</p>
                  </div>
                </>
              )}

              <Separator />

              {/* Line Items */}
              <div>
                <h3 className="font-semibold mb-3">Itens</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Preço Unit.</TableHead>
                      <TableHead className="text-right">Desconto</TableHead>
                      <TableHead className="text-right">Imposto</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-4 text-muted-foreground">Nenhum item</TableCell></TableRow>
                    ) : items.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <p className="font-medium">{item.description}</p>
                          {item.period_start && item.period_end && (
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(item.period_start), 'dd/MM', { locale: ptBR })} — {format(new Date(item.period_end), 'dd/MM', { locale: ptBR })}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right font-mono">{fmt(item.unit_price)}</TableCell>
                        <TableCell className="text-right font-mono text-destructive">
                          {item.discount_amount > 0 ? `-${fmt(item.discount_amount)}` : '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono">{fmt(item.tax_amount)}</TableCell>
                        <TableCell className="text-right font-mono font-semibold">{fmt(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono">{fmt(invoice.subtotal)}</span>
                </div>
                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Desconto</span>
                    <span className="font-mono text-destructive">-{fmt(invoice.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Impostos</span>
                  <span className="font-mono">{fmt(invoice.tax_amount)}</span>
                </div>
                {invoice.shipping_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frete</span>
                    <span className="font-mono">{fmt(invoice.shipping_amount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{fmt(invoice.total)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Pago</span>
                  <span className="font-mono">{fmt(invoice.amount_paid)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Saldo Devido</span>
                  <span className={invoice.amount_due > 0 ? 'text-destructive' : 'text-green-600'}>{fmt(invoice.amount_due)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Histórico de Pagamentos</CardTitle>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum pagamento registrado</p>
                ) : (
                  <div className="space-y-3">
                    {payments.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="text-sm font-medium">{p.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(p.transaction_date), "dd/MM/yy HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <span className="font-mono font-semibold text-green-600">{fmt(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
