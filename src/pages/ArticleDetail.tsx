import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  ArrowLeft, 
  Edit, 
  MoreHorizontal, 
  Eye,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  User,
  Folder,
  ExternalLink,
  Star,
  Archive,
  Trash2,
  Send,
  RefreshCcw,
  Globe,
  Lock
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

type ArticleStatus = 'draft' | 'in_review' | 'published' | 'archived';

const statusConfig: Record<ArticleStatus, { label: string; className: string }> = {
  draft: { label: 'Rascunho', className: 'bg-slate-100 text-slate-700' },
  in_review: { label: 'Em Revisão', className: 'bg-yellow-100 text-yellow-700' },
  published: { label: 'Publicado', className: 'bg-green-100 text-green-700' },
  archived: { label: 'Arquivado', className: 'bg-gray-100 text-gray-700' },
};

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch article
  const { data: article, isLoading } = useQuery({
    queryKey: ['knowledge-article', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select(`
          *,
          category:category_id(id, name, slug)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;

      // Fetch author
      let author = null;
      if (data.author_id) {
        const { data: authorData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, avatar_url')
          .eq('id', data.author_id)
          .single();
        author = authorData;
      }
      
      // Increment view count
      await supabase
        .from('knowledge_articles')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', id);
      
      return { ...data, author };
    },
    enabled: !!id,
  });

  // Fetch related articles
  const { data: relatedArticles = [] } = useQuery({
    queryKey: ['related-articles', article?.category_id, id],
    queryFn: async () => {
      if (!article?.category_id || !id) return [];
      
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select('id, title, slug, summary')
        .eq('category_id', article.category_id)
        .eq('status', 'published')
        .neq('id', id)
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!article?.category_id,
  });

  // Update article status
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: ArticleStatus) => {
      const updates: any = { status: newStatus };
      
      if (newStatus === 'published' && !article?.published_at) {
        updates.published_at = new Date().toISOString();
        updates.published_by = profile?.id;
      }
      
      const { error } = await supabase
        .from('knowledge_articles')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-article', id] });
      toast({
        title: 'Status atualizado',
        description: 'O artigo foi atualizado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Submit feedback
  const submitFeedbackMutation = useMutation({
    mutationFn: async (isHelpful: boolean) => {
      const { error } = await supabase
        .from('article_feedback')
        .insert({
          article_id: id,
          is_helpful: isHelpful,
          user_id: profile?.id,
        });
      
      if (error) throw error;
    },
    onSuccess: (_, isHelpful) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-article', id] });
      toast({
        title: 'Obrigado pelo feedback!',
        description: isHelpful 
          ? 'Ficamos felizes que o artigo foi útil.'
          : 'Vamos trabalhar para melhorar este conteúdo.',
      });
    },
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <RefreshCcw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!article) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold">Artigo não encontrado</h2>
          <Button className="mt-4" onClick={() => navigate('/knowledge')}>
            Voltar para Base de Conhecimento
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/knowledge')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge className={statusConfig[article.status as ArticleStatus].className}>
                  {statusConfig[article.status as ArticleStatus].label}
                </Badge>
                {article.is_public ? (
                  <Badge variant="outline" className="text-green-600">
                    <Globe className="h-3 w-3 mr-1" />
                    Público
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-slate-600">
                    <Lock className="h-3 w-3 mr-1" />
                    Interno
                  </Badge>
                )}
                {article.is_featured && (
                  <Badge variant="outline" className="text-yellow-600">
                    <Star className="h-3 w-3 mr-1 fill-yellow-500" />
                    Destaque
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                {article.title}
              </h1>
              {article.summary && (
                <p className="text-muted-foreground mt-1">{article.summary}</p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/knowledge/${id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {article.status === 'draft' && (
                  <DropdownMenuItem onClick={() => updateStatusMutation.mutate('in_review')}>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar para Revisão
                  </DropdownMenuItem>
                )}
                {article.status === 'in_review' && (
                  <DropdownMenuItem onClick={() => updateStatusMutation.mutate('published')}>
                    <Globe className="mr-2 h-4 w-4" />
                    Publicar
                  </DropdownMenuItem>
                )}
                {article.status === 'published' && (
                  <DropdownMenuItem onClick={() => updateStatusMutation.mutate('archived')}>
                    <Archive className="mr-2 h-4 w-4" />
                    Arquivar
                  </DropdownMenuItem>
                )}
                {article.status === 'archived' && (
                  <DropdownMenuItem onClick={() => updateStatusMutation.mutate('draft')}>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Reativar como Rascunho
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Article Content */}
            <Card>
              <CardContent className="pt-6">
                <div className="prose prose-slate max-w-none dark:prose-invert">
                  {article.content_html ? (
                    <div dangerouslySetInnerHTML={{ __html: article.content_html }} />
                  ) : (
                    <div className="whitespace-pre-wrap">{article.content}</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Feedback */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Este artigo foi útil?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => submitFeedbackMutation.mutate(true)}
                    disabled={submitFeedbackMutation.isPending}
                  >
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    Sim, ajudou!
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => submitFeedbackMutation.mutate(false)}
                    disabled={submitFeedbackMutation.isPending}
                  >
                    <ThumbsDown className="mr-2 h-4 w-4" />
                    Precisa melhorar
                  </Button>
                </div>
                <div className="flex items-center justify-center gap-6 mt-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-4 w-4 text-green-500" />
                    {article.helpful_count} acharam útil
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsDown className="h-4 w-4 text-red-500" />
                    {article.not_helpful_count} não acharam
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Metadata */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {article.category && (
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4 text-muted-foreground" />
                    <span>{article.category.name}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span>{article.view_count} visualizações</span>
                </div>
                
                <Separator />
                
                {article.author && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Autor</p>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={article.author.avatar_url || ''} />
                        <AvatarFallback className="text-xs">
                          {article.author.first_name?.[0]}{article.author.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span>{article.author.first_name} {article.author.last_name}</span>
                    </div>
                  </div>
                )}
                
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Criado em</p>
                  <p>{format(new Date(article.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                </div>
                
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Última atualização</p>
                  <p>{formatDistanceToNow(new Date(article.updated_at), { addSuffix: true, locale: ptBR })}</p>
                </div>
                
                {article.published_at && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Publicado em</p>
                    <p>{format(new Date(article.published_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                  </div>
                )}
                
                {article.tags && article.tags.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {article.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Artigos Relacionados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {relatedArticles.map((related) => (
                    <Link
                      key={related.id}
                      to={`/knowledge/${related.id}`}
                      className="block p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <p className="font-medium text-sm line-clamp-2">{related.title}</p>
                      {related.summary && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                          {related.summary}
                        </p>
                      )}
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
