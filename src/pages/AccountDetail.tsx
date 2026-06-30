import { useState, useEffect , useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  Mail,
  Globe,
  Building2,
  MapPin,
  Users,
  DollarSign,
  Calendar,
  MoreHorizontal,
  Eye,
  Plus,
  RefreshCw,
  TrendingUp,
  FileText,
  Target,
} from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
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

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Timeline } from '@/components/Timeline';
import { NotesWidget } from '@/components/NotesWidget';
import { ActivitiesWidget } from '@/components/ActivitiesWidget';
import { format } from 'date-fns';
import { ChangeHistory } from '@/components/ChangeHistory';

interface Account {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_postal_code: string | null;
  address_country: string | null;
  description: string | null;
  source: string | null;
  tags: string[] | null;
  annual_revenue: number | null;
  employee_count: number | null;
  created_at: string;
  updated_at: string;
  owner?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  territory?: {
    name: string;
  };
  parent_account?: {
    id: string;
    name: string;
  };
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  role: string | null;
}

interface Opportunity {
  id: string;
  name: string;
  stage: string;
  amount: number | null;
  probability: number | null;
  close_date: string | null;
}

interface Quote {
  id: string;
  name: string;
  quote_number: string;
  status: string;
  total: number | null;
  created_at: string;
}

const stageColors: Record<string, string> = {
  prospecting: 'bg-info/10 text-info border-info/20',
  qualification: 'bg-warning/10 text-warning border-warning/20',
  proposal: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  negotiation: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  closed_won: 'bg-success/10 text-success border-success/20',
  closed_lost: 'bg-destructive/10 text-destructive border-destructive/20',
};

const roleColors: Record<string, string> = {
  decision_maker: 'bg-primary/10 text-primary',
  technical: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  financial: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  influencer: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  end_user: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  other: 'bg-muted text-muted-foreground',
};

