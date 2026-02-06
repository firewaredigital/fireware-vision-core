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
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  MessageCircle,
  Plus,
  Settings,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  RefreshCw,
  Trash2,
  Edit,
  Eye,
  FileText,
  Users,
  TrendingUp,
  AlertTriangle,
  Ban,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Copy,
  ExternalLink,
  Smartphone,
  Shield,
  Activity,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Database } from '@/integrations/supabase/types';

// Use database types directly
type WhatsAppAccount = Database['public']['Tables']['whatsapp_accounts']['Row'];
type WhatsAppTemplate = Database['public']['Tables']['whatsapp_templates']['Row'];
type WhatsAppMessageLog = Database['public']['Tables']['whatsapp_message_logs']['Row'];
type WhatsAppOptin = Database['public']['Tables']['whatsapp_optins']['Row'];


export default function WhatsAppAdmin() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('accounts');
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<WhatsAppAccount | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form states
  const [accountForm, setAccountForm] = useState({
    phone_number_id: '',
    display_phone: '',
    waba_id: '',
    business_name: '',
    api_token: '',
    webhook_verify_token: '',
  });

  const [templateForm, setTemplateForm] = useState({
    whatsapp_account_id: '',
    template_name: '',
    category: 'marketing',
    language: 'pt_BR',
    header_type: 'none',
    header_content: '',
    body_content: '',
    footer_content: '',
    variables: '',
  });

  // Queries
  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['whatsapp-accounts', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data, error } = await supabase
        .from('whatsapp_accounts')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as WhatsAppAccount[];
    },
    enabled: !!profile?.organization_id,
  });

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['whatsapp-templates', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as WhatsAppTemplate[];
    },
    enabled: !!profile?.organization_id,
  });

  const { data: messageLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['whatsapp-logs', profile?.organization_id, searchQuery, statusFilter],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      let query = supabase
        .from('whatsapp_message_logs')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as Database['public']['Enums']['whatsapp_message_status']);
      }
      
      if (searchQuery) {
        query = query.or(`from_phone.ilike.%${searchQuery}%,to_phone.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as WhatsAppMessageLog[];
    },
    enabled: !!profile?.organization_id,
  });

  const { data: optins, isLoading: optinsLoading } = useQuery({
    queryKey: ['whatsapp-optins', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data, error } = await supabase
        .from('whatsapp_optins')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as WhatsAppOptin[];
    },
    enabled: !!profile?.organization_id,
  });

  // Mutations
  const createAccountMutation = useMutation({
    mutationFn: async (data: typeof accountForm) => {
      if (!profile?.organization_id || !profile?.id) throw new Error('Não autenticado');
      const { error } = await supabase.from('whatsapp_accounts').insert([{
        organization_id: profile.organization_id,
        phone_number_id: data.phone_number_id,
        display_phone: data.display_phone,
        waba_id: data.waba_id || null,
        business_name: data.business_name || 'Empresa',
        api_token_encrypted: data.api_token,
        webhook_verify_token: data.webhook_verify_token || crypto.randomUUID().replace(/-/g, ''),
        status: 'pending_verification' as const,
        created_by: profile.id,
        updated_by: profile.id,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Conta WhatsApp criada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-accounts'] });
      setIsAccountDialogOpen(false);
      resetAccountForm();
    },
    onError: (error) => {
      toast.error('Erro ao criar conta: ' + (error as Error).message);
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<WhatsAppAccount> }) => {
      if (!profile?.id) throw new Error('Não autenticado');
      const { error } = await supabase
        .from('whatsapp_accounts')
        .update({ ...data, updated_by: profile.id })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Conta atualizada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-accounts'] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar conta: ' + (error as Error).message);
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('whatsapp_accounts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Conta removida com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-accounts'] });
    },
    onError: (error) => {
      toast.error('Erro ao remover conta: ' + (error as Error).message);
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: typeof templateForm) => {
      if (!profile?.organization_id || !profile?.id) throw new Error('Não autenticado');
      const { error } = await supabase.from('whatsapp_templates').insert([{
        organization_id: profile.organization_id,
        whatsapp_account_id: data.whatsapp_account_id,
        template_name: data.template_name,
        category: data.category as Database['public']['Enums']['whatsapp_template_category'],
        language: data.language,
        header_type: data.header_type !== 'none' ? data.header_type : null,
        header_content: data.header_content || null,
        body_text: data.body_content,
        footer_text: data.footer_content || null,
        variables: data.variables ? data.variables.split(',').map(v => v.trim()) : null,
        status: 'pending' as const,
        created_by: profile.id,
        updated_by: profile.id,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Template criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
      setIsTemplateDialogOpen(false);
      resetTemplateForm();
    },
    onError: (error) => {
      toast.error('Erro ao criar template: ' + (error as Error).message);
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('whatsapp_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Template removido com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
    },
    onError: (error) => {
      toast.error('Erro ao remover template: ' + (error as Error).message);
    },
  });

  // Helpers
  const resetAccountForm = () => {
    setAccountForm({
      phone_number_id: '',
      display_phone: '',
      waba_id: '',
      business_name: '',
      api_token: '',
      webhook_verify_token: '',
    });
    setSelectedAccount(null);
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      whatsapp_account_id: '',
      template_name: '',
      category: 'marketing',
      language: 'pt_BR',
      header_type: 'none',
      header_content: '',
      body_content: '',
      footer_content: '',
      variables: '',
    });
    setSelectedTemplate(null);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
      active: { variant: 'default', icon: CheckCircle },
      connected: { variant: 'default', icon: CheckCircle },
      pending: { variant: 'secondary', icon: Clock },
      disconnected: { variant: 'destructive', icon: XCircle },
      error: { variant: 'destructive', icon: AlertTriangle },
      approved: { variant: 'default', icon: CheckCircle },
      rejected: { variant: 'destructive', icon: Ban },
      draft: { variant: 'outline', icon: FileText },
      pending_approval: { variant: 'secondary', icon: Clock },
      sent: { variant: 'default', icon: Send },
      delivered: { variant: 'default', icon: CheckCircle },
      read: { variant: 'default', icon: Eye },
      failed: { variant: 'destructive', icon: XCircle },
      opted_in: { variant: 'default', icon: CheckCircle },
      opted_out: { variant: 'destructive', icon: Ban },
    };
    const config = statusConfig[status] || { variant: 'outline' as const, icon: Clock };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getQualityBadge = (quality: string | null) => {
    if (!quality) return null;
    const qualityConfig: Record<string, 'default' | 'secondary' | 'destructive'> = {
      green: 'default',
      yellow: 'secondary',
      red: 'destructive',
    };
    return <Badge variant={qualityConfig[quality] || 'outline'}>{quality.toUpperCase()}</Badge>;
  };

  // Calculate stats
  const stats = {
    totalAccounts: accounts?.length || 0,
    activeAccounts: accounts?.filter(a => a.status === 'active').length || 0,
    totalTemplates: templates?.length || 0,
    approvedTemplates: templates?.filter(t => t.status === 'approved').length || 0,
    messagesToday: accounts?.reduce((sum, a) => sum + (a.messages_sent_today || 0), 0) || 0,
    messagesReceivedToday: accounts?.reduce((sum, a) => sum + (a.messages_received_today || 0), 0) || 0,
    totalOptins: optins?.filter(o => o.is_opted_in).length || 0,
  };

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook`;

  return (
    <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <MessageCircle className="h-8 w-8 text-green-600" />
              WhatsApp Business
            </h1>
            <p className="text-muted-foreground">
              Gerencie contas, templates e mensagens do WhatsApp Business API
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['whatsapp-accounts'] })}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contas Ativas</CardTitle>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeAccounts}/{stats.totalAccounts}</div>
              <p className="text-xs text-muted-foreground">contas configuradas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Templates Aprovados</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approvedTemplates}/{stats.totalTemplates}</div>
              <p className="text-xs text-muted-foreground">templates disponíveis</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensagens Hoje</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.messagesToday}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.messagesReceivedToday} recebidas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Opt-ins Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOptins}</div>
              <p className="text-xs text-muted-foreground">contatos com consentimento</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="accounts" className="gap-2">
              <Smartphone className="h-4 w-4" />
              Contas
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <Activity className="h-4 w-4" />
              Logs de Mensagens
            </TabsTrigger>
            <TabsTrigger value="optins" className="gap-2">
              <Shield className="h-4 w-4" />
              Opt-ins
            </TabsTrigger>
          </TabsList>

          {/* Accounts Tab */}
          <TabsContent value="accounts" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Contas WhatsApp Business</CardTitle>
                  <CardDescription>
                    Configure suas contas do WhatsApp Business API para envio e recebimento de mensagens
                  </CardDescription>
                </div>
                <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetAccountForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Conta
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {selectedAccount ? 'Editar Conta WhatsApp' : 'Nova Conta WhatsApp'}
                      </DialogTitle>
                      <DialogDescription>
                        Configure os detalhes da sua conta WhatsApp Business API
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone_number_id">Phone Number ID *</Label>
                          <Input
                            id="phone_number_id"
                            placeholder="Ex: 123456789012345"
                            value={accountForm.phone_number_id}
                            onChange={(e) => setAccountForm({ ...accountForm, phone_number_id: e.target.value })}
                          />
                          <p className="text-xs text-muted-foreground">
                            ID do número de telefone no Meta Business
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="display_phone">Número de Exibição *</Label>
                          <Input
                            id="display_phone"
                            placeholder="Ex: +55 11 99999-9999"
                            value={accountForm.display_phone}
                            onChange={(e) => setAccountForm({ ...accountForm, display_phone: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="waba_id">WABA ID</Label>
                          <Input
                            id="waba_id"
                            placeholder="WhatsApp Business Account ID"
                            value={accountForm.waba_id}
                            onChange={(e) => setAccountForm({ ...accountForm, waba_id: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="business_name">Nome do Negócio</Label>
                          <Input
                            id="business_name"
                            placeholder="Nome exibido no WhatsApp"
                            value={accountForm.business_name}
                            onChange={(e) => setAccountForm({ ...accountForm, business_name: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="api_token">Token de Acesso da API *</Label>
                        <Input
                          id="api_token"
                          type="password"
                          placeholder="Token de acesso permanente do Meta"
                          value={accountForm.api_token}
                          onChange={(e) => setAccountForm({ ...accountForm, api_token: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                          Token gerado no Meta Business Suite com permissões do WhatsApp
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="webhook_verify_token">Token de Verificação do Webhook</Label>
                        <Input
                          id="webhook_verify_token"
                          placeholder="Token secreto para verificação do webhook"
                          value={accountForm.webhook_verify_token}
                          onChange={(e) => setAccountForm({ ...accountForm, webhook_verify_token: e.target.value })}
                        />
                      </div>
                      <div className="rounded-lg border p-4 bg-muted/50">
                        <Label className="text-sm font-medium">URL do Webhook</Label>
                        <div className="flex items-center gap-2 mt-2">
                          <code className="flex-1 text-sm bg-background p-2 rounded">
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
                          Configure esta URL no Meta Business Suite para receber mensagens
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAccountDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button
                        onClick={() => createAccountMutation.mutate(accountForm)}
                        disabled={createAccountMutation.isPending || !accountForm.phone_number_id || !accountForm.display_phone || !accountForm.api_token}
                      >
                        {createAccountMutation.isPending ? 'Salvando...' : 'Salvar Conta'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {accountsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : accounts && accounts.length > 0 ? (
                  <div className="space-y-4">
                    {accounts.map((account) => (
                      <div
                        key={account.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                            <MessageCircle className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">
                                {account.business_name || account.display_phone}
                              </h3>
                              {getStatusBadge(account.status)}
                              {getQualityBadge(account.quality_rating)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {account.display_phone}
                              </span>
                              <span>ID: {account.phone_number_id}</span>
                              {account.messaging_limit && (
                                <span>Limite: {account.messaging_limit}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                              <span>Enviadas hoje: {account.messages_sent_today}</span>
                              <span>Recebidas hoje: {account.messages_received_today}</span>
                              {account.last_message_at && (
                                <span>
                                  Última: {format(new Date(account.last_message_at), "dd/MM HH:mm", { locale: ptBR })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 mr-4">
                            <Label htmlFor={`active-${account.id}`} className="text-sm">
                              Ativa
                            </Label>
                            <Switch
                              id={`active-${account.id}`}
                              checked={account.status === 'active'}
                              onCheckedChange={(checked) => 
                                updateAccountMutation.mutate({ id: account.id, data: { status: checked ? 'active' : 'suspended' } })
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
                              <DropdownMenuItem onClick={() => {
                                setSelectedAccount(account);
                                setAccountForm({
                                  phone_number_id: account.phone_number_id,
                                  display_phone: account.display_phone,
                                  waba_id: account.waba_id || '',
                                  business_name: account.business_name || '',
                                  api_token: '',
                                  webhook_verify_token: '',
                                });
                                setIsAccountDialogOpen(true);
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  if (confirm('Tem certeza que deseja remover esta conta?')) {
                                    deleteAccountMutation.mutate(account.id);
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
                    <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">Nenhuma conta configurada</h3>
                    <p className="text-muted-foreground mb-4">
                      Adicione uma conta do WhatsApp Business API para começar
                    </p>
                    <Button onClick={() => setIsAccountDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Conta
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Templates de Mensagem</CardTitle>
                  <CardDescription>
                    Gerencie templates aprovados pela Meta para envio de mensagens proativas
                  </CardDescription>
                </div>
                <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetTemplateForm} disabled={!accounts || accounts.length === 0}>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Criar Template de Mensagem</DialogTitle>
                      <DialogDescription>
                        Configure um novo template para aprovação pela Meta
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="template_account">Conta WhatsApp *</Label>
                          <Select
                            value={templateForm.whatsapp_account_id}
                            onValueChange={(value) => setTemplateForm({ ...templateForm, whatsapp_account_id: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a conta" />
                            </SelectTrigger>
                            <SelectContent>
                              {accounts?.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  {account.business_name || account.display_phone}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="template_name">Nome do Template *</Label>
                          <Input
                            id="template_name"
                            placeholder="Ex: order_confirmation"
                            value={templateForm.template_name}
                            onChange={(e) => setTemplateForm({ ...templateForm, template_name: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                          />
                          <p className="text-xs text-muted-foreground">
                            Apenas letras minúsculas e underscores
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="template_category">Categoria *</Label>
                          <Select
                            value={templateForm.category}
                            onValueChange={(value) => setTemplateForm({ ...templateForm, category: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="marketing">Marketing</SelectItem>
                              <SelectItem value="utility">Utilidade</SelectItem>
                              <SelectItem value="authentication">Autenticação</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="template_language">Idioma *</Label>
                          <Select
                            value={templateForm.language}
                            onValueChange={(value) => setTemplateForm({ ...templateForm, language: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pt_BR">Português (Brasil)</SelectItem>
                              <SelectItem value="en_US">English (US)</SelectItem>
                              <SelectItem value="es">Español</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="header_type">Tipo de Cabeçalho</Label>
                        <Select
                          value={templateForm.header_type}
                          onValueChange={(value) => setTemplateForm({ ...templateForm, header_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhum</SelectItem>
                            <SelectItem value="text">Texto</SelectItem>
                            <SelectItem value="image">Imagem</SelectItem>
                            <SelectItem value="video">Vídeo</SelectItem>
                            <SelectItem value="document">Documento</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {templateForm.header_type !== 'none' && (
                        <div className="space-y-2">
                          <Label htmlFor="header_content">
                            {templateForm.header_type === 'text' ? 'Texto do Cabeçalho' : 'URL da Mídia'}
                          </Label>
                          <Input
                            id="header_content"
                            placeholder={templateForm.header_type === 'text' ? 'Título do template' : 'https://...'}
                            value={templateForm.header_content}
                            onChange={(e) => setTemplateForm({ ...templateForm, header_content: e.target.value })}
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="body_content">Corpo da Mensagem *</Label>
                        <Textarea
                          id="body_content"
                          placeholder="Olá {{1}}, seu pedido {{2}} foi confirmado!"
                          value={templateForm.body_content}
                          onChange={(e) => setTemplateForm({ ...templateForm, body_content: e.target.value })}
                          rows={4}
                        />
                        <p className="text-xs text-muted-foreground">
                          Use {`{{1}}`}, {`{{2}}`}, etc. para variáveis dinâmicas
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="footer_content">Rodapé (opcional)</Label>
                        <Input
                          id="footer_content"
                          placeholder="Fireware CRM - Sua empresa"
                          value={templateForm.footer_content}
                          onChange={(e) => setTemplateForm({ ...templateForm, footer_content: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="variables">Variáveis (separadas por vírgula)</Label>
                        <Input
                          id="variables"
                          placeholder="nome, numero_pedido, data_entrega"
                          value={templateForm.variables}
                          onChange={(e) => setTemplateForm({ ...templateForm, variables: e.target.value })}
                        />
                      </div>
                      
                      {/* Preview */}
                      <div className="rounded-lg border p-4 bg-muted/50">
                        <Label className="text-sm font-medium mb-3 block">Pré-visualização</Label>
                        <div className="bg-background rounded-lg p-4 max-w-sm border shadow-sm">
                          {templateForm.header_type === 'text' && templateForm.header_content && (
                            <div className="font-semibold mb-2">{templateForm.header_content}</div>
                          )}
                          <div className="text-sm whitespace-pre-wrap">
                            {templateForm.body_content || 'Corpo da mensagem...'}
                          </div>
                          {templateForm.footer_content && (
                            <div className="text-xs text-muted-foreground mt-2">
                              {templateForm.footer_content}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button
                        onClick={() => createTemplateMutation.mutate(templateForm)}
                        disabled={
                          createTemplateMutation.isPending ||
                          !templateForm.whatsapp_account_id ||
                          !templateForm.template_name ||
                          !templateForm.body_content
                        }
                      >
                        {createTemplateMutation.isPending ? 'Salvando...' : 'Criar Template'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {templatesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : templates && templates.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map((template) => (
                      <Card key={template.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">{template.template_name}</CardTitle>
                              <CardDescription className="text-xs">
                                {template.category} • {template.language}
                              </CardDescription>
                            </div>
                            {getStatusBadge(template.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="text-sm text-muted-foreground line-clamp-3 mb-3">
                            {template.body_text}
                          </div>
                          {template.variables && Array.isArray(template.variables) && (template.variables as unknown as string[]).length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {(template.variables as unknown as string[]).map((variable: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {variable}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {template.rejection_reason && (
                            <div className="text-xs text-destructive bg-destructive/10 p-2 rounded mb-3">
                              Motivo: {template.rejection_reason}
                            </div>
                          )}
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => {
                                if (confirm('Tem certeza que deseja remover este template?')) {
                                  deleteTemplateMutation.mutate(template.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">Nenhum template criado</h3>
                    <p className="text-muted-foreground mb-4">
                      Crie templates para enviar mensagens proativas pelo WhatsApp
                    </p>
                    <Button onClick={() => setIsTemplateDialogOpen(true)} disabled={!accounts || accounts.length === 0}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Template
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Message Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Logs de Mensagens</CardTitle>
                    <CardDescription>
                      Histórico de todas as mensagens enviadas e recebidas
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por telefone ou conteúdo..."
                        className="pl-9 w-64"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="sent">Enviadas</SelectItem>
                        <SelectItem value="delivered">Entregues</SelectItem>
                        <SelectItem value="read">Lidas</SelectItem>
                        <SelectItem value="failed">Falhas</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : messageLogs && messageLogs.length > 0 ? (
                  <ScrollArea className="h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-24">Direção</TableHead>
                          <TableHead>De / Para</TableHead>
                          <TableHead className="w-32">Tipo</TableHead>
                          <TableHead>Conteúdo</TableHead>
                          <TableHead className="w-28">Status</TableHead>
                          <TableHead className="w-36">Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {messageLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              <Badge variant={log.direction === 'inbound' ? 'outline' : 'secondary'}>
                                {log.direction === 'inbound' ? 'Recebida' : 'Enviada'}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {log.direction === 'inbound' ? log.from_phone : log.to_phone}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{log.message_type}</Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {log.template_name ? (
                                <span className="text-muted-foreground">
                                  [Template: {log.template_name}]
                                </span>
                              ) : (
                                log.content
                              )}
                            </TableCell>
                            <TableCell>{getStatusBadge(log.status)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(log.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">Nenhum log encontrado</h3>
                    <p className="text-muted-foreground">
                      Os logs de mensagens aparecerão aqui quando houver atividade
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Opt-ins Tab */}
          <TabsContent value="optins" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gerenciamento de Opt-ins</CardTitle>
                    <CardDescription>
                      Controle de consentimento para comunicações via WhatsApp
                    </CardDescription>
                  </div>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {optinsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : optins && optins.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead>Mensagens</TableHead>
                        <TableHead>Opt-in em</TableHead>
                        <TableHead>Última Mensagem</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {optins.map((optin) => (
                        <TableRow key={optin.id}>
                          <TableCell className="font-mono">{optin.phone_number}</TableCell>
                          <TableCell>
                            <Badge variant={optin.is_opted_in ? 'default' : 'destructive'}>
                              {optin.is_opted_in ? 'Opted In' : 'Opted Out'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{optin.opt_in_source || 'N/A'}</Badge>
                          </TableCell>
                          <TableCell>
                            {optin.marketing_opted_in ? '✓' : '—'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {optin.opted_in_at
                              ? format(new Date(optin.opted_in_at), "dd/MM/yy HH:mm", { locale: ptBR })
                              : '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {optin.updated_at
                              ? format(new Date(optin.updated_at), "dd/MM/yy HH:mm", { locale: ptBR })
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">Nenhum opt-in registrado</h3>
                    <p className="text-muted-foreground">
                      Os registros de consentimento aparecerão aqui
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
