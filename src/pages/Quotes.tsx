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
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  RefreshCw,
  Download,
  Copy,
  Filter,
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
import type { Database } from '@/integrations/supabase/types';

type QuoteStatus = Database['public']['Enums']['quote_status'];

interface Quote {
  id: string;
  quote_number: string;
  name: string;
  status: QuoteStatus;
  total: number | null;
  subtotal: number | null;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
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

const statusConfig: Record<QuoteStatus, { label: string; className: string; icon: React.ReactNode }> = {
  draft: { 
    label: 'Rascunho', 
    className: 'bg-muted text-muted-foreground',
    icon: <FileText className="h-3 w-3" />
  },
  sent: { 
    label: 'Enviada', 
    className: 'bg-info/10 text-info border-info/20',
    icon: <Send className="h-3 w-3" />
  },
  accepted: { 
    label: 'Aceita', 
    className: 'bg-success/10 text-success border-success/20',
    icon: <CheckCircle className="h-3 w-3" />
  },
  rejected: { 
    label: 'Rejeitada', 
    className: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: <XCircle className="h-3 w-3" />
  },
  expired: { 
    label: 'Expirada', 
    className: 'bg-warning/10 text-warning border-warning/20',
    icon: <Clock className="h-3 w-3" />
  },
};

export default function Quotes() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteQuoteId, setDeleteQuoteId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchQuotes();
    }
  }, [user]);

  const fetchQuotes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        id,
        quote_number,
        name,
        status,
        total,
        subtotal,
        valid_until,
        created_at,
        updated_at,
        account:accounts(id, name),
        opportunity:opportunities(id, name),
        owner:profiles!quotes_owner_id_fkey(id, first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching quotes:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao carregar propostas',
      });
    } else {
      setQuotes(data || []);
    }
    setLoading(false);
  };

  const deleteQuote = async (id: string) => {
    // First delete quote items
    await supabase.from('quote_items').delete().eq('quote_id', id);
    
    // Then delete the quote
    const { error } = await supabase.from('quotes').delete().eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao excluir proposta',
      });
    } else {
      toast({
        title: 'Proposta excluída',
        description: 'A proposta foi excluída com sucesso.',
      });
      fetchQuotes();
    }
    setDeleteQuoteId(null);
  };

  const updateQuoteStatus = async (id: string, newStatus: QuoteStatus) => {
    const { error } = await supabase
      .from('quotes')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao atualizar status da proposta',
      });
    } else {
      toast({
        title: 'Proposta atualizada',
        description: `Status da proposta alterado para ${statusConfig[newStatus].label}.`,
      });
      fetchQuotes();
    }
  };

  const duplicateQuote = async (quote: Quote) => {
    // Fetch the original quote with items
    const { data: originalItems } = await supabase
      .from('quote_items')
      .select('*')
      .eq('quote_id', quote.id);

    // Generate new quote number
    const quoteNumber = `Q-${Date.now().toString(36).toUpperCase()}`;

    // Create new quote
    const { data: newQuote, error: quoteError } = await supabase
      .from('quotes')
      .insert([{
        quote_number: quoteNumber,
        name: `${quote.name} (Copy)`,
        status: 'draft' as QuoteStatus,
        account_id: quote.account?.id,
        opportunity_id: quote.opportunity?.id,
        subtotal: quote.subtotal,
        total: quote.total,
        organization_id: (await supabase.from('quotes').select('organization_id').eq('id', quote.id).single()).data?.organization_id,
        owner_id: user?.id,
      }])
      .select()
      .single();

    if (quoteError || !newQuote) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao duplicar proposta',
      });
      return;
    }

    // Duplicate items
    if (originalItems && originalItems.length > 0) {
      const newItems = originalItems.map(item => ({
        quote_id: newQuote.id,
        product_id: item.product_id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percent: item.discount_percent,
        discount_amount: item.discount_amount,
        total: item.total,
        sort_order: item.sort_order,
      }));

      await supabase.from('quote_items').insert(newItems);
    }

    toast({
      title: 'Proposta duplicada',
      description: 'Uma cópia da proposta foi criada.',
    });

    navigate(`/quotes/${newQuote.id}/edit`);
  };

  const filteredQuotes = quotes.filter((quote) => {
    const matchesSearch =
      searchQuery === '' ||
      quote.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.quote_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.account?.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const totalQuotes = quotes.length;
  const draftQuotes = quotes.filter(q => q.status === 'draft').length;
  const sentQuotes = quotes.filter(q => q.status === 'sent').length;
  const totalValue = quotes.reduce((sum, q) => sum + (q.total || 0), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const isExpiringSoon = (validUntil: string | null) => {
    if (!validUntil) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  const isExpired = (validUntil: string | null) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Propostas</h1>
            <p className="text-muted-foreground">
              Crie e gerencie propostas para seus clientes
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button size="sm" onClick={() => navigate('/quotes/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Proposta
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
                  <p className="text-sm text-muted-foreground">Total de Propostas</p>
                  <p className="text-2xl font-bold">{totalQuotes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-muted rounded-lg">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rascunhos</p>
                  <p className="text-2xl font-bold">{draftQuotes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-info/10 rounded-lg">
                  <Send className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Enviadas</p>
                  <p className="text-2xl font-bold">{sentQuotes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-success/10 rounded-lg">
                  <DollarSign className="h-5 w-5 text-success" />
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
              placeholder="Buscar propostas..."
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
              <SelectItem value="sent">Enviada</SelectItem>
              <SelectItem value="accepted">Aceita</SelectItem>
              <SelectItem value="rejected">Rejeitada</SelectItem>
              <SelectItem value="expired">Expirada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Número</TableHead>
                <TableHead className="w-[250px]">
                  <Button variant="ghost" className="p-0 hover:bg-transparent">
                    Nome
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Conta</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Válida Até</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Carregando propostas...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredQuotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">Nenhuma proposta encontrada</p>
                      <Button variant="outline" size="sm" onClick={() => navigate('/quotes/new')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Crie sua primeira proposta
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuotes.map((quote) => {
                  const config = statusConfig[quote.status];
                  const expiringSoon = isExpiringSoon(quote.valid_until);
                  const expired = isExpired(quote.valid_until);
                  
                  return (
                    <TableRow key={quote.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">
                        {quote.quote_number}
                      </TableCell>
                      <TableCell>
                        <Link to={`/quotes/${quote.id}`} className="font-medium hover:underline">
                          {quote.name}
                        </Link>
                        {quote.opportunity && (
                          <p className="text-sm text-muted-foreground">
                            {quote.opportunity.name}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {quote.account ? (
                          <Link 
                            to={`/accounts/${quote.account.id}`}
                            className="hover:underline"
                          >
                            {quote.account.name}
                          </Link>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={config.className}>
                          <span className="mr-1">{config.icon}</span>
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {quote.total ? formatCurrency(quote.total) : '-'}
                      </TableCell>
                      <TableCell>
                        {quote.valid_until ? (
                          <div className="flex items-center gap-2">
                            <span className={expired ? 'text-destructive' : expiringSoon ? 'text-warning' : ''}>
                              {new Date(quote.valid_until).toLocaleDateString('pt-BR')}
                            </span>
                            {expiringSoon && !expired && (
                              <Badge variant="outline" className="bg-warning/10 text-warning text-xs">
                                Soon
                              </Badge>
                            )}
                            {expired && (
                              <Badge variant="outline" className="bg-destructive/10 text-destructive text-xs">
                                Expired
                              </Badge>
                            )}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(quote.created_at).toLocaleDateString('pt-BR')}
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
                            <DropdownMenuItem onClick={() => duplicateQuote(quote)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {quote.status === 'draft' && (
                              <DropdownMenuItem onClick={() => updateQuoteStatus(quote.id, 'sent')}>
                                <Send className="mr-2 h-4 w-4" />
                                Mark as Sent
                              </DropdownMenuItem>
                            )}
                            {quote.status === 'sent' && (
                              <>
                                <DropdownMenuItem onClick={() => updateQuoteStatus(quote.id, 'accepted')}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Mark as Accepted
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateQuoteStatus(quote.id, 'rejected')}>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Mark as Rejected
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteQuoteId(quote.id)}
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

        {/* Pagination */}
        {filteredQuotes.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredQuotes.length} of {quotes.length} quotes
            </p>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteQuoteId} onOpenChange={() => setDeleteQuoteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Quote</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this quote? This will also delete all line items.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteQuoteId && deleteQuote(deleteQuoteId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
