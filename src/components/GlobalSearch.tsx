import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Building2, Users, Target, FileText, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchResult {
  id: string;
  type: 'lead' | 'account' | 'contact' | 'opportunity' | 'quote';
  title: string;
  subtitle: string;
}

const typeConfig = {
  lead: { icon: User, label: 'Lead', color: 'bg-blue-100 text-blue-800', path: '/leads' },
  account: { icon: Building2, label: 'Account', color: 'bg-green-100 text-green-800', path: '/accounts' },
  contact: { icon: Users, label: 'Contact', color: 'bg-purple-100 text-purple-800', path: '/contacts' },
  opportunity: { icon: Target, label: 'Opportunity', color: 'bg-orange-100 text-orange-800', path: '/opportunities' },
  quote: { icon: FileText, label: 'Quote', color: 'bg-pink-100 text-pink-800', path: '/quotes' }
};

export function GlobalSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    const performSearch = async () => {
      setIsLoading(true);
      
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user?.id)
          .single();
        
        if (!profile?.organization_id) return;

        const searchTerm = `%${debouncedQuery.toLowerCase()}%`;

        // Search in parallel
        const [leadsRes, accountsRes, contactsRes, opportunitiesRes, quotesRes] = await Promise.all([
          supabase
            .from('leads')
            .select('id, first_name, last_name, email, company')
            .eq('organization_id', profile.organization_id)
            .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},company.ilike.${searchTerm}`)
            .limit(5),
          supabase
            .from('accounts')
            .select('id, name, industry')
            .eq('organization_id', profile.organization_id)
            .or(`name.ilike.${searchTerm},industry.ilike.${searchTerm}`)
            .limit(5),
          supabase
            .from('contacts')
            .select('id, first_name, last_name, email')
            .eq('organization_id', profile.organization_id)
            .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
            .limit(5),
          supabase
            .from('opportunities')
            .select('id, name, stage')
            .eq('organization_id', profile.organization_id)
            .ilike('name', searchTerm)
            .limit(5),
          supabase
            .from('quotes')
            .select('id, name, quote_number')
            .eq('organization_id', profile.organization_id)
            .or(`name.ilike.${searchTerm},quote_number.ilike.${searchTerm}`)
            .limit(5)
        ]);

        const allResults: SearchResult[] = [];

        leadsRes.data?.forEach(lead => {
          allResults.push({
            id: lead.id,
            type: 'lead',
            title: `${lead.first_name} ${lead.last_name}`,
            subtitle: lead.company || lead.email || ''
          });
        });

        accountsRes.data?.forEach(account => {
          allResults.push({
            id: account.id,
            type: 'account',
            title: account.name,
            subtitle: account.industry || ''
          });
        });

        contactsRes.data?.forEach(contact => {
          allResults.push({
            id: contact.id,
            type: 'contact',
            title: `${contact.first_name} ${contact.last_name}`,
            subtitle: contact.email || ''
          });
        });

        opportunitiesRes.data?.forEach(opp => {
          allResults.push({
            id: opp.id,
            type: 'opportunity',
            title: opp.name,
            subtitle: opp.stage.replace('_', ' ')
          });
        });

        quotesRes.data?.forEach(quote => {
          allResults.push({
            id: quote.id,
            type: 'quote',
            title: quote.name,
            subtitle: quote.quote_number
          });
        });

        setResults(allResults);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, user]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        event.preventDefault();
        if (results[selectedIndex]) {
          navigateToResult(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const navigateToResult = (result: SearchResult) => {
    const config = typeConfig[result.type];
    navigate(`${config.path}/${result.id}`);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="search"
        placeholder="Search leads, accounts, contacts... (⌘K)"
        className="pl-9 pr-9 bg-secondary/50 border-0 focus-visible:ring-1"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {query && (
        <button
          onClick={() => { setQuery(''); setResults([]); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Results Dropdown */}
      {isOpen && (query.length >= 2 || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-lg shadow-lg z-50 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center p-4 text-muted-foreground">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {query.length >= 2 ? 'No results found' : 'Type at least 2 characters'}
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {results.map((result, index) => {
                const config = typeConfig[result.type];
                const Icon = config.icon;
                const isSelected = index === selectedIndex;

                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    className={`w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors ${
                      isSelected ? 'bg-muted/50' : ''
                    }`}
                    onClick={() => navigateToResult(result)}
                  >
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{result.title}</div>
                      {result.subtitle && (
                        <div className="text-sm text-muted-foreground truncate">{result.subtitle}</div>
                      )}
                    </div>
                    <Badge variant="outline" className={`text-xs ${config.color}`}>
                      {config.label}
                    </Badge>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
