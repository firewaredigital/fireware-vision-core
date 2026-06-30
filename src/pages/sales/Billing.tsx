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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Search, Filter, FileText, DollarSign, AlertTriangle,
  CheckCircle, Clock, XCircle, Receipt, ArrowDownRight, ArrowUpRight
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

const ledgerTypeLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  charge: { label: 'Cobrança', icon: ArrowUpRight, color: 'text-destructive' },
  payment: { label: 'Pagamento', icon: ArrowDownRight, color: 'text-green-600' },
  credit: { label: 'Crédito', icon: ArrowDownRight, color: 'text-green-600' },
  debit: { label: 'Débito', icon: ArrowUpRight, color: 'text-destructive' },
  refund: { label: 'Reembolso', icon: ArrowDownRight, color: 'text-amber-600' },
  adjustment: { label: 'Ajuste', icon: Receipt, color: 'text-muted-foreground' },
  write_off: { label: 'Baixa', icon: XCircle, color: 'text-muted-foreground' },
};

export default function Billing() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const organizationId = profile?.organization_id;

  const [activeTab, setActiveTab] = useState('invoices');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Invoices query
  const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ['invoices', organizationId, statusFilter, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('invoices')
        .select(`*, accounts:account_id (name)`)
        .eq('organization_id', organizationId!)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') query = query.eq('status', statusFilter as unknown);
      if (searchTerm) query = query.or(`invoice_number.ilike.%${searchTerm}%,billing_name.ilike.%${searchTerm}%`);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Payment Ledger query
  const { data: ledgerEntries = [], isLoading: loadingLedger } = useQuery({
    queryKey: ['payment-ledger', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_ledger')
        .select(`*, accounts:account_id (name)`)
        .eq('organization_id', organizationId!)
        .order('transaction_date', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Dunning query
  const { data: dunningAttempts = [] } = useQuery({
    queryKey: ['dunning-attempts', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dunning_attempts')
        .select(`*, invoices:invoice_id (invoice_number, total), accounts:account_id (name)`)
        .eq('organization_id', organizationId!)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // KPIs
  const totalInvoiced = invoices.reduce((s: number, i: unknown) => s + (i.total || 0), 0);
  const totalPaid = invoices.filter((i: unknown) => i.status === 'paid').reduce((s: number, i: unknown) => s + (i.total || 0), 0);
  const totalOverdue = invoices.filter((i: unknown) => i.status === 'overdue').reduce((s: number, i: unknown) => s + (i.amount_due || 0), 0);
  const pendingDunning = dunningAttempts.filter((d: unknown) => d.status === 'pending' || d.status === 'sent').length;

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <>
      <div className="space-y-6 p-6">
        <ModuleHeroBanner
          module="sales"
          title="Faturamento & Billing"
          subtitle="Faturas, pagamentos, livro razão e cobranças automáticas"
          compact
        />

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Faturado</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fmt(totalInvoiced)}</div>
              <p className="text-xs text-muted-foreground">{invoices.length} faturas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{fmt(totalPaid)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Vencido</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{fmt(totalOverdue)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Cobranças Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingDunning}</div>
              <p className="text-xs text-muted-foreground">dunning ativo</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="invoices"><FileText className="h-4 w-4 mr-2" />Faturas</TabsTrigger>
            <TabsTrigger value="ledger"><Receipt className="h-4 w-4 mr-2" />Livro Razão</TabsTrigger>
            <TabsTrigger value="dunning"><AlertTriangle className="h-4 w-4 mr-2" />Dunning</TabsTrigger>
          </TabsList>

          {/* Invoices */}
          <TabsContent value="invoices" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar faturas..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="sent">Enviada</SelectItem>
                  <SelectItem value="paid">Paga</SelectItem>
                  <SelectItem value="overdue">Vencida</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead>Emissão</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Pago</TableHead>
                    <TableHead className="text-right">Devido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingInvoices ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                  ) : invoices.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma fatura encontrada</TableCell></TableRow>
                  ) : invoices.map((inv: unknown) => {
                    const st = invoiceStatusConfig[inv.status] || invoiceStatusConfig.draft;
                    return (
                      <TableRow key={inv.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/sales/billing/${inv.id}`)}>
                        <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                        <TableCell className="font-medium">{inv.accounts?.name || '—'}</TableCell>
                        <TableCell className="text-sm">{format(new Date(inv.issue_date), 'dd/MM/yy', { locale: ptBR })}</TableCell>
                        <TableCell className="text-sm">{format(new Date(inv.due_date), 'dd/MM/yy', { locale: ptBR })}</TableCell>
                        <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                        <TableCell className="text-right font-mono">{fmt(inv.total)}</TableCell>
                        <TableCell className="text-right font-mono text-green-600">{fmt(inv.amount_paid)}</TableCell>
                        <TableCell className="text-right font-mono font-semibold">{fmt(inv.amount_due)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Ledger */}
          <TabsContent value="ledger" className="space-y-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Referência</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingLedger ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                  ) : ledgerEntries.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma entrada</TableCell></TableRow>
                  ) : ledgerEntries.map((entry: unknown) => {
                    const lt = ledgerTypeLabels[entry.entry_type] || ledgerTypeLabels.adjustment;
                    const LTIcon = lt.icon;
                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="text-sm">{format(new Date(entry.transaction_date), 'dd/MM/yy HH:mm', { locale: ptBR })}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <LTIcon className={`h-3 w-3 ${lt.color}`} />{lt.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{entry.accounts?.name || '—'}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{entry.description}</TableCell>
                        <TableCell className="font-mono text-xs">{entry.reference_number || '—'}</TableCell>
                        <TableCell className={`text-right font-mono font-semibold ${entry.entry_type === 'payment' || entry.entry_type === 'credit' ? 'text-green-600' : ''}`}>
                          {fmt(entry.amount)}
                        </TableCell>
                        <TableCell><Badge variant="outline">{entry.status}</Badge></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Dunning */}
          <TabsContent value="dunning" className="space-y-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fatura</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead>Tentativa #</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Enviado em</TableHead>
                    <TableHead>Próxima Tentativa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dunningAttempts.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma cobrança registrada</TableCell></TableRow>
                  ) : dunningAttempts.map((d: unknown) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-sm">{d.invoices?.invoice_number || '—'}</TableCell>
                      <TableCell className="font-medium">{d.accounts?.name || '—'}</TableCell>
                      <TableCell><Badge variant="outline">{d.attempt_number}/{d.max_attempts}</Badge></TableCell>
                      <TableCell><Badge variant="secondary">{d.channel}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={d.status === 'resolved' ? 'default' : d.status === 'failed' ? 'destructive' : 'outline'}>
                          {d.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{d.sent_at ? format(new Date(d.sent_at), 'dd/MM/yy HH:mm', { locale: ptBR }) : '—'}</TableCell>
                      <TableCell className="text-sm">{d.next_attempt_at ? format(new Date(d.next_attempt_at), 'dd/MM/yy', { locale: ptBR }) : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
