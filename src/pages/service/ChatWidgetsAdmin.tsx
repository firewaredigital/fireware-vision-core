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
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  MessageSquare,
  Plus,
  Settings,
  Code,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Trash2,
  Edit,
  Eye,
  Users,
  TrendingUp,
  Activity,
  Globe,
  Palette,
  Copy,
  ExternalLink,
  MoreHorizontal,
  Monitor,
  Smartphone,
  MessageCircle,
  Bot,
  UserCircle,
  LayoutGrid,
  MousePointer,
  Timer,
  Zap,
} from '@/components/icons';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Database } from '@/integrations/supabase/types';

// Use database types directly
type ChatWidget = Database['public']['Tables']['chat_widgets']['Row'];
type ChatSession = Database['public']['Tables']['chat_sessions']['Row'];
type ChatWidgetEvent = Database['public']['Tables']['chat_widget_events']['Row'];


export default function ChatWidgetsAdmin() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('widgets');
  const [isWidgetDialogOpen, setIsWidgetDialogOpen] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<ChatWidget | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  // Form states
  const [widgetForm, setWidgetForm] = useState({
    name: '',
    position: 'bottom-right',
    theme: 'light',
    primary_color: '#4F46E5',
    greeting_message: 'Olá! Como posso ajudar?',
    offline_message: 'No momento não estamos online. Deixe sua mensagem!',
    input_placeholder: 'Digite sua mensagem...',
    header_text: 'Chat de Suporte',
    show_agent_photo: true,
    show_agent_name: true,
    require_email: false,
    require_name: false,
    pre_chat_form: true,
    auto_open_delay: 0,
    sound_enabled: true,
    auto_reply_enabled: true,
    auto_reply_message: 'Obrigado por entrar em contato! Um atendente irá responder em breve.',
    typing_indicator: true,
    read_receipts: true,
    file_upload_enabled: true,
    max_file_size_mb: 10,
    allowed_domains: '',
  });

  // Queries
  const { data: widgets, isLoading: widgetsLoading } = useQuery({
    queryKey: ['chat-widgets', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data, error } = await supabase
        .from('chat_widgets')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ChatWidget[];
    },
    enabled: !!profile?.organization_id,
  });

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['chat-sessions', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('started_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as ChatSession[];
    },
    enabled: !!profile?.organization_id,
  });

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['chat-widget-events', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data, error } = await supabase
        .from('chat_widget_events')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as ChatWidgetEvent[];
    },
    enabled: !!profile?.organization_id,
  });

  // Mutations
  const createWidgetMutation = useMutation({
    mutationFn: async (data: typeof widgetForm) => {
      if (!profile?.organization_id || !profile?.id) throw new Error('Não autenticado');
      const widgetKey = `fw_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
      const { error } = await supabase.from('chat_widgets').insert({
        organization_id: profile.organization_id,
        name: data.name,
        widget_key: widgetKey,
        position: data.position,
        primary_color: data.primary_color,
        greeting_message: data.greeting_message,
        offline_message: data.offline_message,
        placeholder_text: data.input_placeholder,
        show_agent_avatar: data.show_agent_photo,
        show_agent_name: data.show_agent_name,
        pre_chat_form_enabled: data.pre_chat_form,
        auto_open: data.auto_open_delay > 0,
        auto_open_delay_seconds: data.auto_open_delay,
        play_sound_on_message: data.sound_enabled,
        bot_enabled: data.auto_reply_enabled,
        bot_greeting: data.auto_reply_message,
        window_title: data.header_text,
        allowed_domains: data.allowed_domains ? data.allowed_domains.split(',').map(d => d.trim()) : null,
        is_active: true,
        created_by: profile.id,
        updated_by: profile.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Widget criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['chat-widgets'] });
      setIsWidgetDialogOpen(false);
      resetWidgetForm();
    },
    onError: (error) => {
      toast.error('Erro ao criar widget: ' + (error as Error).message);
    },
  });

  const updateWidgetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ChatWidget> }) => {
      if (!profile?.id) throw new Error('Não autenticado');
      const { error } = await supabase
        .from('chat_widgets')
        .update({ ...data, updated_by: profile.id })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Widget atualizado!');
      queryClient.invalidateQueries({ queryKey: ['chat-widgets'] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + (error as Error).message);
    },
  });

  const deleteWidgetMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('chat_widgets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Widget removido!');
      queryClient.invalidateQueries({ queryKey: ['chat-widgets'] });
    },
    onError: (error) => {
      toast.error('Erro ao remover: ' + (error as Error).message);
    },
  });

  // Helpers
  const resetWidgetForm = () => {
    setWidgetForm({
      name: '',
      position: 'bottom-right',
      theme: 'light',
      primary_color: '#4F46E5',
      greeting_message: 'Olá! Como posso ajudar?',
      offline_message: 'No momento não estamos online. Deixe sua mensagem!',
      input_placeholder: 'Digite sua mensagem...',
      header_text: 'Chat de Suporte',
      show_agent_photo: true,
      show_agent_name: true,
      require_email: false,
      require_name: false,
      pre_chat_form: true,
      auto_open_delay: 0,
      sound_enabled: true,
      auto_reply_enabled: true,
      auto_reply_message: 'Obrigado por entrar em contato! Um atendente irá responder em breve.',
      typing_indicator: true,
      read_receipts: true,
      file_upload_enabled: true,
      max_file_size_mb: 10,
      allowed_domains: '',
    });
    setSelectedWidget(null);
  };

  const generateEmbedCode = (widgetKey: string) => {
    const scriptUrl = `${window.location.origin}/widget.js`;
    return `<!-- Fireware Chat Widget -->
<script>
  (function(w,d,s,o,f,js,fjs){
    w['FirewareChat']=o;w[o]=w[o]||function(){
    (w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s);fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','fw','${scriptUrl}'));
  fw('init', '${widgetKey}');
</script>`;
  };

  const getSessionStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      active: { variant: 'default', label: 'Ativo' },
      idle: { variant: 'secondary', label: 'Inativo' },
      ended: { variant: 'outline', label: 'Encerrado' },
    };
    const config = statusConfig[status] || { variant: 'outline' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getEventIcon = (eventType: string) => {
    const icons: Record<string, unknown> = {
      session_started: MessageCircle,
      message_sent: MessageSquare,
      message_received: MessageSquare,
      widget_opened: Eye,
      widget_closed: XCircle,
      page_view: Globe,
      form_submitted: CheckCircle,
      agent_joined: UserCircle,
      agent_left: UserCircle,
      file_uploaded: Zap,
    };
    return icons[eventType] || Activity;
  };

  // Calculate stats
  const stats = {
    totalWidgets: widgets?.length || 0,
    activeWidgets: widgets?.filter(w => w.is_active).length || 0,
    totalConversations: widgets?.reduce((sum, w) => sum + (w.total_conversations || 0), 0) || 0,
    activeSessions: sessions?.filter(s => s.status === 'active').length || 0,
    todaySessions: sessions?.filter(s => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(s.started_at) >= today;
    }).length || 0,
    todayEvents: events?.filter(e => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(e.created_at) >= today;
    }).length || 0,
  };

  return (
    <>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <MessageSquare className="h-8 w-8 text-primary" />
              Chat Widgets
            </h1>
            <p className="text-muted-foreground">
              Configure e gerencie widgets de chat para seu site
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['chat-widgets'] })}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Widgets Ativos</CardTitle>
              <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeWidgets}/{stats.totalWidgets}</div>
              <p className="text-xs text-muted-foreground">widgets configurados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversas Totais</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalConversations}</div>
              <p className="text-xs text-muted-foreground">via chat widget</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sessões Hoje</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todaySessions}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeSessions} ativas agora
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eventos Hoje</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayEvents}</div>
              <p className="text-xs text-muted-foreground">interações registradas</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="widgets" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Widgets
            </TabsTrigger>
            <TabsTrigger value="sessions" className="gap-2">
              <Users className="h-4 w-4" />
              Sessões
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2">
              <Activity className="h-4 w-4" />
              Eventos
            </TabsTrigger>
            <TabsTrigger value="embed" className="gap-2">
              <Code className="h-4 w-4" />
              Instalação
            </TabsTrigger>
          </TabsList>

          {/* Widgets Tab */}
          <TabsContent value="widgets" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Widgets de Chat</CardTitle>
                  <CardDescription>
                    Configure a aparência e comportamento dos seus widgets de chat
                  </CardDescription>
                </div>
                <Dialog open={isWidgetDialogOpen} onOpenChange={setIsWidgetDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetWidgetForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Widget
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Criar Chat Widget</DialogTitle>
                      <DialogDescription>
                        Configure todos os aspectos do seu widget de chat
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-6 py-4">
                      {/* Left Column - Form */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="widget_name">Nome do Widget *</Label>
                          <Input
                            id="widget_name"
                            placeholder="Ex: Chat Principal"
                            value={widgetForm.name}
                            onChange={(e) => setWidgetForm({ ...widgetForm, name: e.target.value })}
                          />
                        </div>

                        <div className="border-t pt-4">
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <Palette className="h-4 w-4" />
                            Aparência
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Posição</Label>
                              <Select
                                value={widgetForm.position}
                                onValueChange={(value) => setWidgetForm({ ...widgetForm, position: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="bottom-right">Inferior Direita</SelectItem>
                                  <SelectItem value="bottom-left">Inferior Esquerda</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Tema</Label>
                              <Select
                                value={widgetForm.theme}
                                onValueChange={(value) => setWidgetForm({ ...widgetForm, theme: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="light">Claro</SelectItem>
                                  <SelectItem value="dark">Escuro</SelectItem>
                                  <SelectItem value="auto">Automático</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="space-y-2">
                              <Label>Cor Principal</Label>
                              <div className="flex gap-2">
                                <Input
                                  type="color"
                                  className="w-12 h-10 p-1"
                                  value={widgetForm.primary_color}
                                  onChange={(e) => setWidgetForm({ ...widgetForm, primary_color: e.target.value })}
                                />
                                <Input
                                  value={widgetForm.primary_color}
                                  onChange={(e) => setWidgetForm({ ...widgetForm, primary_color: e.target.value })}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Título do Header</Label>
                              <Input
                                value={widgetForm.header_text}
                                onChange={(e) => setWidgetForm({ ...widgetForm, header_text: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Mensagens
                          </h4>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Saudação Inicial</Label>
                              <Textarea
                                value={widgetForm.greeting_message}
                                onChange={(e) => setWidgetForm({ ...widgetForm, greeting_message: e.target.value })}
                                rows={2}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Mensagem Offline</Label>
                              <Textarea
                                value={widgetForm.offline_message}
                                onChange={(e) => setWidgetForm({ ...widgetForm, offline_message: e.target.value })}
                                rows={2}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Placeholder do Input</Label>
                              <Input
                                value={widgetForm.input_placeholder}
                                onChange={(e) => setWidgetForm({ ...widgetForm, input_placeholder: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Comportamento
                          </h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label>Formulário pré-chat</Label>
                              <Switch
                                checked={widgetForm.pre_chat_form}
                                onCheckedChange={(checked) => setWidgetForm({ ...widgetForm, pre_chat_form: checked })}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label>Exigir nome</Label>
                              <Switch
                                checked={widgetForm.require_name}
                                onCheckedChange={(checked) => setWidgetForm({ ...widgetForm, require_name: checked })}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label>Exigir email</Label>
                              <Switch
                                checked={widgetForm.require_email}
                                onCheckedChange={(checked) => setWidgetForm({ ...widgetForm, require_email: checked })}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label>Mostrar foto do agente</Label>
                              <Switch
                                checked={widgetForm.show_agent_photo}
                                onCheckedChange={(checked) => setWidgetForm({ ...widgetForm, show_agent_photo: checked })}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label>Mostrar nome do agente</Label>
                              <Switch
                                checked={widgetForm.show_agent_name}
                                onCheckedChange={(checked) => setWidgetForm({ ...widgetForm, show_agent_name: checked })}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label>Sons de notificação</Label>
                              <Switch
                                checked={widgetForm.sound_enabled}
                                onCheckedChange={(checked) => setWidgetForm({ ...widgetForm, sound_enabled: checked })}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label>Upload de arquivos</Label>
                              <Switch
                                checked={widgetForm.file_upload_enabled}
                                onCheckedChange={(checked) => setWidgetForm({ ...widgetForm, file_upload_enabled: checked })}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label>Resposta automática</Label>
                              <Switch
                                checked={widgetForm.auto_reply_enabled}
                                onCheckedChange={(checked) => setWidgetForm({ ...widgetForm, auto_reply_enabled: checked })}
                              />
                            </div>
                            {widgetForm.auto_reply_enabled && (
                              <div className="space-y-2 pl-4 border-l-2">
                                <Label>Mensagem de resposta automática</Label>
                                <Textarea
                                  value={widgetForm.auto_reply_message}
                                  onChange={(e) => setWidgetForm({ ...widgetForm, auto_reply_message: e.target.value })}
                                  rows={2}
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Domínios Permitidos
                          </h4>
                          <div className="space-y-2">
                            <Input
                              placeholder="exemplo.com, app.exemplo.com (separados por vírgula)"
                              value={widgetForm.allowed_domains}
                              onChange={(e) => setWidgetForm({ ...widgetForm, allowed_domains: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">
                              Deixe vazio para permitir todos os domínios
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Preview */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Pré-visualização</h4>
                          <div className="flex items-center gap-2">
                            <Button
                              variant={previewMode === 'desktop' ? 'secondary' : 'ghost'}
                              size="sm"
                              onClick={() => setPreviewMode('desktop')}
                            >
                              <Monitor className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={previewMode === 'mobile' ? 'secondary' : 'ghost'}
                              size="sm"
                              onClick={() => setPreviewMode('mobile')}
                            >
                              <Smartphone className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className={`border rounded-lg bg-muted/30 relative ${previewMode === 'mobile' ? 'max-w-xs mx-auto h-[600px]' : 'h-[500px]'}`}>
                          {/* Widget Button */}
                          <div 
                            className={`absolute ${widgetForm.position === 'bottom-right' ? 'right-4' : 'left-4'} bottom-4`}
                          >
                            <div
                              className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer"
                              style={{ backgroundColor: widgetForm.primary_color }}
                            >
                              <MessageCircle className="h-6 w-6 text-white" />
                            </div>
                          </div>

                          {/* Widget Window Preview */}
                          <div 
                            className={`absolute ${widgetForm.position === 'bottom-right' ? 'right-4' : 'left-4'} bottom-20 w-80 bg-background rounded-lg shadow-xl border overflow-hidden`}
                          >
                            {/* Header */}
                            <div
                              className="p-4 text-white"
                              style={{ backgroundColor: widgetForm.primary_color }}
                            >
                              <h3 className="font-semibold">{widgetForm.header_text}</h3>
                              <p className="text-sm opacity-90">Online agora</p>
                            </div>

                            {/* Messages Area */}
                            <div className="p-4 h-48 bg-muted/20">
                              {/* Bot Message */}
                              <div className="flex gap-2 mb-3">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                  <Bot className="h-4 w-4 text-primary" />
                                </div>
                                <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                                  <p className="text-sm">{widgetForm.greeting_message}</p>
                                </div>
                              </div>
                            </div>

                            {/* Input Area */}
                            <div className="p-3 border-t">
                              <div className="flex gap-2">
                                <Input
                                  placeholder={widgetForm.input_placeholder}
                                  className="flex-1"
                                  disabled
                                />
                                <Button size="icon" style={{ backgroundColor: widgetForm.primary_color }}>
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsWidgetDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button
                        onClick={() => createWidgetMutation.mutate(widgetForm)}
                        disabled={createWidgetMutation.isPending || !widgetForm.name}
                      >
                        {createWidgetMutation.isPending ? 'Criando...' : 'Criar Widget'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {widgetsLoading ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-48" />
                    ))}
                  </div>
                ) : widgets && widgets.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {widgets.map((widget) => (
                      <Card key={widget.id} className="overflow-hidden">
                         <div 
                          className="h-2"
                          style={{ backgroundColor: widget.primary_color || '#4F46E5' }}
                        />
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{widget.name}</CardTitle>
                              <CardDescription className="font-mono text-xs">
                                {widget.widget_key}
                              </CardDescription>
                            </div>
                            <Badge variant={widget.is_active ? 'default' : 'secondary'}>
                              {widget.is_active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Posição</span>
                              <span>{widget.position === 'bottom-right' ? 'Inferior Direita' : 'Inferior Esquerda'}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Título</span>
                              <span>{widget.window_title || 'Chat'}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Conversas</span>
                              <span>{widget.total_conversations || 0}</span>
                            </div>
                            {widget.allowed_domains && widget.allowed_domains.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {widget.allowed_domains.slice(0, 2).map((domain, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {domain}
                                  </Badge>
                                ))}
                                {widget.allowed_domains.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{widget.allowed_domains.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={widget.is_active}
                                onCheckedChange={(checked) =>
                                  updateWidgetMutation.mutate({ id: widget.id, data: { is_active: checked } })
                                }
                              />
                              <span className="text-xs text-muted-foreground">
                                {widget.is_active ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  navigator.clipboard.writeText(widget.widget_key);
                                  toast.success('Chave copiada!');
                                }}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copiar Chave
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  navigator.clipboard.writeText(generateEmbedCode(widget.widget_key));
                                  toast.success('Código copiado!');
                                }}>
                                  <Code className="h-4 w-4 mr-2" />
                                  Copiar Código
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    if (confirm('Tem certeza que deseja remover este widget?')) {
                                      deleteWidgetMutation.mutate(widget.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remover
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">Nenhum widget configurado</h3>
                    <p className="text-muted-foreground mb-4">
                      Crie seu primeiro widget de chat para começar
                    </p>
                    <Button onClick={() => setIsWidgetDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Widget
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sessões de Chat</CardTitle>
                <CardDescription>
                  Visualize as sessões ativas e históricas dos visitantes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessionsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : sessions && sessions.length > 0 ? (
                  <ScrollArea className="h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Visitante</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Dispositivo</TableHead>
                          <TableHead>Origem</TableHead>
                          <TableHead>Páginas</TableHead>
                          <TableHead>Iniciou em</TableHead>
                          <TableHead>Última Atividade</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sessions.map((session) => (
                          <TableRow key={session.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{session.visitor_name || 'Visitante Anônimo'}</p>
                                <p className="text-xs text-muted-foreground">{session.visitor_email || session.visitor_id.slice(0, 8)}</p>
                              </div>
                            </TableCell>
                            <TableCell>{getSessionStatusBadge(session.status)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {session.device_type === 'mobile' ? (
                                  <Smartphone className="h-4 w-4" />
                                ) : (
                                  <Monitor className="h-4 w-4" />
                                )}
                                <span className="text-sm">{session.browser || 'N/A'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs truncate text-sm">
                              {session.source_url || 'N/A'}
                            </TableCell>
                            <TableCell>{session.pages_viewed}</TableCell>
                            <TableCell className="text-sm">
                              {format(new Date(session.started_at), "dd/MM HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(session.last_activity_at), { locale: ptBR, addSuffix: true })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">Nenhuma sessão encontrada</h3>
                    <p className="text-muted-foreground">
                      As sessões aparecerão aqui quando visitantes usarem o chat
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Timeline de Eventos</CardTitle>
                <CardDescription>
                  Todos os eventos capturados pelos widgets
                </CardDescription>
              </CardHeader>
              <CardContent>
                {eventsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : events && events.length > 0 ? (
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-3">
                      {events.map((event) => {
                        const EventIcon = getEventIcon(event.event_type);
                        return (
                          <div
                            key={event.id}
                            className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                              <EventIcon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-medium text-sm">
                                  {event.event_type.replace(/_/g, ' ')}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(event.created_at), { locale: ptBR, addSuffix: true })}
                                </span>
                              </div>
                              {event.page_url && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {event.page_url}
                                </p>
                              )}
                              {event.event_data && Object.keys(event.event_data).length > 0 && (
                                <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto">
                                  {JSON.stringify(event.event_data, null, 2)}
                                </pre>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">Nenhum evento registrado</h3>
                    <p className="text-muted-foreground">
                      Os eventos dos widgets aparecerão aqui
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Embed Tab */}
          <TabsContent value="embed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Instalação do Widget</CardTitle>
                <CardDescription>
                  Copie o código de instalação e adicione ao seu site
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {widgets && widgets.length > 0 ? (
                  widgets.map((widget) => (
                    <div key={widget.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={widget.is_active ? 'default' : 'secondary'}
                            className="px-2"
                          >
                            {widget.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <span className="font-medium">{widget.name}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(generateEmbedCode(widget.widget_key));
                            toast.success('Código copiado para a área de transferência!');
                          }}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar Código
                        </Button>
                      </div>
                      <div className="rounded-lg border bg-muted/50 p-4">
                        <pre className="text-sm overflow-x-auto whitespace-pre-wrap font-mono">
                          {generateEmbedCode(widget.widget_key)}
                        </pre>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Cole este código antes da tag {`</body>`} em todas as páginas onde deseja exibir o widget.
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Code className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">Nenhum widget para instalar</h3>
                    <p className="text-muted-foreground mb-4">
                      Crie um widget primeiro para obter o código de instalação
                    </p>
                    <Button onClick={() => {
                      setActiveTab('widgets');
                      setIsWidgetDialogOpen(true);
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Widget
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
