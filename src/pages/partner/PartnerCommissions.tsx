import { PartnerLayout } from './PartnerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Filter } from '@/components/icons';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Aprovada',
  paid: 'Paga',
  cancelled: 'Cancelada',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  approved: 'secondary',
  paid: 'default',
  cancelled: 'destructive',
};

function getPartnerSession() {
  try {
    const session = localStorage.getItem('partner_session');
    return session ? JSON.parse(session) : null;
  } catch { return null; }
}

export default function PartnerCommissions() {
  const session = getPartnerSession();
  const partnerId = session?.partner_id;
  const orgId = session?.organization_id;
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: commissions, isLoading } = useQuery({
    queryKey: ['partner-commissions', partnerId, statusFilter],
    queryFn: async () => {
      if (!partnerId || !orgId) return [];
      let query = supabase
        .from('partner_commissions')
        .select('*, partner_deals(deal_type, deal_value, status)')
        .eq('partner_id', partnerId)
        .eq('organization_id', orgId)
        .order('calculated_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!partnerId && !!orgId,
  });

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const totalPending = commissions?.filter(c => c.status === 'pending').reduce((acc, c) => acc + Number(c.amount), 0) ?? 0;
  const totalApproved = commissions?.filter(c => c.status === 'approved').reduce((acc, c) => acc + Number(c.amount), 0) ?? 0;
  const totalPaid = commissions?.filter(c => c.status === 'paid').reduce((acc, c) => acc + Number(c.amount), 0) ?? 0;

  return (
    <PartnerLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Comissões</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-24" /> : (
                <p className="text-2xl font-bold text-accent-foreground">{formatCurrency(totalPending)}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Aprovadas</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-24" /> : (
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalApproved)}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Pagas</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-24" /> : (
                <p className="text-2xl font-bold text-chart-4">{formatCurrency(totalPaid)}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : commissions && commissions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deal Vinculado</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Moeda</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Calculado em</TableHead>
                    <TableHead>Pago em</TableHead>
                    <TableHead>Referência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((c) => {
                    const deal = c.partner_deals as any;
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">
                          {deal ? `${deal.deal_type === 'lead_referral' ? 'Indicação' : deal.deal_type === 'co_sell' ? 'Co-Sell' : 'Revenda'} - ${formatCurrency(Number(deal.deal_value))}` : '—'}
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(Number(c.amount))}</TableCell>
                        <TableCell>{c.currency}</TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[c.status] || 'outline'}>
                            {STATUS_LABELS[c.status] || c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(c.calculated_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {c.paid_at ? format(new Date(c.paid_at), 'dd/MM/yyyy', { locale: ptBR }) : '—'}
                        </TableCell>
                        <TableCell className="text-sm">{c.payment_reference || '—'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-3" />
                <p className="text-lg font-medium">Nenhuma comissão registrada</p>
                <p className="text-sm mt-1">Comissões serão geradas automaticamente quando seus deals forem aprovados.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PartnerLayout>
  );
}
