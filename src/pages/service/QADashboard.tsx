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
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ClipboardCheck, Search, Plus, Star, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle, Clock, BarChart3, Users, FileText,
  Filter, Award, Target, ThumbsUp, ThumbsDown, Eye
} from '@/components/icons';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const ratingLabels: Record<string, string> = {
  excellent: 'Excelente',
  good: 'Bom',
  satisfactory: 'Satisfatório',
  needs_improvement: 'Precisa Melhorar',
  unsatisfactory: 'Insatisfatório',
};

const ratingColors: Record<string, string> = {
  excellent: 'bg-green-500',
  good: 'bg-blue-500',
  satisfactory: 'bg-yellow-500',
  needs_improvement: 'bg-orange-500',
  unsatisfactory: 'bg-red-500',
};

const ratingBadgeVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  excellent: 'default',
  good: 'default',
  satisfactory: 'secondary',
  needs_improvement: 'destructive',
  unsatisfactory: 'destructive',
};

const CHART_COLORS = ['#22c55e', '#3b82f6', '#eab308', '#f97316', '#ef4444'];

export default function QADashboard() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showScorecardDialog, setShowScorecardDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  // New scorecard form
  const [newScorecard, setNewScorecard] = useState({
    name: '', description: '', passing_score: 70, total_max_score: 100,
    criteria_definitions: [
      { name: 'Saudação e Empatia', category: 'Comunicação', weight: 1.0, max_score: 10 },
      { name: 'Conhecimento do Produto', category: 'Técnico', weight: 1.5, max_score: 10 },
      { name: 'Resolução do Problema', category: 'Técnico', weight: 2.0, max_score: 10 },
      { name: 'Tempo de Resposta', category: 'Eficiência', weight: 1.0, max_score: 10 },
      { name: 'Documentação', category: 'Processo', weight: 0.5, max_score: 10 },
    ],
  });

  // === QUERIES ===

  const { data: scorecards = [], isLoading: scorecardsLoading } = useQuery({
    queryKey: ['qa-scorecards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qa_scorecards')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['qa-reviews', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('qa_reviews')
        .select(`
          *,
          agent:profiles!qa_reviews_agent_id_fkey(id, first_name, last_name, email),
          reviewer:profiles!qa_reviews_reviewer_id_fkey(id, first_name, last_name, email),
          scorecard:qa_scorecards(id, name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as unknown);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: npsSurveys = [] } = useQuery({
    queryKey: ['nps-surveys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nps_surveys')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: npsResponses = [] } = useQuery({
    queryKey: ['nps-responses-recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nps_responses')
        .select(`
          *,
          contact:contacts(id, first_name, last_name, email),
          survey:nps_surveys(id, name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // === MUTATIONS ===

  const createScorecardMutation = useMutation({
    mutationFn: async (data: typeof newScorecard) => {
      const { error } = await supabase.from('qa_scorecards').insert({
        organization_id: profile?.organization_id,
        name: data.name,
        description: data.description,
        passing_score: data.passing_score,
        total_max_score: data.total_max_score,
        criteria_definitions: data.criteria_definitions as unknown,
        status: 'active',
        created_by: profile?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qa-scorecards'] });
      setShowScorecardDialog(false);
      toast.success('Scorecard criado com sucesso');
      setNewScorecard({
        name: '', description: '', passing_score: 70, total_max_score: 100,
        criteria_definitions: [
          { name: 'Saudação e Empatia', category: 'Comunicação', weight: 1.0, max_score: 10 },
          { name: 'Conhecimento do Produto', category: 'Técnico', weight: 1.5, max_score: 10 },
          { name: 'Resolução do Problema', category: 'Técnico', weight: 2.0, max_score: 10 },
          { name: 'Tempo de Resposta', category: 'Eficiência', weight: 1.0, max_score: 10 },
          { name: 'Documentação', category: 'Processo', weight: 0.5, max_score: 10 },
        ],
      });
    },
    onError: (error: unknown) => toast.error('Erro ao criar scorecard: ' + error.message),
  });

  // === COMPUTED VALUES ===

  const completedReviews = reviews.filter(r => r.status === 'completed');
  const avgScore = completedReviews.length > 0
    ? completedReviews.reduce((sum, r) => sum + (Number(r.percentage_score) || 0), 0) / completedReviews.length
    : 0;
  const pendingReviews = reviews.filter(r => r.status === 'pending').length;
  const disputedReviews = reviews.filter(r => r.agent_disputed).length;

  // Agent performance aggregation
  const agentPerformance = completedReviews.reduce((acc, r) => {
    const agentName = r.agent?.first_name
      ? `${r.agent.first_name} ${r.agent.last_name || ''}`.trim()
      : 'Desconhecido';
    if (!acc[agentName]) {
      acc[agentName] = { name: agentName, total: 0, sum: 0, reviews: 0 };
    }
    acc[agentName].total += Number(r.percentage_score) || 0;
    acc[agentName].reviews += 1;
    acc[agentName].sum = acc[agentName].total / acc[agentName].reviews;
    return acc;
  }, {} as Record<string, { name: string; total: number; sum: number; reviews: number }>);

  const agentChartData = Object.values(agentPerformance)
    .map(a => ({ name: a.name, score: Math.round(a.sum), reviews: a.reviews }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  // Rating distribution
  const ratingDistribution = completedReviews.reduce((acc, r) => {
    const rating = r.overall_rating || 'unknown';
    acc[rating] = (acc[rating] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const ratingChartData = Object.entries(ratingDistribution).map(([key, value]) => ({
    name: ratingLabels[key] || key,
    value,
  }));

  // NPS Aggregation
  const totalNpsResponses = npsResponses.length;
  const avgNps = totalNpsResponses > 0
    ? npsResponses.reduce((sum, r) => sum + r.score, 0) / totalNpsResponses
    : 0;
  const promoters = npsResponses.filter(r => r.score >= 9).length;
  const detractors = npsResponses.filter(r => r.score < 7).length;
  const npsScore = totalNpsResponses > 0
    ? Math.round(((promoters - detractors) / totalNpsResponses) * 100)
    : 0;

  // Filtered reviews
  const filteredReviews = reviews.filter(r => {
    if (!searchQuery) return true;
    const s = searchQuery.toLowerCase();
    return (
      r.agent?.first_name?.toLowerCase().includes(s) ||
      r.agent?.last_name?.toLowerCase().includes(s) ||
      r.scorecard?.name?.toLowerCase().includes(s) ||
      r.entity_type?.toLowerCase().includes(s)
    );
  });

  const handleAddCriterion = () => {
    setNewScorecard(prev => ({
      ...prev,
      criteria_definitions: [...prev.criteria_definitions, { name: '', category: '', weight: 1.0, max_score: 10 }],
    }));
  };

  const handleRemoveCriterion = (index: number) => {
    setNewScorecard(prev => ({
      ...prev,
      criteria_definitions: prev.criteria_definitions.filter((_, i) => i !== index),
    }));
  };

  const handleCriterionChange = (index: number, field: string, value: string | number) => {
    setNewScorecard(prev => ({
      ...prev,
      criteria_definitions: prev.criteria_definitions.map((c, i) =>
        i === index ? { ...c, [field]: value } : c
      ),
    }));
  };

  return (
    <>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ClipboardCheck className="h-8 w-8 text-primary" />
              Qualidade & NPS
            </h1>
            <p className="text-muted-foreground mt-1">
              Avaliação de qualidade do atendimento, scorecards e pesquisas NPS
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showScorecardDialog} onOpenChange={setShowScorecardDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Novo Scorecard
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Scorecard de Qualidade</DialogTitle>
                  <DialogDescription>
                    Configure os critérios de avaliação e pesos para medir a qualidade do atendimento.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome do Scorecard</Label>
                      <Input
                        value={newScorecard.name}
                        onChange={e => setNewScorecard(p => ({ ...p, name: e.target.value }))}
                        placeholder="Ex: Avaliação Padrão de Suporte"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nota de Aprovação (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={newScorecard.passing_score}
                        onChange={e => setNewScorecard(p => ({ ...p, passing_score: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={newScorecard.description}
                      onChange={e => setNewScorecard(p => ({ ...p, description: e.target.value }))}
                      placeholder="Descreva o propósito deste scorecard..."
                    />
                  </div>

                  {/* Criteria */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Critérios de Avaliação</Label>
                      <Button size="sm" variant="outline" onClick={handleAddCriterion}>
                        <Plus className="h-3 w-3 mr-1" /> Adicionar
                      </Button>
                    </div>
                    {newScorecard.criteria_definitions.map((criterion, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-end border rounded-lg p-3">
                        <div className="col-span-4 space-y-1">
                          <Label className="text-xs">Nome</Label>
                          <Input
                            value={criterion.name}
                            onChange={e => handleCriterionChange(idx, 'name', e.target.value)}
                            placeholder="Nome do critério"
                          />
                        </div>
                        <div className="col-span-3 space-y-1">
                          <Label className="text-xs">Categoria</Label>
                          <Input
                            value={criterion.category}
                            onChange={e => handleCriterionChange(idx, 'category', e.target.value)}
                            placeholder="Categoria"
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs">Peso</Label>
                          <Input
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={criterion.weight}
                            onChange={e => handleCriterionChange(idx, 'weight', Number(e.target.value))}
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs">Nota Máx.</Label>
                          <Input
                            type="number"
                            min="1"
                            value={criterion.max_score}
                            onChange={e => handleCriterionChange(idx, 'max_score', Number(e.target.value))}
                          />
                        </div>
                        <div className="col-span-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleRemoveCriterion(idx)}
                            disabled={newScorecard.criteria_definitions.length <= 1}
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowScorecardDialog(false)}>Cancelar</Button>
                  <Button
                    onClick={() => createScorecardMutation.mutate(newScorecard)}
                    disabled={!newScorecard.name || createScorecardMutation.isPending}
                  >
                    {createScorecardMutation.isPending ? 'Criando...' : 'Criar Scorecard'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Score Médio</p>
                  <p className="text-3xl font-bold">{avgScore.toFixed(1)}%</p>
                </div>
                <div className={cn('p-3 rounded-full', avgScore >= 70 ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900')}>
                  {avgScore >= 70 ? <TrendingUp className="h-5 w-5 text-green-600" /> : <TrendingDown className="h-5 w-5 text-red-600" />}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avaliações Concluídas</p>
                  <p className="text-3xl font-bold">{completedReviews.length}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-3xl font-bold">{pendingReviews}</p>
                </div>
                <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">NPS Score</p>
                  <p className="text-3xl font-bold">{npsScore}</p>
                </div>
                <div className={cn('p-3 rounded-full', npsScore >= 50 ? 'bg-green-100 dark:bg-green-900' : npsScore >= 0 ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-red-100 dark:bg-red-900')}>
                  <Star className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Disputas</p>
                  <p className="text-3xl font-bold">{disputedReviews}</p>
                </div>
                <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="reviews">
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Avaliações
            </TabsTrigger>
            <TabsTrigger value="scorecards">
              <FileText className="h-4 w-4 mr-2" />
              Scorecards
            </TabsTrigger>
            <TabsTrigger value="nps">
              <Star className="h-4 w-4 mr-2" />
              NPS
            </TabsTrigger>
            <TabsTrigger value="agents">
              <Users className="h-4 w-4 mr-2" />
              Por Agente
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Rating Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Distribuição de Ratings</CardTitle>
                </CardHeader>
                <CardContent>
                  {ratingChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={ratingChartData} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label>
                          {ratingChartData.map((_, idx) => (
                            <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      Nenhuma avaliação concluída ainda
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Agent Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Performance por Agente</CardTitle>
                </CardHeader>
                <CardContent>
                  {agentChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={agentChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value: number) => [`${value}%`, 'Score']} />
                        <Bar dataKey="score" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      Nenhum dado de performance disponível
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* NPS Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resumo NPS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Respostas</p>
                    <p className="text-2xl font-bold">{totalNpsResponses}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Promotores (9-10)</p>
                    <p className="text-2xl font-bold text-green-600">{promoters}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Passivos (7-8)</p>
                    <p className="text-2xl font-bold text-yellow-600">{totalNpsResponses - promoters - detractors}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Detratores (0-6)</p>
                    <p className="text-2xl font-bold text-red-600">{detractors}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>NPS Score</span>
                    <span className="font-medium">{npsScore}</span>
                  </div>
                  <Progress value={Math.max(0, (npsScore + 100) / 2)} className="h-3" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>-100</span>
                    <span>0</span>
                    <span>+100</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar avaliações..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="completed">Concluídas</SelectItem>
                  <SelectItem value="disputed">Disputadas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agente</TableHead>
                      <TableHead>Scorecard</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Avaliador</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviewsLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : filteredReviews.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          <ClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          Nenhuma avaliação encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReviews.map(review => (
                        <TableRow key={review.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {review.agent?.first_name?.[0]}{review.agent?.last_name?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">
                                {review.agent?.first_name} {review.agent?.last_name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{review.scorecard?.name || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{review.entity_type}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono font-bold">
                              {Number(review.percentage_score).toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell>
                            {review.overall_rating ? (
                              <Badge variant={ratingBadgeVariants[review.overall_rating] || 'outline'}>
                                {ratingLabels[review.overall_rating] || review.overall_rating}
                              </Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              review.status === 'completed' ? 'default' :
                              review.status === 'pending' ? 'secondary' :
                              review.status === 'disputed' ? 'destructive' : 'outline'
                            }>
                              {review.status === 'completed' ? 'Concluída' :
                               review.status === 'pending' ? 'Pendente' :
                               review.status === 'in_progress' ? 'Em Andamento' :
                               review.status === 'disputed' ? 'Disputada' :
                               review.status === 'calibrated' ? 'Calibrada' : review.status}
                            </Badge>
                            {review.agent_disputed && (
                              <AlertTriangle className="inline h-3 w-3 ml-1 text-orange-500" />
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {review.reviewer?.first_name} {review.reviewer?.last_name}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: ptBR })}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scorecards Tab */}
          <TabsContent value="scorecards" className="space-y-4">
            {scorecardsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando scorecards...</div>
            ) : scorecards.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Nenhum scorecard criado</h3>
                  <p className="text-muted-foreground mb-4">Crie seu primeiro scorecard para começar a avaliar a qualidade.</p>
                  <Button onClick={() => setShowScorecardDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Criar Scorecard
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scorecards.map(sc => {
                  const criteria = Array.isArray(sc.criteria_definitions) ? sc.criteria_definitions : [];
                  return (
                    <Card key={sc.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{sc.name}</CardTitle>
                          <Badge variant={sc.status === 'active' ? 'default' : 'secondary'}>
                            {sc.status === 'active' ? 'Ativo' : sc.status === 'draft' ? 'Rascunho' : 'Arquivado'}
                          </Badge>
                        </div>
                        {sc.description && (
                          <CardDescription>{sc.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Nota de Aprovação</span>
                          <span className="font-medium">{sc.passing_score}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Critérios</span>
                          <span className="font-medium">{criteria.length}</span>
                        </div>
                        <div className="space-y-1">
                          {criteria.slice(0, 4).map((c: unknown, i: number) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <span className="truncate">{c.name}</span>
                              <span className="text-muted-foreground">Peso: {c.weight}x</span>
                            </div>
                          ))}
                          {criteria.length > 4 && (
                            <p className="text-xs text-muted-foreground">+{criteria.length - 4} critérios</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* NPS Tab */}
          <TabsContent value="nps" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Surveys */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pesquisas NPS</CardTitle>
                </CardHeader>
                <CardContent>
                  {npsSurveys.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma pesquisa NPS configurada</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {npsSurveys.map(survey => (
                        <div key={survey.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{survey.name}</span>
                            <Badge variant={survey.status === 'active' ? 'default' : 'secondary'}>
                              {survey.status === 'active' ? 'Ativa' : survey.status === 'draft' ? 'Rascunho' : survey.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center text-sm">
                            <div>
                              <p className="text-muted-foreground text-xs">Enviadas</p>
                              <p className="font-bold">{survey.total_sent}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Respostas</p>
                              <p className="font-bold">{survey.total_responses}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">NPS</p>
                              <p className="font-bold">{Number(survey.nps_score || 0).toFixed(0)}</p>
                            </div>
                          </div>
                          <Progress value={Number(survey.response_rate || 0)} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            Taxa de resposta: {Number(survey.response_rate || 0).toFixed(1)}%
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Responses */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Respostas Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  {npsResponses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ThumbsUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma resposta recebida</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {npsResponses.map(resp => (
                          <div key={resp.id} className="border rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {resp.contact?.first_name} {resp.contact?.last_name || resp.contact?.email || 'Anônimo'}
                              </span>
                              <Badge
                                variant={resp.score >= 9 ? 'default' : resp.score >= 7 ? 'secondary' : 'destructive'}
                                className="text-lg px-3 py-1 font-bold"
                              >
                                {resp.score}
                              </Badge>
                            </div>
                            {resp.feedback && (
                              <p className="text-sm text-muted-foreground italic">"{resp.feedback}"</p>
                            )}
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{resp.survey?.name}</span>
                              <span>{formatDistanceToNow(new Date(resp.created_at), { addSuffix: true, locale: ptBR })}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agente</TableHead>
                      <TableHead>Score Médio</TableHead>
                      <TableHead>Avaliações</TableHead>
                      <TableHead>Progresso</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentChartData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          Nenhum dado de agente disponível
                        </TableCell>
                      </TableRow>
                    ) : (
                      agentChartData.map((agent, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {agent.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{agent.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={cn(
                              'font-mono font-bold',
                              agent.score >= 70 ? 'text-green-600' : agent.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                            )}>
                              {agent.score}%
                            </span>
                          </TableCell>
                          <TableCell>{agent.reviews}</TableCell>
                          <TableCell className="w-48">
                            <Progress value={agent.score} className="h-2" />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
