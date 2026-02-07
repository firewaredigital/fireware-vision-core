import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Mail,
  MessageSquare,
  Users,
  Target,
  TrendingUp,
  Eye,
  MousePointer,
  Send,
  Calendar,
  BarChart3,
  GitBranch,
  FileText,
  Filter,
  RefreshCw,
  MoreHorizontal,
  Play,
  Pause,
  Copy,
  Trash2,
  Edit,
  Megaphone,
} from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ModuleHeroBanner } from '@/components/ModuleHeroBanner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  subject: string | null;
  total_recipients: number;
  sent_count: number;
  open_count: number;
  unique_opens: number;
  click_count: number;
  unique_clicks: number;
  conversion_count: number;
  open_rate: number | null;
  click_rate: number | null;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
}

interface Segment {
  id: string;
  name: string;
  description: string | null;
  type: string;
  entity_type: string;
  member_count: number;
  is_active: boolean;
  last_calculated_at: string | null;
  created_at: string;
}

interface Journey {
  id: string;
  name: string;
  description: string | null;
  status: string;
  trigger_type: string;
  entry_count: number;
  active_count: number;
  completed_count: number;
  goal_achieved_count: number;
  conversion_rate: number | null;
  created_at: string;
}

const campaignTypeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  email: { label: 'Email', icon: <Mail className="h-4 w-4" /> },
  sms: { label: 'SMS', icon: <MessageSquare className="h-4 w-4" /> },
  whatsapp: { label: 'WhatsApp', icon: <MessageSquare className="h-4 w-4" /> },
  push: { label: 'Push', icon: <Megaphone className="h-4 w-4" /> },
  social: { label: 'Social', icon: <Users className="h-4 w-4" /> },
  ads: { label: 'Anúncios', icon: <Target className="h-4 w-4" /> },
  event: { label: 'Evento', icon: <Calendar className="h-4 w-4" /> },
  webinar: { label: 'Webinar', icon: <Eye className="h-4 w-4" /> },
  content: { label: 'Conteúdo', icon: <FileText className="h-4 w-4" /> },
  referral: { label: 'Indicação', icon: <Users className="h-4 w-4" /> },
};

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Rascunho', variant: 'secondary' },
  scheduled: { label: 'Agendada', variant: 'outline' },
  sending: { label: 'Enviando', variant: 'default' },
  active: { label: 'Ativa', variant: 'default' },
  paused: { label: 'Pausada', variant: 'outline' },
  completed: { label: 'Concluída', variant: 'secondary' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
  archived: { label: 'Arquivada', variant: 'secondary' },
};

const journeyStatusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Rascunho', variant: 'secondary' },
  active: { label: 'Ativa', variant: 'default' },
  paused: { label: 'Pausada', variant: 'outline' },
  completed: { label: 'Concluída', variant: 'secondary' },
  archived: { label: 'Arquivada', variant: 'secondary' },
};

