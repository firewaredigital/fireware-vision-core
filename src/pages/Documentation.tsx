import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';
import { useAppContext } from '@/hooks/useAppContext';
import { documentationData, searchDocumentation, findCategory, type DocCategory } from '@/config/documentation';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Search, ChevronRight, ChevronDown, BookOpen, FileText } from '@/components/icons';
import { cn } from '@/lib/utils';

export default function Documentation() {
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const navigate = useNavigate();
  const { currentApp } = useAppContext();
  const prefix = currentApp ? `/app/${currentApp.slug}` : '/app/crm';

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 250);

  const searchResults = useMemo(() => {
    if (!debouncedQuery) return [];
    return searchDocumentation(debouncedQuery);
  }, [debouncedQuery]);

  const selectedCategory = categorySlug ? findCategory(categorySlug) : null;
  const isSearching = debouncedQuery.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-card px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <BookOpen className="h-6 w-6 text-primary" weight="duotone" />
          <h1 className="text-2xl font-bold text-foreground">Documentação</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-9">
          Guia completo de uso de todos os módulos e funcionalidades da CR Platform.
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 border-r bg-muted/30 flex flex-col">
          {/* Search */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar na documentação..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <nav className="p-2 space-y-0.5">
              {isSearching ? (
                searchResults.length > 0 ? (
                  searchResults.map(({ category, article }) => (
                    <Link
                      key={`${category.slug}-${article.slug}`}
                      to={`${prefix}/docs/${category.slug}/${article.slug}`}
                      className="flex items-start gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent/50 transition-colors"
                    >
                      <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div>
                        <span className="font-medium text-foreground">{article.title}</span>
                        <span className="block text-xs text-muted-foreground truncate">{category.title}</span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="px-3 py-6 text-sm text-muted-foreground text-center">
                    Nenhum resultado para "{debouncedQuery}"
                  </p>
                )
              ) : (
                documentationData.map(cat => (
                  <CategoryItem
                    key={cat.slug}
                    category={cat}
                    isActive={categorySlug === cat.slug}
                    prefix={prefix}
                  />
                ))
              )}
            </nav>
          </ScrollArea>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {selectedCategory ? (
            <CategoryOverview category={selectedCategory} prefix={prefix} />
          ) : (
            <WelcomeView prefix={prefix} />
          )}
        </main>
      </div>
    </div>
  );
}

// ─── Sidebar Category Item ─────────────────────────────────────────

function CategoryItem({ category, isActive, prefix }: { category: DocCategory; isActive: boolean; prefix: string }) {
  const [open, setOpen] = useState(isActive);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
            isActive ? 'bg-primary/10 text-primary' : 'hover:bg-accent/50 text-foreground'
          )}
        >
          {open ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          )}
          <span className="truncate">{category.title}</span>
          <span className="ml-auto text-xs text-muted-foreground">{category.articles.length}</span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-5 pl-3 border-l space-y-0.5 py-1">
          {category.articles.map(article => (
            <Link
              key={article.slug}
              to={`${prefix}/docs/${category.slug}/${article.slug}`}
              className="block px-2 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors truncate"
            >
              {article.title}
            </Link>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── Welcome View ──────────────────────────────────────────────────

function WelcomeView({ prefix }: { prefix: string }) {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" weight="duotone" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Bem-vindo à Documentação</h2>
        <p className="text-muted-foreground">
          Selecione uma categoria na barra lateral ou use a busca para encontrar o que precisa.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documentationData.map(cat => (
          <Link
            key={cat.slug}
            to={`${prefix}/docs/${cat.slug}`}
            className="group rounded-xl border bg-card p-5 hover:border-primary/40 hover:shadow-md transition-all"
          >
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
              {cat.title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {cat.articles.length} artigo{cat.articles.length !== 1 ? 's' : ''}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Category Overview ─────────────────────────────────────────────

function CategoryOverview({ category, prefix }: { category: DocCategory; prefix: string }) {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
        <Link to={`${prefix}/docs`} className="hover:text-foreground transition-colors">Documentação</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{category.title}</span>
      </div>

      <h2 className="text-2xl font-bold text-foreground mb-6">{category.title}</h2>

      <div className="space-y-3">
        {category.articles.map(article => (
          <Link
            key={article.slug}
            to={`${prefix}/docs/${category.slug}/${article.slug}`}
            className="group flex items-start gap-4 rounded-xl border bg-card p-5 hover:border-primary/40 hover:shadow-md transition-all"
          >
            <FileText className="h-5 w-5 text-muted-foreground group-hover:text-primary mt-0.5 shrink-0 transition-colors" />
            <div>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {article.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">{article.description}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {article.sections.length} seç{article.sections.length !== 1 ? 'ões' : 'ão'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
