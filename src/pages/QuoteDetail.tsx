import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  DollarSign,
  Building2,
  Target,
  Calendar,
  Clock,
  RefreshCw,
  Send,
  CheckCircle,
  XCircle,
  Download,
  Copy,
  User,
  Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { AppLayout } from '@/components/layout/AppLayout';
import { Timeline } from '@/components/Timeline';
import { useAuth } from '@/hooks/useAuth';
import { ChangeHistory } from '@/components/ChangeHistory';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
import type { Database } from '@/integrations/supabase/types';

type QuoteStatus = Database['public']['Enums']['quote_status'];

interface Quote {
  id: string;
  quote_number: string;
  name: string;
  status: QuoteStatus;
  subtotal: number | null;
  discount_percent: number | null;
  discount_amount: number | null;
  tax_percent: number | null;
  tax_amount: number | null;
  total: number | null;
  valid_until: string | null;
  terms: string | null;
  notes: string | null;
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
  contact: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
  } | null;
  owner: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface QuoteItem {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  discount_percent: number | null;
  discount_amount: number | null;
  total: number;
  product: {
    id: string;
    name: string;
    sku: string | null;
  } | null;
}

const statusConfig: Record<QuoteStatus, { label: string; className: string; icon: React.ReactNode }> = {
  draft: { 
    label: 'Rascunho', 
    className: 'bg-muted text-muted-foreground',
    icon: <FileText className="h-4 w-4" />
  },
  sent: { 
    label: 'Enviada', 
    className: 'bg-info/10 text-info border-info/20',
    icon: <Send className="h-4 w-4" />
  },
  accepted: { 
    label: 'Aceita', 
    className: 'bg-success/10 text-success border-success/20',
    icon: <CheckCircle className="h-4 w-4" />
  },
  rejected: { 
    label: 'Rejeitada', 
    className: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: <XCircle className="h-4 w-4" />
  },
  expired: { 
    label: 'Expirada', 
    className: 'bg-warning/10 text-warning border-warning/20',
    icon: <Clock className="h-4 w-4" />
  },
};

