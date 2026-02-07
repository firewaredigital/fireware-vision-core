
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plus, MessageSquare, Mail, Phone, Send, Bell, Puzzle, ExternalLink } from '@/components/icons';
import { useState } from 'react';

const iconMap: Record<string, React.ElementType> = {
  whatsapp: MessageSquare,
  email: Mail,
  voice: Phone,
  sms: Send,
  custom: Puzzle,
};

const typeColors: Record<string, string> = {
  whatsapp: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  email: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  voice: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  sms: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  custom: 'bg-muted text-muted-foreground',
};

export default function IntegrationsCatalog() {
  const [search, setSearch] = useState('');

  const { data: connectors, isLoading } = useQuery({
    queryKey: ['connectors-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('connectors')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const filtered = connectors?.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Catálogo de Conectores</h1>
            <p className="text-muted-foreground mt-1">Conectores nativos disponíveis para integração</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conectores..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered?.map((connector) => {
              const Icon = iconMap[connector.connector_type] || Puzzle;
              const capabilities = connector.capabilities as { actions?: string[]; triggers?: string[] } | null;
              const actions = capabilities?.actions || [];
              const triggers = capabilities?.triggers || [];

              return (
                <Card key={connector.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{connector.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={typeColors[connector.connector_type] || typeColors.custom}>
                              {connector.connector_type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">v{connector.version}</span>
                          </div>
                        </div>
                      </div>
                      {connector.is_native && (
                        <Badge variant="secondary" className="text-xs">Nativo</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <CardDescription className="line-clamp-2">
                      {connector.description}
                    </CardDescription>
                    <div className="flex flex-wrap gap-1">
                      {actions.slice(0, 3).map((a: string) => (
                        <Badge key={a} variant="outline" className="text-[10px]">{a}</Badge>
                      ))}
                      {actions.length > 3 && (
                        <Badge variant="outline" className="text-[10px]">+{actions.length - 3}</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        {actions.length} ações · {triggers.length} triggers
                      </span>
                      <Button size="sm" variant="outline" className="gap-1">
                        <Plus className="h-3 w-3" /> Instanciar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
