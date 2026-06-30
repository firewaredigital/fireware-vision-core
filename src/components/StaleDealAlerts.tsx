import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  DollarSign,
  TrendingDown,
  RefreshCw,
  ExternalLink,
  Settings,
  ChevronRight,
  Calendar,
  User,
  Building2,
  Flame,
  Timer,
  Bell,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  EyeOff,
} from '@/components/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, format, formatDistanceToNow, isToday, isYesterday, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StaleOpportunity {
  id: string;
  name: string;
  amount: number | null;
  stage: string;
  probability: number | null;
  last_activity: string;
  days_stale: number;
  expected_revenue: number | null;
  close_date: string | null;
  account: {
    id: string;
    name: string;
  } | null;
  owner: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
  activity_count: number;
  risk_score: number;
}

interface StaleDealAlertsProps {
  thresholdDays?: number;
  maxItems?: number;
  showConfig?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  onThresholdChange?: (days: number) => void;
  className?: string;
}

type SortField = 'days_stale' | 'amount' | 'risk_score' | 'close_date';
type SortDirection = 'asc' | 'desc';

const stageLabels: Record<string, string> = {
  prospecting: 'Prospecção',
  qualification: 'Qualificação',
  proposal: 'Proposta',
  negotiation: 'Negociação',
};

const stageColors: Record<string, string> = {
  prospecting: 'bg-slate-500',
  qualification: 'bg-blue-500',
  proposal: 'bg-purple-500',
  negotiation: 'bg-orange-500',
};

// Calculates risk score based on multiple factors
const calculateRiskScore = (
  daysStale: number,
  amount: number | null,
  probability: number | null,
  closeDate: string | null,
  activityCount: number
): number => {
  let score = 0;
  
  // Days without activity (0-40 points)
  if (daysStale >= 30) score += 40;
  else if (daysStale >= 21) score += 30;
  else if (daysStale >= 14) score += 20;
  else score += 10;
  
  // Value at risk - higher values = higher risk concern (0-25 points)
  if (amount) {
    if (amount >= 100000) score += 25;
    else if (amount >= 50000) score += 20;
    else if (amount >= 10000) score += 15;
    else score += 10;
  }
  
  // Close date proximity (0-20 points)
  if (closeDate) {
    const daysToClose = differenceInDays(new Date(closeDate), new Date());
    if (daysToClose < 0) score += 20; // Past due
    else if (daysToClose <= 7) score += 15;
    else if (daysToClose <= 14) score += 10;
    else if (daysToClose <= 30) score += 5;
  }
  
  // Low activity history (0-15 points)
  if (activityCount === 0) score += 15;
  else if (activityCount <= 2) score += 10;
  else if (activityCount <= 5) score += 5;
  
  return Math.min(score, 100);
};

