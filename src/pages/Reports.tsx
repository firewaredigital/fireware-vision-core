import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  PieChart,
  LineChart,
  Download,
  RefreshCw,
  Calendar,
  Users,
  Target,
  DollarSign,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter } from 'date-fns';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  FunnelChart,
  Funnel,
  LabelList,
} from 'recharts';
import { exportToCSV } from '@/components/CSVImportDialog';

interface PipelineStage {
  stage: string;
  count: number;
  value: number;
  [key: string]: unknown;
}

interface ConversionData {
  name: string;
  value: number;
  percentage: number;
}

interface ActivityMetrics {
  type: string;
  count: number;
  completed: number;
}

interface WinLossData {
  reason: string;
  count: number;
  type: 'win' | 'loss';
}

interface RepPerformance {
  id: string;
  name: string;
  email: string;
  deals_won: number;
  deals_lost: number;
  revenue: number;
  activities: number;
  win_rate: number;
  [key: string]: unknown;
}

interface TrendData {
  date: string;
  leads: number;
  opportunities: number;
  won: number;
  revenue: number;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const dateRanges = [
  { value: 'this_month', label: 'Este Mês' },
  { value: 'last_month', label: 'Mês Passado' },
  { value: 'this_quarter', label: 'Este Trimestre' },
  { value: 'last_quarter', label: 'Trimestre Passado' },
  { value: 'last_30', label: 'Últimos 30 Dias' },
  { value: 'last_90', label: 'Últimos 90 Dias' },
  { value: 'custom', label: 'Período Personalizado' },
];

export default function Reports() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('this_month');
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>();
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>();
  
