import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import {
  Globe, Plus, Search, Filter, MessageSquare, AtSign,
  Instagram, Facebook, Twitter, Linkedin, Youtube,
  TrendingUp, TrendingDown, Heart, Share2, MessageCircle,
  CheckCircle, AlertTriangle, Eye, EyeOff, Flag,
  Sparkles, RefreshCw, ExternalLink, Send, ThumbsUp,
  ThumbsDown, Minus
} from '@/components/icons';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const platformIcons: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-4 w-4 text-pink-500" />,
  facebook: <Facebook className="h-4 w-4 text-blue-600" />,
  twitter: <Twitter className="h-4 w-4 text-sky-500" />,
  linkedin: <Linkedin className="h-4 w-4 text-blue-700" />,
  youtube: <Youtube className="h-4 w-4 text-red-600" />,
  tiktok: <Sparkles className="h-4 w-4 text-foreground" />,
};

const platformLabels: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  twitter: 'Twitter/X',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  tiktok: 'TikTok',
};

const sentimentIcons: Record<string, React.ReactNode> = {
  positive: <ThumbsUp className="h-4 w-4 text-green-500" />,
  negative: <ThumbsDown className="h-4 w-4 text-red-500" />,
  neutral: <Minus className="h-4 w-4 text-gray-500" />,
  mixed: <Sparkles className="h-4 w-4 text-yellow-500" />,
};

const sentimentLabels: Record<string, string> = {
  positive: 'Positivo',
  negative: 'Negativo',
  neutral: 'Neutro',
  mixed: 'Misto',
};

