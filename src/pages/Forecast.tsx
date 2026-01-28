import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Calendar, Target, TrendingUp, DollarSign, ChevronLeft, ChevronRight, Plus, Edit, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, addMonths, addQuarters, subMonths, subQuarters } from 'date-fns';

interface Forecast {
  id: string;
  owner_id: string;
  organization_id: string;
  period_type: string;
  period_start: string;
  period_end: string;
  target_amount: number;
  commit_amount: number;
  best_case_amount: number;
  pipeline_amount: number;
  closed_amount: number;
  notes: string | null;
  owner?: { first_name: string | null; last_name: string | null; email: string } | null;
}

interface Opportunity {
  id: string;
  name: string;
  amount: number;
  close_date: string | null;
  stage: string;
  forecast_category: string | null;
  owner_id: string | null;
  account?: { name: string } | null;
}

export default function Forecast() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [periodType, setPeriodType] = useState<'monthly' | 'quarterly'>('monthly');
  const [currentPeriod, setCurrentPeriod] = useState(new Date());
  const [editingForecast, setEditingForecast] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    target_amount: number;
    commit_amount: number;
    best_case_amount: number;
  }>({ target_amount: 0, commit_amount: 0, best_case_amount: 0 });

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  const getPeriodRange = () => {
    if (periodType === 'monthly') {
      return {
        start: startOfMonth(currentPeriod),
        end: endOfMonth(currentPeriod)
      };
    }
    return {
      start: startOfQuarter(currentPeriod),
      end: endOfQuarter(currentPeriod)
    };
  };

  const { start: periodStart, end: periodEnd } = getPeriodRange();

  // Fetch forecasts
  const { data: forecasts = [], isLoading: forecastsLoading } = useQuery({
    queryKey: ['forecasts', periodType, format(periodStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('id', user?.id)
        .single();
      
      if (!profile?.organization_id) return [];

      const { data, error } = await supabase
        .from('forecasts')
        .select(`
          *,
          owner:profiles!forecasts_owner_id_fkey(first_name, last_name, email)
        `)
        .eq('organization_id', profile.organization_id)
        .eq('period_type', periodType)
        .eq('period_start', format(periodStart, 'yyyy-MM-dd'));
      
      if (error) throw error;
      return data as Forecast[];
    },
    enabled: !!user
  });

  // Fetch opportunities for the period
  const { data: opportunities = [] } = useQuery({
    queryKey: ['forecast-opportunities', format(periodStart, 'yyyy-MM-dd'), format(periodEnd, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user?.id)
        .single();
      
      if (!profile?.organization_id) return [];

      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          id, name, amount, close_date, stage, forecast_category, owner_id,
          account:accounts(name)
        `)
        .eq('organization_id', profile.organization_id)
        .gte('close_date', format(periodStart, 'yyyy-MM-dd'))
        .lte('close_date', format(periodEnd, 'yyyy-MM-dd'))
        .not('stage', 'eq', 'closed_lost');
      
      if (error) throw error;
      return data as Opportunity[];
    },
    enabled: !!user
  });

  // Fetch team members
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['forecast-team'],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user?.id)
        .single();
      
      if (!profile?.organization_id) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Fetch historical data for chart
  const { data: historicalData = [] } = useQuery({
    queryKey: ['forecast-history', periodType],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user?.id)
        .single();
      
      if (!profile?.organization_id) return [];

      // Get last 6 periods
      const periods = [];
      for (let i = 5; i >= 0; i--) {
        const date = periodType === 'monthly' 
          ? subMonths(currentPeriod, i)
          : subQuarters(currentPeriod, i);
        const start = periodType === 'monthly' ? startOfMonth(date) : startOfQuarter(date);
        periods.push(format(start, 'yyyy-MM-dd'));
      }

      const { data, error } = await supabase
        .from('forecasts')
        .select('period_start, target_amount, closed_amount')
        .eq('organization_id', profile.organization_id)
        .eq('period_type', periodType)
        .in('period_start', periods);
      
      if (error) throw error;

      // Aggregate by period
      const aggregated = periods.map(period => {
        const periodForecasts = data.filter(f => f.period_start === period);
        return {
          period: format(new Date(period), periodType === 'monthly' ? 'MMM yyyy' : 'QQQ yyyy'),
          target: periodForecasts.reduce((sum, f) => sum + (f.target_amount || 0), 0),
          closed: periodForecasts.reduce((sum, f) => sum + (f.closed_amount || 0), 0)
        };
      });

      return aggregated;
    },
    enabled: !!user
  });

  // Save forecast mutation
  const saveForecastMutation = useMutation({
    mutationFn: async (data: { 
      owner_id: string;
      target_amount: number;
      commit_amount: number;
      best_case_amount: number;
    }) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user?.id)
        .single();
      
      if (!profile?.organization_id) throw new Error('No organization');

      // Calculate pipeline and closed from opportunities
      const ownerOpps = opportunities.filter(o => o.owner_id === data.owner_id);
      const pipeline_amount = ownerOpps
        .filter(o => o.stage !== 'closed_won')
        .reduce((sum, o) => sum + (o.amount || 0), 0);
      const closed_amount = ownerOpps
        .filter(o => o.stage === 'closed_won')
        .reduce((sum, o) => sum + (o.amount || 0), 0);

      const existingForecast = forecasts.find(f => f.owner_id === data.owner_id);

      const payload = {
        owner_id: data.owner_id,
        organization_id: profile.organization_id,
        period_type: periodType,
        period_start: format(periodStart, 'yyyy-MM-dd'),
        period_end: format(periodEnd, 'yyyy-MM-dd'),
        target_amount: data.target_amount,
        commit_amount: data.commit_amount,
        best_case_amount: data.best_case_amount,
        pipeline_amount,
        closed_amount
      };

      if (existingForecast) {
        const { error } = await supabase
          .from('forecasts')
          .update(payload)
          .eq('id', existingForecast.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('forecasts')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forecasts'] });
      setEditingForecast(null);
      toast({
        title: 'Forecast saved',
        description: 'Changes saved successfully.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const navigatePeriod = (direction: 'prev' | 'next') => {
    if (periodType === 'monthly') {
      setCurrentPeriod(direction === 'prev' ? subMonths(currentPeriod, 1) : addMonths(currentPeriod, 1));
    } else {
      setCurrentPeriod(direction === 'prev' ? subQuarters(currentPeriod, 1) : addQuarters(currentPeriod, 1));
    }
  };

  const startEditForecast = (memberId: string) => {
    const existing = forecasts.find(f => f.owner_id === memberId);
    setEditValues({
      target_amount: existing?.target_amount || 0,
      commit_amount: existing?.commit_amount || 0,
      best_case_amount: existing?.best_case_amount || 0
    });
    setEditingForecast(memberId);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate totals
  const totals = {
    target: forecasts.reduce((sum, f) => sum + (f.target_amount || 0), 0),
    commit: forecasts.reduce((sum, f) => sum + (f.commit_amount || 0), 0),
    bestCase: forecasts.reduce((sum, f) => sum + (f.best_case_amount || 0), 0),
    pipeline: forecasts.reduce((sum, f) => sum + (f.pipeline_amount || 0), 0),
    closed: forecasts.reduce((sum, f) => sum + (f.closed_amount || 0), 0)
  };

  // Calculate forecast by category from opportunities
  const byCategory = {
    commit: opportunities.filter(o => o.forecast_category === 'commit').reduce((sum, o) => sum + (o.amount || 0), 0),
    bestCase: opportunities.filter(o => o.forecast_category === 'best_case').reduce((sum, o) => sum + (o.amount || 0), 0),
    pipeline: opportunities.filter(o => o.forecast_category === 'pipeline').reduce((sum, o) => sum + (o.amount || 0), 0),
    omitted: opportunities.filter(o => o.forecast_category === 'omitted').reduce((sum, o) => sum + (o.amount || 0), 0),
    closed: opportunities.filter(o => o.stage === 'closed_won').reduce((sum, o) => sum + (o.amount || 0), 0)
  };

  if (loading || !user) return null;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Forecast</h1>
            <p className="text-muted-foreground">Sales forecasting and targets</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={periodType} onValueChange={(v: 'monthly' | 'quarterly') => setPeriodType(v)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigatePeriod('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="w-32 text-center font-medium">
                {format(periodStart, periodType === 'monthly' ? 'MMMM yyyy' : 'QQQ yyyy')}
              </div>
              <Button variant="outline" size="icon" onClick={() => navigatePeriod('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Target className="h-4 w-4" />
                <span className="text-sm">Target</span>
              </div>
              <div className="text-2xl font-bold">{formatCurrency(totals.target)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Commit</span>
              </div>
              <div className="text-2xl font-bold">{formatCurrency(byCategory.commit)}</div>
              <div className="text-xs text-muted-foreground">
                {totals.target > 0 ? Math.round((byCategory.commit / totals.target) * 100) : 0}% of target
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <BarChart3 className="h-4 w-4" />
                <span className="text-sm">Best Case</span>
              </div>
              <div className="text-2xl font-bold">{formatCurrency(byCategory.bestCase)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Pipeline</span>
              </div>
              <div className="text-2xl font-bold">{formatCurrency(byCategory.pipeline)}</div>
            </CardContent>
          </Card>
          <Card className="bg-primary/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">Closed Won</span>
              </div>
              <div className="text-2xl font-bold text-primary">{formatCurrency(byCategory.closed)}</div>
              <div className="text-xs text-muted-foreground">
                {totals.target > 0 ? Math.round((byCategory.closed / totals.target) * 100) : 0}% of target
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress to Target</span>
              <span className="text-sm text-muted-foreground">
                {formatCurrency(byCategory.closed)} / {formatCurrency(totals.target)}
              </span>
            </div>
            <Progress value={totals.target > 0 ? (byCategory.closed / totals.target) * 100 : 0} className="h-3" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Closed: {totals.target > 0 ? Math.round((byCategory.closed / totals.target) * 100) : 0}%</span>
              <span>Commit: +{formatCurrency(byCategory.commit)}</span>
              <span>Best Case: +{formatCurrency(byCategory.bestCase)}</span>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="team" className="space-y-4">
          <TabsList>
            <TabsTrigger value="team">Team Forecast</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities ({opportunities.length})</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle>Team Forecast - {format(periodStart, periodType === 'monthly' ? 'MMMM yyyy' : 'QQQ yyyy')}</CardTitle>
                <CardDescription>Individual targets and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rep</TableHead>
                      <TableHead className="text-right">Target</TableHead>
                      <TableHead className="text-right">Commit</TableHead>
                      <TableHead className="text-right">Best Case</TableHead>
                      <TableHead className="text-right">Pipeline</TableHead>
                      <TableHead className="text-right">Closed</TableHead>
                      <TableHead className="text-right">Attainment</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMembers.map(member => {
                      const forecast = forecasts.find(f => f.owner_id === member.id);
                      const memberOpps = opportunities.filter(o => o.owner_id === member.id);
                      const memberClosed = memberOpps.filter(o => o.stage === 'closed_won').reduce((sum, o) => sum + (o.amount || 0), 0);
                      const memberPipeline = memberOpps.filter(o => o.stage !== 'closed_won').reduce((sum, o) => sum + (o.amount || 0), 0);
                      const memberCommit = memberOpps.filter(o => o.forecast_category === 'commit').reduce((sum, o) => sum + (o.amount || 0), 0);
                      const memberBestCase = memberOpps.filter(o => o.forecast_category === 'best_case').reduce((sum, o) => sum + (o.amount || 0), 0);
                      const target = forecast?.target_amount || 0;
                      const attainment = target > 0 ? Math.round((memberClosed / target) * 100) : 0;

                      const isEditing = editingForecast === member.id;

                      return (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {member.first_name || member.email} {member.last_name || ''}
                              </div>
                              <div className="text-xs text-muted-foreground">{member.role}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editValues.target_amount}
                                onChange={(e) => setEditValues({ ...editValues, target_amount: parseFloat(e.target.value) || 0 })}
                                className="w-24 h-8 text-right"
                              />
                            ) : (
                              formatCurrency(target)
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editValues.commit_amount}
                                onChange={(e) => setEditValues({ ...editValues, commit_amount: parseFloat(e.target.value) || 0 })}
                                className="w-24 h-8 text-right"
                              />
                            ) : (
                              formatCurrency(memberCommit)
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editValues.best_case_amount}
                                onChange={(e) => setEditValues({ ...editValues, best_case_amount: parseFloat(e.target.value) || 0 })}
                                className="w-24 h-8 text-right"
                              />
                            ) : (
                              formatCurrency(memberBestCase)
                            )}
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(memberPipeline)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(memberClosed)}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={attainment >= 100 ? 'default' : attainment >= 75 ? 'secondary' : 'outline'}>
                              {attainment}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => saveForecastMutation.mutate({
                                    owner_id: member.id,
                                    ...editValues
                                  })}
                                >
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => setEditingForecast(null)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => startEditForecast(member.id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {/* Totals Row */}
                    <TableRow className="font-bold bg-muted/50">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">{formatCurrency(totals.target)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(byCategory.commit)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(byCategory.bestCase)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(byCategory.pipeline)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(byCategory.closed)}</TableCell>
                      <TableCell className="text-right">
                        <Badge>{totals.target > 0 ? Math.round((byCategory.closed / totals.target) * 100) : 0}%</Badge>
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="opportunities">
            <Card>
              <CardHeader>
                <CardTitle>Opportunities Closing This Period</CardTitle>
                <CardDescription>Deals with close dates in {format(periodStart, periodType === 'monthly' ? 'MMMM yyyy' : 'QQQ yyyy')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Opportunity</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Close Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {opportunities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No opportunities closing this period
                        </TableCell>
                      </TableRow>
                    ) : (
                      opportunities.map(opp => (
                        <TableRow key={opp.id}>
                          <TableCell className="font-medium">{opp.name}</TableCell>
                          <TableCell>{opp.account?.name || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={opp.stage === 'closed_won' ? 'default' : 'outline'}>
                              {opp.stage.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {opp.forecast_category?.replace('_', ' ') || 'pipeline'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {opp.close_date ? format(new Date(opp.close_date), 'MMM d, yyyy') : '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(opp.amount || 0)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends">
            <Card>
              <CardHeader>
                <CardTitle>Historical Performance</CardTitle>
                <CardDescription>Target vs Closed comparison over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        labelStyle={{ color: 'var(--foreground)' }}
                      />
                      <Legend />
                      <Bar dataKey="target" name="Target" fill="hsl(var(--muted-foreground))" />
                      <Bar dataKey="closed" name="Closed" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
