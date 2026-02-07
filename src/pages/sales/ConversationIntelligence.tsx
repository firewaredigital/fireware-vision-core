import { useState } from 'react';
import { ModuleHeroBanner } from '@/components/ModuleHeroBanner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Search, Filter, Mic, BarChart3, Brain, MessageSquare,
  TrendingUp, TrendingDown, AlertTriangle, Target,
  ThumbsUp, ThumbsDown, Minus, Clock, Users, Zap
} from '@/components/icons';

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  processing: { label: 'Processando', variant: 'outline' },
  ready: { label: 'Pronto', variant: 'secondary' },
  transcribed: { label: 'Transcrito', variant: 'outline' },
  analyzed: { label: 'Analisado', variant: 'default' },
  failed: { label: 'Falhou', variant: 'destructive' },
  archived: { label: 'Arquivado', variant: 'secondary' },
};

const sentimentIcons: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  very_positive: { icon: ThumbsUp, color: 'text-green-600', label: 'Muito Positivo' },
  positive: { icon: ThumbsUp, color: 'text-green-500', label: 'Positivo' },
  neutral: { icon: Minus, color: 'text-muted-foreground', label: 'Neutro' },
  negative: { icon: ThumbsDown, color: 'text-amber-500', label: 'Negativo' },
  very_negative: { icon: ThumbsDown, color: 'text-destructive', label: 'Muito Negativo' },
  mixed: { icon: Zap, color: 'text-amber-500', label: 'Misto' },
};

const insightTypeLabels: Record<string, { label: string; color: string }> = {
  objection: { label: 'Objeção', color: 'bg-red-100 text-red-800' },
  competitor_mention: { label: 'Menção a Concorrente', color: 'bg-amber-100 text-amber-800' },
  pricing_discussion: { label: 'Discussão de Preço', color: 'bg-blue-100 text-blue-800' },
  next_step: { label: 'Próximo Passo', color: 'bg-green-100 text-green-800' },
  risk_signal: { label: 'Sinal de Risco', color: 'bg-red-100 text-red-800' },
  buying_signal: { label: 'Sinal de Compra', color: 'bg-green-100 text-green-800' },
  feature_request: { label: 'Pedido de Feature', color: 'bg-purple-100 text-purple-800' },
  pain_point: { label: 'Dor do Cliente', color: 'bg-orange-100 text-orange-800' },
  decision_maker: { label: 'Decision Maker', color: 'bg-blue-100 text-blue-800' },
  timeline: { label: 'Timeline', color: 'bg-teal-100 text-teal-800' },
};

