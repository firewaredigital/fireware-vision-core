import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileSignature, Calendar, DollarSign, AlertTriangle } from '@/components/icons';

interface Customer360ContractsProps {
  entityType: string;
  entityId: string;
}

export function Customer360Contracts({ entityType, entityId }: Customer360ContractsProps) {
  const navigate = useNavigate();

  const { data: contracts = [] } = useQuery({
    queryKey: ['c360-contracts', entityId],
    queryFn: async () => {
      const column = entityType === 'account' ? 'account_id' : 'account_id';
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq(column, entityId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!entityId,
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'expired': return 'destructive';
      case 'draft': return 'secondary';
      case 'pending_approval': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      draft: 'Rascunho', pending_approval: 'Pendente', active: 'Ativo',
      expired: 'Expirado', cancelled: 'Cancelado', renewed: 'Renovado',
      terminated: 'Encerrado',
    };
    return map[status] || status;
  };

  const isExpiringSoon = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileSignature className="h-5 w-5" />
          Contratos ({contracts.length})
        </CardTitle>
        <Button size="sm" onClick={() => navigate(`/contracts/new?account_id=${entityId}`)}>
          Novo Contrato
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {contracts.map((contract: any) => (
            <div
              key={contract.id}
              className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => navigate(`/contracts/${contract.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{contract.contract_number || contract.title}</p>
                    {contract.end_date && isExpiringSoon(contract.end_date) && (
                      <Badge variant="outline" className="text-amber-600 border-amber-600">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Expira em breve
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {contract.start_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(contract.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                        {contract.end_date && ` — ${format(new Date(contract.end_date), 'dd/MM/yyyy', { locale: ptBR })}`}
                      </span>
                    )}
                    {contract.type && <Badge variant="outline">{contract.type}</Badge>}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  {contract.total_value != null && (
                    <p className="font-bold flex items-center gap-1 justify-end">
                      <DollarSign className="h-4 w-4" />
                      {formatCurrency(contract.total_value)}
                    </p>
                  )}
                  <Badge variant={getStatusVariant(contract.status)}>
                    {getStatusLabel(contract.status)}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
          {contracts.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Nenhum contrato encontrado</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
