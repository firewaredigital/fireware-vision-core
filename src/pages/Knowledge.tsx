import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Book, 
  FileText, 
  Eye, 
  Edit,
  ThumbsUp,
  ThumbsDown,
  Folder,
  Calendar,
  User,
  RefreshCcw,
  ExternalLink,
  Star
} from '@/components/icons';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type ArticleStatus = 'draft' | 'in_review' | 'published' | 'archived';

interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  status: ArticleStatus;
  is_public: boolean;
  is_featured: boolean;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author?: { first_name: string; last_name: string } | null;
  category?: { id: string; name: string } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  article_count: number;
  icon: string | null;
}

const statusConfig: Record<ArticleStatus, { label: string; className: string }> = {
  draft: { label: 'Rascunho', className: 'bg-slate-100 text-slate-700' },
  in_review: { label: 'Em Revisão', className: 'bg-yellow-100 text-yellow-700' },
  published: { label: 'Publicado', className: 'bg-green-100 text-green-700' },
  archived: { label: 'Arquivado', className: 'bg-gray-100 text-gray-700' },
};

export default function Knowledge() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('articles');

  // Fetch articles
  const { data: articles = [], isLoading: isLoadingArticles, refetch: refetchArticles } = useQuery({
    queryKey: ['knowledge-articles', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select(`
          id, title, slug, summary, status, is_public, is_featured,
          view_count, helpful_count, not_helpful_count,
          published_at, created_at, updated_at,
          category:category_id(id, name)
        `)
        .eq('organization_id', profile.organization_id)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch authors separately
      const articlesWithAuthors = await Promise.all(
        (data || []).map(async (article: any) => {
          const { data: authorData } = await supabase
            .from('knowledge_articles')
            .select('author_id')
            .eq('id', article.id)
            .single();
          
          let author = null;
          if (authorData?.author_id) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', authorData.author_id)
              .single();
            author = profileData;
          }
          
          return { ...article, author } as Article;
        })
      );
      
      return articlesWithAuthors;
    },
    enabled: !!profile?.organization_id,
  });

  // Fetch categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['knowledge-categories', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      const { data, error } = await supabase
        .from('knowledge_categories')
        .select('id, name, slug, description, article_count, icon')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .order('display_order');
      
      if (error) throw error;
      return (data || []) as Category[];
    },
    enabled: !!profile?.organization_id,
  });

  // Fetch metrics
  const { data: metrics } = useQuery({
    queryKey: ['knowledge-metrics', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return null;
      
      const { data: allArticles } = await supabase
        .from('knowledge_articles')
        .select('status, view_count, helpful_count, not_helpful_count')
        .eq('organization_id', profile.organization_id);
      
      const articles = allArticles || [];
      const published = articles.filter(a => a.status === 'published');
      const totalViews = articles.reduce((sum, a) => sum + (a.view_count || 0), 0);
      const totalHelpful = articles.reduce((sum, a) => sum + (a.helpful_count || 0), 0);
      const totalNotHelpful = articles.reduce((sum, a) => sum + (a.not_helpful_count || 0), 0);
      const helpfulRate = totalHelpful + totalNotHelpful > 0 
        ? Math.round((totalHelpful / (totalHelpful + totalNotHelpful)) * 100)
        : 0;
      
      return {
        total: articles.length,
        published: published.length,
        drafts: articles.filter(a => a.status === 'draft').length,
        inReview: articles.filter(a => a.status === 'in_review').length,
        totalViews,
        helpfulRate,
      };
    },
    enabled: !!profile?.organization_id,
  });

  // Filter articles
  const filteredArticles = articles.filter(article => {
    const matchesSearch = 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.summary?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || article.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || article.category?.id === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Base de Conhecimento</h1>
            <p className="text-muted-foreground">
              Gerencie artigos, tutoriais e documentação de suporte
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetchArticles()}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
            <Button onClick={() => navigate('/knowledge/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Artigo
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Artigos</CardTitle>
              <Book className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.total || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Publicados</CardTitle>
              <FileText className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{metrics?.published || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rascunhos</CardTitle>
              <FileText className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-600">{metrics?.drafts || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
              <Eye className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{metrics?.totalViews || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Utilidade</CardTitle>
              <ThumbsUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{metrics?.helpfulRate || 0}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="articles">
              <FileText className="mr-2 h-4 w-4" />
              Artigos ({articles.length})
            </TabsTrigger>
            <TabsTrigger value="categories">
              <Folder className="mr-2 h-4 w-4" />
              Categorias ({categories.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="articles" className="mt-4 space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar artigos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="in_review">Em Revisão</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Categorias</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Articles Grid */}
            {isLoadingArticles ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCcw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredArticles.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Book className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">Nenhum artigo encontrado</h3>
                  <p className="text-muted-foreground">
                    Crie seu primeiro artigo de suporte
                  </p>
                  <Button className="mt-4" onClick={() => navigate('/knowledge/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Artigo
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredArticles.map((article) => (
                  <Card 
                    key={article.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/knowledge/${article.id}`)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <Badge className={statusConfig[article.status].className}>
                          {statusConfig[article.status].label}
                        </Badge>
                        {article.is_featured && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                      <CardTitle className="text-lg line-clamp-2 mt-2">
                        {article.title}
                      </CardTitle>
                      {article.summary && (
                        <CardDescription className="line-clamp-2">
                          {article.summary}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {article.category && (
                          <Badge variant="outline" className="text-xs">
                            <Folder className="h-3 w-3 mr-1" />
                            {article.category.name}
                          </Badge>
                        )}
                        {article.is_public && (
                          <Badge variant="outline" className="text-xs text-green-600">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Público
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {article.view_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {article.helpful_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsDown className="h-3 w-3" />
                            {article.not_helpful_count}
                          </span>
                        </div>
                        <span>
                          {formatDistanceToNow(new Date(article.updated_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="categories" className="mt-4">
            {isLoadingCategories ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCcw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : categories.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Folder className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">Nenhuma categoria</h3>
                  <p className="text-muted-foreground">
                    Crie categorias para organizar seus artigos
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <Card key={category.id}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Folder className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          <CardDescription>/{category.slug}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {category.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {category.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">
                          {category.article_count} artigos
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setCategoryFilter(category.id)}
                        >
                          Ver Artigos
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
