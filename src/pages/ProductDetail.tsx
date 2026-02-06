import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  DollarSign,
  Tag,
  Calendar,
  RefreshCw,
  CheckCircle,
  XCircle,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { useAuth } from '@/hooks/useAuth';
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

interface Product {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  category: string | null;
  unit_price: number;
  cost: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface QuoteUsage {
  quote_id: string;
  quote_name: string;
  quantity: number;
  total: number;
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quoteUsage, setQuoteUsage] = useState<QuoteUsage[]>([]);
  const [stats, setStats] = useState({
    totalQuotes: 0,
    totalQuantity: 0,
    totalRevenue: 0,
  });


  useEffect(() => {
    if (id && user) {
      fetchProduct();
      fetchQuoteUsage();
    }
  }, [id, user]);

  const fetchProduct = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao carregar detalhes do produto',
      });
      navigate('/products');
    } else {
      setProduct(data);
    }
    setLoading(false);
  };

  const fetchQuoteUsage = async () => {
    const { data, error } = await supabase
      .from('quote_items')
      .select(`
        quote_id,
        quantity,
        total,
        quotes!inner(name)
      `)
      .eq('product_id', id);

    if (!error && data) {
      const usage = data.map((item: any) => ({
        quote_id: item.quote_id,
        quote_name: item.quotes.name,
        quantity: item.quantity,
        total: item.total,
      }));
      setQuoteUsage(usage);
      
      // Calculate stats
      setStats({
        totalQuotes: new Set(usage.map(u => u.quote_id)).size,
        totalQuantity: usage.reduce((sum, u) => sum + u.quantity, 0),
        totalRevenue: usage.reduce((sum, u) => sum + u.total, 0),
      });
    }
  };

  const deleteProduct = async () => {
    if (!id) return;

    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao excluir produto. Ele pode estar sendo usado em propostas.',
      });
    } else {
      toast({
        title: 'Produto excluído',
        description: 'O produto foi excluído com sucesso.',
      });
      navigate('/products');
    }
  };

  const toggleStatus = async () => {
    if (!product) return;

    const { error } = await supabase
      .from('products')
      .update({ is_active: !product.is_active })
      .eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao atualizar status do produto',
      });
    } else {
      toast({
        title: 'Produto atualizado',
        description: `Produto ${!product.is_active ? 'ativado' : 'desativado'} com sucesso.`,
      });
      fetchProduct();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (authLoading || loading) {
    return (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    );
  }

  if (!product) {
    return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Package className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Produto não encontrado</p>
          <Button onClick={() => navigate('/products')}>Voltar para Produtos</Button>
        </div>
    );
  }

  const margin = product.cost 
    ? ((product.unit_price - product.cost) / product.unit_price * 100).toFixed(1)
    : null;

  return (
    
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => navigate('/products')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  {product.name}
                </h1>
                <Badge 
                  variant="outline" 
                  className={product.is_active 
                    ? 'bg-success/10 text-success border-success/20' 
                    : 'bg-muted text-muted-foreground'
                  }
                >
                  {product.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              {product.sku && (
                <p className="text-muted-foreground font-mono">
                  SKU: {product.sku}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={toggleStatus}>
              {product.is_active ? (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Desativar
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Ativar
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => navigate(`/products/${id}/edit`)}>
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
                  <AlertDialogTitle>Excluir Produto</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
                    Produtos utilizados em propostas não podem ser excluídos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteProduct}>Excluir</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Informações do Produto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {product.description && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      Descrição
                    </h4>
                    <p className="text-sm whitespace-pre-wrap">{product.description}</p>
                  </div>
                )}

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Categoria</p>
                      <p className="font-medium">{product.category || 'Sem categoria'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Criado em</p>
                      <p className="font-medium">
                        {new Date(product.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quote Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Uso em Propostas
                </CardTitle>
                <CardDescription>
                  Propostas que contêm este produto
                </CardDescription>
              </CardHeader>
              <CardContent>
                {quoteUsage.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
                    <FileText className="h-8 w-8 mb-2" />
                    <p>Ainda não utilizado em nenhuma proposta</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {quoteUsage.slice(0, 5).map((usage) => (
                      <div
                        key={`${usage.quote_id}`}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                        onClick={() => navigate(`/quotes/${usage.quote_id}`)}
                      >
                        <div>
                          <p className="font-medium">{usage.quote_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Qtd: {usage.quantity}
                          </p>
                        </div>
                        <p className="font-medium">{formatCurrency(usage.total)}</p>
                      </div>
                    ))}
                    {quoteUsage.length > 5 && (
                      <p className="text-sm text-muted-foreground text-center">
                        E mais {quoteUsage.length - 5} propostas...
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Precificação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Preço Unitário</span>
                  <span className="text-2xl font-bold">
                    {formatCurrency(product.unit_price)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Custo</span>
                  <span className="font-medium">
                    {product.cost ? formatCurrency(product.cost) : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Margem</span>
                  {margin ? (
                    <span className={`font-medium ${Number(margin) >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {margin}%
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Usage Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Estatísticas de Uso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total de Propostas</span>
                  <span className="font-bold">{stats.totalQuotes}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Quantidade Total</span>
                  <span className="font-bold">{stats.totalQuantity}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Receita Total</span>
                  <span className="font-bold text-success">
                    {formatCurrency(stats.totalRevenue)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Última Atualização</span>
                  <span>{new Date(product.updated_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    
  );
}
