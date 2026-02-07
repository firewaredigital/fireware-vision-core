import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, Loader2, Eye, Globe, Lock, Star, Send, X } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';

const articleSchema = z.object({
  title: z.string().min(5, 'O título deve ter pelo menos 5 caracteres').max(200),
  slug: z.string().min(3, 'O slug deve ter pelo menos 3 caracteres').max(100)
    .regex(/^[a-z0-9-]+$/, 'O slug deve conter apenas letras minúsculas, números e hífens'),
  summary: z.string().max(500).optional().nullable(),
  content: z.string().min(50, 'O conteúdo deve ter pelo menos 50 caracteres'),
  category_id: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  is_public: z.boolean().default(true),
  is_internal: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  meta_title: z.string().max(60).optional().nullable(),
  meta_description: z.string().max(160).optional().nullable(),
});

type ArticleFormData = z.infer<typeof articleSchema>;

export default function ArticleForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [tagInput, setTagInput] = useState('');

  const form = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: '',
      slug: '',
      summary: '',
      content: '',
      category_id: null,
      tags: [],
      is_public: true,
      is_internal: false,
      is_featured: false,
      meta_title: '',
      meta_description: '',
    },
  });

  // Auto-generate slug from title
  const watchTitle = form.watch('title');
  useEffect(() => {
    if (!isEditing && watchTitle) {
      const slug = watchTitle
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 100);
      form.setValue('slug', slug);
    }
  }, [watchTitle, isEditing, form]);

  // Fetch existing article for edit mode
  const { data: article, isLoading: isLoadingArticle } = useQuery({
    queryKey: ['knowledge-article', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['knowledge-categories', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data, error } = await supabase
        .from('knowledge_categories')
        .select('id, name')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.organization_id,
  });

  // Populate form when editing
  useEffect(() => {
    if (article) {
      form.reset({
        title: article.title,
        slug: article.slug,
        summary: article.summary || '',
        content: article.content,
        category_id: article.category_id,
        tags: article.tags || [],
        is_public: article.is_public,
        is_internal: article.is_internal,
        is_featured: article.is_featured,
        meta_title: article.meta_title || '',
        meta_description: article.meta_description || '',
      });
    }
  }, [article, form]);

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (data: ArticleFormData) => {
      if (!profile?.organization_id) throw new Error('Organização não encontrada');

      const articleData = {
        title: data.title,
        slug: data.slug,
        summary: data.summary || null,
        content: data.content,
        category_id: data.category_id || null,
        tags: data.tags || [],
        is_public: data.is_public,
        is_internal: data.is_internal,
        is_featured: data.is_featured,
        meta_title: data.meta_title || null,
        meta_description: data.meta_description || null,
        last_edited_by: profile.id,
      };

      if (isEditing) {
        // Increment version on edit
        const newVersion = (article?.version || 0) + 1;
        
        // Save version history
        await supabase.from('article_versions').insert({
          article_id: id,
          version: article?.version || 1,
          title: article?.title || '',
          content: article?.content || '',
          changed_by: profile.id,
          change_summary: 'Versão anterior salva antes da edição',
        });

        const { error } = await supabase
          .from('knowledge_articles')
          .update({ ...articleData, version: newVersion })
          .eq('id', id);
        if (error) throw error;
        return id;
      } else {
        const { data: newArticle, error } = await supabase
          .from('knowledge_articles')
          .insert({
            ...articleData,
            organization_id: profile.organization_id,
            author_id: profile.id,
            status: 'draft',
            version: 1,
          })
          .select('id')
          .single();
        if (error) throw error;
        return newArticle.id;
      }
    },
    onSuccess: (articleId) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-article', articleId] });
      toast({
        title: isEditing ? 'Artigo atualizado' : 'Artigo criado',
        description: isEditing 
          ? 'As alterações foram salvas com sucesso.'
          : 'O artigo foi criado como rascunho.',
      });
      navigate(`/knowledge/${articleId}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ArticleFormData) => {
    mutation.mutate(data);
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.getValues('tags')?.includes(tag)) {
      form.setValue('tags', [...(form.getValues('tags') || []), tag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    form.setValue('tags', form.getValues('tags')?.filter(tag => tag !== tagToRemove) || []);
  };

  if (isEditing && isLoadingArticle) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditing ? 'Editar Artigo' : 'Novo Artigo'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing 
                ? 'Atualize o conteúdo do artigo'
                : 'Crie um novo artigo para a base de conhecimento'
              }
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Main Content */}
            <Card>
              <CardHeader>
                <CardTitle>Conteúdo do Artigo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Como configurar sua conta" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Slug *</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-sm">/artigos/</span>
                          <Input 
                            placeholder="como-configurar-sua-conta" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        URL amigável para o artigo (gerado automaticamente do título)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resumo</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Breve descrição do artigo..."
                          className="min-h-[80px]"
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Aparece nos resultados de busca e listagens
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conteúdo *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Escreva o conteúdo do artigo aqui...

Você pode usar:
- **Negrito** para destaque
- *Itálico* para ênfase
- # Títulos de seção
- ## Subtítulos
- Listas com - ou 1. 2. 3."
                          className="min-h-[400px] font-mono text-sm"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Suporta formatação Markdown para estruturar o conteúdo
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Classification */}
            <Card>
              <CardHeader>
                <CardTitle>Classificação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Nenhuma</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>Tags</FormLabel>
                  <div className="flex gap-2 mt-2">
                    <Input 
                      placeholder="Adicionar tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={handleAddTag}>
                      Adicionar
                    </Button>
                  </div>
                  {form.watch('tags')?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {form.watch('tags')?.map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="secondary"
                          className="gap-1 cursor-pointer"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          {tag}
                          <X className="h-3 w-3" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Visibility Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Visibilidade</CardTitle>
                <CardDescription>
                  Configure quem pode ver este artigo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="is_public"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-primary" />
                          <FormLabel className="text-base font-medium">Público</FormLabel>
                        </div>
                        <FormDescription>
                          Visível para clientes no portal de autoatendimento
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

                <FormField
                  control={form.control}
                  name="is_internal"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-muted-foreground" />
                          <FormLabel className="text-base font-medium">Interno</FormLabel>
                        </div>
                        <FormDescription>
                          Visível apenas para agentes e funcionários
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

                <FormField
                  control={form.control}
                  name="is_featured"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-primary" />
                          <FormLabel className="text-base font-medium">Destaque</FormLabel>
                        </div>
                        <FormDescription>
                          Aparece em posição de destaque na base de conhecimento
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

            {/* SEO Settings */}
            <Card>
              <CardHeader>
                <CardTitle>SEO</CardTitle>
                <CardDescription>
                  Otimização para mecanismos de busca
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="meta_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Título</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Título para SEO (deixe em branco para usar o título do artigo)"
                          maxLength={60}
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Máximo 60 caracteres ({60 - (field.value?.length || 0)} restantes)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meta_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descrição para resultados de busca..."
                          maxLength={160}
                          className="min-h-[80px]"
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Máximo 160 caracteres ({160 - (field.value?.length || 0)} restantes)
                      </FormDescription>
                      <FormMessage />
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
                onClick={() => navigate(-1)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? 'Salvar Alterações' : 'Criar Rascunho'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
}