export default function ConversationIntelligence() {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;

  const [activeTab, setActiveTab] = useState('recordings');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Recordings
  const { data: recordings = [], isLoading: loadingRecordings } = useQuery({
    queryKey: ['call-recordings', organizationId, statusFilter, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('sales_call_recordings')
        .select(`
          *,
          caller:caller_id (first_name, last_name),
          contact:contact_id (first_name, last_name),
          account:account_id (name),
          opportunity:opportunity_id (name)
        `)
        .eq('organization_id', organizationId!)
        .order('recorded_at', { ascending: false });

      if (statusFilter !== 'all') query = query.eq('status', statusFilter as any);
      if (searchTerm) query = query.ilike('title', `%${searchTerm}%`);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Insights
  const { data: insights = [] } = useQuery({
    queryKey: ['call-insights', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('call_insights')
        .select(`*, recording:recording_id (title)`)
        .eq('organization_id', organizationId!)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Coaching notes
  const { data: coachingNotes = [] } = useQuery({
    queryKey: ['coaching-notes', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coaching_notes')
        .select(`
          *,
          recording:recording_id (title),
          coach:coach_id (first_name, last_name),
          rep:rep_id (first_name, last_name)
        `)
        .eq('organization_id', organizationId!)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // KPIs
  const analyzed = recordings.filter((r: any) => r.status === 'analyzed');
  const avgScore = analyzed.length > 0 
    ? Math.round(analyzed.reduce((s: number, r: any) => s + (r.call_score || 0), 0) / analyzed.length) 
    : 0;
  const avgEngagement = analyzed.length > 0
    ? Math.round(analyzed.reduce((s: number, r: any) => s + (r.engagement_score || 0), 0) / analyzed.length)
    : 0;
  const insightsByType = insights.reduce((acc: Record<string, number>, i: any) => {
    acc[i.insight_type] = (acc[i.insight_type] || 0) + 1;
    return acc;
  }, {});

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className="space-y-6 p-6">
        <ModuleHeroBanner
          module="sales"
          title="Conversation Intelligence"
          subtitle="Análise de chamadas de vendas com transcrição, insights de IA e coaching"
          compact
        />

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Gravações</CardTitle>
              <Mic className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recordings.length}</div>
              <p className="text-xs text-muted-foreground">{analyzed.length} analisadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Score Médio</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgScore}/100</div>
              <Progress value={avgScore} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Engajamento Médio</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgEngagement}/100</div>
              <Progress value={avgEngagement} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Insights Gerados</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{insights.length}</div>
              <p className="text-xs text-muted-foreground">{coachingNotes.length} notas de coaching</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="recordings"><Mic className="h-4 w-4 mr-2" />Gravações</TabsTrigger>
            <TabsTrigger value="insights"><Brain className="h-4 w-4 mr-2" />Insights</TabsTrigger>
            <TabsTrigger value="coaching"><MessageSquare className="h-4 w-4 mr-2" />Coaching</TabsTrigger>
          </TabsList>

          {/* Recordings */}
          <TabsContent value="recordings" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar gravações..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="processing">Processando</SelectItem>
                  <SelectItem value="transcribed">Transcrito</SelectItem>
                  <SelectItem value="analyzed">Analisado</SelectItem>
                  <SelectItem value="failed">Falhou</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Contato / Conta</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Sentimento</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingRecordings ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                  ) : recordings.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma gravação encontrada</TableCell></TableRow>
                  ) : recordings.map((rec: any) => {
                    const st = statusLabels[rec.status] || statusLabels.processing;
                    const sent = rec.overall_sentiment ? sentimentIcons[rec.overall_sentiment] : null;
                    return (
                      <TableRow key={rec.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{rec.title}</p>
                            {rec.opportunity?.name && <p className="text-xs text-muted-foreground">{rec.opportunity.name}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {rec.caller ? `${rec.caller.first_name} ${rec.caller.last_name}` : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {rec.contact ? `${rec.contact.first_name} ${rec.contact.last_name}` : '—'}
                            {rec.account && <p className="text-xs text-muted-foreground">{rec.account.name}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />{formatDuration(rec.recording_duration_seconds)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {sent ? (
                            <div className="flex items-center gap-1">
                              <sent.icon className={`h-4 w-4 ${sent.color}`} />
                              <span className={`text-xs ${sent.color}`}>{sent.label}</span>
                            </div>
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          {rec.call_score ? (
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold">{rec.call_score}</span>
                              <Progress value={rec.call_score} className="w-16 h-2" />
                            </div>
                          ) : '—'}
                        </TableCell>
                        <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(rec.recorded_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Insights */}
          <TabsContent value="insights" className="space-y-4">
            {/* Insight distribution */}
            <div className="grid gap-3 md:grid-cols-5">
              {Object.entries(insightsByType).slice(0, 5).map(([type, count]) => {
                const cfg = insightTypeLabels[type] || { label: type, color: 'bg-gray-100 text-gray-800' };
                return (
                  <Card key={type}>
                    <CardContent className="pt-4 text-center">
                      <Badge className={cfg.color}>{cfg.label}</Badge>
                      <p className="text-2xl font-bold mt-2">{count as number}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Gravação</TableHead>
                    <TableHead>Confiança</TableHead>
                    <TableHead>Severidade</TableHead>
                    <TableHead>Resolvido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {insights.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum insight encontrado</TableCell></TableRow>
                  ) : insights.map((insight: any) => {
                    const cfg = insightTypeLabels[insight.insight_type] || { label: insight.insight_type, color: '' };
                    return (
                      <TableRow key={insight.id}>
                        <TableCell><Badge className={cfg.color}>{cfg.label}</Badge></TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{insight.title}</p>
                            {insight.description && <p className="text-xs text-muted-foreground truncate max-w-[300px]">{insight.description}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{insight.recording?.title || '—'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{Math.round(insight.confidence * 100)}%</span>
                            <Progress value={insight.confidence * 100} className="w-12 h-2" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={insight.severity === 'critical' ? 'destructive' : insight.severity === 'high' ? 'destructive' : 'outline'}>
                            {insight.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {insight.is_addressed ? (
                            <Badge variant="default" className="gap-1"><Target className="h-3 w-3" />Sim</Badge>
                          ) : (
                            <Badge variant="secondary">Não</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Coaching */}
          <TabsContent value="coaching" className="space-y-4">
            {coachingNotes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Nenhuma nota de coaching registrada ainda.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {coachingNotes.map((note: any) => (
                  <Card key={note.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{note.category || 'Geral'}</Badge>
                            {note.rating && (
                              <Badge variant={note.rating === 'excellent' ? 'default' : note.rating === 'critical' ? 'destructive' : 'secondary'}>
                                {note.rating}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {note.recording?.title}
                            </span>
                          </div>
                          <p className="text-sm">{note.content}</p>
                          {note.suggested_action && (
                            <p className="text-sm text-primary mt-2">
                              <strong>Ação sugerida:</strong> {note.suggested_action}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-xs text-muted-foreground ml-4">
                          <p>Coach: {note.coach?.first_name} {note.coach?.last_name}</p>
                          <p>Rep: {note.rep?.first_name} {note.rep?.last_name}</p>
                          <p>{format(new Date(note.created_at), 'dd/MM/yy', { locale: ptBR })}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
