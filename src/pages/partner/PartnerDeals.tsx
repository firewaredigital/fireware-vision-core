import { PartnerLayout } from './PartnerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Handshake, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Enviado',
  under_review: 'Em Análise',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  won: 'Ganho',
  lost: 'Perdido',
};

const TYPE_LABELS: Record<string, string> = {
  lead_referral: 'Indicação de Lead',
  co_sell: 'Co-Sell',
  resale: 'Revenda',
};

function getPartnerSession() {
  try {
    const session = localStorage.getItem('partner_session');
    return session ? JSON.parse(session) : null;
  } catch { return null; }
}

export default function PartnerDeals() {
  const navigate = useNavigate();
  const session = getPartnerSession();
  const partnerId = session?.partner_id;
  const orgId = session?.organization_id;
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const { data: deals, isLoading } = useQuery({
    queryKey: ['partner-deals', partnerId, statusFilter, typeFilter],
    queryFn: async () => {
      if (!partnerId || !orgId) return [];
      let query = supabase
        .from('partner_deals')
        .select('*')
        .eq('partner_id', partnerId)
        .eq('organization_id', orgId)
        .order('submitted_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }
      if (typeFilter !== 'all') {
        query = query.eq('deal_type', typeFilter as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!partnerId && !!orgId,
  });

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <PartnerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Deals & Indicações</h1>
          <Button className="gap-2" onClick={() => navigate('/partner/deals/new')}>
            <Plus className="h-4 w-4" /> Nova Indicação
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
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
            ) : deals && deals.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor do Deal</TableHead>
                    <TableHead>Comissão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Status Comissão</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deals.map((deal) => (
                    <TableRow key={deal.id}>
                      <TableCell className="font-medium">{TYPE_LABELS[deal.deal_type] || deal.deal_type}</TableCell>
                      <TableCell>{formatCurrency(Number(deal.deal_value))}</TableCell>
                      <TableCell>{formatCurrency(Number(deal.commission_amount))}</TableCell>
                      <TableCell>
                        <Badge variant={
                          deal.status === 'won' ? 'default' :
                          deal.status === 'lost' || deal.status === 'rejected' ? 'destructive' :
                          'secondary'
                        }>
                          {STATUS_LABELS[deal.status] || deal.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={deal.commission_status === 'paid' ? 'default' : 'outline'}>
                          {deal.commission_status === 'pending' ? 'Pendente' :
                           deal.commission_status === 'approved' ? 'Aprovada' :
                           deal.commission_status === 'paid' ? 'Paga' : deal.commission_status}
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
              <div className="p-12 text-center text-muted-foreground">
                <Handshake className="h-12 w-12 mx-auto mb-3" />
                <p className="text-lg font-medium">Nenhum deal registrado</p>
                <p className="text-sm mt-1">Registre indicações de leads para iniciar o processo de comissão.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PartnerLayout>
  );
}