export function StaleDealAlerts({
  thresholdDays = 14,
  maxItems = 5,
  showConfig = false,
  variant = 'default',
  onThresholdChange,
  className = '',
}: StaleDealAlertsProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [staleDeals, setStaleDeals] = useState<StaleOpportunity[]>([]);
  const [allStaleDeals, setAllStaleDeals] = useState<StaleOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [sortField, setSortField] = useState<SortField>('risk_score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedThreshold, setSelectedThreshold] = useState(thresholdDays);
  const [isExpanded, setIsExpanded] = useState(false);
  const [filterByOwner, setFilterByOwner] = useState<string | null>(null);
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchStaleDeals = useCallback(async () => {
    if (!profile?.organization_id) return;

    setLoading(true);

    try {
      // Fetch open opportunities with related data
      const { data: opportunities, error } = await supabase
        .from('opportunities')
        .select(`
          id,
          name,
          amount,
          stage,
          probability,
          expected_revenue,
          close_date,
          updated_at,
          created_at,
          account:accounts!opportunities_account_id_fkey(id, name),
          owner:profiles!opportunities_owner_id_fkey(id, first_name, last_name)
        `)
        .eq('organization_id', profile.organization_id)
        .not('stage', 'in', '(closed_won,closed_lost)')
        .order('updated_at', { ascending: true });

      if (error) {
        console.error('Erro ao buscar oportunidades:', error);
        setLoading(false);
        return;
      }

      // Process each opportunity in parallel for performance
      const staleOpps: StaleOpportunity[] = [];
      let totalAtRisk = 0;

      const processPromises = (opportunities || []).map(async (opp) => {
        // Get activity counts and last dates in parallel
        const [activitiesResult, notesResult, timelineResult] = await Promise.all([
          supabase
            .from('activities')
            .select('created_at', { count: 'exact' })
            .eq('opportunity_id', opp.id)
            .order('created_at', { ascending: false })
            .limit(1),
          supabase
            .from('notes')
            .select('created_at')
            .eq('opportunity_id', opp.id)
            .order('created_at', { ascending: false })
            .limit(1),
          supabase
            .from('timeline_events')
            .select('created_at')
            .eq('opportunity_id', opp.id)
            .order('created_at', { ascending: false })
            .limit(1),
        ]);

        // Calculate activity count
        const activityCount = activitiesResult.count || 0;

        // Find the most recent activity across all sources
        const dates = [
          activitiesResult.data?.[0]?.created_at,
          notesResult.data?.[0]?.created_at,
          timelineResult.data?.[0]?.created_at,
          opp.updated_at,
        ].filter(Boolean).map(d => new Date(d!));

        const lastActivity = dates.length > 0 
          ? new Date(Math.max(...dates.map(d => d.getTime()))) 
          : new Date(opp.updated_at);
        
        const daysSinceActivity = differenceInDays(new Date(), lastActivity);

        if (daysSinceActivity >= selectedThreshold) {
          const riskScore = calculateRiskScore(
            daysSinceActivity,
            opp.amount,
            opp.probability,
            opp.close_date,
            activityCount
          );

          return {
            id: opp.id,
            name: opp.name,
            amount: opp.amount,
            stage: opp.stage,
            probability: opp.probability,
            expected_revenue: opp.expected_revenue,
            close_date: opp.close_date,
            last_activity: lastActivity.toISOString(),
            days_stale: daysSinceActivity,
            account: opp.account as { id: string; name: string } | null,
            owner: opp.owner as { id: string; first_name: string | null; last_name: string | null } | null,
            activity_count: activityCount,
            risk_score: riskScore,
          };
        }
        return null;
      });

      const results = await Promise.all(processPromises);
      const validResults = results.filter((r): r is NonNullable<typeof r> => r !== null) as StaleOpportunity[];

      // Filter by owner if enabled
      let filteredDeals = validResults;
      if (showOnlyMine && profile?.id) {
        filteredDeals = filteredDeals.filter(d => d.owner?.id === profile.id);
      }
      if (filterByOwner) {
        filteredDeals = filteredDeals.filter(d => d.owner?.id === filterByOwner);
      }

      // Calculate totals
      totalAtRisk = filteredDeals.reduce((sum, d) => sum + (d.amount || 0), 0);

      // Sort deals
      filteredDeals.sort((a, b) => {
        let aVal: number, bVal: number;
        
        switch (sortField) {
          case 'days_stale':
            aVal = a.days_stale;
            bVal = b.days_stale;
            break;
          case 'amount':
            aVal = a.amount || 0;
            bVal = b.amount || 0;
            break;
          case 'risk_score':
            aVal = a.risk_score;
            bVal = b.risk_score;
            break;
          case 'close_date':
            aVal = a.close_date ? new Date(a.close_date).getTime() : Infinity;
            bVal = b.close_date ? new Date(b.close_date).getTime() : Infinity;
            break;
          default:
            aVal = a.risk_score;
            bVal = b.risk_score;
        }
        
        return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
      });

      setAllStaleDeals(filteredDeals);
      setStaleDeals(filteredDeals.slice(0, maxItems));
      setTotalValue(totalAtRisk);
      setTotalCount(filteredDeals.length);
    } catch (err) {
      console.error('Erro ao processar negócios obsoletos:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.organization_id, profile?.id, selectedThreshold, showOnlyMine, filterByOwner, sortField, sortDirection, maxItems]);

  useEffect(() => {
    fetchStaleDeals();
  }, [fetchStaleDeals, refreshKey]);

  const handleThresholdChange = (value: string) => {
    const days = parseInt(value, 10);
    setSelectedThreshold(days);
    onThresholdChange?.(days);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: value >= 100000 ? 'compact' : 'standard',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatLastActivity = (dateStr: string): string => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Hoje';
    if (isYesterday(date)) return 'Ontem';
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  };

  const getStaleSeverity = (days: number): { 
    label: string; 
    className: string; 
    bgClassName: string;
    icon: typeof Flame;
  } => {
    if (days >= 30) return { 
      label: 'Crítico', 
      className: 'bg-destructive text-destructive-foreground', 
      bgClassName: 'bg-destructive/10 border-destructive/30',
      icon: Flame,
    };
    if (days >= 21) return { 
      label: 'Alto', 
      className: 'bg-orange-500 text-white', 
      bgClassName: 'bg-orange-500/10 border-orange-500/30',
      icon: AlertTriangle,
    };
    return { 
      label: 'Médio', 
      className: 'bg-yellow-500 text-yellow-950', 
      bgClassName: 'bg-yellow-500/10 border-yellow-500/30',
      icon: Timer,
    };
  };

  const getRiskLabel = (score: number): { label: string; color: string } => {
    if (score >= 80) return { label: 'Muito Alto', color: 'text-destructive' };
    if (score >= 60) return { label: 'Alto', color: 'text-orange-500' };
    if (score >= 40) return { label: 'Moderado', color: 'text-yellow-600' };
    return { label: 'Baixo', color: 'text-muted-foreground' };
  };

  const getOwnerInitials = (owner: StaleOpportunity['owner']): string => {
    if (!owner) return '?';
    const first = owner.first_name?.[0] || '';
    const last = owner.last_name?.[0] || '';
    return (first + last).toUpperCase() || '?';
  };

  const getOwnerName = (owner: StaleOpportunity['owner']): string => {
    if (!owner) return 'Não atribuído';
    return [owner.first_name, owner.last_name].filter(Boolean).join(' ') || 'Usuário';
  };

  // Loading skeleton
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  Alertas de Negócios Obsoletos
                </CardTitle>
                <CardDescription className="text-xs">
                  Oportunidades sem atividade há {selectedThreshold}+ dias
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Filter by "only mine" */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showOnlyMine ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowOnlyMine(!showOnlyMine)}
                  >
                    {showOnlyMine ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {showOnlyMine ? 'Mostrando apenas meus' : 'Mostrar apenas meus'}
                </TooltipContent>
              </Tooltip>

              {/* Sort dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    {sortDirection === 'desc' ? (
                      <SortDesc className="h-4 w-4" />
                    ) : (
                      <SortAsc className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => toggleSort('risk_score')}>
                    <Flame className="h-4 w-4 mr-2" />
                    Risco {sortField === 'risk_score' && (sortDirection === 'desc' ? '↓' : '↑')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleSort('days_stale')}>
                    <Clock className="h-4 w-4 mr-2" />
                    Dias parado {sortField === 'days_stale' && (sortDirection === 'desc' ? '↓' : '↑')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleSort('amount')}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Valor {sortField === 'amount' && (sortDirection === 'desc' ? '↓' : '↑')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleSort('close_date')}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Data fechamento {sortField === 'close_date' && (sortDirection === 'desc' ? '↓' : '↑')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Refresh */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleRefresh}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Atualizar</TooltipContent>
              </Tooltip>

              {/* Threshold selector */}
              {showConfig && (
                <Select value={selectedThreshold.toString()} onValueChange={handleThresholdChange}>
                  <SelectTrigger className="h-8 w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="14">14 dias</SelectItem>
                    <SelectItem value="21">21 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {staleDeals.length === 0 ? (
            <div className="text-center py-8">
              <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-success/10 mb-3">
                <Clock className="h-6 w-6 text-success" />
              </div>
              <p className="font-medium text-foreground">Tudo em dia!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Nenhuma oportunidade sem atividade há mais de {selectedThreshold} dias.
              </p>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-warning" />
                    <span className="text-xs font-medium text-warning">Negócios em Risco</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{totalCount}</p>
                  <p className="text-xs text-muted-foreground">
                    {totalCount === 1 ? 'oportunidade' : 'oportunidades'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-destructive" />
                    <span className="text-xs font-medium text-destructive">Valor em Risco</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(totalValue)}</p>
                  <p className="text-xs text-muted-foreground">potencial de perda</p>
                </div>
              </div>

              {/* Distribution by severity */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-muted-foreground">Distribuição por severidade</span>
                </div>
                <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                  {(() => {
                    const critical = allStaleDeals.filter(d => d.days_stale >= 30).length;
                    const high = allStaleDeals.filter(d => d.days_stale >= 21 && d.days_stale < 30).length;
                    const medium = allStaleDeals.filter(d => d.days_stale < 21).length;
                    const total = allStaleDeals.length || 1;
                    return (
                      <>
                        {critical > 0 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div 
                                className="bg-destructive transition-all" 
                                style={{ width: `${(critical / total) * 100}%` }}
                              />
                            </TooltipTrigger>
                            <TooltipContent>Crítico: {critical}</TooltipContent>
                          </Tooltip>
                        )}
                        {high > 0 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div 
                                className="bg-orange-500 transition-all" 
                                style={{ width: `${(high / total) * 100}%` }}
                              />
                            </TooltipTrigger>
                            <TooltipContent>Alto: {high}</TooltipContent>
                          </Tooltip>
                        )}
                        {medium > 0 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div 
                                className="bg-yellow-500 transition-all" 
                                style={{ width: `${(medium / total) * 100}%` }}
                              />
                            </TooltipTrigger>
                            <TooltipContent>Médio: {medium}</TooltipContent>
                          </Tooltip>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-destructive" />
                      <span className="text-muted-foreground">Crítico (30+d)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-orange-500" />
                      <span className="text-muted-foreground">Alto (21-29d)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-yellow-500" />
                      <span className="text-muted-foreground">Médio (14-20d)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stale Deals List */}
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <div className="space-y-2">
                  {staleDeals.map((deal, index) => {
                    const severity = getStaleSeverity(deal.days_stale);
                    const risk = getRiskLabel(deal.risk_score);
                    const SeverityIcon = severity.icon;
                    
                    return (
                      <div
                        key={deal.id}
                        className={`group relative flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md ${severity.bgClassName}`}
                        onClick={() => navigate(`/opportunities/${deal.id}`)}
                      >
                        {/* Risk indicator bar */}
                        <div 
                          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                          style={{
                            background: deal.days_stale >= 30 
                              ? 'hsl(var(--destructive))' 
                              : deal.days_stale >= 21 
                                ? 'rgb(249, 115, 22)' 
                                : 'rgb(234, 179, 8)'
                          }}
                        />
                        
                        {/* Severity icon */}
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${severity.className}`}>
                          <SeverityIcon className="h-4 w-4" />
                        </div>

                        {/* Main content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate text-sm">{deal.name}</p>
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] px-1.5 py-0 h-5 ${severity.className}`}
                            >
                              {deal.days_stale}d
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            {deal.account && (
                              <>
                                <Building2 className="h-3 w-3" />
                                <span className="truncate max-w-[120px]">{deal.account.name}</span>
                                <span>•</span>
                              </>
                            )}
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${stageColors[deal.stage]} text-white`}>
                              {stageLabels[deal.stage] || deal.stage}
                            </span>
                          </div>
                        </div>

                        {/* Right side info */}
                        <div className="text-right shrink-0">
                          <p className="font-semibold text-sm">
                            {deal.amount ? formatCurrency(deal.amount) : '-'}
                          </p>
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1">
                                  <Flame className={`h-3 w-3 ${risk.color}`} />
                                  <span className={`text-[10px] ${risk.color}`}>
                                    {deal.risk_score}%
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                Pontuação de risco: {risk.label}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>

                        {/* Owner avatar */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                              {getOwnerInitials(deal.owner)}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>{getOwnerName(deal.owner)}</TooltipContent>
                        </Tooltip>

                        {/* Arrow indicator */}
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    );
                  })}
                </div>

                {/* Expandable additional items */}
                {allStaleDeals.length > maxItems && (
                  <>
                    <CollapsibleContent>
                      <div className="space-y-2 mt-2">
                        {allStaleDeals.slice(maxItems).map((deal) => {
                          const severity = getStaleSeverity(deal.days_stale);
                          const risk = getRiskLabel(deal.risk_score);
                          const SeverityIcon = severity.icon;
                          
                          return (
                            <div
                              key={deal.id}
                              className={`group relative flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md ${severity.bgClassName}`}
                              onClick={() => navigate(`/opportunities/${deal.id}`)}
                            >
                              <div 
                                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                                style={{
                                  background: deal.days_stale >= 30 
                                    ? 'hsl(var(--destructive))' 
                                    : deal.days_stale >= 21 
                                      ? 'rgb(249, 115, 22)' 
                                      : 'rgb(234, 179, 8)'
                                }}
                              />
                              
                              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${severity.className}`}>
                                <SeverityIcon className="h-4 w-4" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium truncate text-sm">{deal.name}</p>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-[10px] px-1.5 py-0 h-5 ${severity.className}`}
                                  >
                                    {deal.days_stale}d
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                  {deal.account && (
                                    <>
                                      <Building2 className="h-3 w-3" />
                                      <span className="truncate max-w-[120px]">{deal.account.name}</span>
                                      <span>•</span>
                                    </>
                                  )}
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${stageColors[deal.stage]} text-white`}>
                                    {stageLabels[deal.stage] || deal.stage}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <p className="font-semibold text-sm">
                                  {deal.amount ? formatCurrency(deal.amount) : '-'}
                                </p>
                                <div className="flex items-center justify-end gap-1 mt-0.5">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center gap-1">
                                        <Flame className={`h-3 w-3 ${risk.color}`} />
                                        <span className={`text-[10px] ${risk.color}`}>
                                          {deal.risk_score}%
                                        </span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Pontuação de risco: {risk.label}
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                                    {getOwnerInitials(deal.owner)}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>{getOwnerName(deal.owner)}</TooltipContent>
                              </Tooltip>

                              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                    
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full mt-2 text-xs">
                        {isExpanded 
                          ? `Mostrar menos` 
                          : `Ver mais ${allStaleDeals.length - maxItems} negócios`
                        }
                      </Button>
                    </CollapsibleTrigger>
                  </>
                )}
              </Collapsible>
            </>
          )}
        </CardContent>

        {staleDeals.length > 0 && (
          <CardFooter className="pt-0">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/opportunities?filter=stale')}
            >
              <Bell className="h-4 w-4 mr-2" />
              Ver Todos os Negócios Obsoletos
            </Button>
          </CardFooter>
        )}
      </Card>
    </TooltipProvider>
  );
}

// Stale indicator badge for opportunity cards
export function StaleIndicator({ 
  opportunityId, 
  thresholdDays = 14 
}: { 
  opportunityId: string; 
  thresholdDays?: number;
}) {
  const [daysSinceActivity, setDaysSinceActivity] = useState<number | null>(null);

  

  const checkStaleness = useCallback( async () => {
    const [activitiesResult, oppResult] = await Promise.all([
      supabase
        .from('activities')
        .select('created_at')
        .eq('opportunity_id', opportunityId)
        .order('created_at', { ascending: false })
        .limit(1),
      supabase
        .from('opportunities')
        .select('updated_at')
        .eq('id', opportunityId)
        .maybeSingle(),
    ]);

    const lastDate = activitiesResult.data?.[0]?.created_at || oppResult.data?.updated_at;
    if (lastDate) {
      const days = differenceInDays(new Date(), new Date(lastDate));
      if (days >= thresholdDays) {
        setDaysSinceActivity(days);
      }
    }
  }, [opportunityId, id, thresholdDays]);

  useEffect(() => {
    checkStaleness();
  }, [opportunityId, checkStaleness]);

  if (daysSinceActivity === null) return null;

  const severity = daysSinceActivity >= 30 
    ? 'destructive' 
    : daysSinceActivity >= 21 
      ? 'default' 
      : 'secondary';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={severity} className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            {daysSinceActivity}d
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          Sem atividade há {daysSinceActivity} dias
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