  // Data states
  const [pipelineData, setPipelineData] = useState<PipelineStage[]>([]);
  const [conversionData, setConversionData] = useState<ConversionData[]>([]);
  const [activityData, setActivityData] = useState<ActivityMetrics[]>([]);
  const [winLossData, setWinLossData] = useState<WinLossData[]>([]);
  const [repPerformance, setRepPerformance] = useState<RepPerformance[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  
  // Summary metrics
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalDeals, setTotalDeals] = useState(0);
  const [avgDealSize, setAvgDealSize] = useState(0);
  const [winRate, setWinRate] = useState(0);
  const [totalLeads, setTotalLeads] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && profile) {
      fetchAllData();
    }
  }, [user, profile, dateRange, customDateFrom, customDateTo]);

  const getDateRange = (): { from: Date; to: Date } => {
    const now = new Date();
    
    switch (dateRange) {
      case 'this_month':
        return { from: startOfMonth(now), to: endOfMonth(now) };
      case 'last_month':
        return { from: startOfMonth(subMonths(now, 1)), to: endOfMonth(subMonths(now, 1)) };
      case 'this_quarter':
        return { from: startOfQuarter(now), to: endOfQuarter(now) };
      case 'last_quarter':
        return { from: startOfQuarter(subMonths(now, 3)), to: endOfQuarter(subMonths(now, 3)) };
      case 'last_30':
        return { from: subDays(now, 30), to: now };
      case 'last_90':
        return { from: subDays(now, 90), to: now };
      case 'custom':
        return { 
          from: customDateFrom || subDays(now, 30), 
          to: customDateTo || now 
        };
      default:
        return { from: startOfMonth(now), to: endOfMonth(now) };
    }
  };

  const fetchAllData = async () => {
    if (!profile?.organization_id) return;
    
    setLoading(true);
    const { from, to } = getDateRange();

    try {
      // Fetch pipeline data
      const { data: opportunities } = await supabase
        .from('opportunities')
        .select('stage, amount')
        .eq('organization_id', profile.organization_id)
        .gte('created_at', from.toISOString())
        .lte('created_at', to.toISOString());

      if (opportunities) {
        const stageMap = new Map<string, { count: number; value: number }>();
        opportunities.forEach((opp) => {
          const current = stageMap.get(opp.stage) || { count: 0, value: 0 };
          stageMap.set(opp.stage, {
            count: current.count + 1,
            value: current.value + (opp.amount || 0),
          });
        });
        
        const stages = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
        setPipelineData(stages.map(stage => ({
          stage: stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          count: stageMap.get(stage)?.count || 0,
          value: stageMap.get(stage)?.value || 0,
        })));

        // Calculate metrics
        const won = opportunities.filter(o => o.stage === 'closed_won');
        const lost = opportunities.filter(o => o.stage === 'closed_lost');
        const totalRev = won.reduce((sum, o) => sum + (o.amount || 0), 0);
        
        setTotalRevenue(totalRev);
        setTotalDeals(opportunities.length);
        setAvgDealSize(won.length > 0 ? totalRev / won.length : 0);
        setWinRate(won.length + lost.length > 0 ? (won.length / (won.length + lost.length)) * 100 : 0);
      }

      // Fetch leads for conversion funnel
      const { data: leads, count: leadCount } = await supabase
        .from('leads')
        .select('status', { count: 'exact' })
        .eq('organization_id', profile.organization_id)
        .gte('created_at', from.toISOString())
        .lte('created_at', to.toISOString());

      if (leads && leadCount) {
        setTotalLeads(leadCount);
        const statusCounts = new Map<string, number>();
        leads.forEach(lead => {
          statusCounts.set(lead.status, (statusCounts.get(lead.status) || 0) + 1);
        });
        
        const converted = statusCounts.get('converted') || 0;
        setConversionRate(leadCount > 0 ? (converted / leadCount) * 100 : 0);

        setConversionData([
          { name: 'Total Leads', value: leadCount, percentage: 100 },
          { name: 'Contacted', value: statusCounts.get('contacted') || 0, percentage: ((statusCounts.get('contacted') || 0) / leadCount) * 100 },
          { name: 'Qualified', value: statusCounts.get('qualified') || 0, percentage: ((statusCounts.get('qualified') || 0) / leadCount) * 100 },
          { name: 'Converted', value: converted, percentage: (converted / leadCount) * 100 },
        ]);
      }

      // Fetch activities
      const { data: activities } = await supabase
        .from('activities')
        .select('type, status')
        .eq('organization_id', profile.organization_id)
        .gte('created_at', from.toISOString())
        .lte('created_at', to.toISOString());

      if (activities) {
        const activityMap = new Map<string, { count: number; completed: number }>();
        activities.forEach(act => {
          const current = activityMap.get(act.type) || { count: 0, completed: 0 };
          activityMap.set(act.type, {
            count: current.count + 1,
            completed: current.completed + (act.status === 'completed' ? 1 : 0),
          });
        });
        
        setActivityData(Array.from(activityMap.entries()).map(([type, data]) => ({
          type: type.charAt(0).toUpperCase() + type.slice(1),
          count: data.count,
          completed: data.completed,
        })));
      }

      // Fetch win/loss reasons from closed opportunities
      const { data: closedOpps } = await supabase
        .from('opportunities')
        .select('stage, win_reason, loss_reason')
        .eq('organization_id', profile.organization_id)
        .in('stage', ['closed_won', 'closed_lost'])
        .gte('created_at', from.toISOString())
        .lte('created_at', to.toISOString());

      if (closedOpps) {
        const reasonMap = new Map<string, { count: number; type: 'win' | 'loss' }>();
        closedOpps.forEach(opp => {
          if (opp.stage === 'closed_won' && opp.win_reason) {
            const current = reasonMap.get(opp.win_reason) || { count: 0, type: 'win' as const };
            reasonMap.set(opp.win_reason, { count: current.count + 1, type: 'win' });
          } else if (opp.stage === 'closed_lost' && opp.loss_reason) {
            const current = reasonMap.get(opp.loss_reason) || { count: 0, type: 'loss' as const };
            reasonMap.set(opp.loss_reason, { count: current.count + 1, type: 'loss' });
          }
        });
        
        setWinLossData(Array.from(reasonMap.entries()).map(([reason, data]) => ({
          reason,
          count: data.count,
          type: data.type,
        })));
      }

      // Fetch rep performance
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('organization_id', profile.organization_id);

      if (profiles) {
        const repData: RepPerformance[] = [];
        
        for (const rep of profiles) {
          const { data: repOpps } = await supabase
            .from('opportunities')
            .select('stage, amount')
            .eq('owner_id', rep.id)
            .gte('created_at', from.toISOString())
            .lte('created_at', to.toISOString());

          const { count: activityCount } = await supabase
            .from('activities')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', rep.id)
            .gte('created_at', from.toISOString())
            .lte('created_at', to.toISOString());

          const won = repOpps?.filter(o => o.stage === 'closed_won') || [];
          const lost = repOpps?.filter(o => o.stage === 'closed_lost') || [];
          const revenue = won.reduce((sum, o) => sum + (o.amount || 0), 0);
          
          repData.push({
            id: rep.id,
            name: `${rep.first_name || ''} ${rep.last_name || ''}`.trim() || 'Unknown',
            email: rep.email,
            deals_won: won.length,
            deals_lost: lost.length,
            revenue,
            activities: activityCount || 0,
            win_rate: won.length + lost.length > 0 ? (won.length / (won.length + lost.length)) * 100 : 0,
          });
        }
        
        setRepPerformance(repData.sort((a, b) => b.revenue - a.revenue));
      }

      // Generate trend data (simplified - by week)
      const trends: TrendData[] = [];
      const days = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
      const interval = Math.max(1, Math.floor(days / 10));
      
      for (let i = 0; i < days; i += interval) {
        const date = new Date(from);
        date.setDate(date.getDate() + i);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + interval);

        const { count: leadCount } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', profile.organization_id)
          .gte('created_at', date.toISOString())
          .lt('created_at', endDate.toISOString());

        const { data: periodOpps } = await supabase
          .from('opportunities')
          .select('stage, amount')
          .eq('organization_id', profile.organization_id)
          .gte('created_at', date.toISOString())
          .lt('created_at', endDate.toISOString());

        const wonOpps = periodOpps?.filter(o => o.stage === 'closed_won') || [];

        trends.push({
          date: format(date, 'MMM d'),
          leads: leadCount || 0,
          opportunities: periodOpps?.length || 0,
          won: wonOpps.length,
          revenue: wonOpps.reduce((sum, o) => sum + (o.amount || 0), 0),
        });
      }
      
      setTrendData(trends);

    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao carregar dados do relatório',
      });
    }
    
    setLoading(false);
  };

  const handleExportPipeline = () => {
    exportToCSV(pipelineData, 'pipeline_report', [
      { key: 'stage', label: 'Stage' },
      { key: 'count', label: 'Deals' },
      { key: 'value', label: 'Value' },
    ]);
  };

  const handleExportRepPerformance = () => {
    exportToCSV(repPerformance, 'rep_performance_report', [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'deals_won', label: 'Deals Won' },
      { key: 'deals_lost', label: 'Deals Lost' },
      { key: 'revenue', label: 'Revenue' },
      { key: 'activities', label: 'Activities' },
      { key: 'win_rate', label: 'Win Rate %' },
    ]);
  };

  if (authLoading || !user) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Relatórios & Análises</h1>
            <p className="text-muted-foreground">
              Insights completos sobre seu desempenho de vendas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                {dateRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {dateRange === 'custom' && (
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Calendar className="mr-2 h-4 w-4" />
                      {customDateFrom ? format(customDateFrom, 'PP') : 'De'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={customDateFrom}
                      onSelect={setCustomDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Calendar className="mr-2 h-4 w-4" />
                      {customDateTo ? format(customDateTo, 'PP') : 'Até'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={customDateTo}
                      onSelect={setCustomDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
            
            <Button variant="outline" size="sm" onClick={fetchAllData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <DollarSign className="h-5 w-5 text-success" />
                <Badge variant="outline" className="text-success">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  Revenue
                </Badge>
              </div>
              <p className="text-2xl font-bold mt-2">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-muted-foreground">Closed won</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Target className="h-5 w-5 text-info" />
                <Badge variant="outline" className="text-info">Pipeline</Badge>
              </div>
              <p className="text-2xl font-bold mt-2">{totalDeals}</p>
              <p className="text-xs text-muted-foreground">Total deals</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <BarChart3 className="h-5 w-5 text-primary" />
                <Badge variant="outline">Avg Deal</Badge>
              </div>
              <p className="text-2xl font-bold mt-2">{formatCurrency(avgDealSize)}</p>
              <p className="text-xs text-muted-foreground">Deal size</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <Badge variant="outline" className="text-success">Win Rate</Badge>
              </div>
              <p className="text-2xl font-bold mt-2">{winRate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Closed deals</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Users className="h-5 w-5 text-warning" />
                <Badge variant="outline" className="text-warning">Leads</Badge>
              </div>
              <p className="text-2xl font-bold mt-2">{totalLeads}</p>
              <p className="text-xs text-muted-foreground">New leads</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <TrendingUp className="h-5 w-5 text-primary" />
                <Badge variant="outline" className="text-primary">Convert</Badge>
              </div>
              <p className="text-2xl font-bold mt-2">{conversionRate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Conversion rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pipeline" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pipeline">Pipeline Analysis</TabsTrigger>
            <TabsTrigger value="conversion">Conversion Funnel</TabsTrigger>
            <TabsTrigger value="activity">Activity Metrics</TabsTrigger>
            <TabsTrigger value="winloss">Win/Loss Analysis</TabsTrigger>
            <TabsTrigger value="performance">Rep Performance</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          {/* Pipeline Analysis */}
          <TabsContent value="pipeline" className="space-y-6">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleExportPipeline}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pipeline by Stage</CardTitle>
                  <CardDescription>Number of deals in each stage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={pipelineData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="stage" type="category" width={100} />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pipeline Value by Stage</CardTitle>
                  <CardDescription>Total value in each stage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={pipelineData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="stage" angle={-45} textAnchor="end" height={80} />
                        <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                        <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pipeline table */}
            <Card>
              <CardHeader>
                <CardTitle>Pipeline Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stage</TableHead>
                      <TableHead className="text-right">Deals</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">Avg Deal</TableHead>
                      <TableHead className="text-right">% of Pipeline</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pipelineData.map((stage) => (
                      <TableRow key={stage.stage}>
                        <TableCell className="font-medium">{stage.stage}</TableCell>
                        <TableCell className="text-right">{stage.count}</TableCell>
                        <TableCell className="text-right">{formatCurrency(stage.value)}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(stage.count > 0 ? stage.value / stage.count : 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          {totalDeals > 0 ? ((stage.count / totalDeals) * 100).toFixed(1) : 0}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Conversion Funnel */}
          <TabsContent value="conversion" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Lead Conversion Funnel</CardTitle>
                  <CardDescription>Lead progression through stages</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {conversionData.map((stage, index) => (
                      <div key={stage.name} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{stage.name}</span>
                          <span className="font-medium">{stage.value} ({stage.percentage.toFixed(1)}%)</span>
                        </div>
                        <Progress value={stage.percentage} className="h-8" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Conversion Distribution</CardTitle>
                  <CardDescription>Lead status breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={conversionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name}: ${percentage.toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {conversionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Metrics */}
          <TabsContent value="activity" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Activities by Type</CardTitle>
                  <CardDescription>Distribution of activity types</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="type" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name="Total" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="completed" name="Completed" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Activity Completion Rates</CardTitle>
                  <CardDescription>Percentage of completed activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activityData.map((activity) => {
                      const completionRate = activity.count > 0 
                        ? (activity.completed / activity.count) * 100 
                        : 0;
                      
                      return (
                        <div key={activity.type} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-2">
                              {activity.type === 'Call' && <Phone className="h-4 w-4" />}
                              {activity.type === 'Email' && <Mail className="h-4 w-4" />}
                              {activity.type === 'Meeting' && <Calendar className="h-4 w-4" />}
                              {activity.type === 'Task' && <CheckCircle2 className="h-4 w-4" />}
                              {activity.type}
                            </span>
                            <span>
                              {activity.completed}/{activity.count} ({completionRate.toFixed(0)}%)
                            </span>
                          </div>
                          <Progress value={completionRate} />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Win/Loss Analysis */}
          <TabsContent value="winloss" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    Win Reasons
                  </CardTitle>
                  <CardDescription>Why deals were won</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={winLossData.filter(d => d.type === 'win')} 
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="reason" type="category" width={150} />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-destructive" />
                    Loss Reasons
                  </CardTitle>
                  <CardDescription>Why deals were lost</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={winLossData.filter(d => d.type === 'loss')} 
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="reason" type="category" width={150} />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Rep Performance */}
          <TabsContent value="performance" className="space-y-6">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleExportRepPerformance}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Sales Rep Performance</CardTitle>
                <CardDescription>Individual performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rep</TableHead>
                      <TableHead className="text-right">Deals Won</TableHead>
                      <TableHead className="text-right">Deals Lost</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Activities</TableHead>
                      <TableHead className="text-right">Win Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {repPerformance.map((rep) => (
                      <TableRow key={rep.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{rep.name}</p>
                            <p className="text-sm text-muted-foreground">{rep.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="bg-success/10 text-success">
                            {rep.deals_won}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="bg-destructive/10 text-destructive">
                            {rep.deals_lost}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(rep.revenue)}
                        </TableCell>
                        <TableCell className="text-right">{rep.activities}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Progress value={rep.win_rate} className="w-16 h-2" />
                            <span className="text-sm w-12 text-right">{rep.win_rate.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {repPerformance.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                          No performance data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Rep</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={repPerformance.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends */}
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lead & Opportunity Trends</CardTitle>
                <CardDescription>Volume over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="leads" 
                        name="Leads" 
                        stackId="1"
                        stroke="hsl(var(--chart-1))" 
                        fill="hsl(var(--chart-1))" 
                        fillOpacity={0.6}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="opportunities" 
                        name="Opportunities"
                        stackId="2"
                        stroke="hsl(var(--chart-2))" 
                        fill="hsl(var(--chart-2))"
                        fillOpacity={0.6}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="won" 
                        name="Won Deals"
                        stackId="3"
                        stroke="hsl(var(--chart-3))" 
                        fill="hsl(var(--chart-3))"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Closed revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        name="Revenue" 
                        stroke="hsl(var(--success))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--success))' }}
                      />
                    </RechartsLineChart>
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
