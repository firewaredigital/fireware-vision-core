import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  DollarSign,
  TrendingDown,
  RefreshCw,
  ExternalLink,
  Settings,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, format } from 'date-fns';

interface StaleOpportunity {
  id: string;
  name: string;
  amount: number | null;
  stage: string;
  probability: number | null;
  last_activity: string;
  days_stale: number;
  account: {
    id: string;
    name: string;
  } | null;
  owner: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface StaleDealAlertsProps {
  thresholdDays?: number;
  maxItems?: number;
  showConfig?: boolean;
}

const stageLabels: Record<string, string> = {
  prospecting: 'Prospecting',
  qualification: 'Qualification',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
};

export function StaleDealAlerts({
  thresholdDays = 14,
  maxItems = 5,
  showConfig = false,
}: StaleDealAlertsProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [staleDeals, setStaleDeals] = useState<StaleOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    fetchStaleDeals();
  }, [profile?.organization_id, thresholdDays]);

  const fetchStaleDeals = async () => {
    if (!profile?.organization_id) return;

    setLoading(true);

    // Fetch open opportunities
    const { data: opportunities, error } = await supabase
      .from('opportunities')
      .select(`
        id,
        name,
        amount,
        stage,
        probability,
        updated_at,
        account:accounts(id, name),
        owner:profiles!opportunities_owner_id_fkey(id, first_name, last_name)
      `)
      .eq('organization_id', profile.organization_id)
      .not('stage', 'in', '(closed_won,closed_lost)')
      .order('updated_at', { ascending: true });

    if (error) {
      console.error('Error fetching opportunities:', error);
      setLoading(false);
      return;
    }

    // For each opportunity, get the last activity date
    const staleOpps: StaleOpportunity[] = [];
    let totalAtRisk = 0;

    for (const opp of opportunities || []) {
      // Get last activity
      const { data: activities } = await supabase
        .from('activities')
        .select('created_at')
        .eq('opportunity_id', opp.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const { data: notes } = await supabase
        .from('notes')
        .select('created_at')
        .eq('opportunity_id', opp.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const { data: timeline } = await supabase
        .from('timeline_events')
        .select('created_at')
        .eq('opportunity_id', opp.id)
        .order('created_at', { ascending: false })
        .limit(1);

      // Find the most recent activity
      const dates = [
        activities?.[0]?.created_at,
        notes?.[0]?.created_at,
        timeline?.[0]?.created_at,
        opp.updated_at,
      ].filter(Boolean).map(d => new Date(d!));

      const lastActivity = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date(opp.updated_at);
      const daysSinceActivity = differenceInDays(new Date(), lastActivity);

      if (daysSinceActivity >= thresholdDays) {
        staleOpps.push({
          id: opp.id,
          name: opp.name,
          amount: opp.amount,
          stage: opp.stage,
          probability: opp.probability,
          last_activity: lastActivity.toISOString(),
          days_stale: daysSinceActivity,
          account: opp.account,
          owner: opp.owner,
        });
        totalAtRisk += opp.amount || 0;
      }
    }

    // Sort by days stale (most stale first)
    staleOpps.sort((a, b) => b.days_stale - a.days_stale);

    setStaleDeals(staleOpps.slice(0, maxItems));
    setTotalValue(totalAtRisk);
    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
    }).format(value);
  };

  const getStaleSeverity = (days: number): { label: string; className: string } => {
    if (days >= 30) return { label: 'Critical', className: 'bg-destructive text-destructive-foreground' };
    if (days >= 21) return { label: 'High', className: 'bg-warning text-warning-foreground' };
    return { label: 'Medium', className: 'bg-muted text-muted-foreground' };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <div>
              <CardTitle className="text-base">Stale Deals</CardTitle>
              <CardDescription>
                Opportunities without activity for {thresholdDays}+ days
              </CardDescription>
            </div>
          </div>
          {showConfig && (
            <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : staleDeals.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-8 w-8 mx-auto mb-2 text-success opacity-70" />
            <p className="text-muted-foreground">All deals are active!</p>
            <p className="text-sm text-muted-foreground">
              No opportunities without activity for more than {thresholdDays} days.
            </p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-warning/10 rounded-lg">
                <div className="flex items-center gap-2 text-warning">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-sm font-medium">At Risk Deals</span>
                </div>
                <p className="text-2xl font-bold mt-1">{staleDeals.length}</p>
              </div>
              <div className="p-3 bg-destructive/10 rounded-lg">
                <div className="flex items-center gap-2 text-destructive">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm font-medium">Value at Risk</span>
                </div>
                <p className="text-2xl font-bold mt-1">{formatCurrency(totalValue)}</p>
              </div>
            </div>

            {/* Stale Deals List */}
            <div className="space-y-3">
              {staleDeals.map((deal) => {
                const severity = getStaleSeverity(deal.days_stale);
                return (
                  <div
                    key={deal.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/opportunities/${deal.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{deal.name}</p>
                        <Badge variant="outline" className={severity.className}>
                          {deal.days_stale}d
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        {deal.account && (
                          <span className="truncate">{deal.account.name}</span>
                        )}
                        <span>•</span>
                        <span>{stageLabels[deal.stage] || deal.stage}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {deal.amount ? formatCurrency(deal.amount) : '-'}
                      </p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-xs text-muted-foreground">
                            Last: {format(new Date(deal.last_activity), 'MMM d')}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent>
                          Last activity: {format(new Date(deal.last_activity), 'MMMM d, yyyy')}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                );
              })}
            </div>

            {/* View All Button */}
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => navigate('/opportunities?filter=stale')}
            >
              View All Stale Deals
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Stale indicator badge for opportunity cards
export function StaleIndicator({ opportunityId, thresholdDays = 14 }: { opportunityId: string; thresholdDays?: number }) {
  const [daysSinceActivity, setDaysSinceActivity] = useState<number | null>(null);

  useEffect(() => {
    checkStaleness();
  }, [opportunityId]);

  const checkStaleness = async () => {
    const { data: activities } = await supabase
      .from('activities')
      .select('created_at')
      .eq('opportunity_id', opportunityId)
      .order('created_at', { ascending: false })
      .limit(1);

    const { data: opp } = await supabase
      .from('opportunities')
      .select('updated_at')
      .eq('id', opportunityId)
      .single();

    const lastDate = activities?.[0]?.created_at || opp?.updated_at;
    if (lastDate) {
      const days = differenceInDays(new Date(), new Date(lastDate));
      if (days >= thresholdDays) {
        setDaysSinceActivity(days);
      }
    }
  };

  if (daysSinceActivity === null) return null;

  const severity = daysSinceActivity >= 30 ? 'destructive' : 'secondary';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={severity} className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          {daysSinceActivity}d
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        No activity for {daysSinceActivity} days
      </TooltipContent>
    </Tooltip>
  );
}
