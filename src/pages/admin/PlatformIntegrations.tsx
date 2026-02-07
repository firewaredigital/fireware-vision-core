import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Link, MessageSquare, Phone, Globe, Mail,
  CheckCircle, XCircle, AlertTriangle, Clock,
  Loader2, Activity, Zap, Server
} from '@/components/icons';

// Native connectors definition
const NATIVE_CONNECTORS = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Business API',
    description: 'Envio e recebimento de mensagens via WhatsApp Business',
    icon: MessageSquare,
    status: 'active' as const,
    edgeFunctions: ['whatsapp-webhook', 'whatsapp-send'],
    tables: ['whatsapp_accounts', 'whatsapp_templates', 'whatsapp_message_logs', 'whatsapp_optins'],
  },
  {
    id: 'chat-widget',
    name: 'Chat Widget Web',
    description: 'Widget de chat embutível para sites externos',
    icon: Globe,
    status: 'active' as const,
    edgeFunctions: ['chat-widget'],
    tables: ['chat_widgets', 'chat_sessions', 'chat_widget_events'],
  },
  {
    id: 'voice',
    name: 'Voice Provider (Telefonia)',
    description: 'Integração com provedores de telefonia para chamadas',
    icon: Phone,
    status: 'active' as const,
    edgeFunctions: ['voice-webhook'],
    tables: ['voice_providers', 'voice_calls', 'voice_call_events', 'voice_transcripts'],
  },
  {
    id: 'email-smtp',
    name: 'Email SMTP',
    description: 'Envio de emails transacionais e campanhas',
    icon: Mail,
    status: 'planned' as const,
    edgeFunctions: [],
    tables: [],
  },
  {
    id: 'sms',
    name: 'SMS Provider',
    description: 'Envio de mensagens SMS',
    icon: MessageSquare,
    status: 'planned' as const,
    edgeFunctions: [],
    tables: [],
  },
];

const STATUS_MAP = {
  active: { label: 'Ativo', className: 'bg-accent text-accent-foreground', icon: CheckCircle },
  planned: { label: 'Planejado', className: 'bg-muted text-muted-foreground', icon: Clock },
  error: { label: 'Erro', className: 'bg-destructive/20 text-destructive', icon: XCircle },
  inactive: { label: 'Inativo', className: 'bg-warning/20 text-warning-foreground', icon: AlertTriangle },
};

export default function PlatformIntegrations() {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;

  // Fetch integration run logs
  const { data: recentRuns, isLoading: runsLoading } = useQuery({
    queryKey: ['admin-integration-runs', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_run_logs')
        .select('*')
        .eq('organization_id', organizationId!)
        .order('started_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  // Fetch WhatsApp account count
  const { data: waAccounts } = useQuery({
    queryKey: ['admin-wa-accounts', organizationId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('whatsapp_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId!);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!organizationId,
  });

  // Fetch chat widget count
  const { data: chatWidgets } = useQuery({
    queryKey: ['admin-chat-widgets', organizationId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('chat_widgets')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId!);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!organizationId,
  });

  // Fetch voice provider count
  const { data: voiceProviders } = useQuery({
    queryKey: ['admin-voice-providers', organizationId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('voice_providers')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId!);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!organizationId,
  });

  const getInstanceCount = (connectorId: string) => {
    switch (connectorId) {
      case 'whatsapp': return waAccounts || 0;
      case 'chat-widget': return chatWidgets || 0;
      case 'voice': return voiceProviders || 0;
      default: return 0;
    }
  };

  const activeConnectors = NATIVE_CONNECTORS.filter(c => c.status === 'active').length;
  const totalInstances = (waAccounts || 0) + (chatWidgets || 0) + (voiceProviders || 0);

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Integrações da Plataforma</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral dos conectores nativos e status de integração
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Conectores Nativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{NATIVE_CONNECTORS.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {activeConnectors} ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Instâncias Configuradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInstances}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all connectors
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Edge Functions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground mt-1">
                Deployadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Execuções Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentRuns?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Últimas 30 execuções
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="connectors" className="space-y-4">
          <TabsList>
            <TabsTrigger value="connectors">
              <Link className="h-4 w-4 mr-2" />
              Conectores Nativos
            </TabsTrigger>
            <TabsTrigger value="runs">
              <Activity className="h-4 w-4 mr-2" />
              Execuções Recentes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connectors">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {NATIVE_CONNECTORS.map(connector => {
                const statusInfo = STATUS_MAP[connector.status];
                const Icon = connector.icon;
                const StatusIcon = statusInfo.icon;
                const instanceCount = getInstanceCount(connector.id);

                return (
                  <Card key={connector.id} className={connector.status === 'active' ? 'border-primary/30' : ''}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            connector.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                          }`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{connector.name}</CardTitle>
                          </div>
                        </div>
                        <Badge className={statusInfo.className}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <CardDescription>{connector.description}</CardDescription>

                      {connector.status === 'active' && (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between text-muted-foreground">
                            <span>Instâncias:</span>
                            <span className="font-medium text-foreground">{instanceCount}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Edge Functions:</span>
                            <span className="font-medium text-foreground">{connector.edgeFunctions.length}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Tabelas:</span>
                            <span className="font-medium text-foreground">{connector.tables.length}</span>
                          </div>
                        </div>
                      )}

                      {connector.edgeFunctions.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {connector.edgeFunctions.map(fn => (
                            <Badge key={fn} variant="outline" className="text-xs font-mono">
                              <Zap className="h-3 w-3 mr-1" />
                              {fn}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="runs">
            <Card>
              <CardHeader>
                <CardTitle>Execuções Recentes de Integrações</CardTitle>
                <CardDescription>Últimas 30 execuções registradas</CardDescription>
              </CardHeader>
              <CardContent>
                {runsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Conector</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Duração</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentRuns?.map(run => {
                        const status = run.status as keyof typeof STATUS_MAP;
                        const sInfo = STATUS_MAP[status] || STATUS_MAP.inactive;
                        const SIcon = sInfo.icon;
                        return (
                          <TableRow key={run.id}>
                            <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                              {format(new Date(run.started_at), "dd/MM HH:mm:ss", { locale: ptBR })}
                            </TableCell>
                            <TableCell className="font-medium">{run.connector_name}</TableCell>
                            <TableCell className="font-mono text-xs">{run.action_name || '-'}</TableCell>
                            <TableCell>
                              <Badge className={sInfo.className}>
                                <SIcon className="h-3 w-3 mr-1" />
                                {sInfo.label}
                              </Badge>
                            </TableCell>
                            <TableCell>{run.duration_ms ? `${run.duration_ms}ms` : '-'}</TableCell>
                          </TableRow>
                        );
                      })}
                      {(!recentRuns || recentRuns.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Nenhuma execução registrada
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}
