import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, subDays, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Target, 
  TrendingUp, 
  DollarSign, 
  MousePointerClick,
  Mail,
  Share2,
  Globe,
  Search,
  Calendar,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Treemap,
  Sankey,
  Layer,
  Rectangle,
} from "recharts";

type AttributionModel = "first_touch" | "last_touch" | "linear" | "position_based" | "time_decay";

interface CampaignAttribution {
  campaign_id: string;
  campaign_name: string;
  touchpoints: number;
  conversions: number;
  revenue_attributed: number;
  first_touch_revenue: number;
  last_touch_revenue: number;
  linear_revenue: number;
}

interface ChannelAttribution {
  channel: string;
  touchpoints: number;
  conversions: number;
  revenue: number;
  percentage: number;
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

const modelDescriptions: Record<AttributionModel, string> = {
  first_touch: "100% do crédito vai para o primeiro touchpoint que iniciou a jornada",
  last_touch: "100% do crédito vai para o último touchpoint antes da conversão",
  linear: "Crédito distribuído igualmente entre todos os touchpoints",
  position_based: "40% primeiro, 40% último, 20% distribuído no meio",
  time_decay: "Mais crédito para touchpoints mais próximos da conversão",
};

export default function AttributionDashboard() {
  const [period, setPeriod] = useState("30d");
  const [model, setModel] = useState<AttributionModel>("linear");

  const getDateRange = () => {
    const end = new Date();
    let start: Date;
    switch (period) {
      case "7d": start = subDays(end, 7); break;
      case "30d": start = subDays(end, 30); break;
      case "90d": start = subDays(end, 90); break;
      default: start = subDays(end, 30);
    }
    return { start, end };
  };

  // Fetch attribution data
  const { data: attributionData, isLoading } = useQuery({
    queryKey: ["attribution-data", period, model],
    queryFn: async () => {
      const { start } = getDateRange();

      // Fetch touchpoints with campaign info
      const { data: touchpoints, error } = await supabase
        .from("attribution_touchpoints")
        .select(`
          *,
          campaigns (id, name)
        `)
        .gte("touchpoint_date", start.toISOString())
        .order("touchpoint_date", { ascending: true });

      if (error) throw error;

      // Fetch attribution calculations
      const { data: attributions } = await supabase
        .from("marketing_attribution")
        .select(`
          *,
          campaigns (id, name)
        `)
        .eq("attribution_model", model)
        .gte("calculated_at", start.toISOString());

      // Aggregate by campaign
      const campaignMap = new Map<string, CampaignAttribution>();
      
      for (const attr of attributions || []) {
        const campaignId = attr.campaign_id || "direct";
        const campaignName = attr.campaigns?.name || "Tráfego Direto";
        
        if (!campaignMap.has(campaignId)) {
          campaignMap.set(campaignId, {
            campaign_id: campaignId,
            campaign_name: campaignName,
            touchpoints: 0,
            conversions: 0,
            revenue_attributed: 0,
            first_touch_revenue: 0,
            last_touch_revenue: 0,
            linear_revenue: 0,
          });
        }
        
        const entry = campaignMap.get(campaignId)!;
        entry.touchpoints += 1;
        entry.revenue_attributed += attr.revenue_attributed || 0;
        
        if (attr.attribution_model === "first_touch") {
          entry.first_touch_revenue += attr.revenue_attributed || 0;
        } else if (attr.attribution_model === "last_touch") {
          entry.last_touch_revenue += attr.revenue_attributed || 0;
        } else if (attr.attribution_model === "linear") {
          entry.linear_revenue += attr.revenue_attributed || 0;
        }
      }

      // Aggregate by channel
      const channelMap = new Map<string, ChannelAttribution>();
      
      for (const tp of touchpoints || []) {
        const channel = tp.channel || tp.utm_medium || "direct";
        
        if (!channelMap.has(channel)) {
          channelMap.set(channel, {
            channel,
            touchpoints: 0,
            conversions: 0,
            revenue: 0,
            percentage: 0,
          });
        }
        
        const entry = channelMap.get(channel)!;
        entry.touchpoints += 1;
        entry.revenue += tp.conversion_value || 0;
        if (tp.is_conversion_touch) {
          entry.conversions += 1;
        }
      }

      // Calculate percentages
      const totalRevenue = Array.from(channelMap.values()).reduce((sum, c) => sum + c.revenue, 0);
      channelMap.forEach(channel => {
        channel.percentage = totalRevenue > 0 ? (channel.revenue / totalRevenue) * 100 : 0;
      });

      // Calculate totals
      const totalTouchpoints = touchpoints?.length || 0;
      const totalConversions = touchpoints?.filter(tp => tp.is_conversion_touch).length || 0;
      const avgTouchpoints = totalConversions > 0 ? (totalTouchpoints / totalConversions).toFixed(1) : 0;

      return {
        campaigns: Array.from(campaignMap.values()).sort((a, b) => b.revenue_attributed - a.revenue_attributed),
        channels: Array.from(channelMap.values()).sort((a, b) => b.revenue - a.revenue),
        touchpoints: touchpoints || [],
        totals: {
          touchpoints: totalTouchpoints,
          conversions: totalConversions,
          revenue: totalRevenue,
          avgTouchpoints,
        },
      };
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Channel icon mapping
  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case "email": return <Mail className="h-4 w-4" />;
      case "social": return <Share2 className="h-4 w-4" />;
      case "organic": return <Search className="h-4 w-4" />;
      case "paid": return <MousePointerClick className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  // Prepare chart data
  const channelChartData = attributionData?.channels.map((c, index) => ({
    name: c.channel,
    value: c.revenue,
    percentage: c.percentage,
    fill: COLORS[index % COLORS.length],
  })) || [];

  const campaignChartData = attributionData?.campaigns.slice(0, 10).map(c => ({
    name: c.campaign_name.length > 20 ? c.campaign_name.slice(0, 20) + "..." : c.campaign_name,
    revenue: c.revenue_attributed,
    touchpoints: c.touchpoints,
  })) || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Atribuição de Marketing</h1>
            <p className="text-muted-foreground">
              Analise o impacto de cada canal e campanha nas conversões
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
              </SelectContent>
            </Select>
            <Select value={model} onValueChange={(v) => setModel(v as AttributionModel)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="first_touch">First Touch</SelectItem>
                <SelectItem value="last_touch">Last Touch</SelectItem>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="position_based">Position Based</SelectItem>
                <SelectItem value="time_decay">Time Decay</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Model Description */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  Modelo: {model.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {modelDescriptions[model]}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Touchpoints</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attributionData?.totals.touchpoints || 0}</div>
              <p className="text-xs text-muted-foreground">interações rastreadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Conversões</CardTitle>
              <Target className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attributionData?.totals.conversions || 0}</div>
              <p className="text-xs text-muted-foreground">vendas atribuídas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Receita Atribuída</CardTitle>
              <DollarSign className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(attributionData?.totals.revenue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">valor total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Média de Touchpoints</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attributionData?.totals.avgTouchpoints || 0}</div>
              <p className="text-xs text-muted-foreground">por conversão</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Channel Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Atribuição por Canal</CardTitle>
              <CardDescription>
                Distribuição de receita entre canais de marketing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={channelChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {channelChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Top Campanhas</CardTitle>
              <CardDescription>
                Campanhas com maior receita atribuída
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={campaignChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="revenue" fill="#3b82f6" name="Receita" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tables */}
        <Tabs defaultValue="channels">
          <TabsList>
            <TabsTrigger value="channels">Por Canal</TabsTrigger>
            <TabsTrigger value="campaigns">Por Campanha</TabsTrigger>
          </TabsList>

          <TabsContent value="channels" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Detalhamento por Canal</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Canal</TableHead>
                      <TableHead className="text-right">Touchpoints</TableHead>
                      <TableHead className="text-right">Conversões</TableHead>
                      <TableHead className="text-right">Receita</TableHead>
                      <TableHead className="text-right">% do Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attributionData?.channels.map((channel) => (
                      <TableRow key={channel.channel}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getChannelIcon(channel.channel)}
                            <span className="font-medium capitalize">{channel.channel}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{channel.touchpoints}</TableCell>
                        <TableCell className="text-right">{channel.conversions}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(channel.revenue)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary"
                                style={{ width: `${channel.percentage}%` }}
                              />
                            </div>
                            <span className="text-sm">{channel.percentage.toFixed(1)}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Detalhamento por Campanha</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campanha</TableHead>
                      <TableHead className="text-right">Touchpoints</TableHead>
                      <TableHead className="text-right">Receita ({model.replace("_", " ")})</TableHead>
                      <TableHead className="text-right">ROI Estimado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attributionData?.campaigns.map((campaign) => (
                      <TableRow key={campaign.campaign_id}>
                        <TableCell>
                          <span className="font-medium">{campaign.campaign_name}</span>
                        </TableCell>
                        <TableCell className="text-right">{campaign.touchpoints}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(campaign.revenue_attributed)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className="font-mono">
                            {campaign.revenue_attributed > 0 ? (
                              <span className="flex items-center gap-1 text-green-600">
                                <ArrowUpRight className="h-3 w-3" />
                                {((campaign.revenue_attributed / 1000) * 100).toFixed(0)}%
                              </span>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
