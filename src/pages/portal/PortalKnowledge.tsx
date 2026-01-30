import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  BookOpen,
  FileText,
  ChevronRight,
  Star,
  Clock,
  Eye,
  Folder,
  TrendingUp,
  RefreshCcw,
  HelpCircle,
} from 'lucide-react';
import { PortalLayout } from './PortalLayout';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  views: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  article_count: number;
}

export default function PortalKnowledge() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Mock data
  const categories: Category[] = [
    { id: '1', name: 'Primeiros Passos', description: 'Guias para começar a usar o sistema', icon: '🚀', article_count: 12 },
    { id: '2', name: 'Conta e Login', description: 'Gerenciamento de conta e acesso', icon: '🔐', article_count: 8 },
    { id: '3', name: 'Faturamento', description: 'Pagamentos, faturas e planos', icon: '💳', article_count: 6 },
    { id: '4', name: 'Integrações', description: 'Conectar com outras ferramentas', icon: '🔗', article_count: 15 },
    { id: '5', name: 'Relatórios', description: 'Análises e exportação de dados', icon: '📊', article_count: 10 },
    { id: '6', name: 'Suporte', description: 'Problemas comuns e soluções', icon: '🛠️', article_count: 20 },
  ];

  const articles: Article[] = [
    {
      id: '1',
      title: 'Como redefinir minha senha',
      excerpt: 'Aprenda a recuperar o acesso à sua conta quando esquecer a senha.',
      category: 'Conta e Login',
      views: 5234,
      is_featured: true,
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      title: 'Guia rápido de início',
      excerpt: 'Tudo que você precisa saber para começar a usar o sistema em minutos.',
      category: 'Primeiros Passos',
      views: 8456,
      is_featured: true,
      created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      title: 'Configurando integrações com Slack',
      excerpt: 'Receba notificações em tempo real no seu workspace do Slack.',
      category: 'Integrações',
      views: 2341,
      is_featured: false,
      created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '4',
      title: 'Entendendo sua fatura mensal',
      excerpt: 'Saiba como interpretar os itens e valores da sua fatura.',
      category: 'Faturamento',
      views: 1876,
      is_featured: false,
      created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '5',
      title: 'Exportando relatórios em PDF',
      excerpt: 'Como gerar e baixar relatórios completos do sistema.',
      category: 'Relatórios',
      views: 3421,
      is_featured: true,
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '6',
      title: 'Solução de problemas de conexão',
      excerpt: 'Passos para resolver erros de conexão e timeout.',
      category: 'Suporte',
      views: 4532,
      is_featured: false,
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const featuredArticles = articles.filter(a => a.is_featured);
  const popularArticles = [...articles].sort((a, b) => b.views - a.views).slice(0, 5);
  const recentArticles = [...articles].sort((a, b) => 
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  ).slice(0, 5);

  const filteredArticles = articles.filter(article => {
    const matchesSearch = 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <PortalLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="text-center py-8 bg-gradient-to-b from-primary/5 to-transparent rounded-lg">
          <BookOpen className="h-12 w-12 mx-auto text-primary mb-4" />
          <h1 className="text-3xl font-bold tracking-tight">Base de Conhecimento</h1>
          <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
            Encontre respostas, tutoriais e guias para aproveitar ao máximo nossa plataforma.
          </p>
          
          {/* Search */}
          <div className="max-w-xl mx-auto mt-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar artigos, tutoriais..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-lg"
              />
            </div>
          </div>
        </div>

        {/* Categories */}
        {!searchTerm && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Categorias</h2>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              {categories.map((category) => (
                <Card
                  key={category.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedCategory(
                    selectedCategory === category.name ? null : category.name
                  )}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl mb-2">{category.icon}</div>
                    <h3 className="font-medium">{category.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {category.article_count} artigos
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Search Results or Featured Content */}
        {searchTerm || selectedCategory ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {selectedCategory ? `Artigos em "${selectedCategory}"` : 'Resultados da busca'}
              </h2>
              {(searchTerm || selectedCategory) && (
                <Button variant="ghost" onClick={() => { setSearchTerm(''); setSelectedCategory(null); }}>
                  Limpar filtros
                </Button>
              )}
            </div>
            
            {filteredArticles.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold">Nenhum artigo encontrado</h3>
                  <p className="text-muted-foreground text-center mt-1">
                    Tente usar termos diferentes ou navegue pelas categorias.
                  </p>
                  <Button className="mt-4" onClick={() => navigate('/portal/tickets/new')}>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Abrir Ticket de Suporte
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} onClick={() => navigate(`/portal/knowledge/${article.id}`)} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Featured Articles */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-yellow-500" />
                <h2 className="text-xl font-semibold">Artigos em Destaque</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {featuredArticles.map((article) => (
                  <Card
                    key={article.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/portal/knowledge/${article.id}`)}
                  >
                    <CardHeader>
                      <Badge variant="secondary" className="w-fit">{article.category}</Badge>
                      <CardTitle className="text-lg mt-2">{article.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {article.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {article.views.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
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
            </div>

            {/* Popular & Recent */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Popular */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Mais Populares
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {popularArticles.map((article, index) => (
                    <Button
                      key={article.id}
                      variant="ghost"
                      className="w-full justify-start h-auto py-3"
                      onClick={() => navigate(`/portal/knowledge/${article.id}`)}
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium mr-3">
                        {index + 1}
                      </span>
                      <div className="text-left flex-1">
                        <p className="font-medium">{article.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {article.views.toLocaleString()} visualizações
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Recent */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Atualizados Recentemente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {recentArticles.map((article) => (
                    <Button
                      key={article.id}
                      variant="ghost"
                      className="w-full justify-start h-auto py-3"
                      onClick={() => navigate(`/portal/knowledge/${article.id}`)}
                    >
                      <FileText className="h-5 w-5 mr-3 text-muted-foreground" />
                      <div className="text-left flex-1">
                        <p className="font-medium">{article.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Atualizado {formatDistanceToNow(new Date(article.updated_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Help CTA */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="flex flex-col md:flex-row items-center justify-between p-6 gap-4">
            <div className="text-center md:text-left">
              <h3 className="text-lg font-semibold">Não encontrou o que procurava?</h3>
              <p className="text-muted-foreground">
                Nossa equipe de suporte está pronta para ajudar.
              </p>
            </div>
            <Button onClick={() => navigate('/portal/tickets/new')}>
              <HelpCircle className="mr-2 h-4 w-4" />
              Abrir Ticket de Suporte
            </Button>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}

function ArticleCard({ article, onClick }: { article: Article; onClick: () => void }) {
  return (
    <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium">{article.title}</h3>
              {article.is_featured && (
                <Badge variant="outline" className="gap-1">
                  <Star className="h-3 w-3" />
                  Destaque
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
              {article.excerpt}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <Badge variant="secondary">{article.category}</Badge>
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {article.views.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(article.updated_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}