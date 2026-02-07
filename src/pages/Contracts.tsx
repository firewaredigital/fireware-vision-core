import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ArrowUpDown,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  Send,
  RefreshCw,
  Download,
  Copy,
  AlertTriangle,
  Building2,
} from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays, addDays } from 'date-fns';

type ContractStatus = 'draft' | 'pending_approval' | 'sent' | 'negotiating' | 'signed' | 'active' | 'expired' | 'terminated' | 'renewed';

interface Contract {
  id: string;
  contract_number: string;
  name: string;
  status: ContractStatus;
  total_value: number | null;
  recurring_value: number | null;
  start_date: string | null;
  end_date: string | null;
  signed_date: string | null;
  auto_renewal: boolean | null;
  created_at: string;
  account: {
    id: string;
    name: string;
  } | null;
  opportunity: {
    id: string;
    name: string;
  } | null;
  owner: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

const statusConfig: Record<ContractStatus, { label: string; className: string; icon: React.ReactNode }> = {
  draft: { 
    label: 'Rascunho', 
    className: 'bg-muted text-muted-foreground',
    icon: <FileText className="h-3 w-3" />
  },
  pending_approval: { 
    label: 'Aguard. Aprovação', 
    className: 'bg-warning/10 text-warning border-warning/20',
    icon: <Clock className="h-3 w-3" />
  },
  sent: { 
    label: 'Enviado', 
    className: 'bg-info/10 text-info border-info/20',
    icon: <Send className="h-3 w-3" />
  },
  negotiating: { 
    label: 'Negociando', 
    className: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    icon: <RefreshCw className="h-3 w-3" />
  },
  signed: { 
    label: 'Assinado', 
    className: 'bg-success/10 text-success border-success/20',
    icon: <CheckCircle className="h-3 w-3" />
  },
  active: { 
    label: 'Ativo', 
    className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    icon: <CheckCircle className="h-3 w-3" />
  },
  expired: { 
    label: 'Expirado', 
    className: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: <AlertTriangle className="h-3 w-3" />
  },
  terminated: { 
    label: 'Rescindido', 
    className: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: <AlertTriangle className="h-3 w-3" />
  },
  renewed: { 
    label: 'Renovado', 
    className: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    icon: <RefreshCw className="h-3 w-3" />
  },
};

export default function Contracts() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteContractId, setDeleteContractId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchContracts();
    }
  }, [user]);

  const fetchContracts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        id,
        contract_number,
        name,
        status,
        total_value,
        recurring_value,
        start_date,
        end_date,
        signed_date,
        auto_renewal,
        created_at,
        account:accounts(id, name),
        opportunity:opportunities(id, name),
        owner:profiles!contracts_owner_id_fkey(id, first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contracts:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao carregar contratos',
      });
    } else {
      setContracts((data || []) as Contract[]);
    }
    setLoading(false);
  };

  const deleteContract = async (id: string) => {
    const { error } = await supabase.from('contracts').delete().eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao excluir contrato',
      });
    } else {
      toast({
        title: 'Contrato excluído',
        description: 'O contrato foi excluído com sucesso.',
      });
      fetchContracts();
    }
    setDeleteContractId(null);
  };

  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch =
      searchQuery === '' ||
      contract.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.contract_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.account?.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const totalContracts = contracts.length;
  const activeContracts = contracts.filter(c => c.status === 'active').length;
  const expiringContracts = contracts.filter(c => {
    if (!c.end_date) return false;
    const daysUntilExpiry = differenceInDays(new Date(c.end_date), new Date());
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0 && c.status === 'active';
  }).length;
  const totalValue = contracts.reduce((sum, c) => sum + (c.total_value || 0), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getExpiryWarning = (endDate: string | null, status: ContractStatus) => {
    if (!endDate || status !== 'active') return null;
    const daysUntilExpiry = differenceInDays(new Date(endDate), new Date());
    if (daysUntilExpiry <= 0) return { label: 'Expirado', className: 'text-destructive' };
    if (daysUntilExpiry <= 30) return { label: `${daysUntilExpiry} dias`, className: 'text-warning' };
    return null;
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Contratos</h1>
            <p className="text-muted-foreground">
              Gerencie contratos de clientes e acompanhe renovações
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button size="sm" onClick={() => navigate('/contracts/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Contrato
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Contratos</p>
                  <p className="text-2xl font-bold">{totalContracts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-success/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ativos</p>
                  <p className="text-2xl font-bold">{activeContracts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-warning/10 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expirando em Breve</p>
                  <p className="text-2xl font-bold">{expiringContracts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-info/10 rounded-lg">
                  <Building2 className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar contratos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="pending_approval">Aguard. Aprovação</SelectItem>
              <SelectItem value="sent">Enviado</SelectItem>
              <SelectItem value="negotiating">Negociando</SelectItem>
              <SelectItem value="signed">Assinado</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="expired">Expirado</SelectItem>
              <SelectItem value="terminated">Rescindido</SelectItem>
              <SelectItem value="renewed">Renovado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Número</TableHead>
                <TableHead className="w-[250px]">Nome</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data Final</TableHead>
                <TableHead>Renovação Auto</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Carregando contratos...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredContracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">Nenhum contrato encontrado</p>
                      <Button variant="outline" size="sm" onClick={() => navigate('/contracts/new')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Crie seu primeiro contrato
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredContracts.map((contract) => {
                  const config = statusConfig[contract.status];
                  const expiryWarning = getExpiryWarning(contract.end_date, contract.status);
                  
                  return (
                    <TableRow key={contract.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">
                        {contract.contract_number}
                      </TableCell>
                      <TableCell>
                        <Link to={`/contracts/${contract.id}`} className="font-medium hover:underline">
                          {contract.name}
                        </Link>
                        {contract.opportunity && (
                          <p className="text-sm text-muted-foreground">
                            {contract.opportunity.name}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {contract.account ? (
                          <Link 
                            to={`/accounts/${contract.account.id}`}
                            className="hover:underline"
                          >
                            {contract.account.name}
                          </Link>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={config.className}>
                          {config.icon}
                          <span className="ml-1">{config.label}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {contract.total_value ? formatCurrency(contract.total_value) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {contract.end_date ? (
                            <>
                              <span>{format(new Date(contract.end_date), 'MMM d, yyyy')}</span>
                              {expiryWarning && (
                                <span className={`text-xs font-medium ${expiryWarning.className}`}>
                                  ({expiryWarning.label})
                                </span>
                              )}
                            </>
                          ) : '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {contract.auto_renewal ? (
                          <Badge variant="secondary">Auto</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/contracts/${contract.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/contracts/${contract.id}/edit`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteContractId(contract.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteContractId} onOpenChange={() => setDeleteContractId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Contract</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this contract? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteContractId && deleteContract(deleteContractId)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
