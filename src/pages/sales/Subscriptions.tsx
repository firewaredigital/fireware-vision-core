import { useState } from 'react';
import { ModuleHeroBanner } from '@/components/ModuleHeroBanner';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Plus, Search, Filter, RefreshCw, TrendingUp, AlertTriangle,
  DollarSign, Users, Pause, Play, XCircle, Clock, CheckCircle
} from '@/components/icons';

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  trial: { label: 'Trial', variant: 'outline' },
  active: { label: 'Ativa', variant: 'default' },
  past_due: { label: 'Inadimplente', variant: 'destructive' },
  cancelled: { label: 'Cancelada', variant: 'secondary' },
  paused: { label: 'Pausada', variant: 'outline' },
  expired: { label: 'Expirada', variant: 'secondary' },
  pending_activation: { label: 'Pendente', variant: 'outline' },
};

const intervalLabels: Record<string, string> = {
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  semi_annual: 'Semestral',
  annual: 'Anual',
  custom: 'Personalizado',
};

export default function Subscriptions() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const organizationId = profile?.organization_id;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['subscriptions', organizationId, statusFilter, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('subscriptions')
        .select(`
          *,
          accounts:account_id (name),
          contacts:contact_id (first_name, last_name)
        `)
        .eq('organization_id', organizationId!)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') query = query.eq('status', statusFilter as any);
      if (searchTerm) query = query.or(`plan_name.ilike.%${searchTerm}%,subscription_number.ilike.%${searchTerm}%`);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // KPIs
  const activeSubs = subscriptions.filter((s: any) => s.status === 'active');
  const mrr = activeSubs.reduce((sum: number, s: any) => {
    const monthly = s.billing_interval === 'monthly' ? s.total_recurring :
      s.billing_interval === 'quarterly' ? s.total_recurring / 3 :
      s.billing_interval === 'semi_annual' ? s.total_recurring / 6 :
      s.billing_interval === 'annual' ? s.total_recurring / 12 :
      s.total_recurring;
    return sum + monthly;
  }, 0);
  const pastDue = subscriptions.filter((s: any) => s.status === 'past_due').length;
  const renewingSoon = subscriptions.filter((s: any) => {
    if (s.status !== 'active' || !s.current_period_end) return false;
    return differenceInDays(new Date(s.current_period_end), new Date()) <= 30;
  }).length;

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="space-y-6">
        <ModuleHeroBanner
          module="sales"
          title="Assinaturas"
          subtitle="Gerencie assinaturas recorrentes, renovações e churn"
          compact
          actions={
            <Button onClick={() => navigate('/sales/subscriptions/new')}>
              <Plus className="h-4 w-4 mr-2" />Nova Assinatura
            </Button>
          }
        />

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">MRR</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fmt(mrr)}</div>
              <p className="text-xs text-muted-foreground">Receita Recorrente Mensal</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSubs.length}</div>
              <p className="text-xs text-muted-foreground">de {subscriptions.length} total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Inadimplentes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{pastDue}</div>
              <p className="text-xs text-muted-foreground">requerem atenção</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Renovação em 30 dias</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{renewingSoon}</div>
              <p className="text-xs text-muted-foreground">próximas renovações</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por plano ou número..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativas</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="past_due">Inadimplentes</SelectItem>
              <SelectItem value="paused">Pausadas</SelectItem>
              <SelectItem value="cancelled">Canceladas</SelectItem>
              <SelectItem value="expired">Expiradas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Intervalo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor Recorrente</TableHead>
                <TableHead>Próx. Cobrança</TableHead>
                <TableHead>Início</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : subscriptions.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma assinatura encontrada</TableCell></TableRow>
              ) : subscriptions.map((sub: any) => {
                const st = statusLabels[sub.status] || statusLabels.active;
                return (
                  <TableRow key={sub.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">{sub.subscription_number}</TableCell>
                    <TableCell className="font-medium">{sub.accounts?.name || '—'}</TableCell>
                    <TableCell>{sub.plan_name}</TableCell>
                    <TableCell><Badge variant="outline">{intervalLabels[sub.billing_interval] || sub.billing_interval}</Badge></TableCell>
                    <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                    <TableCell className="text-right font-mono font-semibold">{fmt(sub.total_recurring)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {sub.next_billing_date ? format(new Date(sub.next_billing_date), 'dd/MM/yy', { locale: ptBR }) : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(sub.starts_at), 'dd/MM/yy', { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
    </div>
  );
}
