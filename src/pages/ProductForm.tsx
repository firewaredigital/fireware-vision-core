import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Loader2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const productSchema = z.object({
  name: z.string().min(1, 'O nome do produto é obrigatório').max(255, 'O nome deve ter no máximo 255 caracteres'),
  sku: z.string().max(100, 'O SKU deve ter no máximo 100 caracteres').optional().or(z.literal('')),
  description: z.string().max(2000, 'A descrição deve ter no máximo 2000 caracteres').optional().or(z.literal('')),
  category: z.string().max(100, 'A categoria deve ter no máximo 100 caracteres').optional().or(z.literal('')),
  unit_price: z.coerce.number().min(0, 'O preço deve ser positivo'),
  cost: z.coerce.number().min(0, 'O custo deve ser positivo').optional().or(z.literal('')),
  is_active: z.boolean().default(true),
});

type ProductFormData = z.infer<typeof productSchema>;

const PRESET_CATEGORIES = [
  'Software',
  'Hardware',
  'Serviços',
  'Consultoria',
  'Suporte',
  'Treinamento',
  'Licença',
  'Assinatura',
  'Implementação',
  'Outros',
];

export default function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(!!id);
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [customCategory, setCustomCategory] = useState(false);

  const isEditing = !!id;

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      description: '',
      category: '',
      unit_price: 0,
      cost: undefined,
      is_active: true,
    },
  });


  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (id && user) {
      fetchProduct();
    }
  }, [id, user]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('products')
      .select('category')
      .not('category', 'is', null);

    if (data) {
      const uniqueCategories = [...new Set(data.map(p => p.category).filter(Boolean) as string[])];
      setExistingCategories(uniqueCategories);
    }
  };

  const fetchProduct = async () => {
    setFetchingProduct(true);
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
        description: 'Falha ao carregar produto',
      });
      navigate('/products');
    } else if (data) {
      form.reset({
        name: data.name,
        sku: data.sku || '',
        description: data.description || '',
        category: data.category || '',
        unit_price: data.unit_price,
        cost: data.cost || undefined,
        is_active: data.is_active,
      });
      
      // Check if category is custom
      const allCategories = [...PRESET_CATEGORIES, ...existingCategories];
      if (data.category && !allCategories.includes(data.category)) {
        setCustomCategory(true);
      }
    }
    setFetchingProduct(false);
  };

  const onSubmit = async (data: ProductFormData) => {
    if (!profile?.organization_id) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Você precisa fazer parte de uma organização para gerenciar produtos.',
      });
      return;
    }

    setLoading(true);

    const productData = {
      name: data.name,
      sku: data.sku || null,
      description: data.description || null,
      category: data.category || null,
      unit_price: data.unit_price,
      cost: data.cost ? Number(data.cost) : null,
      is_active: data.is_active,
      organization_id: profile.organization_id,
    };

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', id);

        if (error) throw error;

        toast({
          title: 'Produto atualizado',
          description: 'O produto foi atualizado com sucesso.',
        });
      } else {
        const { error } = await supabase.from('products').insert([productData]);

        if (error) throw error;

        toast({
          title: 'Produto criado',
          description: 'O produto foi criado com sucesso.',
        });
      }

      navigate('/products');
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Falha ao salvar produto',
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate margin
  const watchedPrice = form.watch('unit_price');
  const watchedCost = form.watch('cost');
  const margin = watchedPrice && watchedCost 
    ? ((watchedPrice - Number(watchedCost)) / watchedPrice * 100).toFixed(1)
    : null;

  const allCategories = [...new Set([...PRESET_CATEGORIES, ...existingCategories])];

  if (authLoading || fetchingProduct) {
    return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    );
  }

  return (
    
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/products')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditing ? 'Editar Produto' : 'Novo Produto'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? 'Atualizar informações do produto' : 'Adicionar um novo produto ao catálogo'}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Informações Básicas
                </CardTitle>
                <CardDescription>
                  Nome do produto, SKU e descrição
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Produto *</FormLabel>
                        <FormControl>
                          <Input placeholder="Licença de Software Empresarial" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input placeholder="PROD-001" className="font-mono" {...field} />
                        </FormControl>
                        <FormDescription>Código de identificação do produto</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descrição detalhada do produto..."
                          className="min-h-[100px] resize-y"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      {customCategory ? (
                        <div className="flex gap-2">
                          <FormControl>
                            <Input placeholder="Categoria personalizada" {...field} />
                          </FormControl>
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => {
                              setCustomCategory(false);
                              field.onChange('');
                            }}
                          >
                            Selecionar
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {allCategories.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => setCustomCategory(true)}
                          >
                            Personalizada
                          </Button>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Precificação</CardTitle>
                <CardDescription>
                  Defina o preço e o custo do produto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="unit_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço Unitário *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              R$
                            </span>
                            <Input 
                              type="number" 
                              step="0.01"
                              min="0"
                              className="pl-9"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormDescription>Preço de venda para clientes</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custo</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              R$
                            </span>
                            <Input 
                              type="number" 
                              step="0.01"
                              min="0"
                              className="pl-9"
                              {...field} 
                              value={field.value || ''}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>Seu custo (opcional)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div>
                    <FormLabel>Margem</FormLabel>
                    <div className="h-10 flex items-center">
                      {margin ? (
                        <span className={`text-lg font-semibold ${Number(margin) >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {margin}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Calculado automaticamente</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
                <CardDescription>
                  Controle a disponibilidade do produto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Ativo</FormLabel>
                        <FormDescription>
                          Produtos ativos podem ser adicionados a propostas e pedidos
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/products')}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEditing ? 'Atualizar Produto' : 'Criar Produto'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    
  );
}
