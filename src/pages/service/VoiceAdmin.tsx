import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  PhoneOff,
  Plus,
  Settings,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Download,
  RefreshCw,
  Trash2,
  Edit,
  Eye,
  Users,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  MoreHorizontal,
  Copy,
  FileText,
  Voicemail,
  Timer,
  BarChart3,
  Headphones,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Database } from '@/integrations/supabase/types';

// Use database types directly
type VoiceProvider = Database['public']['Tables']['voice_providers']['Row'];
type VoiceCall = Database['public']['Tables']['voice_calls']['Row'];
type VoiceVoicemail = Database['public']['Tables']['voice_voicemails']['Row'];
type VoiceTranscript = Database['public']['Tables']['voice_transcripts']['Row'];


export default function VoiceAdmin() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('providers');
  const [isProviderDialogOpen, setIsProviderDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<VoiceProvider | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  // Form states
  const [providerForm, setProviderForm] = useState({
    name: '',
    provider_type: 'twilio',
    account_sid: '',
    auth_token: '',
    phone_number: '',
    region: 'us1',
  });

  // Queries
  const { data: providers, isLoading: providersLoading } = useQuery({
    queryKey: ['voice-providers', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data, error } = await supabase
        .from('voice_providers')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as VoiceProvider[];
    },
    enabled: !!profile?.organization_id,
  });

  const { data: calls, isLoading: callsLoading } = useQuery({
    queryKey: ['voice-calls', profile?.organization_id, searchQuery, statusFilter, directionFilter],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      let query = supabase
        .from('voice_calls')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('initiated_at', { ascending: false })
        .limit(100);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as Database['public']['Enums']['voice_call_status']);
      }
      if (directionFilter !== 'all') {
        query = query.eq('direction', directionFilter as Database['public']['Enums']['communication_direction']);
      }
      if (searchQuery) {
        query = query.or(`from_number.ilike.%${searchQuery}%,to_number.ilike.%${searchQuery}%,caller_name.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as VoiceCall[];
    },
    enabled: !!profile?.organization_id,
  });

  const { data: voicemails, isLoading: voicemailsLoading } = useQuery({
    queryKey: ['voice-voicemails', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data, error } = await supabase
        .from('voice_voicemails')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as VoiceVoicemail[];
    },
    enabled: !!profile?.organization_id,
  });

  const { data: transcripts, isLoading: transcriptsLoading } = useQuery({
    queryKey: ['voice-transcripts', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data, error } = await supabase
        .from('voice_transcripts')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as VoiceTranscript[];
    },
    enabled: !!profile?.organization_id,
  });

  // Mutations
  const createProviderMutation = useMutation({
    mutationFn: async (data: typeof providerForm) => {
      if (!profile?.organization_id || !profile?.id) throw new Error('Não autenticado');
      const { error } = await supabase.from('voice_providers').insert({
        organization_id: profile.organization_id,
        name: data.name,
        provider_type: data.provider_type,
        account_sid: data.account_sid,
        auth_token_encrypted: data.auth_token,
        phone_numbers: data.phone_number ? [data.phone_number] : null,
        health_status: 'pending',
        is_active: false,
        created_by: profile.id,
        updated_by: profile.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Provedor de voz criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['voice-providers'] });
      setIsProviderDialogOpen(false);
      resetProviderForm();
    },
    onError: (error) => {
      toast.error('Erro ao criar provedor: ' + (error as Error).message);
    },
  });

  const updateProviderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<VoiceProvider> }) => {
      if (!profile?.id) throw new Error('Não autenticado');
      const { error } = await supabase
        .from('voice_providers')
        .update({ ...data, updated_by: profile.id })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Provedor atualizado!');
      queryClient.invalidateQueries({ queryKey: ['voice-providers'] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + (error as Error).message);
    },
  });

  const deleteProviderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('voice_providers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Provedor removido!');
      queryClient.invalidateQueries({ queryKey: ['voice-providers'] });
    },
    onError: (error) => {
      toast.error('Erro ao remover: ' + (error as Error).message);
    },
  });

  const markVoicemailListenedMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!profile?.id) throw new Error('Não autenticado');
      const { error } = await supabase
        .from('voice_voicemails')
        .update({ is_read: true, read_by: profile.id, read_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice-voicemails'] });
    },
  });

  // Helpers
  const resetProviderForm = () => {
    setProviderForm({
      name: '',
      provider_type: 'twilio',
      account_sid: '',
      auth_token: '',
      phone_number: '',
      region: 'us1',
    });
    setSelectedProvider(null);
  };

  const formatDurationFromSeconds = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCallStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any; label: string }> = {
      initiated: { variant: 'secondary', icon: Clock, label: 'Iniciada' },
      ringing: { variant: 'secondary', icon: PhoneCall, label: 'Tocando' },
      in_progress: { variant: 'default', icon: Phone, label: 'Em Andamento' },
      completed: { variant: 'outline', icon: CheckCircle, label: 'Completada' },
      busy: { variant: 'destructive', icon: PhoneOff, label: 'Ocupado' },
      no_answer: { variant: 'destructive', icon: PhoneMissed, label: 'Sem Resposta' },
      failed: { variant: 'destructive', icon: XCircle, label: 'Falhou' },
      canceled: { variant: 'outline', icon: PhoneOff, label: 'Cancelada' },
    };
    const config = statusConfig[status] || { variant: 'outline' as const, icon: Phone, label: status };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getDirectionIcon = (direction: string) => {
    if (direction === 'inbound') return PhoneIncoming;
    return PhoneOutgoing;
  };

  const getProviderStatusBadge = (status: string) => {
    const statusConfig: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      connected: 'default',
      active: 'default',
      pending: 'secondary',
      disconnected: 'destructive',
      error: 'destructive',
    };
    return <Badge variant={statusConfig[status] || 'outline'}>{status}</Badge>;
  };

  // Calculate stats
  const stats = {
    totalProviders: providers?.length || 0,
    activeProviders: providers?.filter(p => p.is_active).length || 0,
    todayCalls: calls?.filter(c => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(c.initiated_at) >= today;
    }).length || 0,
    inboundCalls: calls?.filter(c => c.direction === 'inbound').length || 0,
    outboundCalls: calls?.filter(c => c.direction === 'outbound').length || 0,
    missedCalls: calls?.filter(c => c.status === 'no_answer' || c.status === 'missed').length || 0,
    totalMinutes: calls?.filter(c => c.talk_duration_seconds).reduce((sum, c) => sum + Math.round((c.talk_duration_seconds || 0) / 60), 0) || 0,
    unheardVoicemails: voicemails?.filter(v => !v.is_read).length || 0,
    avgCallDuration: calls && calls.length > 0
      ? Math.round(calls.filter(c => c.talk_duration_seconds).reduce((sum, c) => sum + (c.talk_duration_seconds || 0), 0) / calls.filter(c => c.talk_duration_seconds).length)
      : 0,
  };

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-webhook`;

  return (
    <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Phone className="h-8 w-8 text-primary" />
              Telefonia / Voice
            </h1>
            <p className="text-muted-foreground">
              Gerencie provedores de telefonia, chamadas e gravações
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['voice-providers'] })}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Provedores Ativos</CardTitle>
              <Headphones className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProviders}/{stats.totalProviders}</div>
              <p className="text-xs text-muted-foreground">configurados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chamadas Hoje</CardTitle>
              <PhoneCall className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayCalls}</div>
              <p className="text-xs text-muted-foreground">
                {stats.inboundCalls} entrada / {stats.outboundCalls} saída
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Minutos Totais</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMinutes.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">acumulados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDurationFromSeconds(stats.avgCallDuration)}</div>
              <p className="text-xs text-muted-foreground">por chamada</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Voicemails</CardTitle>
              <Voicemail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unheardVoicemails}</div>
              <p className="text-xs text-muted-foreground">não ouvidos</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="providers" className="gap-2">
              <Settings className="h-4 w-4" />
              Provedores
            </TabsTrigger>
            <TabsTrigger value="calls" className="gap-2">
              <PhoneCall className="h-4 w-4" />
              Histórico de Chamadas
            </TabsTrigger>
            <TabsTrigger value="voicemails" className="gap-2">
              <Voicemail className="h-4 w-4" />
              Voicemails
            </TabsTrigger>
            <TabsTrigger value="transcripts" className="gap-2">
              <FileText className="h-4 w-4" />
              Transcrições
            </TabsTrigger>
          </TabsList>

          {/* Providers Tab */}
          <TabsContent value="providers" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Provedores de Telefonia</CardTitle>
                  <CardDescription>
                    Configure suas integrações com provedores de voz (Twilio, etc.)
                  </CardDescription>
                </div>
                <Dialog open={isProviderDialogOpen} onOpenChange={setIsProviderDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetProviderForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Provedor
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Configurar Provedor de Voz</DialogTitle>
                      <DialogDescription>
                        Adicione as credenciais do seu provedor de telefonia
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="provider_name">Nome do Provedor *</Label>
                        <Input
                          id="provider_name"
                          placeholder="Ex: Twilio Principal"
                          value={providerForm.name}
                          onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo de Provedor</Label>
                        <Select
                          value={providerForm.provider_type}
                          onValueChange={(value) => setProviderForm({ ...providerForm, provider_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="twilio">Twilio</SelectItem>
                            <SelectItem value="vonage">Vonage</SelectItem>
                            <SelectItem value="plivo">Plivo</SelectItem>
                            <SelectItem value="telnyx">Telnyx</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="account_sid">Account SID *</Label>
                        <Input
                          id="account_sid"
                          placeholder="ACxxxxxxxxxxxxxxxxxx"
                          value={providerForm.account_sid}
                          onChange={(e) => setProviderForm({ ...providerForm, account_sid: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="auth_token">Auth Token *</Label>
                        <Input
                          id="auth_token"
                          type="password"
                          placeholder="Token de autenticação"
                          value={providerForm.auth_token}
                          onChange={(e) => setProviderForm({ ...providerForm, auth_token: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone_number">Número de Telefone</Label>
                          <Input
                            id="phone_number"
                            placeholder="+5511999999999"
                            value={providerForm.phone_number}
                            onChange={(e) => setProviderForm({ ...providerForm, phone_number: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Região</Label>
                          <Select
                            value={providerForm.region}
                            onValueChange={(value) => setProviderForm({ ...providerForm, region: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="us1">US East</SelectItem>
                              <SelectItem value="ie1">Ireland</SelectItem>
                              <SelectItem value="au1">Australia</SelectItem>
                              <SelectItem value="br1">Brazil</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="rounded-lg border p-4 bg-muted/50">
                        <Label className="text-sm font-medium">URL do Webhook</Label>
                        <div className="flex items-center gap-2 mt-2">
                          <code className="flex-1 text-sm bg-background p-2 rounded truncate">
                            {webhookUrl}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(webhookUrl);
                              toast.success('URL copiada!');
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Configure esta URL no painel do Twilio para Voice webhooks
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsProviderDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button
                        onClick={() => createProviderMutation.mutate(providerForm)}
                        disabled={createProviderMutation.isPending || !providerForm.name || !providerForm.account_sid || !providerForm.auth_token}
                      >
                        {createProviderMutation.isPending ? 'Salvando...' : 'Salvar Provedor'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {providersLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : providers && providers.length > 0 ? (
                  <div className="space-y-4">
                    {providers.map((provider) => (
                      <div
                        key={provider.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                            <Phone className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{provider.name}</h3>
                              {getProviderStatusBadge(provider.health_status || 'pending')}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="capitalize">{provider.provider_type}</span>
                              {provider.phone_numbers && provider.phone_numbers.length > 0 && (
                                <span>{provider.phone_numbers[0]}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                              <span>SID: {provider.account_sid || 'N/A'}</span>
                              {provider.last_health_check && (
                                <span>
                                  Última verificação: {format(new Date(provider.last_health_check), "dd/MM HH:mm", { locale: ptBR })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 mr-4">
                            <Label htmlFor={`active-${provider.id}`} className="text-sm">
                              Ativo
                            </Label>
                            <Switch
                              id={`active-${provider.id}`}
                              checked={provider.is_active}
                              onCheckedChange={(checked) =>
                                updateProviderMutation.mutate({ id: provider.id, data: { is_active: checked } })
                              }
                            />
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  updateProviderMutation.mutate({ id: provider.id, data: { is_active: true } })
                                }
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Ativar Provedor
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  if (confirm('Tem certeza que deseja remover este provedor?')) {
                                    deleteProviderMutation.mutate(provider.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remover
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Phone className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">Nenhum provedor configurado</h3>
                    <p className="text-muted-foreground mb-4">
                      Configure um provedor de telefonia para começar
                    </p>
                    <Button onClick={() => setIsProviderDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Provedor
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calls Tab */}
          <TabsContent value="calls" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Histórico de Chamadas</CardTitle>
                    <CardDescription>
                      Todas as chamadas recebidas e realizadas
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por número..."
                        className="pl-9 w-56"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Select value={directionFilter} onValueChange={setDirectionFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Direção" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="inbound">Entrada</SelectItem>
                        <SelectItem value="outbound">Saída</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="completed">Completada</SelectItem>
                        <SelectItem value="no_answer">Sem Resposta</SelectItem>
                        <SelectItem value="busy">Ocupado</SelectItem>
                        <SelectItem value="failed">Falha</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {callsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : calls && calls.length > 0 ? (
                  <ScrollArea className="h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>De / Para</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Duração</TableHead>
                          <TableHead>Gravação</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {calls.map((call) => {
                          const DirectionIcon = getDirectionIcon(call.direction);
                          return (
                            <TableRow key={call.id}>
                              <TableCell>
                                <div className={`p-2 rounded-full ${call.direction === 'inbound' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                  <DirectionIcon className="h-4 w-4" />
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium font-mono">
                                    {call.direction === 'inbound' ? call.from_number : call.to_number}
                                  </p>
                                  {call.caller_name && (
                                    <p className="text-xs text-muted-foreground">{call.caller_name}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{getCallStatusBadge(call.status)}</TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1 text-sm">
                                    <Phone className="h-3 w-3" />
                                    {formatDurationFromSeconds(call.talk_duration_seconds)}
                                  </div>
                                  {(call.hold_duration_seconds || 0) > 0 && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Pause className="h-3 w-3" />
                                      {formatDurationFromSeconds(call.hold_duration_seconds)} hold
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {call.recording_url ? (
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => {
                                        if (playingAudio === call.id) {
                                          setPlayingAudio(null);
                                        } else {
                                          setPlayingAudio(call.id);
                                        }
                                      }}
                                    >
                                      {playingAudio === call.id ? (
                                        <Pause className="h-4 w-4" />
                                      ) : (
                                        <Play className="h-4 w-4" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => window.open(call.recording_url!, '_blank')}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                    {call.transcription_status === 'completed' && (
                                      <Badge variant="outline" className="text-xs">
                                        <FileText className="h-3 w-3 mr-1" />
                                        Transcrita
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm">
                                <div>
                                  {format(new Date(call.initiated_at), "dd/MM/yy", { locale: ptBR })}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(call.initiated_at), "HH:mm", { locale: ptBR })}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <PhoneCall className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">Nenhuma chamada encontrada</h3>
                    <p className="text-muted-foreground">
                      O histórico de chamadas aparecerá aqui
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Voicemails Tab */}
          <TabsContent value="voicemails" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Voicemails</CardTitle>
                <CardDescription>
                  Mensagens de voz deixadas por clientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {voicemailsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : voicemails && voicemails.length > 0 ? (
                  <div className="space-y-4">
                    {voicemails.map((voicemail) => (
                      <div
                        key={voicemail.id}
                        className={`flex items-start justify-between p-4 rounded-lg border ${
                          !voicemail.is_read ? 'bg-primary/5 border-primary/20' : 'bg-card'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            <Voicemail className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-medium">Chamada {voicemail.call_id.slice(0, 8)}...</span>
                              {!voicemail.is_read && (
                                <Badge variant="default" className="text-xs">Novo</Badge>
                              )}
                              {voicemail.callback_requested && !voicemail.callback_completed && (
                                <Badge variant="secondary" className="text-xs">Callback Pendente</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Timer className="h-3 w-3" />
                                {formatDurationFromSeconds(voicemail.duration_seconds)}
                              </span>
                              <span>
                                {format(new Date(voicemail.created_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                            {voicemail.transcription_text && (
                              <p className="text-sm mt-2 p-2 bg-muted rounded">
                                "{voicemail.transcription_text}"
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              window.open(voicemail.audio_url, '_blank');
                              if (!voicemail.is_read) {
                                markVoicemailListenedMutation.mutate(voicemail.id);
                              }
                            }}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Ouvir
                          </Button>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Voicemail className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">Nenhum voicemail</h3>
                    <p className="text-muted-foreground">
                      Os voicemails aparecerão aqui quando forem deixados
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transcripts Tab */}
          <TabsContent value="transcripts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Transcrições de Chamadas</CardTitle>
                <CardDescription>
                  Transcrições automáticas das gravações de chamadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transcriptsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : transcripts && transcripts.length > 0 ? (
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-4">
                      {transcripts.map((transcript) => (
                        <Card key={transcript.id}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                  Chamada {transcript.call_id.slice(0, 8)}...
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {transcript.language || 'pt-BR'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{transcript.word_count || 0} palavras</span>
                                <span>{formatDurationFromSeconds(transcript.duration_seconds)}</span>
                                {transcript.overall_confidence != null && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs">Confiança:</span>
                                    <Progress value={transcript.overall_confidence * 100} className="w-16 h-2" />
                                    <span className="text-xs">{Math.round(transcript.overall_confidence * 100)}%</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {transcript.full_text}
                              </p>
                            </div>
                            {transcript.keywords && transcript.keywords.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t">
                                {transcript.keywords.map((keyword, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {transcript.sentiment_score != null && (
                              <div className="flex items-center gap-2 mt-3 pt-3 border-t text-sm">
                                <span className="text-muted-foreground">Sentimento:</span>
                                <Badge variant={
                                  transcript.sentiment_score > 0.3 ? 'default' :
                                  transcript.sentiment_score < -0.3 ? 'destructive' : 'secondary'
                                }>
                                  {transcript.sentiment_score > 0.3 ? 'Positivo' :
                                   transcript.sentiment_score < -0.3 ? 'Negativo' : 'Neutro'}
                                </Badge>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">Nenhuma transcrição disponível</h3>
                    <p className="text-muted-foreground">
                      As transcrições das chamadas gravadas aparecerão aqui
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}
