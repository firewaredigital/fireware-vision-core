import { PortalLayout } from './PortalLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RotateCcw, Plus, Loader2 } from '@/components/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, string> = {
  requested: 'Solicitada',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
  received: 'Recebida',
  refunded: 'Reembolsada',
  completed: 'Concluída',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  requested: 'outline',
  approved: 'secondary',
  rejected: 'destructive',
  received: 'secondary',
  refunded: 'default',
  completed: 'default',
};

function getPortalSession() {
  try {
    const session = localStorage.getItem('portal_session');
    return session ? JSON.parse(session) : null;
  } catch { return null; }
}

export default function PortalReturns() {
  const session = getPortalSession();
  const accountId = session?.account_id;
  const orgId = session?.organization_id;
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [reason, setReason] = useState('');
  const [reasonCategory, setReasonCategory] = useState('');

  const { data: returns, isLoading } = useQuery({
    queryKey: ['portal-returns', accountId],
    queryFn: async () => {
      if (!accountId || !orgId) return [];
      // Get orders for this account first
      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('account_id', accountId)
        .eq('organization_id', orgId);
      
      if (!orders || orders.length === 0) return [];
      const orderIds = orders.map(o => o.id);

      const { data, error } = await supabase
        .from('returns')
        .select('*, orders(order_number)')
        .in('order_id', orderIds)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!accountId && !!orgId,
  });

  const { data: eligibleOrders } = useQuery({
    queryKey: ['portal-eligible-orders', accountId],
    queryFn: async () => {
      if (!accountId || !orgId) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number')
        .eq('account_id', accountId)
        .eq('organization_id', orgId)
        .in('status', ['delivered', 'shipped'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!accountId && !!orgId,
  });

  const createReturn = useMutation({
    mutationFn: async () => {
      if (!orgId || !selectedOrderId) throw new Error('Dados incompletos');
      const { data: returnNumber } = await supabase.rpc('generate_return_number', { org_id: orgId });
      const { error } = await supabase.from('returns').insert({
        organization_id: orgId,
        order_id: selectedOrderId,
        return_number: returnNumber || `RMA-${Date.now()}`,
        reason,
        reason_category: reasonCategory,
        items: [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-returns'] });
      toast.success('Devolução solicitada com sucesso!');
      setDialogOpen(false);
      setSelectedOrderId('');
      setReason('');
      setReasonCategory('');
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Devoluções</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Solicitar Devolução</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Solicitar Devolução</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Pedido *</Label>
                  <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                    <SelectTrigger><SelectValue placeholder="Selecione o pedido" /></SelectTrigger>
                    <SelectContent>
                      {eligibleOrders?.map(o => (
                        <SelectItem key={o.id} value={o.id}>{o.order_number}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Categoria do Motivo</Label>
                  <Select value={reasonCategory} onValueChange={setReasonCategory}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="defective">Produto Defeituoso</SelectItem>
                      <SelectItem value="wrong_item">Produto Errado</SelectItem>
                      <SelectItem value="not_as_described">Diferente da Descrição</SelectItem>
                      <SelectItem value="changed_mind">Desistência</SelectItem>
                      <SelectItem value="damaged">Produto Danificado</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Motivo Detalhado *</Label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Descreva o motivo da devolução..."
                    rows={3}
                  />
                </div>
                <Button
                  className="w-full gap-2"
                  disabled={!selectedOrderId || !reason.trim() || createReturn.isPending}
                  onClick={() => createReturn.mutate()}
                >
                  {createReturn.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Solicitar Devolução
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : returns && returns.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Devolução</TableHead>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reembolso</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returns.map((ret) => {
                    const order = ret.orders as any;
                    return (
                      <TableRow key={ret.id}>
                        <TableCell className="font-mono font-medium">{ret.return_number}</TableCell>
                        <TableCell className="font-mono text-sm">{order?.order_number || '—'}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">{ret.reason}</TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[ret.status ?? 'requested'] || 'outline'}>
                            {STATUS_LABELS[ret.status ?? 'requested'] || ret.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {ret.refund_amount ? formatCurrency(Number(ret.refund_amount)) : '—'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(ret.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                <RotateCcw className="h-12 w-12 mx-auto mb-3" />
                <p className="text-lg font-medium">Nenhuma devolução em andamento</p>
                <p className="text-sm mt-1">Solicite devoluções para pedidos entregues ou enviados.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
