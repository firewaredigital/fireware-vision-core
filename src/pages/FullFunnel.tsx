import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target, 
  ShoppingCart, 
  Headphones,
  ArrowRight,
  ArrowDown,
  Percent,
  DollarSign,
  Activity,
  Calendar,
  RefreshCw,
  BarChart3,
  LineChart
} from '@/components/icons';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Funnel,
  FunnelChart,
  LabelList,
  Cell,
  PieChart,
  Pie,
} from "recharts";

interface FunnelSnapshot {
  id: string;
  snapshot_date: string;
  period_type: string;
  marketing_leads: number;
  marketing_mqls: number;
  marketing_campaigns_active: number;
  marketing_conversions: number;
  sales_leads_received: number;
  sales_sqls: number;
  sales_opportunities_created: number;
  sales_opportunities_won: number;
  sales_opportunities_lost: number;
  sales_pipeline_value: number;
  sales_closed_value: number;
  sales_win_rate: number;
  service_tickets_created: number;
  service_tickets_resolved: number;
  service_tickets_backlog: number;
  service_sla_compliance: number;
  service_csat_score: number;
  commerce_orders: number;
  commerce_revenue: number;
  commerce_avg_order_value: number;
  customers_total: number;
  customers_new: number;
  customers_churned: number;
  visitor_to_lead_rate: number;
  lead_to_mql_rate: number;
  mql_to_sql_rate: number;
  sql_to_opportunity_rate: number;
  opportunity_to_customer_rate: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function FullFunnel() {
  const [period, setPeriod] = useState("30d");
  const [view, setView] = useState("funnel");

  // Calculate date range based on period
  const getDateRange = () => {
    const end = new Date();
    let start: Date;
    switch (period) {
      case "7d": start = subDays(end, 7); break;
      case "30d": start = subDays(end, 30); break;
      case "90d": start = subDays(end, 90); break;
      case "12m": start = subMonths(end, 12); break;
      default: start = subDays(end, 30);
    }
    return { start, end };
  };

  // Fetch real-time metrics
  const { data: currentMetrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ["funnel-current-metrics"],
    queryFn: async () => {
      const { start, end } = getDateRange();

      // Marketing metrics
      const { count: leadsCount } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .gte("created_at", start.toISOString());

      const { count: campaignsActive } = await supabase
        .from("campaigns")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Sales metrics
      const { count: opportunitiesCreated } = await supabase
        .from("opportunities")
        .select("*", { count: "exact", head: true })
        .gte("created_at", start.toISOString());

      const { count: opportunitiesWon } = await supabase
        .from("opportunities")
        .select("*", { count: "exact", head: true })
        .eq("stage", "closed_won")
        .gte("updated_at", start.toISOString());

      const { count: opportunitiesLost } = await supabase
        .from("opportunities")
        .select("*", { count: "exact", head: true })
        .eq("stage", "closed_lost")
        .gte("updated_at", start.toISOString());

      const { data: pipelineData } = await supabase
        .from("opportunities")
        .select("amount")
        .not("stage", "in", '("closed_won","closed_lost")');

      const pipelineValue = pipelineData?.reduce((sum, opp) => sum + (opp.amount || 0), 0) || 0;

      const { data: closedData } = await supabase
        .from("opportunities")
        .select("amount")
        .eq("stage", "closed_won")
        .gte("updated_at", start.toISOString());

      const closedValue = closedData?.reduce((sum, opp) => sum + (opp.amount || 0), 0) || 0;

      // Service metrics
      const { count: ticketsCreated } = await supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .gte("created_at", start.toISOString());

      const { count: ticketsResolved } = await supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("status", "resolved")
        .gte("resolved_at", start.toISOString());

      const { count: ticketsBacklog } = await supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .not("status", "in", '("resolved","closed")');

      // Commerce metrics
      const { count: ordersCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .gte("created_at", start.toISOString());

      const { data: ordersData } = await supabase
        .from("orders")
        .select("grand_total")
        .gte("created_at", start.toISOString());

      const commerceRevenue = ordersData?.reduce((sum, order) => sum + (order.grand_total || 0), 0) || 0;

      // Customer metrics
      const { count: customersTotal } = await supabase
        .from("accounts")
        .select("*", { count: "exact", head: true });

      const { count: customersNew } = await supabase
        .from("accounts")
        .select("*", { count: "exact", head: true })
        .gte("created_at", start.toISOString());

      return {
        marketing: {
          leads: leadsCount || 0,
          campaignsActive: campaignsActive || 0,
          mqls: Math.floor((leadsCount || 0) * 0.3), // Simulated MQL rate
        },
        sales: {
          opportunities: opportunitiesCreated || 0,
          won: opportunitiesWon || 0,
          lost: opportunitiesLost || 0,
          pipelineValue,
          closedValue,
          winRate: opportunitiesCreated ? ((opportunitiesWon || 0) / opportunitiesCreated * 100).toFixed(1) : 0,
        },
        service: {
          ticketsCreated: ticketsCreated || 0,
          ticketsResolved: ticketsResolved || 0,
          backlog: ticketsBacklog || 0,
          resolutionRate: ticketsCreated ? ((ticketsResolved || 0) / ticketsCreated * 100).toFixed(1) : 0,
        },
        commerce: {
          orders: ordersCount || 0,
          revenue: commerceRevenue,
          avgOrderValue: ordersCount ? (commerceRevenue / ordersCount).toFixed(2) : 0,
        },
        customers: {
          total: customersTotal || 0,
          new: customersNew || 0,
        },
      };
    },
  });

  // Fetch historical snapshots
  const { data: snapshots = [] } = useQuery({
    queryKey: ["funnel-snapshots", period],
    queryFn: async () => {
      const { start } = getDateRange();
      const { data, error } = await supabase
        .from("funnel_snapshots")
        .select("*")
        .gte("snapshot_date", start.toISOString().split("T")[0])
        .order("snapshot_date", { ascending: true });
      
      if (error) throw error;
      return data as FunnelSnapshot[];
    },
  });

  // Funnel data for visualization
  const funnelData = currentMetrics ? [
    { name: "Leads", value: currentMetrics.marketing.leads, fill: "#3b82f6" },
    { name: "MQLs", value: currentMetrics.marketing.mqls, fill: "#8b5cf6" },
    { name: "Oportunidades", value: currentMetrics.sales.opportunities, fill: "#f59e0b" },
    { name: "Ganhas", value: currentMetrics.sales.won, fill: "#22c55e" },
  ] : [];

  // Trend data for charts
  const trendData = snapshots.map(s => ({
    date: format(new Date(s.snapshot_date), "dd/MM", { locale: ptBR }),
    leads: s.marketing_leads,
    opportunities: s.sales_opportunities_created,
    tickets: s.service_tickets_created,
    orders: s.commerce_orders,
    revenue: s.commerce_revenue,
  }));

  // Module comparison data
  const moduleData = currentMetrics ? [
    { name: "Marketing", leads: currentMetrics.marketing.leads, value: currentMetrics.marketing.mqls },
    { name: "Vendas", opportunities: currentMetrics.sales.opportunities, value: currentMetrics.sales.closedValue },
    { name: "Atendimento", tickets: currentMetrics.service.ticketsCreated, value: currentMetrics.service.ticketsResolved },
    { name: "Commerce", orders: currentMetrics.commerce.orders, value: currentMetrics.commerce.revenue },
  ] : [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      notation: "compact",
    }).format(value);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Funil Completo</h1>
            <p className="text-muted-foreground">
              Visão integrada Marketing → Vendas → Atendimento → Commerce
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[150px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
                <SelectItem value="12m">Últimos 12 meses</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Module Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          {/* Marketing */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Marketing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentMetrics?.marketing.leads || 0}</div>
              <p className="text-xs text-muted-foreground">leads gerados</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {currentMetrics?.marketing.campaignsActive || 0} campanhas ativas
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Sales */}
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Vendas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(currentMetrics?.sales.closedValue || 0)}</div>
              <p className="text-xs text-muted-foreground">receita fechada</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {currentMetrics?.sales.winRate}% win rate
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Service */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Headphones className="h-4 w-4" />
                Atendimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentMetrics?.service.ticketsResolved || 0}</div>
              <p className="text-xs text-muted-foreground">tickets resolvidos</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {currentMetrics?.service.backlog || 0} em aberto
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Commerce */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Commerce
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(currentMetrics?.commerce.revenue || 0)}</div>
              <p className="text-xs text-muted-foreground">receita de pedidos</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {currentMetrics?.commerce.orders || 0} pedidos
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Funnel Visualization */}
        <Tabs value={view} onValueChange={setView}>
          <TabsList>
            <TabsTrigger value="funnel">
              <BarChart3 className="h-4 w-4 mr-2" />
              Funil
            </TabsTrigger>
            <TabsTrigger value="flow">
              <Activity className="h-4 w-4 mr-2" />
              Fluxo
            </TabsTrigger>
            <TabsTrigger value="trends">
              <LineChart className="h-4 w-4 mr-2" />
              Tendências
            </TabsTrigger>
          </TabsList>

          <TabsContent value="funnel" className="mt-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Funnel Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Funil de Conversão</CardTitle>
                  <CardDescription>
                    Progressão de leads até clientes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={funnelData}
                        margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8">
                          {funnelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Conversion Rates */}
              <Card>
                <CardHeader>
                  <CardTitle>Taxas de Conversão</CardTitle>
                  <CardDescription>
                    Eficiência entre etapas do funil
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">Lead → MQL</p>
                          <p className="text-sm text-muted-foreground">Qualificação de marketing</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="text-2xl font-bold">30%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Target className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="font-medium">MQL → Oportunidade</p>
                          <p className="text-sm text-muted-foreground">Qualificação de vendas</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="text-2xl font-bold">
                          {currentMetrics?.marketing.mqls ? 
                            ((currentMetrics.sales.opportunities / currentMetrics.marketing.mqls) * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-amber-500" />
                        <div>
                          <p className="font-medium">Oportunidade → Venda</p>
                          <p className="text-sm text-muted-foreground">Taxa de fechamento</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="text-2xl font-bold">{currentMetrics?.sales.winRate || 0}%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Headphones className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">Resolução de Tickets</p>
                          <p className="text-sm text-muted-foreground">Taxa de resolução</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="text-2xl font-bold">{currentMetrics?.service.resolutionRate || 0}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="flow" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Fluxo do Cliente</CardTitle>
                <CardDescription>
                  Jornada completa através dos módulos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between py-8">
                  {/* Marketing */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
                      <Users className="h-10 w-10 text-blue-600" />
                    </div>
                    <span className="font-medium">Marketing</span>
                    <span className="text-2xl font-bold">{currentMetrics?.marketing.leads || 0}</span>
                    <span className="text-sm text-muted-foreground">leads</span>
                  </div>

                  <ArrowRight className="h-8 w-8 text-muted-foreground" />

                  {/* Sales */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center">
                      <Target className="h-10 w-10 text-amber-600" />
                    </div>
                    <span className="font-medium">Vendas</span>
                    <span className="text-2xl font-bold">{currentMetrics?.sales.opportunities || 0}</span>
                    <span className="text-sm text-muted-foreground">oportunidades</span>
                  </div>

                  <ArrowRight className="h-8 w-8 text-muted-foreground" />

                  {/* Customers */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
                      <ShoppingCart className="h-10 w-10 text-green-600" />
                    </div>
                    <span className="font-medium">Clientes</span>
                    <span className="text-2xl font-bold">{currentMetrics?.sales.won || 0}</span>
                    <span className="text-sm text-muted-foreground">convertidos</span>
                  </div>

                  <ArrowRight className="h-8 w-8 text-muted-foreground" />

                  {/* Service */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center">
                      <Headphones className="h-10 w-10 text-purple-600" />
                    </div>
                    <span className="font-medium">Suporte</span>
                    <span className="text-2xl font-bold">{currentMetrics?.service.ticketsCreated || 0}</span>
                    <span className="text-sm text-muted-foreground">tickets</span>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Revenue Flow */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Pipeline</p>
                    <p className="text-xl font-bold">{formatCurrency(currentMetrics?.sales.pipelineValue || 0)}</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Fechado</p>
                    <p className="text-xl font-bold">{formatCurrency(currentMetrics?.sales.closedValue || 0)}</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Commerce</p>
                    <p className="text-xl font-bold">{formatCurrency(currentMetrics?.commerce.revenue || 0)}</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center bg-green-50 dark:bg-green-950">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency((currentMetrics?.sales.closedValue || 0) + (currentMetrics?.commerce.revenue || 0))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="mt-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Volume Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Tendência de Volume</CardTitle>
                  <CardDescription>
                    Evolução de leads, oportunidades e tickets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="leads" name="Leads" stroke="#3b82f6" strokeWidth={2} />
                        <Line type="monotone" dataKey="opportunities" name="Oportunidades" stroke="#f59e0b" strokeWidth={2} />
                        <Line type="monotone" dataKey="tickets" name="Tickets" stroke="#8b5cf6" strokeWidth={2} />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Tendência de Receita</CardTitle>
                  <CardDescription>
                    Evolução da receita de commerce
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          name="Receita" 
                          stroke="#22c55e" 
                          fill="#22c55e" 
                          fillOpacity={0.3} 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

// Badge component import fix
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