export default function SocialInbox() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('messages');
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [directionFilter, setDirectionFilter] = useState('all');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<unknown>(null);
  const [replyContent, setReplyContent] = useState('');

  // New account form
  const [newAccount, setNewAccount] = useState({
    platform: 'instagram',
    account_name: '',
    account_handle: '',
    auto_import_messages: true,
    auto_import_mentions: true,
    auto_create_conversations: true,
  });

  // === QUERIES ===

  const { data: socialAccounts = [] } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: socialMessages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['social-messages', platformFilter, directionFilter],
    queryFn: async () => {
      let query = supabase
        .from('social_messages')
        .select(`
          *,
          social_account:social_accounts(id, platform, account_name, account_handle),
          contact:contacts(id, first_name, last_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (platformFilter !== 'all') {
        const accountIds = socialAccounts
          .filter(a => a.platform === platformFilter)
          .map(a => a.id);
        if (accountIds.length > 0) {
          query = query.in('social_account_id', accountIds);
        }
      }

      if (directionFilter !== 'all') {
        query = query.eq('direction', directionFilter as unknown);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: socialMentions = [], isLoading: mentionsLoading } = useQuery({
    queryKey: ['social-mentions', platformFilter, sentimentFilter],
    queryFn: async () => {
      let query = supabase
        .from('social_mentions')
        .select(`
          *,
          social_account:social_accounts(id, platform, account_name, account_handle)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (platformFilter !== 'all') {
        query = query.eq('platform', platformFilter as unknown);
      }
      if (sentimentFilter !== 'all') {
        query = query.eq('sentiment', sentimentFilter as unknown);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // === MUTATIONS ===

  const connectAccountMutation = useMutation({
    mutationFn: async (data: typeof newAccount) => {
      const { error } = await supabase.from('social_accounts').insert({
        organization_id: profile?.organization_id,
        platform: data.platform as unknown,
        account_name: data.account_name,
        account_handle: data.account_handle || null,
        status: 'connected',
        auto_import_messages: data.auto_import_messages,
        auto_import_mentions: data.auto_import_mentions,
        auto_create_conversations: data.auto_create_conversations,
        connected_by: profile?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
      setShowConnectDialog(false);
      toast.success('Conta social conectada');
      setNewAccount({
        platform: 'instagram', account_name: '', account_handle: '',
        auto_import_messages: true, auto_import_mentions: true, auto_create_conversations: true,
      });
    },
    onError: (e: unknown) => toast.error('Erro: ' + e.message),
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase.from('social_messages')
        .update({ is_read: true })
        .eq('id', messageId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['social-messages'] }),
  });

  const reviewMentionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      const { error } = await supabase.from('social_mentions')
        .update({
          is_reviewed: true,
          reviewed_by: profile?.id,
          reviewed_at: new Date().toISOString(),
          action_taken: action,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-mentions'] });
      toast.success('Menção revisada');
    },
    onError: (e: unknown) => toast.error('Erro: ' + e.message),
  });

  // === COMPUTED ===

  const unreadMessages = socialMessages.filter(m => !m.is_read).length;
  const unreviewedMentions = socialMentions.filter(m => !m.is_reviewed).length;
  const inboundMessages = socialMessages.filter(m => m.direction === 'inbound').length;
  const negativeMentions = socialMentions.filter(m => m.sentiment === 'negative').length;

  const filteredMessages = socialMessages.filter(m => {
    if (!searchQuery) return true;
    const s = searchQuery.toLowerCase();
    return (
      m.content?.toLowerCase().includes(s) ||
      m.sender_name?.toLowerCase().includes(s) ||
      m.sender_handle?.toLowerCase().includes(s)
    );
  });

  const filteredMentions = socialMentions.filter(m => {
    if (!searchQuery) return true;
    const s = searchQuery.toLowerCase();
    return (
      m.content?.toLowerCase().includes(s) ||
      m.author_name?.toLowerCase().includes(s) ||
      m.author_handle?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Globe className="h-8 w-8 text-primary" />
              Social Inbox
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie mensagens e menções de todas as redes sociais em um só lugar
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => queryClient.invalidateQueries()}>
              <RefreshCw className="h-4 w-4 mr-2" /> Sincronizar
            </Button>
            <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" /> Conectar Conta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Conectar Conta Social</DialogTitle>
                  <DialogDescription>
                    Adicione uma conta de rede social para monitorar mensagens e menções.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Plataforma</Label>
                    <Select
                      value={newAccount.platform}
                      onValueChange={v => setNewAccount(p => ({ ...p, platform: v }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(platformLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              {platformIcons[key]}
                              {label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nome da Conta</Label>
                    <Input
                      value={newAccount.account_name}
                      onChange={e => setNewAccount(p => ({ ...p, account_name: e.target.value }))}
                      placeholder="Ex: Fireware CRM"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Handle / @</Label>
                    <Input
                      value={newAccount.account_handle}
                      onChange={e => setNewAccount(p => ({ ...p, account_handle: e.target.value }))}
                      placeholder="@firewarecrm"
                    />
                  </div>
                  <div className="space-y-3 border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Importar mensagens automaticamente</Label>
                      <Switch
                        checked={newAccount.auto_import_messages}
                        onCheckedChange={v => setNewAccount(p => ({ ...p, auto_import_messages: v }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Importar menções automaticamente</Label>
                      <Switch
                        checked={newAccount.auto_import_mentions}
                        onCheckedChange={v => setNewAccount(p => ({ ...p, auto_import_mentions: v }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Criar conversas automaticamente</Label>
                      <Switch
                        checked={newAccount.auto_create_conversations}
                        onCheckedChange={v => setNewAccount(p => ({ ...p, auto_create_conversations: v }))}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowConnectDialog(false)}>Cancelar</Button>
                  <Button
                    onClick={() => connectAccountMutation.mutate(newAccount)}
                    disabled={!newAccount.account_name || connectAccountMutation.isPending}
                  >
                    {connectAccountMutation.isPending ? 'Conectando...' : 'Conectar Conta'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Connected Accounts Strip */}
        {socialAccounts.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {socialAccounts.map(account => (
              <Card key={account.id} className="min-w-[200px] flex-shrink-0">
                <CardContent className="p-3 flex items-center gap-3">
                  {platformIcons[account.platform]}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{account.account_name}</p>
                    <p className="text-xs text-muted-foreground">{account.account_handle}</p>
                  </div>
                  <Badge variant={account.status === 'connected' ? 'default' : 'destructive'} className="text-xs">
                    {account.status === 'connected' ? 'OK' : account.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Mensagens Não Lidas</p>
                  <p className="text-3xl font-bold">{unreadMessages}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Menções Pendentes</p>
                  <p className="text-3xl font-bold">{unreviewedMentions}</p>
                </div>
                <AtSign className="h-8 w-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Recebidas (Inbound)</p>
                  <p className="text-3xl font-bold">{inboundMessages}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Menções Negativas</p>
                  <p className="text-3xl font-bold text-red-600">{negativeMentions}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="messages">
              <MessageSquare className="h-4 w-4 mr-2" />
              Mensagens
              {unreadMessages > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs px-1.5">{unreadMessages}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="mentions">
              <AtSign className="h-4 w-4 mr-2" />
              Menções
              {unreviewedMentions > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs px-1.5">{unreviewedMentions}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="accounts">
              <Globe className="h-4 w-4 mr-2" />
              Contas ({socialAccounts.length})
            </TabsTrigger>
          </TabsList>

          {/* Filters */}
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar mensagens ou menções..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Plataforma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(platformLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeTab === 'mentions' && (
              <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
                <SelectTrigger className="w-40">
                  <Sparkles className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sentimento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="positive">Positivo</SelectItem>
                  <SelectItem value="negative">Negativo</SelectItem>
                  <SelectItem value="neutral">Neutro</SelectItem>
                  <SelectItem value="mixed">Misto</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plataforma</TableHead>
                      <TableHead>Remetente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Conteúdo</TableHead>
                      <TableHead>Engajamento</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messagesLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Carregando mensagens...
                        </TableCell>
                      </TableRow>
                    ) : filteredMessages.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          Nenhuma mensagem encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMessages.map(msg => (
                        <TableRow key={msg.id} className={cn(!msg.is_read && 'bg-accent/30')}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {platformIcons[msg.social_account?.platform || ''] || <Globe className="h-4 w-4" />}
                              <span className="text-xs">{msg.social_account?.account_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                {msg.sender_avatar_url ? (
                                  <AvatarImage src={msg.sender_avatar_url} />
                                ) : null}
                                <AvatarFallback className="text-xs">
                                  {msg.sender_name?.[0] || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{msg.sender_name || 'Desconhecido'}</p>
                                <p className="text-xs text-muted-foreground">{msg.sender_handle}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Badge variant={msg.direction === 'inbound' ? 'default' : 'secondary'} className="text-xs">
                                {msg.direction === 'inbound' ? '← Entrada' : '→ Saída'}
                              </Badge>
                              <Badge variant="outline" className="text-xs capitalize">
                                {msg.message_type === 'direct_message' ? 'DM' :
                                 msg.message_type === 'comment' ? 'Comentário' :
                                 msg.message_type === 'mention' ? 'Menção' :
                                 msg.message_type === 'reply' ? 'Resposta' : msg.message_type}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm truncate max-w-[300px]">{msg.content}</p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" /> {msg.likes_count || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <Share2 className="h-3 w-3" /> {msg.shares_count || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" /> {msg.replies_count || 0}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {!msg.is_read && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => markAsReadMutation.mutate(msg.id)}
                                  title="Marcar como lida"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              )}
                              {msg.original_post_url && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => window.open(msg.original_post_url, '_blank')}
                                  title="Ver no original"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mentions Tab */}
          <TabsContent value="mentions" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plataforma</TableHead>
                      <TableHead>Autor</TableHead>
                      <TableHead>Conteúdo</TableHead>
                      <TableHead>Sentimento</TableHead>
                      <TableHead>Engajamento</TableHead>
                      <TableHead>Alcance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mentionsLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Carregando menções...
                        </TableCell>
                      </TableRow>
                    ) : filteredMentions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          <AtSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          Nenhuma menção encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMentions.map(mention => (
                        <TableRow key={mention.id} className={cn(!mention.is_reviewed && 'bg-accent/30')}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {platformIcons[mention.platform] || <Globe className="h-4 w-4" />}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                {mention.author_avatar_url ? (
                                  <AvatarImage src={mention.author_avatar_url} />
                                ) : null}
                                <AvatarFallback className="text-xs">
                                  {mention.author_name?.[0] || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{mention.author_name || 'Desconhecido'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {mention.author_handle}
                                  {mention.author_followers_count > 0 && (
                                    <span className="ml-1">({mention.author_followers_count.toLocaleString()} seg.)</span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm truncate max-w-[250px]">{mention.content}</p>
                            {mention.topics && (mention.topics as string[]).length > 0 && (
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {(mention.topics as string[]).slice(0, 3).map((t, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {sentimentIcons[mention.sentiment || 'neutral']}
                              <span className="text-sm">
                                {sentimentLabels[mention.sentiment || 'neutral']}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" /> {mention.likes_count || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <Share2 className="h-3 w-3" /> {mention.shares_count || 0}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-mono">
                              {(mention.reach_estimate || 0).toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            {mention.is_reviewed ? (
                              <Badge variant="secondary" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {mention.action_taken === 'responded' ? 'Respondida' :
                                 mention.action_taken === 'escalated' ? 'Escalada' :
                                 mention.action_taken === 'flagged' ? 'Sinalizada' :
                                 mention.action_taken === 'ignored' ? 'Ignorada' : 'Revisada'}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">Pendente</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {!mention.is_reviewed && (
                              <div className="flex gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-green-600"
                                  title="Marcar como respondida"
                                  onClick={() => reviewMentionMutation.mutate({ id: mention.id, action: 'responded' })}
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-orange-600"
                                  title="Escalar"
                                  onClick={() => reviewMentionMutation.mutate({ id: mention.id, action: 'escalated' })}
                                >
                                  <AlertTriangle className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-muted-foreground"
                                  title="Ignorar"
                                  onClick={() => reviewMentionMutation.mutate({ id: mention.id, action: 'ignored' })}
                                >
                                  <EyeOff className="h-3 w-3" />
                                </Button>
                                {mention.content_url && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    title="Ver original"
                                    onClick={() => window.open(mention.content_url, '_blank')}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Accounts Tab */}
          <TabsContent value="accounts" className="space-y-4">
            {socialAccounts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Globe className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Nenhuma conta conectada</h3>
                  <p className="text-muted-foreground mb-4">Conecte suas redes sociais para começar a monitorar.</p>
                  <Button onClick={() => setShowConnectDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Conectar Conta
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {socialAccounts.map(account => (
                  <Card key={account.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-accent">
                            {platformIcons[account.platform]}
                          </div>
                          <div>
                            <CardTitle className="text-base">{account.account_name}</CardTitle>
                            <CardDescription>{account.account_handle}</CardDescription>
                          </div>
                        </div>
                        <Badge variant={
                          account.status === 'connected' ? 'default' :
                          account.status === 'expired' ? 'destructive' : 'secondary'
                        }>
                          {account.status === 'connected' ? 'Conectada' :
                           account.status === 'disconnected' ? 'Desconectada' :
                           account.status === 'expired' ? 'Expirada' : account.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Seguidores</p>
                          <p className="font-bold">{(account.followers_count || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Seguindo</p>
                          <p className="font-bold">{(account.following_count || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Msgs Importadas</p>
                          <p className="font-bold">{account.total_messages_imported}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Menções Importadas</p>
                          <p className="font-bold">{account.total_mentions_imported}</p>
                        </div>
                      </div>
                      {account.last_sync_at && (
                        <p className="text-xs text-muted-foreground">
                          Última sincronização: {formatDistanceToNow(new Date(account.last_sync_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      )}
                      {account.last_error && (
                        <p className="text-xs text-destructive">Erro: {account.last_error}</p>
                      )}
                      <div className="flex gap-2 text-xs">
                        {account.auto_import_messages && (
                          <Badge variant="outline">Auto Msgs</Badge>
                        )}
                        {account.auto_import_mentions && (
                          <Badge variant="outline">Auto Menções</Badge>
                        )}
                        {account.auto_create_conversations && (
                          <Badge variant="outline">Auto Conv.</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
    </div>
  );
}
