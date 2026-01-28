import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/layout/AppLayout';
import { Timeline } from '@/components/Timeline';
import { AttachmentsWidget } from '@/components/AttachmentsWidget';
import { NotesWidget } from '@/components/NotesWidget';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays } from 'date-fns';
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
    label: 'Draft', 
    className: 'bg-muted text-muted-foreground',
    icon: <FileText className="h-4 w-4" />
  },
  pending_approval: { 
    label: 'Pending Approval', 
    className: 'bg-warning/10 text-warning border-warning/20',
    icon: <Clock className="h-4 w-4" />
  },
  sent: { 
    label: 'Sent', 
    className: 'bg-info/10 text-info border-info/20',
    icon: <Send className="h-4 w-4" />
  },
  negotiating: { 
    label: 'Negotiating', 
    className: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    icon: <RefreshCw className="h-4 w-4" />
  },
  signed: { 
    label: 'Signed', 
    className: 'bg-success/10 text-success border-success/20',
    icon: <CheckCircle className="h-4 w-4" />
  },
  active: { 
    label: 'Active', 
    className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    icon: <CheckCircle className="h-4 w-4" />
  },
  expired: { 
    label: 'Expired', 
    className: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: <AlertTriangle className="h-4 w-4" />
  },
  terminated: { 
    label: 'Terminated', 
    className: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: <AlertTriangle className="h-4 w-4" />
  },
  renewed: { 
    label: 'Renewed', 
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

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (id && user) {
      fetchContract();
    }
  }, [id, user]);

  const fetchContract = async () => {
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
        title: 'Error',
        description: 'Failed to load contract details',
      });
      navigate('/contracts');
    } else {
      setContract(data as Contract);
    }
    setLoading(false);
  };

  const deleteContract = async () => {
    if (!id) return;

    const { error } = await supabase.from('contracts').delete().eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete contract',
      });
    } else {
      toast({
        title: 'Contract deleted',
        description: 'The contract has been successfully deleted.',
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
        title: 'Error',
        description: 'Failed to update contract status',
      });
    } else {
      // Create timeline event
      await supabase.from('timeline_events').insert([{
        organization_id: profile?.organization_id,
        event_type: 'note_added',
        title: `Contract ${newStatus}`,
        description: `Contract "${contract?.name}" status changed to ${statusConfig[newStatus].label}.`,
        account_id: contract?.account?.id,
        opportunity_id: contract?.opportunity?.id,
        created_by: profile?.id,
      }]);

      toast({
        title: 'Contract updated',
        description: `Contract status changed to ${statusConfig[newStatus].label}.`,
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
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!contract) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <FileText className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Contract not found</p>
          <Button onClick={() => navigate('/contracts')}>Back to Contracts</Button>
        </div>
      </AppLayout>
    );
  }

  const config = statusConfig[contract.status];
  const availableTransitions = statusTransitions[contract.status] || [];

  return (
    <AppLayout>
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
                  <SelectValue placeholder="Change Status" />
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
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Contract</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this contract? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteContract}>Delete</AlertDialogAction>
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
                    {isExpired ? 'Contract Expired' : 'Contract Expiring Soon'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isExpired 
                      ? `This contract expired ${Math.abs(daysUntilExpiry!)} days ago.`
                      : `This contract will expire in ${daysUntilExpiry} days.`
                    }
                    {contract.auto_renewal && ' Auto-renewal is enabled.'}
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
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="terms">Terms</TabsTrigger>
                <TabsTrigger value="attachments">Attachments</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Contract Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {contract.description && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                        <p>{contract.description}</p>
                      </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Total Value</h4>
                        <p className="text-2xl font-bold">{formatCurrency(contract.total_value)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Recurring Value</h4>
                        <p className="text-xl font-semibold">
                          {formatCurrency(contract.recurring_value)}
                          {contract.billing_frequency && (
                            <span className="text-sm font-normal text-muted-foreground ml-1">
                              / {contract.billing_frequency}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Start Date</h4>
                        <p>{contract.start_date ? format(new Date(contract.start_date), 'MMMM d, yyyy') : '-'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">End Date</h4>
                        <p>{contract.end_date ? format(new Date(contract.end_date), 'MMMM d, yyyy') : '-'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Signed Date</h4>
                        <p>{contract.signed_date ? format(new Date(contract.signed_date), 'MMMM d, yyyy') : '-'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Sent Date</h4>
                        <p>{contract.sent_date ? format(new Date(contract.sent_date), 'MMMM d, yyyy') : '-'}</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Auto Renewal</h4>
                        <Badge variant={contract.auto_renewal ? 'default' : 'secondary'}>
                          {contract.auto_renewal ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Renewal Notice</h4>
                        <p>{contract.renewal_notice_days ? `${contract.renewal_notice_days} days` : '-'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Payment Terms</h4>
                        <p>{contract.payment_terms || '-'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="terms" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Terms & Conditions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {contract.terms_and_conditions ? (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Standard Terms</h4>
                        <div className="prose prose-sm max-w-none">
                          <pre className="whitespace-pre-wrap font-sans text-sm bg-muted p-4 rounded-lg">
                            {contract.terms_and_conditions}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No terms and conditions specified.</p>
                    )}

                    {contract.special_conditions && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Special Conditions</h4>
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
                <CardTitle className="text-base">Related Records</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contract.account && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">Account</p>
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
                      <p className="text-sm text-muted-foreground">Contact</p>
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
                      <p className="text-sm text-muted-foreground">Opportunity</p>
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
                      <p className="text-sm text-muted-foreground">Quote</p>
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
                      <p className="text-sm text-muted-foreground">Owner</p>
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
                <CardTitle className="text-base">Contract Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Version</span>
                  <span className="font-medium">v{contract.version || 1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="font-medium">
                    {format(new Date(contract.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Updated</span>
                  <span className="font-medium">
                    {format(new Date(contract.updated_at), 'MMM d, yyyy')}
                  </span>
                </div>
                {daysUntilExpiry !== null && contract.status === 'active' && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Days Until Expiry</span>
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
    </AppLayout>
  );
}