export default function QuoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (id && user) {
      fetchQuote();
      fetchItems();
    }
  }, [id, user]);

  const fetchQuote = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        account:accounts(id, name),
        opportunity:opportunities(id, name),
        contact:contacts(id, first_name, last_name, email),
        owner:profiles!quotes_owner_id_fkey(id, first_name, last_name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching quote:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao carregar detalhes da proposta',
      });
      navigate('/quotes');
    } else {
      setQuote(data);
    }
    setLoading(false);
  };

  const fetchItems = async () => {
    const { data } = await supabase
      .from('quote_items')
      .select(`
        *,
        product:products(id, name, sku)
      `)
      .eq('quote_id', id)
      .order('sort_order');

    if (data) setItems(data);
  };

  const deleteQuote = async () => {
    if (!id) return;

    await supabase.from('quote_items').delete().eq('quote_id', id);
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
      navigate('/quotes');
    }
  };

  const updateStatus = async (newStatus: QuoteStatus) => {
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
      // Create timeline event
      await supabase.from('timeline_events').insert([{
        organization_id: profile?.organization_id,
        event_type: 'quote_sent',
        title: `Proposta ${newStatus}`,
        description: `Proposta "${quote?.name}" foi marcada como ${statusConfig[newStatus].label}.`,
        account_id: quote?.account?.id,
        opportunity_id: quote?.opportunity?.id,
        quote_id: id,
        created_by: profile?.id,
      }]);

      toast({
        title: 'Proposta atualizada',
        description: `Status alterado para ${statusConfig[newStatus].label}.`,
      });
      fetchQuote();
    }
  };

  const duplicateQuote = async () => {
    if (!quote || !profile?.organization_id) return;

    const quoteNumber = `Q-${Date.now().toString(36).toUpperCase()}`;

    const { data: newQuote, error } = await supabase
      .from('quotes')
      .insert([{
        quote_number: quoteNumber,
        name: `${quote.name} (Copy)`,
        status: 'draft' as QuoteStatus,
        account_id: quote.account?.id,
        opportunity_id: quote.opportunity?.id,
        contact_id: quote.contact?.id,
        subtotal: quote.subtotal,
        discount_percent: quote.discount_percent,
        discount_amount: quote.discount_amount,
        tax_percent: quote.tax_percent,
        tax_amount: quote.tax_amount,
        total: quote.total,
        terms: quote.terms,
        notes: quote.notes,
        organization_id: profile.organization_id,
        owner_id: profile.id,
      }])
      .select()
      .single();

    if (error || !newQuote) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao duplicar proposta',
      });
      return;
    }

    // Duplicate items
    if (items.length > 0) {
      const newItems = items.map(item => ({
        quote_id: newQuote.id,
        product_id: item.product?.id || null,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percent: item.discount_percent,
        discount_amount: item.discount_amount,
        total: item.total,
      }));

      await supabase.from('quote_items').insert(newItems);
    }

    toast({
      title: 'Proposta duplicada',
      description: 'Uma cópia da proposta foi criada.',
    });

    navigate(`/quotes/${newQuote.id}/edit`);
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const isExpired = quote?.valid_until && new Date(quote.valid_until) < new Date();
  const isExpiringSoon = quote?.valid_until && !isExpired && 
    Math.ceil((new Date(quote.valid_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 7;

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!quote) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <FileText className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Proposta não encontrada</p>
          <Button onClick={() => navigate('/quotes')}>Voltar para Propostas</Button>
        </div>
      </AppLayout>
    );
  }

  const config = statusConfig[quote.status];

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
              onClick={() => navigate('/quotes')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  {quote.name}
                </h1>
                <Badge variant="outline" className={config.className}>
                  {config.icon}
                  <span className="ml-1">{config.label}</span>
                </Badge>
              </div>
              <p className="text-muted-foreground font-mono">
                {quote.quote_number}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {quote.status === 'draft' && (
              <Button variant="outline" onClick={() => updateStatus('sent')}>
                <Send className="mr-2 h-4 w-4" />
                Marcar como Enviada
              </Button>
            )}
            {quote.status === 'sent' && (
              <>
                <Button 
                  variant="outline" 
                  className="text-success hover:text-success"
                  onClick={() => updateStatus('accepted')}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Aceitar
                </Button>
                <Button 
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => updateStatus('rejected')}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Rejeitar
                </Button>
              </>
            )}
            <Button variant="outline" onClick={duplicateQuote}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicar
            </Button>
            <Button variant="outline" onClick={() => navigate(`/quotes/${id}/edit`)}>
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
                  <AlertDialogTitle>Excluir Proposta</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir esta proposta? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteQuote}>Excluir</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="items" className="w-full">
              <TabsList>
                <TabsTrigger value="items">Itens</TabsTrigger>
                <TabsTrigger value="details">Detalhes</TabsTrigger>
                <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
              </TabsList>

              <TabsContent value="items" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Itens da Proposta</CardTitle>
                    <CardDescription>
                      {items.length} {items.length !== 1 ? 'itens' : 'item'} nesta proposta
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[300px]">Item</TableHead>
                          <TableHead className="text-center">Qtd</TableHead>
                          <TableHead className="text-right">Preço Unit.</TableHead>
                          <TableHead className="text-center">Desc %</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <p className="font-medium">{item.name}</p>
                              {item.product?.sku && (
                                <p className="text-sm text-muted-foreground font-mono">
                                  {item.product.sku}
                                </p>
                              )}
                              {item.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {item.description}
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.unit_price)}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.discount_percent ? `${item.discount_percent}%` : '-'}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.total)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={4} className="text-right">
                            Subtotal
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(quote.subtotal)}
                          </TableCell>
                        </TableRow>
                        {quote.discount_percent && quote.discount_percent > 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-right text-destructive">
                              Desconto ({quote.discount_percent}%)
                            </TableCell>
                            <TableCell className="text-right text-destructive">
                              -{formatCurrency(quote.discount_amount)}
                            </TableCell>
                          </TableRow>
                        )}
                        {quote.tax_percent && quote.tax_percent > 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-right">
                              Impostos ({quote.tax_percent}%)
                            </TableCell>
                            <TableCell className="text-right">
                              +{formatCurrency(quote.tax_amount)}
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow>
                          <TableCell colSpan={4} className="text-right font-bold">
                            Total
                          </TableCell>
                          <TableCell className="text-right font-bold text-lg">
                            {formatCurrency(quote.total)}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details" className="mt-6 space-y-6">
                {quote.terms && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Termos e Condições</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{quote.terms}</p>
                    </CardContent>
                  </Card>
                )}

                {quote.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Observações Internas</CardTitle>
                      <CardDescription>Visível apenas para sua equipe</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{quote.notes}</p>
                    </CardContent>
                  </Card>
                )}

                {!quote.terms && !quote.notes && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                      <FileText className="h-8 w-8 mb-2" />
                      <p>Sem detalhes adicionais</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="timeline" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Linha do Tempo</CardTitle>
                    <CardDescription>Histórico desta proposta</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Timeline quoteId={id} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Total Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Total da Proposta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(quote.total)}
                </p>
                {quote.valid_until && (
                  <div className="mt-4 flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className={isExpired ? 'text-destructive' : isExpiringSoon ? 'text-warning' : ''}>
                      Válida até {new Date(quote.valid_until).toLocaleDateString('pt-BR')}
                    </span>
                    {isExpired && (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive text-xs">
                        Expirada
                      </Badge>
                    )}
                    {isExpiringSoon && !isExpired && (
                      <Badge variant="outline" className="bg-warning/10 text-warning text-xs">
                        Em breve
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Related Records */}
            <Card>
              <CardHeader>
                <CardTitle>Registros Relacionados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {quote.account && (
                  <div 
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/accounts/${quote.account!.id}`)}
                  >
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Conta</p>
                      <p className="font-medium">{quote.account.name}</p>
                    </div>
                  </div>
                )}

                {quote.opportunity && (
                  <div 
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/opportunities/${quote.opportunity!.id}`)}
                  >
                    <Target className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Oportunidade</p>
                      <p className="font-medium">{quote.opportunity.name}</p>
                    </div>
                  </div>
                )}

                {quote.contact && (
                  <div 
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/contacts/${quote.contact!.id}`)}
                  >
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Contato</p>
                      <p className="font-medium">
                        {quote.contact.first_name} {quote.contact.last_name}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Responsável</span>
                  <span>
                    {quote.owner?.first_name} {quote.owner?.last_name}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Criada em</span>
                  <span>{new Date(quote.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Atualizada em</span>
                  <span>{new Date(quote.updated_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
