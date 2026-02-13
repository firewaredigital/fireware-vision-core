import { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '@/hooks/useAppContext';
import { findArticle, findCategory, getAllArticlesFlat } from '@/config/documentation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, ArrowLeft, BookOpen } from '@/components/icons';
import { cn } from '@/lib/utils';

export default function DocumentationArticle() {
  const { categorySlug, articleSlug } = useParams<{ categorySlug: string; articleSlug: string }>();
  const navigate = useNavigate();
  const { currentApp } = useAppContext();
  const prefix = currentApp ? `/app/${currentApp.slug}` : '/app/crm';

  const result = categorySlug && articleSlug ? findArticle(categorySlug, articleSlug) : undefined;

  // Compute prev/next within same category
  const { prev, next } = useMemo(() => {
    if (!result) return { prev: null, next: null };
    const cat = result.category;
    const idx = cat.articles.findIndex(a => a.slug === result.article.slug);
    return {
      prev: idx > 0 ? cat.articles[idx - 1] : null,
      next: idx < cat.articles.length - 1 ? cat.articles[idx + 1] : null,
    };
  }, [result]);

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Artigo não encontrado</h2>
        <p className="text-muted-foreground mb-4">O artigo solicitado não existe na documentação.</p>
        <Button variant="outline" onClick={() => navigate(`${prefix}/docs`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar à Documentação
        </Button>
      </div>
    );
  }

  const { category, article } = result;

  // Build table of contents from section headings
  const toc = article.sections.map((s, i) => ({
    id: `section-${i}`,
    label: s.heading,
  }));

  return (
    <div className="flex h-full">
      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 flex-wrap">
            <Link to={`${prefix}/docs`} className="hover:text-foreground transition-colors">Documentação</Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <Link to={`${prefix}/docs/${category.slug}`} className="hover:text-foreground transition-colors">
              {category.title}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <span className="text-foreground font-medium">{article.title}</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-foreground mb-2">{article.title}</h1>
          <p className="text-muted-foreground mb-8">{article.description}</p>

          {/* Sections */}
          <div className="space-y-10">
            {article.sections.map((section, idx) => (
              <section key={idx} id={`section-${idx}`}>
                <h2 className="text-xl font-semibold text-foreground mb-4 pb-2 border-b">
                  {section.heading}
                </h2>
                <DocContent content={section.content} />
              </section>
            ))}
          </div>

          {/* Prev / Next navigation */}
          <div className="flex items-center justify-between mt-12 pt-6 border-t gap-4">
            {prev ? (
              <Link
                to={`${prefix}/docs/${category.slug}/${prev.slug}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
              >
                <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                <div className="text-left">
                  <span className="block text-xs">Anterior</span>
                  <span className="font-medium text-foreground">{prev.title}</span>
                </div>
              </Link>
            ) : (
              <div />
            )}
            {next ? (
              <Link
                to={`${prefix}/docs/${category.slug}/${next.slug}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group text-right"
              >
                <div>
                  <span className="block text-xs">Próximo</span>
                  <span className="font-medium text-foreground">{next.title}</span>
                </div>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>
      </main>

      {/* Table of Contents sidebar */}
      {toc.length > 1 && (
        <aside className="hidden xl:block w-56 border-l bg-muted/20 p-4 shrink-0">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Nesta página
          </h4>
          <nav className="space-y-1.5">
            {toc.map(item => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors truncate"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>
      )}
    </div>
  );
}

// ─── Content Renderer ──────────────────────────────────────────────
// Renders documentation content strings as styled JSX.
// Supports: paragraphs, bold, tables, lists, and inline code.

function DocContent({ content }: { content: string }) {
  const blocks = useMemo(() => parseContent(content), [content]);

  return (
    <div className="prose-doc space-y-4 text-sm leading-relaxed text-foreground/90">
      {blocks.map((block, i) => {
        if (block.type === 'table') {
          return <DocTable key={i} rows={block.rows} />;
        }
        if (block.type === 'list') {
          return (
            <ul key={i} className="space-y-1.5 ml-1">
              {block.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                  <span dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === 'numbered') {
          return (
            <ol key={i} className="space-y-1.5 ml-1 list-decimal list-inside">
              {block.items.map((item, j) => (
                <li key={j} className="pl-1" dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
              ))}
            </ol>
          );
        }
        // paragraph
        return (
          <p key={i} dangerouslySetInnerHTML={{ __html: inlineFormat(block.text) }} />
        );
      })}
    </div>
  );
}

// ─── Table ─────────────────────────────────────────────────────────

function DocTable({ rows }: { rows: string[][] }) {
  if (rows.length < 2) return null;
  const headers = rows[0];
  const body = rows.slice(1).filter(r => !r.every(c => /^[-–—:]+$/.test(c.trim())));

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-2.5 text-left font-semibold text-foreground whitespace-nowrap">
                <span dangerouslySetInnerHTML={{ __html: inlineFormat(h.trim()) }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, i) => (
            <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2 text-foreground/80">
                  <span dangerouslySetInnerHTML={{ __html: inlineFormat(cell.trim()) }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Parser helpers ────────────────────────────────────────────────

type Block =
  | { type: 'paragraph'; text: string }
  | { type: 'table'; rows: string[][] }
  | { type: 'list'; items: string[] }
  | { type: 'numbered'; items: string[] };

function parseContent(content: string): Block[] {
  const lines = content.split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Table detection
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableRows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        const cells = lines[i].split('|').slice(1, -1);
        tableRows.push(cells);
        i++;
      }
      blocks.push({ type: 'table', rows: tableRows });
      continue;
    }

    // Numbered list
    if (/^\d+\.\s/.test(line.trim())) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ''));
        i++;
      }
      blocks.push({ type: 'numbered', items });
      continue;
    }

    // Unordered list
    if (/^[-*•]\s/.test(line.trim())) {
      const items: string[] = [];
      while (i < lines.length && /^[-*•]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*•]\s/, ''));
        i++;
      }
      blocks.push({ type: 'list', items });
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph: collect consecutive non-empty, non-special lines
    let text = '';
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].trim().startsWith('|') &&
      !/^\d+\.\s/.test(lines[i].trim()) &&
      !/^[-*•]\s/.test(lines[i].trim())
    ) {
      text += (text ? ' ' : '') + lines[i].trim();
      i++;
    }
    if (text) blocks.push({ type: 'paragraph', text });
  }

  return blocks;
}

function inlineFormat(text: string): string {
  return text
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
    // Inline code
    .replace(/`(.+?)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
    // Emoji shortcuts (keep as-is)
    ;
}
