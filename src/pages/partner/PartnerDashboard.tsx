import { PartnerLayout } from './PartnerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Handshake, TrendingUp, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DEAL_STATUS_COLORS: Record<string, string> = {
  submitted: 'hsl(var(--chart-1))',
  under_review: 'hsl(var(--chart-2))',
  approved: 'hsl(var(--chart-3))',
  won: 'hsl(var(--chart-4))',
  lost: 'hsl(var(--chart-5))',
  rejected: 'hsl(var(--muted-foreground))',
};

const DEAL_STATUS_LABELS: Record<string, string> = {
  submitted: 'Enviado',
  under_review: 'Em Análise',
  approved: 'Aprovado',
  won: 'Ganho',
  lost: 'Perdido',
  rejected: 'Rejeitado',
};

const COMMISSION_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Aprovada',
  paid: 'Paga',
  cancelled: 'Cancelada',
};

function getPartnerSession() {
  try {
    const session = localStorage.getItem('partner_session');
    return session ? JSON.parse(session) : null;
  } catch { return null; }
}

export default function PartnerDashboard() {
  const session = getPartnerSession();
  const partnerId = session?.partner_id;
  const orgId = session?.organization_id;

  const { data: deals, isLoading: dealsLoading } = useQuery({
    queryKey: ['partner-deals-stats', partnerId],
    queryFn: async () => {
      if (!partnerId || !orgId) return [];
      const { data, error } = await supabase
        .from('partner_deals')
        .select('id, deal_type, status, deal_value, commission_amount, commission_status, submitted_at, notes')
        .eq('partner_id', partnerId)
        .eq('organization_id', orgId)
        .order('submitted_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!partnerId && !!orgId,
  });

  const { data: commissions, isLoading: commissionsLoading } = useQuery({
    queryKey: ['partner-commissions-stats', partnerId],
    queryFn: async () => {
      if (!partnerId || !orgId) return [];
      const { data, error } = await supabase
        .from('partner_commissions')
        .select('id, amount, status, calculated_at, paid_at, payment_reference')
        .eq('partner_id', partnerId)
        .eq('organization_id', orgId)
        .order('calculated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!partnerId && !!orgId,
  });

  const isLoading = dealsLoading || commissionsLoading;

  // KPI calculations
  const activeDeals = deals?.filter(d => ['submitted', 'under_review', 'approved'].includes(d.status)).length ?? 0;
  const wonDeals = deals?.filter(d => d.status === 'won').length ?? 0;
  const pendingCommissions = commissions?.filter(c => c.status === 'pending' || c.status === 'approved').reduce((acc, c) => acc + Number(c.amount), 0) ?? 0;
  const paidCommissions = commissions?.filter(c => c.status === 'paid').reduce((acc, c) => acc + Number(c.amount), 0) ?? 0;

  // Charts data
  const dealsByStatus = Object.entries(
    (deals || []).reduce((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([status, count]) => ({
    name: DEAL_STATUS_LABELS[status] || status,
    value: count,
    fill: DEAL_STATUS_COLORS[status] || 'hsl(var(--muted))',
  }));

  const commissionsByMonth = (commissions || []).reduce((acc, c) => {
    const month = format(new Date(c.calculated_at), 'MMM/yy', { locale: ptBR });
    const existing = acc.find(m => m.month === month);
    if (existing) {
      existing.total += Number(c.amount);
    } else {
      acc.push({ month, total: Number(c.amount) });
    }
    return acc;
  }, [] as { month: string; total: number }[]).slice(-6);

  const recentDeals = (deals || []).slice(0, 5);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (!session) {
    return (
      <PartnerLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Sessão expirada. Faça login novamente.</p>
        </div>
      </PartnerLayout>
    );
  }

  return (
    <PartnerLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard do Parceiro</h1>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
                <Handshake className="h-4 w-4" />Deals Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-16" /> : (
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-bold">{activeDeals}</p>
                  <span className="text-xs text-muted-foreground mb-1">de {deals?.length ?? 0} total</span>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />Deals Ganhos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-16" /> : (
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-bold">{wonDeals}</p>
                  {deals && deals.length > 0 && (
                    <span className="text-xs text-green-600 flex items-center mb-1">
                      <ArrowUpRight className="h-3 w-3" />
                      {Math.round((wonDeals / deals.length) * 100)}%
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" />Comissões Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-16" /> : (
                <p className="text-2xl font-bold">{formatCurrency(pendingCommissions)}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-4 w-4" />Comissões Pagas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-16" /> : (
                <p className="text-2xl font-bold text-green-600">{formatCurrency(paidCommissions)}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Deals por Status</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-[200px] w-full" /> : dealsByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={dealsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                      {dealsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
                  Nenhum deal registrado ainda.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comissões por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-[200px] w-full" /> : commissionsByMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={commissionsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
                  Nenhuma comissão registrada ainda.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Deals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimos Deals</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[200px] w-full" /> : recentDeals.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Comissão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentDeals.map((deal) => (
                    <TableRow key={deal.id}>
                      <TableCell className="capitalize">{deal.deal_type.replace('_', ' ')}</TableCell>
                      <TableCell>{formatCurrency(Number(deal.deal_value))}</TableCell>
                      <TableCell>{formatCurrency(Number(deal.commission_amount))}</TableCell>
                      <TableCell>
                        <Badge variant={deal.status === 'won' ? 'default' : deal.status === 'lost' || deal.status === 'rejected' ? 'destructive' : 'secondary'}>
                          {DEAL_STATUS_LABELS[deal.status] || deal.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(deal.submitted_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <p>Bem-vindo ao Portal do Parceiro. Registre indicações para começar a acompanhar suas comissões.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PartnerLayout>
  );
}
