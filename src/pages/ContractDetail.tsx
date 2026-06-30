import { useState, useEffect , useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  DollarSign,
  Building2,
  Calendar,
  Clock,
  RefreshCw,
  Send,
  CheckCircle,
  AlertTriangle,
  User,
  Target,
  Download,
  Copy,
  History,
  FileCheck,
} from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Timeline } from '@/components/Timeline';
import { AttachmentsWidget } from '@/components/AttachmentsWidget';
import { NotesWidget } from '@/components/NotesWidget';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays } from 'date-fns';
import { ChangeHistory } from '@/components/ChangeHistory';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ContractStatus = 'draft' | 'pending_approval' | 'sent' | 'negotiating' | 'signed' | 'active' | 'expired' | 'terminated' | 'renewed';

interface Contract {
  id: string;
  contract_number: string;
  name: string;
  description: string | null;
  status: ContractStatus;
  total_value: number | null;
  recurring_value: number | null;
  billing_frequency: string | null;
  payment_terms: string | null;
  start_date: string | null;
  end_date: string | null;
  signed_date: string | null;
  sent_date: string | null;
  auto_renewal: boolean | null;
  renewal_notice_days: number | null;
  terms_and_conditions: string | null;
  special_conditions: string | null;
  version: number | null;
  created_at: string;
  updated_at: string;
  account: {
    id: string;
    name: string;
  } | null;
  contact: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
  } | null;
  opportunity: {
    id: string;
    name: string;
  } | null;
  quote: {
    id: string;
    quote_number: string;
    name: string;
  } | null;
  owner: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
}

const statusConfig: Record<ContractStatus, { label: string; className: string; icon: React.ReactNode }> = {
  draft: { 
    label: 'Rascunho', 
    className: 'bg-muted text-muted-foreground',
    icon: <FileText className="h-4 w-4" />
  },
  pending_approval: { 
    label: 'Aguardando Aprovação', 
    className: 'bg-warning/10 text-warning border-warning/20',
    icon: <Clock className="h-4 w-4" />
  },
  sent: { 
    label: 'Enviado', 
    className: 'bg-info/10 text-info border-info/20',
    icon: <Send className="h-4 w-4" />
  },
  negotiating: { 
    label: 'Em Negociação', 
    className: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    icon: <RefreshCw className="h-4 w-4" />
  },
  signed: { 
    label: 'Assinado', 
    className: 'bg-success/10 text-success border-success/20',
    icon: <CheckCircle className="h-4 w-4" />
  },
  active: { 
    label: 'Ativo', 
    className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    icon: <CheckCircle className="h-4 w-4" />
  },
  expired: { 
    label: 'Expirado', 
    className: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: <AlertTriangle className="h-4 w-4" />
  },
  terminated: { 
    label: 'Rescindido', 
    className: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: <AlertTriangle className="h-4 w-4" />
  },
  renewed: { 
    label: 'Renovado', 
    className: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    icon: <RefreshCw className="h-4 w-4" />
  },
};