export default function Marketing() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    if (profile?.organization_id) {
      fetchData();
    }
  }, [profile?.organization_id]);

  const fetchData = async () => {
    if (!profile?.organization_id) return;

    setLoading(true);

    // Fetch campaigns
    const { data: campaignsData } = await supabase
      .from('campaigns')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false });

    if (campaignsData) {
      setCampaigns(campaignsData as Campaign[]);
    }

    // Fetch segments
    const { data: segmentsData } = await supabase
      .from('segments')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false });

    if (segmentsData) {
      setSegments(segmentsData as Segment[]);
    }

    // Fetch journeys
    const { data: journeysData } = await supabase
      .from('journeys')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false });

    if (journeysData) {
      setJourneys(journeysData as Journey[]);
    }

    setLoading(false);
  };

  // Stats
  const activeCampaigns = campaigns.filter(c => c.status === 'active' || c.status === 'sending').length;
  const totalSent = campaigns.reduce((sum, c) => sum + c.sent_count, 0);
  const totalOpens = campaigns.reduce((sum, c) => sum + c.unique_opens, 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + c.unique_clicks, 0);
  const avgOpenRate = totalSent > 0 ? Math.round((totalOpens / totalSent) * 100) : 0;
  const avgClickRate = totalOpens > 0 ? Math.round((totalClicks / totalOpens) * 100) : 0;
  const totalContacts = segments.reduce((sum, s) => sum + s.member_count, 0);
  const activeJourneys = journeys.filter(j => j.status === 'active').length;

  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesType = typeFilter === 'all' || c.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      <ModuleHeroBanner
        module="marketing"
        title="Marketing"
        subtitle="Gerencie campanhas, segmentos e jornadas de marketing"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/marketing/segments/new')} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Users className="mr-2 h-4 w-4" />
              Novo Segmento
            </Button>
            <Button onClick={() => navigate('/marketing/campaigns/new')} className="bg-white text-foreground hover:bg-white/90">
              <Plus className="mr-2 h-4 w-4" />
              Nova Campanha
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campanhas Ativas</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCampaigns}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enviados</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSent.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Abertura</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgOpenRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Clique</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgClickRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Segmentos</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{segments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contatos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContacts.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jornadas Ativas</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeJourneys}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversões</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {campaigns.reduce((sum, c) => sum + c.conversion_count, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          <TabsTrigger value="segments">Segmentos</TabsTrigger>
          <TabsTrigger value="journeys">Jornadas</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="forms">Formulários</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar campanhas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                {Object.entries(statusLabels).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Tipos</SelectItem>
                {Object.entries(campaignTypeLabels).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Campaigns Table */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Mail className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <p className="text-muted-foreground mb-4">Nenhuma campanha encontrada</p>
                <Button onClick={() => navigate('/marketing/campaigns/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeira Campanha
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campanha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Enviados</TableHead>
                    <TableHead>Aberturas</TableHead>
                    <TableHead>Cliques</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampaigns.map((campaign) => {
                    const typeConfig = campaignTypeLabels[campaign.type] || { label: campaign.type, icon: <Mail className="h-4 w-4" /> };
                    const statusConfig = statusLabels[campaign.status] || statusLabels.draft;
                    const openRate = campaign.sent_count > 0 ? Math.round((campaign.unique_opens / campaign.sent_count) * 100) : 0;
                    const clickRate = campaign.unique_opens > 0 ? Math.round((campaign.unique_clicks / campaign.unique_opens) * 100) : 0;

                    return (
                      <TableRow 
                        key={campaign.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/marketing/campaigns/${campaign.id}`)}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{campaign.name}</p>
                            {campaign.subject && (
                              <p className="text-sm text-muted-foreground truncate max-w-[250px]">
                                {campaign.subject}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {typeConfig.icon}
                            <span>{typeConfig.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{campaign.sent_count.toLocaleString()}</span>
                          <span className="text-muted-foreground">/{campaign.total_recipients.toLocaleString()}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{campaign.unique_opens.toLocaleString()}</span>
                            <Badge variant="secondary">{openRate}%</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{campaign.unique_clicks.toLocaleString()}</span>
                            <Badge variant="secondary">{clickRate}%</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {campaign.sent_at 
                              ? format(new Date(campaign.sent_at), "dd/MM/yyyy", { locale: ptBR })
                              : campaign.scheduled_at
                              ? format(new Date(campaign.scheduled_at), "dd/MM/yyyy", { locale: ptBR })
                              : format(new Date(campaign.created_at), "dd/MM/yyyy", { locale: ptBR })
                            }
                          </span>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/marketing/campaigns/${campaign.id}`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <BarChart3 className="mr-2 h-4 w-4" />
                                Relatório
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar segmentos..."
                className="pl-8"
              />
            </div>
            <Button onClick={() => navigate('/marketing/segments/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Segmento
            </Button>
          </div>

          {segments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <p className="text-muted-foreground mb-4">Nenhum segmento criado</p>
                <Button onClick={() => navigate('/marketing/segments/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Segmento
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {segments.map((segment) => (
                <Card 
                  key={segment.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => navigate(`/marketing/segments/${segment.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{segment.name}</CardTitle>
                      <Badge variant={segment.type === 'dynamic' ? 'default' : 'secondary'}>
                        {segment.type === 'dynamic' ? 'Dinâmico' : 'Estático'}
                      </Badge>
                    </div>
                    {segment.description && (
                      <CardDescription>{segment.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-2xl font-bold">{segment.member_count.toLocaleString()}</span>
                        <span className="text-muted-foreground">
                          {segment.entity_type === 'contact' ? 'contatos' : segment.entity_type === 'lead' ? 'leads' : 'contas'}
                        </span>
                      </div>
                      {!segment.is_active && (
                        <Badge variant="outline">Inativo</Badge>
                      )}
                    </div>
                    {segment.last_calculated_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Atualizado: {format(new Date(segment.last_calculated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="journeys" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar jornadas..."
                className="pl-8"
              />
            </div>
            <Button onClick={() => navigate('/marketing/journeys/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Jornada
            </Button>
          </div>

          {journeys.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <GitBranch className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <p className="text-muted-foreground mb-4">Nenhuma jornada criada</p>
                <Button onClick={() => navigate('/marketing/journeys/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeira Jornada
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jornada</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Entradas</TableHead>
                    <TableHead>Ativos</TableHead>
                    <TableHead>Concluídos</TableHead>
                    <TableHead>Conversão</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {journeys.map((journey) => {
                    const statusConfig = journeyStatusLabels[journey.status] || journeyStatusLabels.draft;
                    return (
                      <TableRow 
                        key={journey.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/marketing/journeys/${journey.id}`)}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{journey.name}</p>
                            {journey.description && (
                              <p className="text-sm text-muted-foreground truncate max-w-[250px]">
                                {journey.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                        </TableCell>
                        <TableCell>{journey.entry_count.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className="text-blue-600 font-medium">
                            {journey.active_count.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-green-600 font-medium">
                            {journey.completed_count.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={journey.conversion_rate || 0} className="w-16 h-2" />
                            <span className="text-sm">{journey.conversion_rate || 0}%</span>
                          </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/marketing/journeys/${journey.id}`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              {journey.status === 'active' ? (
                                <DropdownMenuItem>
                                  <Pause className="mr-2 h-4 w-4" />
                                  Pausar
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem>
                                  <Play className="mr-2 h-4 w-4" />
                                  Ativar
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar templates..."
                className="pl-8"
              />
            </div>
            <Button onClick={() => navigate('/marketing/templates/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Template
            </Button>
          </div>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground mb-4">Nenhum template de email criado</p>
              <Button onClick={() => navigate('/marketing/templates/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Template
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forms" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar formulários..."
                className="pl-8"
              />
            </div>
            <Button onClick={() => navigate('/marketing/forms/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Formulário
            </Button>
          </div>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground mb-4">Nenhum formulário criado</p>
              <Button onClick={() => navigate('/marketing/forms/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Formulário
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