export default function AccountDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [account, setAccount] = useState<Account | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (id && user) {
      fetchAccountData();
    }
  }, [id, user, fetchAccountData]);

  const fetchAccountData = useCallback( async () => {
    setLoading(true);

    // Fetch account with relations
    const { data: accountData, error: accountError } = await supabase
      .from('accounts')
      .select(`
        *,
        owner:profiles!accounts_owner_id_fkey(first_name, last_name, email),
        territory:territories!accounts_territory_id_fkey(name)
      `)
      .eq('id', id)
      .single();

    if (accountError) {
      console.error('Error fetching account:', accountError);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao carregar detalhes da conta',
      });
      navigate('/accounts');
      return;
    }

    // Fetch parent account separately if exists
    let parentAccount = null;
    if (accountData.parent_account_id) {
      const { data: parentData } = await supabase
        .from('accounts')
        .select('id, name')
        .eq('id', accountData.parent_account_id)
        .single();
      parentAccount = parentData;
    }

    setAccount({ ...accountData, parent_account: parentAccount });

    // Fetch related contacts
    const { data: contactsData } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email, phone, job_title, role')
      .eq('account_id', id)
      .order('first_name');

    setContacts(contactsData || []);

    // Fetch related opportunities
    const { data: oppsData } = await supabase
      .from('opportunities')
      .select('id, name, stage, amount, probability, close_date')
      .eq('account_id', id)
      .order('created_at', { ascending: false });

    setOpportunities(oppsData || []);

    // Fetch related quotes
    const { data: quotesData } = await supabase
      .from('quotes')
      .select('id, name, quote_number, status, total, created_at')
      .eq('account_id', id)
      .order('created_at', { ascending: false });

    setQuotes(quotesData || []);

    setLoading(false);
  }, [id, profile?.organization_id, profile?.id, toast, navigate]);

  const deleteAccount = async () => {
    if (!id) return;

    const { error } = await supabase.from('accounts').delete().eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao excluir conta',
      });
    } else {
      toast({
        title: 'Conta excluída',
        description: 'A conta foi excluída com sucesso.',
      });
      navigate('/accounts');
    }
  };

  const formatCurrency = (value: number | null) =>
    value
      ? new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          maximumFractionDigits: 0,
        }).format(value)
      : '-';

  const formatAddress = () => {
    if (!account) return null;
    const parts = [
      account.address_street,
      account.address_city,
      account.address_state,
      account.address_postal_code,
      account.address_country,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  const getOwnerName = () => {
    if (account?.owner) {
      if (account.owner.first_name || account.owner.last_name) {
        return `${account.owner.first_name || ''} ${account.owner.last_name || ''}`.trim();
      }
      return account.owner.email;
    }
    return 'Não atribuído';
  };

  // Calculate metrics
  const totalPipelineValue = opportunities
    .filter((o) => !['closed_won', 'closed_lost'].includes(o.stage))
    .reduce((sum, o) => sum + (o.amount || 0), 0);

  const totalWonValue = opportunities
    .filter((o) => o.stage === 'closed_won')
    .reduce((sum, o) => sum + (o.amount || 0), 0);

  const openOpportunities = opportunities.filter(
    (o) => !['closed_won', 'closed_lost'].includes(o.stage)
  ).length;

  if (authLoading || loading) {
    return (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    );
  }

  if (!account) {
    return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-muted-foreground">Conta não encontrada</p>
          <Button onClick={() => navigate('/accounts')}>Voltar para Contas</Button>
        </div>
    );
  }

  return (
    
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => navigate('/accounts')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{account.name}</h1>
                {account.industry && (
                  <Badge variant="secondary">{account.industry}</Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                {account.website || 'No website'}
                {account.territory && ` • ${account.territory.name}`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/accounts/${id}/edit`)}>
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
                  <AlertDialogTitle>Excluir Conta</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir esta conta? Isso também afetará contatos,
                    oportunidades e propostas relacionados. Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteAccount}>Excluir</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                <p className="text-sm text-muted-foreground">Contatos</p>
                  <p className="text-2xl font-bold">{contacts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-info/10">
                  <Target className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Negócios Abertos</p>
                  <p className="text-2xl font-bold">{openOpportunities}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-warning/10">
                  <TrendingUp className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor no Pipeline</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalPipelineValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-success/10">
                  <DollarSign className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Vitalício</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalWonValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conteúdo */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="contacts">Contatos ({contacts.length})</TabsTrigger>
                <TabsTrigger value="opportunities">Oportunidades ({opportunities.length})</TabsTrigger>
                <TabsTrigger value="quotes">Propostas ({quotes.length})</TabsTrigger>
                <TabsTrigger value="activities">Atividades</TabsTrigger>
                <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações da Conta</CardTitle>
                    <CardDescription>Detalhes da empresa e informações de contato</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Informações da Empresa */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">
                        Detalhes da Empresa
                      </h4>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {account.website && (
                          <div className="flex items-center gap-3">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <a
                              href={account.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm hover:underline"
                            >
                              {account.website}
                            </a>
                          </div>
                        )}
                        {account.phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a href={`tel:${account.phone}`} className="text-sm hover:underline">
                              {account.phone}
                            </a>
                          </div>
                        )}
                        {account.email && (
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <a href={`mailto:${account.email}`} className="text-sm hover:underline">
                              {account.email}
                            </a>
                          </div>
                        )}
                        {account.employee_count && (
                          <div className="flex items-center gap-3">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{account.employee_count.toLocaleString('pt-BR')} funcionários</span>
                          </div>
                        )}
                        {account.annual_revenue && (
                          <div className="flex items-center gap-3">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{formatCurrency(account.annual_revenue)} receita anual</span>
                          </div>
                        )}
                        {formatAddress() && (
                          <div className="flex items-start gap-3 sm:col-span-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span className="text-sm">{formatAddress()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {account.description && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-3">
                            Description
                          </h4>
                          <p className="text-sm whitespace-pre-wrap">{account.description}</p>
                        </div>
                      </>
                    )}

                    {account.tags && account.tags.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-3">Tags</h4>
                          <div className="flex flex-wrap gap-2">
                            {account.tags.map((tag) => (
                              <Badge key={tag} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {account.parent_account && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-3">
                            Parent Account
                          </h4>
                          <Link
                            to={`/accounts/${account.parent_account.id}`}
                            className="text-sm hover:underline flex items-center gap-2"
                          >
                            <Building2 className="h-4 w-4" />
                            {account.parent_account.name}
                          </Link>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contacts" className="mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Contacts</CardTitle>
                      <CardDescription>People associated with this account</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => navigate(`/contacts/new?account=${id}`)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Contact
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {contacts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                        <Users className="h-8 w-8 mb-2" />
                        <p>No contacts yet</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {contacts.map((contact) => (
                            <TableRow key={contact.id}>
                              <TableCell>
                                <Link
                                  to={`/contacts/${contact.id}`}
                                  className="font-medium hover:underline"
                                >
                                  {contact.first_name} {contact.last_name}
                                </Link>
                              </TableCell>
                              <TableCell>{contact.job_title || '-'}</TableCell>
                              <TableCell>
                                {contact.role && (
                                  <Badge variant="outline" className={roleColors[contact.role] || roleColors.other}>
                                    {contact.role.replace('_', ' ')}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>{contact.email || '-'}</TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => navigate(`/contacts/${contact.id}`)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigate(`/contacts/${contact.id}/edit`)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="opportunities" className="mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Opportunities</CardTitle>
                      <CardDescription>Sales deals for this account</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => navigate(`/opportunities/new?account=${id}`)}>
                      <Plus className="mr-2 h-4 w-4" />
                      New Opportunity
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {opportunities.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                        <Target className="h-8 w-8 mb-2" />
                        <p>No opportunities yet</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Stage</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Probability</TableHead>
                            <TableHead>Close Date</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {opportunities.map((opp) => (
                            <TableRow key={opp.id}>
                              <TableCell>
                                <Link
                                  to={`/opportunities/${opp.id}`}
                                  className="font-medium hover:underline"
                                >
                                  {opp.name}
                                </Link>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={stageColors[opp.stage] || ''}>
                                  {opp.stage.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatCurrency(opp.amount)}</TableCell>
                              <TableCell>{opp.probability}%</TableCell>
                              <TableCell>
                                {opp.close_date
                                  ? format(new Date(opp.close_date), 'MMM d, yyyy')
                                  : '-'}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => navigate(`/opportunities/${opp.id}`)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigate(`/opportunities/${opp.id}/edit`)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="quotes" className="mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Quotes</CardTitle>
                      <CardDescription>Proposals sent to this account</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => navigate(`/quotes/new?account=${id}`)}>
                      <Plus className="mr-2 h-4 w-4" />
                      New Quote
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {quotes.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                        <FileText className="h-8 w-8 mb-2" />
                        <p>No quotes yet</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Quote #</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {quotes.map((quote) => (
                            <TableRow key={quote.id}>
                              <TableCell className="font-mono text-sm">{quote.quote_number}</TableCell>
                              <TableCell>
                                <Link
                                  to={`/quotes/${quote.id}`}
                                  className="font-medium hover:underline"
                                >
                                  {quote.name}
                                </Link>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{quote.status}</Badge>
                              </TableCell>
                              <TableCell>{formatCurrency(quote.total)}</TableCell>
                              <TableCell>
                                {format(new Date(quote.created_at), 'MMM d, yyyy')}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => navigate(`/quotes/${quote.id}`)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigate(`/quotes/${quote.id}/edit`)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activities" className="mt-6">
                <ActivitiesWidget accountId={id} />
              </TabsContent>

              <TabsContent value="timeline" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Timeline</CardTitle>
                    <CardDescription>Complete history of interactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Timeline accountId={id} maxHeight="500px" />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="mt-6">
                <ChangeHistory entityType="account" entityId={id!} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Owner</span>
                  <span>{getOwnerName()}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Source</span>
                  <span>{account.source || 'Unknown'}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Industry</span>
                  <span>{account.industry || 'Not specified'}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Territory</span>
                  <span>{account.territory?.name || 'Unassigned'}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created</span>
                  <span>{format(new Date(account.created_at), 'MMM d, yyyy')}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{format(new Date(account.updated_at), 'MMM d, yyyy')}</span>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <NotesWidget accountId={id} />
          </div>
        </div>
      </div>
    
  );
}