const statusTransitions: Record<ContractStatus, ContractStatus[]> = {
  draft: ['pending_approval', 'sent'],
  pending_approval: ['draft', 'sent'],
  sent: ['negotiating', 'signed'],
  negotiating: ['sent', 'signed', 'terminated'],
  signed: ['active'],
  active: ['expired', 'terminated', 'renewed'],
  expired: ['renewed'],
  terminated: [],
  renewed: ['active'],
};

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);

  

  const fetchContract = useCallback( async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        account:accounts(id, name),
        contact:contacts(id, first_name, last_name, email),
        opportunity:opportunities(id, name),
        quote:quotes(id, quote_number, name),
        owner:profiles!contracts_owner_id_fkey(id, first_name, last_name, email)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching contract:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao carregar detalhes do contrato',
      });
      navigate('/contracts');
    } else {
      setContract(data as Contract);
    }
    setLoading(false);
  }, [id, profile?.organization_id, profile?.id, toast, navigate]);

  useEffect(() => {
    if (id && user) {
      fetchContract();
    }
  }, [id, user, fetchContract]);

  const deleteContract = async () => {
    if (!id) return;

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
      navigate('/contracts');
    }
  };

  const updateStatus = async (newStatus: ContractStatus) => {
    const updates: Record<string, unknown> = { status: newStatus };
    
    if (newStatus === 'sent' && !contract?.sent_date) {
      updates.sent_date = new Date().toISOString();
    }
    if (newStatus === 'signed' && !contract?.signed_date) {
      updates.signed_date = new Date().toISOString();
    }
    if (newStatus === 'active' && !contract?.start_date) {
      updates.start_date = new Date().toISOString();
    }

    const { error } = await supabase
      .from('contracts')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao atualizar status do contrato',
      });
    } else {
      // Create timeline event
      await supabase.from('timeline_events').insert([{
        organization_id: profile?.organization_id,
        event_type: 'note_added',
        title: `Contrato ${newStatus}`,
        description: `Status do contrato "${contract?.name}" alterado para ${statusConfig[newStatus].label}.`,
        account_id: contract?.account?.id,
        opportunity_id: contract?.opportunity?.id,
        created_by: profile?.id,
      }]);

      toast({
        title: 'Contrato atualizado',
        description: `Status do contrato alterado para ${statusConfig[newStatus].label}.`,
      });
      fetchContract();
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getDaysUntilExpiry = () => {
    if (!contract?.end_date) return null;
    return differenceInDays(new Date(contract.end_date), new Date());
  };

  const daysUntilExpiry = getDaysUntilExpiry();
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <FileText className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Contrato não encontrado</p>
        <Button onClick={() => navigate('/contracts')}>Voltar para Contratos</Button>
      </div>
    );
  }

  const config = statusConfig[contract.status];
  const availableTransitions = statusTransitions[contract.status] || [];

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => navigate('/contracts')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  {contract.name}
                </h1>
                <Badge variant="outline" className={config.className}>
                  {config.icon}
                  <span className="ml-1">{config.label}</span>
                </Badge>
                {contract.version && contract.version > 1 && (
                  <Badge variant="secondary">v{contract.version}</Badge>
                )}
              </div>
              <p className="text-muted-foreground font-mono">
                {contract.contract_number}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableTransitions.length > 0 && (
              <Select onValueChange={(value) => updateStatus(value as ContractStatus)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Alterar Status" />
                </SelectTrigger>
                <SelectContent>
                  {availableTransitions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusConfig[status].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" onClick={() => navigate(`/contracts/${id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Contrato</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteContract}>Excluir</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Expiry Warning */}
        {contract.status === 'active' && (isExpired || isExpiringSoon) && (
          <Card className={isExpired ? 'border-destructive' : 'border-warning'}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className={`h-5 w-5 ${isExpired ? 'text-destructive' : 'text-warning'}`} />
                <div>
                  <p className="font-medium">
                    {isExpired ? 'Contrato Expirado' : 'Contrato Expirando em Breve'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isExpired 
                      ? `Este contrato expirou há ${Math.abs(daysUntilExpiry!)} dias.`
                      : `Este contrato expirará em ${daysUntilExpiry} dias.`
                    }
                    {contract.auto_renewal && ' Renovação automática está habilitada.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="details" className="w-full">
              <TabsList>
                <TabsTrigger value="details">Detalhes</TabsTrigger>
                <TabsTrigger value="terms">Termos</TabsTrigger>
                <TabsTrigger value="attachments">Anexos</TabsTrigger>
                <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Detalhes do Contrato</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {contract.description && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Descrição</h4>
                        <p>{contract.description}</p>
                      </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Valor Total</h4>
                        <p className="text-2xl font-bold">{formatCurrency(contract.total_value)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Valor Recorrente</h4>
                        <p className="text-xl font-semibold">
                          {formatCurrency(contract.recurring_value)}
                          {contract.billing_frequency && (
                            <span className="text-sm font-normal text-muted-foreground ml-1">
                              / {contract.billing_frequency === 'monthly' ? 'mês' : contract.billing_frequency === 'quarterly' ? 'trimestre' : contract.billing_frequency === 'semi-annual' ? 'semestre' : contract.billing_frequency === 'annual' ? 'ano' : 'única'}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Data de Início</h4>
                        <p>{contract.start_date ? format(new Date(contract.start_date), "dd 'de' MMMM 'de' yyyy") : '-'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Data de Término</h4>
                        <p>{contract.end_date ? format(new Date(contract.end_date), "dd 'de' MMMM 'de' yyyy") : '-'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Data de Assinatura</h4>
                        <p>{contract.signed_date ? format(new Date(contract.signed_date), "dd 'de' MMMM 'de' yyyy") : '-'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Data de Envio</h4>
                        <p>{contract.sent_date ? format(new Date(contract.sent_date), "dd 'de' MMMM 'de' yyyy") : '-'}</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Renovação Automática</h4>
                        <Badge variant={contract.auto_renewal ? 'default' : 'secondary'}>
                          {contract.auto_renewal ? 'Habilitada' : 'Desabilitada'}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Aviso de Renovação</h4>
                        <p>{contract.renewal_notice_days ? `${contract.renewal_notice_days} dias` : '-'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Condições de Pagamento</h4>
                        <p>{contract.payment_terms || '-'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="terms" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Termos e Condições</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {contract.terms_and_conditions ? (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Termos Padrão</h4>
                        <div className="prose prose-sm max-w-none">
                          <pre className="whitespace-pre-wrap font-sans text-sm bg-muted p-4 rounded-lg">
                            {contract.terms_and_conditions}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Nenhum termo ou condição especificado.</p>
                    )}

                    {contract.special_conditions && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Condições Especiais</h4>
                        <div className="prose prose-sm max-w-none">
                          <pre className="whitespace-pre-wrap font-sans text-sm bg-warning/10 p-4 rounded-lg border border-warning/20">
                            {contract.special_conditions}
                          </pre>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="attachments" className="mt-6">
                <AttachmentsWidget
                  entityType="contract"
                  entityId={id!}
                  contractId={id}
                />
              </TabsContent>

              <TabsContent value="timeline" className="mt-6">
                <Timeline
                  accountId={contract.account?.id}
                  opportunityId={contract.opportunity?.id}
                />
              </TabsContent>

              <TabsContent value="history" className="mt-6">
                <ChangeHistory entityType="contract" entityId={id!} />
              </TabsContent>
            </Tabs>

            {/* Notes */}
            <NotesWidget
              accountId={contract.account?.id}
              opportunityId={contract.opportunity?.id}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Related Records */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Registros Relacionados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contract.account && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">Conta</p>
                      <Link
                        to={`/accounts/${contract.account.id}`}
                        className="font-medium hover:underline truncate block"
                      >
                        {contract.account.name}
                      </Link>
                    </div>
                  </div>
                )}

                {contract.contact && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">Contato</p>
                      <Link
                        to={`/contacts/${contract.contact.id}`}
                        className="font-medium hover:underline truncate block"
                      >
                        {contract.contact.first_name} {contract.contact.last_name}
                      </Link>
                      {contract.contact.email && (
                        <p className="text-sm text-muted-foreground truncate">
                          {contract.contact.email}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {contract.opportunity && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Target className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">Oportunidade</p>
                      <Link
                        to={`/opportunities/${contract.opportunity.id}`}
                        className="font-medium hover:underline truncate block"
                      >
                        {contract.opportunity.name}
                      </Link>
                    </div>
                  </div>
                )}

                {contract.quote && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <FileCheck className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">Proposta</p>
                      <Link
                        to={`/quotes/${contract.quote.id}`}
                        className="font-medium hover:underline truncate block"
                      >
                        {contract.quote.name}
                      </Link>
                      <p className="text-sm text-muted-foreground font-mono">
                        {contract.quote.quote_number}
                      </p>
                    </div>
                  </div>
                )}

                {contract.owner && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">Responsável</p>
                      <p className="font-medium truncate">
                        {contract.owner.first_name} {contract.owner.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {contract.owner.email}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informações do Contrato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Versão</span>
                  <span className="font-medium">v{contract.version || 1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Criado em</span>
                  <span className="font-medium">
                    {format(new Date(contract.created_at), 'dd/MM/yyyy')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Atualizado em</span>
                  <span className="font-medium">
                    {format(new Date(contract.updated_at), 'dd/MM/yyyy')}
                  </span>
                </div>
                {daysUntilExpiry !== null && contract.status === 'active' && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Dias até Expiração</span>
                    <Badge variant={isExpired ? 'destructive' : isExpiringSoon ? 'secondary' : 'default'}>
                      {daysUntilExpiry}
                    </Badge>
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
