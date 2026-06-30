import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  Search,
  Package,
  Calculator,
  Calendar,
  Building2,
  Target,
  FileText,
  X,
  Percent,
} from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type QuoteStatus = Database['public']['Enums']['quote_status'];

interface Product {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  category: string | null;
  unit_price: number;
  is_active: boolean;
}

interface QuoteItem {
  id: string;
  product_id: string | null;
  name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  total: number;
  sort_order: number;
}

interface Account {
  id: string;
  name: string;
}

interface Opportunity {
  id: string;
  name: string;
  account_id: string;
}

const quoteSchema = z.object({
  name: z.string().min(1, 'Nome da proposta é obrigatório').max(255),
  account_id: z.string().min(1, 'Conta é obrigatória'),
  opportunity_id: z.string().optional(),
  contact_id: z.string().optional(),
  valid_until: z.date().optional(),
  discount_percent: z.coerce.number().min(0).max(100).default(0),
  tax_percent: z.coerce.number().min(0).max(100).default(0),
  terms: z.string().max(5000).optional(),
  notes: z.string().max(5000).optional(),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

export default function QuoteForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchingQuote, setFetchingQuote] = useState(!!id);
  
  // Data
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<QuoteItem[]>([]);
  
  // UI state
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [quoteNumber, setQuoteNumber] = useState('');

  const isEditing = !!id;

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      name: '',
      account_id: '',
      opportunity_id: '',
      contact_id: '',
      valid_until: undefined,
      discount_percent: 0,
      tax_percent: 0,
      terms: '',
      notes: '',
    },
  });

  const selectedAccountId = form.watch('account_id');
  const discountPercent = form.watch('discount_percent') || 0;
  const taxPercent = form.watch('tax_percent') || 0;

  useEffect(() => {
    fetchAccounts();
    fetchProducts();
    if (!id) {
      generateQuoteNumber();
    }
  }, [id]);

  useEffect(() => {
    if (selectedAccountId) {
      fetchOpportunities(selectedAccountId);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    if (id && user) {
      fetchQuote();
    }
  }, [id, user, fetchQuote]);

  const generateQuoteNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    setQuoteNumber(`Q-${timestamp}`);
  };

  const fetchAccounts = async () => {
    const { data } = await supabase
      .from('accounts')
      .select('id, name')
      .order('name');
    if (data) setAccounts(data);
  };

  const fetchOpportunities = async (accountId: string) => {
    const { data } = await supabase
      .from('opportunities')
      .select('id, name, account_id')
      .eq('account_id', accountId)
      .order('name');
    if (data) setOpportunities(data);
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, sku, description, category, unit_price, is_active')
      .eq('is_active', true)
      .order('name');
    if (data) setProducts(data);
  };

  const fetchQuote = useCallback( async () => {
    setFetchingQuote(true);
    
    // Fetch quote
    const { data: quoteData, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single();

    if (quoteError || !quoteData) {
      console.error('Error fetching quote:', quoteError);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao carregar proposta',
      });
      navigate('/quotes');
      return;
    }

    // Set quote number
    setQuoteNumber(quoteData.quote_number);

    // Set form values
    form.reset({
      name: quoteData.name,
      account_id: quoteData.account_id,
      opportunity_id: quoteData.opportunity_id || '',
      contact_id: quoteData.contact_id || '',
      valid_until: quoteData.valid_until ? new Date(quoteData.valid_until) : undefined,
      discount_percent: quoteData.discount_percent || 0,
      tax_percent: quoteData.tax_percent || 0,
      terms: quoteData.terms || '',
      notes: quoteData.notes || '',
    });

    // Fetch items
    const { data: itemsData } = await supabase
      .from('quote_items')
      .select('*')
      .eq('quote_id', id)
      .order('sort_order');

    if (itemsData) {
      setItems(itemsData.map(item => ({
        id: item.id,
        product_id: item.product_id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percent: item.discount_percent || 0,
        discount_amount: item.discount_amount || 0,
        total: item.total,
        sort_order: item.sort_order || 0,
      })));
    }

    setFetchingQuote(false);
  }, [id, toast, form]);

  // Add product to quote
  const addProduct = (product: Product) => {
    const newItem: QuoteItem = {
      id: `temp-${Date.now()}`,
      product_id: product.id,
      name: product.name,
      description: product.description,
      quantity: 1,
      unit_price: product.unit_price,
      discount_percent: 0,
      discount_amount: 0,
      total: product.unit_price,
      sort_order: items.length,
    };
    setItems([...items, newItem]);
    setProductDialogOpen(false);
    setProductSearch('');
  };

  // Add custom item
  const addCustomItem = () => {
    const newItem: QuoteItem = {
      id: `temp-${Date.now()}`,
      product_id: null,
      name: 'Custom Item',
      description: null,
      quantity: 1,
      unit_price: 0,
      discount_percent: 0,
      discount_amount: 0,
      total: 0,
      sort_order: items.length,
    };
    setItems([...items, newItem]);
  };

  // Update item
  const updateItem = (itemId: string, field: keyof QuoteItem, value: unknown) => {
    setItems(items.map(item => {
      if (item.id !== itemId) return item;

      const updated = { ...item, [field]: value };
      
      // Recalculate totals
      if (['quantity', 'unit_price', 'discount_percent'].includes(field)) {
        const subtotal = updated.quantity * updated.unit_price;
        updated.discount_amount = subtotal * (updated.discount_percent / 100);
        updated.total = subtotal - updated.discount_amount;
      }
      
      return updated;
    }));
  };

  // Remove item
  const removeItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  // Drag and drop handler
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const reorderedItems = Array.from(items);
    const [removed] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, removed);

    // Update sort orders
    const updatedItems = reorderedItems.map((item, index) => ({
      ...item,
      sort_order: index,
    }));

    setItems(updatedItems);
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const globalDiscount = subtotal * (discountPercent / 100);
  const afterDiscount = subtotal - globalDiscount;
  const taxAmount = afterDiscount * (taxPercent / 100);
  const total = afterDiscount + taxAmount;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const onSubmit = async (data: QuoteFormData) => {
    if (!profile?.organization_id) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Você precisa fazer parte de uma organização para gerenciar propostas.',
      });
      return;
    }

    if (items.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Adicione pelo menos um item à proposta.',
      });
      return;
    }

    setLoading(true);

    const quoteData = {
      quote_number: quoteNumber,
      name: data.name,
      account_id: data.account_id,
      opportunity_id: data.opportunity_id || null,
      contact_id: data.contact_id || null,
      valid_until: data.valid_until?.toISOString().split('T')[0] || null,
      discount_percent: data.discount_percent || 0,
      discount_amount: globalDiscount,
      tax_percent: data.tax_percent || 0,
      tax_amount: taxAmount,
      subtotal: subtotal,
      total: total,
      terms: data.terms || null,
      notes: data.notes || null,
      organization_id: profile.organization_id,
      owner_id: profile.id,
      status: 'draft' as QuoteStatus,
    };

    try {
      let quoteId: string;

      if (isEditing) {
        const { error } = await supabase
          .from('quotes')
          .update(quoteData)
          .eq('id', id);

        if (error) throw error;
        quoteId = id!;

        // Delete existing items and insert new ones
        await supabase.from('quote_items').delete().eq('quote_id', quoteId);
      } else {
        const { data: newQuote, error } = await supabase
          .from('quotes')
          .insert([quoteData])
          .select()
          .single();

        if (error) throw error;
        quoteId = newQuote.id;
      }

      // Insert items
      const itemsToInsert = items.map((item, index) => ({
        quote_id: quoteId,
        product_id: item.product_id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percent: item.discount_percent,
        discount_amount: item.discount_amount,
        total: item.total,
        sort_order: index,
      }));

      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Create timeline event
      await supabase.from('timeline_events').insert([{
        organization_id: profile.organization_id,
        event_type: 'quote_created',
        title: isEditing ? 'Proposta atualizada' : 'Proposta criada',
        description: `Proposta "${data.name}" foi ${isEditing ? 'atualizada' : 'criada'} com total ${formatCurrency(total)}.`,
        account_id: data.account_id,
        opportunity_id: data.opportunity_id || null,
        quote_id: quoteId,
        created_by: profile.id,
        metadata: {
          quote_number: quoteNumber,
          total: total,
          items_count: items.length,
        },
      }]);

      toast({
        title: isEditing ? 'Proposta atualizada' : 'Proposta criada',
        description: `A proposta ${quoteNumber} foi salva com sucesso.`,
      });

      navigate(`/quotes/${quoteId}`);
    } catch (error: unknown) {
      console.error('Error saving quote:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Falha ao salvar proposta',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku?.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category?.toLowerCase().includes(productSearch.toLowerCase())
  );

  if (authLoading || fetchingQuote) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/quotes')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {isEditing ? 'Editar Proposta' : 'Nova Proposta'}
              </h1>
              <Badge variant="outline" className="font-mono">
                {quoteNumber}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {isEditing ? 'Atualize os detalhes e itens da proposta' : 'Crie uma nova proposta comercial para seu cliente'}
            </p>
          </div>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Proposta
              </>
            )}
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Quote Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Detalhes da Proposta
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Proposta *</FormLabel>
                          <FormControl>
                            <Input placeholder="Pacote de Software Empresarial" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="account_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Conta *</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a conta">
                                    {field.value && (
                                      <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4" />
                                        {accounts.find(a => a.id === field.value)?.name}
                                      </div>
                                    )}
                                  </SelectValue>
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {accounts.map((account) => (
                                  <SelectItem key={account.id} value={account.id}>
                                    {account.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="opportunity_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Oportunidade</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={!selectedAccountId}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={selectedAccountId ? "Selecione a oportunidade" : "Selecione a conta primeiro"}>
                                    {field.value && (
                                      <div className="flex items-center gap-2">
                                        <Target className="h-4 w-4" />
                                        {opportunities.find(o => o.id === field.value)?.name}
                                      </div>
                                    )}
                                  </SelectValue>
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">Nenhuma</SelectItem>
                                {opportunities.map((opp) => (
                                  <SelectItem key={opp.id} value={opp.id}>
                                    {opp.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="valid_until"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Válida até</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "dd/MM/yyyy")
                                  ) : (
                                    <span>Selecione uma data</span>
                                  )}
                                  <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            Data de expiração da proposta
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Line Items */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Itens da Proposta
                      </CardTitle>
                      <CardDescription>
                        Produtos e serviços incluídos nesta proposta
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addCustomItem}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Item Personalizado
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setProductDialogOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Produto
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {items.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground border-2 border-dashed rounded-lg">
                        <Package className="h-8 w-8 mb-2" />
                        <p>Nenhum item adicionado ainda</p>
                        <p className="text-sm">Clique em "Adicionar Produto" para começar</p>
                      </div>
                    ) : (
                      <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="quote-items">
                          {(provided) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className="space-y-3"
                            >
                              {/* Header */}
                              <div className="grid grid-cols-12 gap-2 px-2 text-sm font-medium text-muted-foreground">
                                <div className="col-span-1"></div>
                                <div className="col-span-4">Item</div>
                                <div className="col-span-1 text-center">Qtd</div>
                                <div className="col-span-2 text-right">Preço Unit.</div>
                                <div className="col-span-1 text-center">Desc %</div>
                                <div className="col-span-2 text-right">Total</div>
                                <div className="col-span-1"></div>
                              </div>

                              {items.map((item, index) => (
                                <Draggable
                                  key={item.id}
                                  draggableId={item.id}
                                  index={index}
                                >
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={cn(
                                        "grid grid-cols-12 gap-2 items-center p-3 rounded-lg border bg-card",
                                        snapshot.isDragging && "shadow-lg"
                                      )}
                                    >
                                      <div
                                        {...provided.dragHandleProps}
                                        className="col-span-1 flex justify-center cursor-grab"
                                      >
                                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                                      </div>
                                      
                                      <div className="col-span-4">
                                        <Input
                                          value={item.name}
                                          onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                          className="font-medium"
                                        />
                                        {item.product_id && (
                                          <p className="text-xs text-muted-foreground mt-1">
                                            Do catálogo
                                          </p>
                                        )}
                                      </div>
                                      
                                      <div className="col-span-1">
                                        <Input
                                          type="number"
                                          min="1"
                                          value={item.quantity}
                                          onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                          className="text-center"
                                        />
                                      </div>
                                      
                                      <div className="col-span-2">
                                        <Input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={item.unit_price}
                                          onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                          className="text-right"
                                        />
                                      </div>
                                      
                                      <div className="col-span-1">
                                        <Input
                                          type="number"
                                          min="0"
                                          max="100"
                                          value={item.discount_percent}
                                          onChange={(e) => updateItem(item.id, 'discount_percent', parseFloat(e.target.value) || 0)}
                                          className="text-center"
                                        />
                                      </div>
                                      
                                      <div className="col-span-2 text-right font-medium">
                                        {formatCurrency(item.total)}
                                      </div>
                                      
                                      <div className="col-span-1 flex justify-center">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                          onClick={() => removeItem(item.id)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    )}
                  </CardContent>
                </Card>

                {/* Terms & Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Termos e Observações</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="terms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Termos e Condições</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Condições de pagamento, entrega, garantias..."
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Internal Notes</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Notes visible only to your team..."
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            These notes will not be shown to the customer
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar - Summary */}
              <div className="space-y-6">
                <Card className="sticky top-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Items ({items.length})</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <FormField
                        control={form.control}
                        name="discount_percent"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel className="text-sm text-muted-foreground">
                                Discount
                              </FormLabel>
                              <div className="flex items-center gap-1">
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="w-16 h-8 text-right text-sm"
                                    {...field}
                                  />
                                </FormControl>
                                <Percent className="h-3 w-3 text-muted-foreground" />
                              </div>
                            </div>
                          </FormItem>
                        )}
                      />
                      {discountPercent > 0 && (
                        <div className="flex justify-between text-sm text-destructive">
                          <span></span>
                          <span>-{formatCurrency(globalDiscount)}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <FormField
                        control={form.control}
                        name="tax_percent"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel className="text-sm text-muted-foreground">
                                Tax
                              </FormLabel>
                              <div className="flex items-center gap-1">
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="w-16 h-8 text-right text-sm"
                                    {...field}
                                  />
                                </FormControl>
                                <Percent className="h-3 w-3 text-muted-foreground" />
                              </div>
                            </div>
                          </FormItem>
                        )}
                      />
                      {taxPercent > 0 && (
                        <div className="flex justify-between text-sm">
                          <span></span>
                          <span>+{formatCurrency(taxAmount)}</span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total</span>
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(total)}
                      </span>
                    </div>

                    <Separator />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading || items.length === 0}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Quote
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </Form>

        {/* Product Selection Dialog */}
        <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Add Product</DialogTitle>
              <DialogDescription>
                Select a product from your catalog to add to the quote
              </DialogDescription>
            </DialogHeader>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px]">
              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Package className="h-8 w-8 mb-2" />
                  <p>No products found</p>
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    onClick={() => addProduct(product)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{product.name}</p>
                        {product.category && (
                          <Badge variant="secondary" className="text-xs">
                            {product.category}
                          </Badge>
                        )}
                      </div>
                      {product.sku && (
                        <p className="text-sm text-muted-foreground font-mono">
                          {product.sku}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(product.unit_price)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
