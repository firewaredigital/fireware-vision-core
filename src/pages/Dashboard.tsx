import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Mock data for demonstration
const pipelineData = [
  { stage: 'Prospecting', value: 45000, count: 12 },
  { stage: 'Qualification', value: 78000, count: 8 },
  { stage: 'Proposal', value: 125000, count: 5 },
  { stage: 'Negotiation', value: 89000, count: 3 },
  { stage: 'Closed Won', value: 156000, count: 7 },
];

const stageColors = ['#94a3b8', '#60a5fa', '#facc15', '#f97316', '#22c55e'];

const recentActivities = [
  { id: 1, type: 'opportunity', title: 'Enterprise Deal moved to Proposal', time: '2 hours ago', user: 'John D.' },
  { id: 2, type: 'lead', title: 'New lead from website form', time: '3 hours ago', user: 'System' },
  { id: 3, type: 'quote', title: 'Quote #1234 sent to Acme Corp', time: '5 hours ago', user: 'Sarah M.' },
  { id: 4, type: 'activity', title: 'Meeting scheduled with TechStart Inc', time: '6 hours ago', user: 'John D.' },
  { id: 5, type: 'opportunity', title: 'Enterprise Deal closed won - $45,000', time: '1 day ago', user: 'Mike R.' },
];

const topDeals = [
  { id: 1, name: 'Enterprise Cloud Migration', account: 'Acme Corp', value: 125000, stage: 'Proposal', probability: 60 },
  { id: 2, name: 'Security Suite Implementation', account: 'TechStart Inc', value: 89000, stage: 'Negotiation', probability: 75 },
  { id: 3, name: 'Analytics Platform', account: 'DataFlow LLC', value: 67000, stage: 'Qualification', probability: 40 },
  { id: 4, name: 'Infrastructure Upgrade', account: 'GlobalTech', value: 54000, stage: 'Proposal', probability: 55 },
];

export default function Dashboard() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPipeline: 493000,
    pipelineChange: 12.5,
    openLeads: 45,
    leadsChange: 8.2,
    wonDeals: 156000,
    wonChange: -3.1,
    activitiesThisWeek: 28,
    activitiesChange: 15.0,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {profile?.first_name || 'User'}
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your sales pipeline today.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalPipeline)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {stats.pipelineChange >= 0 ? (
                  <ArrowUpRight className="mr-1 h-3 w-3 text-success" />
                ) : (
                  <ArrowDownRight className="mr-1 h-3 w-3 text-destructive" />
                )}
                <span className={stats.pipelineChange >= 0 ? 'text-success' : 'text-destructive'}>
                  {Math.abs(stats.pipelineChange)}%
                </span>
                <span className="ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Leads</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.openLeads}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {stats.leadsChange >= 0 ? (
                  <ArrowUpRight className="mr-1 h-3 w-3 text-success" />
                ) : (
                  <ArrowDownRight className="mr-1 h-3 w-3 text-destructive" />
                )}
                <span className={stats.leadsChange >= 0 ? 'text-success' : 'text-destructive'}>
                  {Math.abs(stats.leadsChange)}%
                </span>
                <span className="ml-1">from last week</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Closed Won (MTD)</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.wonDeals)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {stats.wonChange >= 0 ? (
                  <ArrowUpRight className="mr-1 h-3 w-3 text-success" />
                ) : (
                  <ArrowDownRight className="mr-1 h-3 w-3 text-destructive" />
                )}
                <span className={stats.wonChange >= 0 ? 'text-success' : 'text-destructive'}>
                  {Math.abs(stats.wonChange)}%
                </span>
                <span className="ml-1">vs target</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activities This Week</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activitiesThisWeek}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {stats.activitiesChange >= 0 ? (
                  <ArrowUpRight className="mr-1 h-3 w-3 text-success" />
                ) : (
                  <ArrowDownRight className="mr-1 h-3 w-3 text-destructive" />
                )}
                <span className={stats.activitiesChange >= 0 ? 'text-success' : 'text-destructive'}>
                  {Math.abs(stats.activitiesChange)}%
                </span>
                <span className="ml-1">from last week</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 lg:grid-cols-7">
          {/* Pipeline Chart */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Pipeline by Stage</CardTitle>
              <CardDescription>Value distribution across your sales pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipelineData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" tickFormatter={(value) => `$${value / 1000}k`} />
                    <YAxis type="category" dataKey="stage" width={100} />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), 'Value']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {pipelineData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={stageColors[index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Stage Distribution */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Deal Distribution</CardTitle>
              <CardDescription>Number of deals by stage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pipelineData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="count"
                      nameKey="stage"
                    >
                      {pipelineData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={stageColors[index]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [value, name]}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {pipelineData.map((item, index) => (
                  <div key={item.stage} className="flex items-center gap-2 text-sm">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: stageColors[index] }}
                    />
                    <span className="truncate text-muted-foreground">{item.stage}</span>
                    <span className="ml-auto font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Top Deals */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Top Deals</CardTitle>
                <CardDescription>Highest value opportunities in pipeline</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/opportunities')}>
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topDeals.map((deal) => (
                  <div key={deal.id} className="flex items-center gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{deal.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {deal.stage}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{deal.account}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(deal.value)}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Progress value={deal.probability} className="h-1 w-12" />
                        <span>{deal.probability}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates from your team</CardDescription>
              </div>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.user} • {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
