import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { 
  MessageSquare, 
  Search, 
  Keyboard, 
  Folder,
  Clock,
  Star,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CannedResponse {
  id: string;
  name: string;
  content: string;
  category: string | null;
  shortcut: string | null;
  usage_count: number;
  is_active: boolean;
}

interface CannedResponsePickerProps {
  onSelect: (content: string) => void;
  ticketId?: string;
  contactId?: string;
  className?: string;
  variant?: 'button' | 'icon';
}

export function CannedResponsePicker({
  onSelect,
  ticketId,
  contactId,
  className,
  variant = 'button',
}: CannedResponsePickerProps) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Fetch canned responses
  const { data: responses = [] } = useQuery({
    queryKey: ['canned-responses-picker', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      const { data, error } = await supabase
        .from('canned_responses')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .or(`is_public.eq.true,owner_id.eq.${profile.id}`)
        .order('usage_count', { ascending: false });
      
      if (error) throw error;
      return data as CannedResponse[];
    },
    enabled: !!profile?.organization_id,
  });

  // Parse variables in content
  const parseContent = async (content: string): Promise<string> => {
    if (!ticketId && !contactId) return content;
    
    try {
      const { data, error } = await supabase.rpc('parse_canned_response', {
        p_content: content,
        p_ticket_id: ticketId || null,
        p_contact_id: contactId || null,
      });
      
      if (error) throw error;
      return data || content;
    } catch (err) {
      console.error('Error parsing canned response:', err);
      return content;
    }
  };

  // Handle selection
  const handleSelect = async (response: CannedResponse) => {
    const parsedContent = await parseContent(response.content);
    onSelect(parsedContent);
    setOpen(false);
    setSearch('');
    
    // Update usage count
    await supabase
      .from('canned_responses')
      .update({ usage_count: response.usage_count + 1 })
      .eq('id', response.id);
    
    // Log analytics
    if (ticketId) {
      await supabase.from('canned_response_analytics').insert({
        canned_response_id: response.id,
        used_by: profile?.id,
        used_in_ticket_id: ticketId,
      });
    }
  };

  // Filter responses
  const filteredResponses = responses.filter(r => {
    const matchesSearch = 
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.content.toLowerCase().includes(search.toLowerCase()) ||
      r.shortcut?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  // Group by category
  const groupedResponses = filteredResponses.reduce((acc, response) => {
    const cat = response.category || 'Sem categoria';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(response);
    return acc;
  }, {} as Record<string, CannedResponse[]>);

  // Recent responses (top 5 most used)
  const recentResponses = [...responses]
    .sort((a, b) => b.usage_count - a.usage_count)
    .slice(0, 5);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {variant === 'button' ? (
          <Button variant="outline" size="sm" className={className}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Resposta Rápida
            <ChevronDown className="ml-2 h-3 w-3" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className={className}>
            <MessageSquare className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder="Buscar respostas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList>
            <CommandEmpty>Nenhuma resposta encontrada.</CommandEmpty>
            
            {/* Recent/Frequent */}
            {!search && recentResponses.length > 0 && (
              <CommandGroup heading="Mais usadas">
                {recentResponses.map((response) => (
                  <CommandItem
                    key={response.id}
                    value={response.name}
                    onSelect={() => handleSelect(response)}
                    className="flex flex-col items-start py-3"
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="h-3.5 w-3.5 text-amber-500" />
                        <span className="font-medium">{response.name}</span>
                      </div>
                      {response.shortcut && (
                        <Badge variant="outline" className="font-mono text-xs">
                          {response.shortcut}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-1 pl-5">
                      {response.content}
                    </p>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Grouped by category */}
            {Object.entries(groupedResponses).map(([category, items]) => (
              <CommandGroup key={category} heading={category}>
                {items.map((response) => (
                  <CommandItem
                    key={response.id}
                    value={`${response.name} ${response.content} ${response.shortcut || ''}`}
                    onSelect={() => handleSelect(response)}
                    className="flex flex-col items-start py-3"
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="font-medium">{response.name}</span>
                      {response.shortcut && (
                        <Badge variant="outline" className="font-mono text-xs">
                          {response.shortcut}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {response.content}
                    </p>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
        <div className="border-t p-2">
          <p className="text-xs text-muted-foreground text-center">
            <Keyboard className="inline h-3 w-3 mr-1" />
            Use atalhos como /saudacao para inserir rapidamente
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}