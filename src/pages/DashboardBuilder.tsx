import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Plus, Trash2, Settings, Eye, RefreshCw,
  LayoutDashboard, BarChart3, PieChartIcon as PieChart, TrendingUp, Activity,
  Target, Gauge, TableIcon as Table, Grid3x3 as Grid3X3, Maximize2, Minimize2,
  ChevronDown, GripVertical, Copy, Lock, Unlock, Share2,
} from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart as RechartsPieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const WIDGET_TYPES = [
  { type: 'kpi_card', label: 'KPI Card', icon: Target, description: 'Indicador numérico com tendência' },
  { type: 'bar_chart', label: 'Barras', icon: BarChart3, description: 'Gráfico de barras vertical/horizontal' },
  { type: 'line_chart', label: 'Linhas', icon: TrendingUp, description: 'Gráfico de linhas temporais' },
  { type: 'area_chart', label: 'Área', icon: Activity, description: 'Gráfico de área preenchida' },
  { type: 'pie_chart', label: 'Pizza', icon: PieChart, description: 'Distribuição proporcional' },
  { type: 'donut_chart', label: 'Donut', icon: PieChart, description: 'Gráfico de rosca' },
  { type: 'table', label: 'Tabela', icon: Table, description: 'Tabela de dados' },
  { type: 'funnel', label: 'Funil', icon: Target, description: 'Gráfico de funil' },
  { type: 'gauge', label: 'Gauge', icon: Gauge, description: 'Medidor circular' },
  { type: 'metric_comparison', label: 'Comparação', icon: Grid3X3, description: 'Métricas lado a lado' },
  { type: 'sparkline', label: 'Sparkline', icon: TrendingUp, description: 'Micro-gráfico inline' },
];

const DATA_SOURCES = [
  { value: 'opportunities', label: 'Oportunidades' },
  { value: 'leads', label: 'Leads' },
  { value: 'tickets', label: 'Tickets' },
  { value: 'accounts', label: 'Contas' },
  { value: 'contacts', label: 'Contatos' },
  { value: 'orders', label: 'Pedidos' },
  { value: 'campaigns', label: 'Campanhas' },
  { value: 'activities', label: 'Atividades' },
  { value: 'invoices', label: 'Faturas' },
  { value: 'subscriptions', label: 'Assinaturas' },
  { value: 'it_incidents', label: 'Incidentes TI' },
  { value: 'ai_runs', label: 'Execuções IA' },
  { value: 'conversations', label: 'Conversas' },
];

const MODULES = [
  { value: 'general', label: 'Geral' },
  { value: 'sales', label: 'Vendas' },
  { value: 'service', label: 'Atendimento' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'itsm', label: 'TI / ITSM' },
  { value: 'ai_agents', label: 'IA' },
  { value: 'data_hub', label: 'Data Hub' },
  { value: 'integrations', label: 'Integrações' },
];

const DATE_RANGES = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: '365d', label: 'Último ano' },
  { value: 'mtd', label: 'Mês atual' },
  { value: 'qtd', label: 'Trimestre atual' },
  { value: 'ytd', label: 'Ano atual' },
];

const CHART_COLORS = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ef4444', '#06b6d4', '#eab308', '#ec4899'];

interface DashboardWidget {
  id: string;
  name: string;
  description: string;
  widget_type: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  data_source: string;
  query_config: Record<string, any>;
  chart_config: Record<string, any>;
  date_range: string;
  is_visible: boolean;
  cached_data: any;
}

interface DashboardForm {
  name: string;
  description: string;
  module: string;
  visibility: string;
  default_date_range: string;
  auto_refresh_seconds: number;
  is_favorite: boolean;
}

const DEFAULT_WIDGET: Partial<DashboardWidget> = {
  name: 'Novo Widget', description: '', widget_type: 'kpi_card',
  position_x: 0, position_y: 0, width: 4, height: 3,
  data_source: 'opportunities', query_config: {}, chart_config: {},
  date_range: 'inherit', is_visible: true,
};

export default function DashboardBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const isEditing = Boolean(id);

  const [form, setForm] = useState<DashboardForm>({
    name: '', description: '', module: 'general', visibility: 'private',
    default_date_range: '30d', auto_refresh_seconds: 0, is_favorite: false,
  });
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addWidgetOpen, setAddWidgetOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (id) fetchDashboard();
  }, [id]);

  const fetchDashboard = async () => {
    if (!id) return;
    setLoading(true);
    const [dashRes, widgetsRes] = await Promise.all([
      supabase.from('dashboards').select('*').eq('id', id).single(),
      supabase.from('dashboard_widgets').select('*').eq('dashboard_id', id).order('display_order'),
    ]);

    if (dashRes.error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Dashboard não encontrado' });
      navigate('/dashboards');
      return;
    }

    const d = dashRes.data;
    setForm({
      name: d.name || '', description: d.description || '', module: d.module || 'general',
      visibility: d.visibility || 'private', default_date_range: d.default_date_range || '30d',
      auto_refresh_seconds: d.auto_refresh_seconds || 0, is_favorite: d.is_favorite || false,
    });

    if (widgetsRes.data) {
      setWidgets(widgetsRes.data.map((w: any) => ({
        ...w, query_config: w.query_config || {}, chart_config: w.chart_config || {},
      })));
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!profile?.organization_id || !form.name) return;
    setSaving(true);

    let savedId = id;
    if (id) {
      const { error } = await supabase.from('dashboards').update({
        name: form.name, description: form.description || null,
        module: form.module as any, visibility: form.visibility as any,
        default_date_range: form.default_date_range, auto_refresh_seconds: form.auto_refresh_seconds,
        is_favorite: form.is_favorite,
      }).eq('id', id);
      if (error) { toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao salvar' }); setSaving(false); return; }
    } else {
      const { data, error } = await supabase.from('dashboards').insert([{
        name: form.name, description: form.description || null,
        module: form.module as any, visibility: form.visibility as any,
        default_date_range: form.default_date_range, auto_refresh_seconds: form.auto_refresh_seconds,
        is_favorite: form.is_favorite, organization_id: profile.organization_id,
        created_by: profile.id,
      }]).select().single();
      if (error) { toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao criar dashboard' }); setSaving(false); return; }
      savedId = data.id;
    }

    // Salvar widgets
    if (savedId) {
      const existingIds = widgets.filter(w => !w.id.startsWith('temp_')).map(w => w.id);
      // Deletar widgets removidos
      if (id) {
        const { data: dbWidgets } = await supabase.from('dashboard_widgets').select('id').eq('dashboard_id', savedId);
        const toDelete = (dbWidgets || []).filter(dw => !existingIds.includes(dw.id));
        if (toDelete.length > 0) {
          await supabase.from('dashboard_widgets').delete().in('id', toDelete.map(d => d.id));
        }
      }

      for (const [idx, widget] of widgets.entries()) {
        const wData = {
          dashboard_id: savedId!, organization_id: profile.organization_id,
          name: widget.name, description: widget.description || null,
          widget_type: widget.widget_type as any,
          position_x: widget.position_x, position_y: widget.position_y,
          width: widget.width, height: widget.height,
          data_source: widget.data_source, query_config: widget.query_config as any,
          chart_config: widget.chart_config as any, date_range: widget.date_range,
          is_visible: widget.is_visible, display_order: idx,
        };

        if (widget.id.startsWith('temp_')) {
          const { data } = await supabase.from('dashboard_widgets').insert([wData]).select().single();
          if (data) {
            setWidgets(prev => prev.map(w => w.id === widget.id ? { ...w, id: data.id } : w));
          }
        } else {
          await supabase.from('dashboard_widgets').update(wData).eq('id', widget.id);
        }
      }
    }

    toast({ title: 'Dashboard salvo', description: `"${form.name}" salvo com sucesso.` });
    if (!id && savedId) navigate(`/dashboards/${savedId}`, { replace: true });
    setSaving(false);
  };

  const addWidget = (type: string) => {
    const maxY = widgets.length > 0 ? Math.max(...widgets.map(w => w.position_y + w.height)) : 0;
    const newWidget: DashboardWidget = {
      id: `temp_${crypto.randomUUID()}`, name: WIDGET_TYPES.find(t => t.type === type)?.label || 'Widget',
      description: '', widget_type: type, position_x: 0, position_y: maxY,
      width: type === 'kpi_card' ? 3 : type === 'table' ? 12 : 6, height: type === 'kpi_card' ? 2 : 4,
      data_source: 'opportunities', query_config: {}, chart_config: {},
      date_range: 'inherit', is_visible: true, cached_data: null,
    };
    setWidgets(prev => [...prev, newWidget]);
    setSelectedWidgetId(newWidget.id);
    setAddWidgetOpen(false);
  };

  const removeWidget = (widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
    if (selectedWidgetId === widgetId) setSelectedWidgetId(null);
  };

  const duplicateWidget = (widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;
    const maxY = Math.max(...widgets.map(w => w.position_y + w.height));
    const dup: DashboardWidget = { ...widget, id: `temp_${crypto.randomUUID()}`, name: `${widget.name} (Cópia)`, position_y: maxY };
    setWidgets(prev => [...prev, dup]);
  };

  const updateWidget = (widgetId: string, updates: Partial<DashboardWidget>) => {
    setWidgets(prev => prev.map(w => w.id === widgetId ? { ...w, ...updates } : w));
  };

  const selectedWidget = widgets.find(w => w.id === selectedWidgetId);

  const renderWidgetPreview = (widget: DashboardWidget) => {
    const mockData = [
      { name: 'Jan', value: 65 }, { name: 'Fev', value: 80 }, { name: 'Mar', value: 45 },
      { name: 'Abr', value: 90 }, { name: 'Mai', value: 75 }, { name: 'Jun', value: 110 },
    ];
    const mockPie = [
      { name: 'Cat A', value: 40 }, { name: 'Cat B', value: 30 }, { name: 'Cat C', value: 20 }, { name: 'Cat D', value: 10 },
    ];

    switch (widget.widget_type) {
      case 'kpi_card':
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-3xl font-bold">1.247</p>
            <p className="text-xs text-muted-foreground mt-1">{widget.data_source}</p>
            <Badge variant="secondary" className="mt-2 text-xs text-green-600">+12.5%</Badge>
          </div>
        );
      case 'bar_chart':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        );
      case 'line_chart':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} /></LineChart>
          </ResponsiveContainer>
        );
      case 'area_chart':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Area type="monotone" dataKey="value" fill="#3b82f680" stroke="#3b82f6" /></AreaChart>
          </ResponsiveContainer>
        );
      case 'pie_chart':
      case 'donut_chart':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart><Pie data={mockPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={widget.widget_type === 'donut_chart' ? 30 : 0} outerRadius={60}>
              {mockPie.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie><Tooltip /></RechartsPieChart>
          </ResponsiveContainer>
        );
      case 'gauge':
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="relative w-24 h-12 overflow-hidden">
              <div className="absolute inset-0 border-t-4 border-l-4 border-r-4 border-primary rounded-t-full" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-10 bg-primary origin-bottom" style={{ transform: 'translateX(-50%) rotate(-30deg)' }} />
            </div>
            <p className="text-2xl font-bold mt-2">78%</p>
            <p className="text-xs text-muted-foreground">{widget.name}</p>
          </div>
        );
      case 'table':
        return (
          <div className="text-xs overflow-hidden">
            <div className="grid grid-cols-4 gap-1 p-1 bg-muted/50 rounded font-medium">
              <span>Nome</span><span>Valor</span><span>Status</span><span>Data</span>
            </div>
            {[1, 2, 3].map(i => (
              <div key={i} className="grid grid-cols-4 gap-1 p-1 border-b border-muted/30">
                <span>Item {i}</span><span>R${(i * 1250).toLocaleString()}</span>
                <Badge variant="secondary" className="text-[10px] w-fit">Ativo</Badge><span>01/0{i}/25</span>
              </div>
            ))}
          </div>
        );
      case 'metric_comparison':
        return (
          <div className="grid grid-cols-2 gap-2 h-full p-2">
            {[{ label: 'Atual', value: '2.450', change: '+15%' }, { label: 'Anterior', value: '2.130', change: '-' }].map(m => (
              <div key={m.label} className="flex flex-col items-center justify-center bg-muted/30 rounded p-2">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="text-lg font-bold">{m.value}</p>
                <Badge variant="secondary" className="text-[10px]">{m.change}</Badge>
              </div>
            ))}
          </div>
        );
      default:
        return <div className="flex items-center justify-center h-full text-muted-foreground text-sm">{widget.widget_type}</div>;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboards')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">{isEditing ? 'Editar Dashboard' : 'Novo Dashboard'}</h1>
            <p className="text-sm text-muted-foreground">Arraste e configure widgets</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)}>
            <Eye className="mr-1 h-4 w-4" />{previewMode ? 'Editar' : 'Preview'}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !form.name}>
            {saving ? <RefreshCw className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
            Salvar
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Settings & Add Widget */}
        {!previewMode && (
          <div className="w-64 border-r bg-muted/30 overflow-y-auto shrink-0">
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Nome *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Pipeline Executivo" className="h-8 text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Descrição</Label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="text-xs" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Módulo</Label>
                <Select value={form.module} onValueChange={v => setForm({ ...form, module: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{MODULES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Visibilidade</Label>
                <Select value={form.visibility} onValueChange={v => setForm({ ...form, visibility: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Privado</SelectItem>
                    <SelectItem value="team">Equipe</SelectItem>
                    <SelectItem value="organization">Organização</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Período Padrão</Label>
                <Select value={form.default_date_range} onValueChange={v => setForm({ ...form, default_date_range: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{DATE_RANGES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_favorite} onCheckedChange={v => setForm({ ...form, is_favorite: v })} />
                <Label className="text-xs">Favorito</Label>
              </div>
            </div>
            <Separator />
            <div className="p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Adicionar Widget</h3>
              <div className="grid grid-cols-2 gap-2">
                {WIDGET_TYPES.map(({ type, label, icon: Icon }) => (
                  <button key={type} onClick={() => addWidget(type)}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg border border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/5 transition-colors text-xs text-muted-foreground hover:text-foreground">
                    <Icon className="h-4 w-4" /><span className="text-[10px] leading-tight text-center">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto p-4 bg-muted/10">
          {widgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <LayoutDashboard className="h-16 w-16 mb-4 opacity-30" />
              <p className="font-medium mb-1">Dashboard vazio</p>
              <p className="text-sm mb-4">Adicione widgets pelo painel lateral</p>
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-4 auto-rows-[80px]">
              {widgets.filter(w => w.is_visible || !previewMode).map((widget) => {
                const colSpan = Math.min(widget.width, 12);
                const rowSpan = widget.height;
                const isSelected = selectedWidgetId === widget.id && !previewMode;

                return (
                  <div key={widget.id}
                    className={`rounded-xl border bg-card shadow-sm overflow-hidden transition-all cursor-pointer ${
                      isSelected ? 'ring-2 ring-primary border-primary' : 'hover:shadow-md'
                    } ${!widget.is_visible ? 'opacity-40' : ''}`}
                    style={{ gridColumn: `span ${colSpan}`, gridRow: `span ${rowSpan}` }}
                    onClick={() => !previewMode && setSelectedWidgetId(widget.id)}>
                    {/* Widget header */}
                    <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
                      <span className="text-xs font-medium truncate">{widget.name}</span>
                      {!previewMode && (
                        <div className="flex items-center gap-0.5">
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={e => { e.stopPropagation(); duplicateWidget(widget.id); }}>
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={e => { e.stopPropagation(); removeWidget(widget.id); }}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {/* Widget content */}
                    <div className="p-2 h-[calc(100%-36px)]">
                      {renderWidgetPreview(widget)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Panel - Widget Properties */}
        {selectedWidget && !previewMode && (
          <div className="w-72 border-l bg-background overflow-y-auto shrink-0">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Propriedades</h3>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedWidgetId(null)}>✕</Button>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Nome</Label>
                <Input value={selectedWidget.name} onChange={e => updateWidget(selectedWidget.id, { name: e.target.value })} className="h-8 text-xs" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Tipo</Label>
                <Select value={selectedWidget.widget_type} onValueChange={v => updateWidget(selectedWidget.id, { widget_type: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{WIDGET_TYPES.map(t => <SelectItem key={t.type} value={t.type}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Fonte de Dados</Label>
                <Select value={selectedWidget.data_source} onValueChange={v => updateWidget(selectedWidget.id, { data_source: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{DATA_SOURCES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="text-xs">Largura (colunas 1-12)</Label>
                <div className="flex items-center gap-2">
                  <Slider value={[selectedWidget.width]} onValueChange={v => updateWidget(selectedWidget.id, { width: v[0] })} min={2} max={12} step={1} className="flex-1" />
                  <span className="text-xs font-medium w-6">{selectedWidget.width}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Altura (linhas)</Label>
                <div className="flex items-center gap-2">
                  <Slider value={[selectedWidget.height]} onValueChange={v => updateWidget(selectedWidget.id, { height: v[0] })} min={2} max={8} step={1} className="flex-1" />
                  <span className="text-xs font-medium w-6">{selectedWidget.height}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Período</Label>
                <Select value={selectedWidget.date_range} onValueChange={v => updateWidget(selectedWidget.id, { date_range: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inherit">Herdar do Dashboard</SelectItem>
                    {DATE_RANGES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={selectedWidget.is_visible} onCheckedChange={v => updateWidget(selectedWidget.id, { is_visible: v })} />
                <Label className="text-xs">Visível</Label>
              </div>

              <Separator />
              <h4 className="text-xs font-semibold text-muted-foreground uppercase">Configuração do Gráfico</h4>
              <div className="space-y-2">
                <Label className="text-xs">Título Personalizado</Label>
                <Input value={selectedWidget.chart_config.title || ''} onChange={e => updateWidget(selectedWidget.id, { chart_config: { ...selectedWidget.chart_config, title: e.target.value } })} className="h-8 text-xs" placeholder="Título no gráfico" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Cor Principal</Label>
                <Input type="color" value={selectedWidget.chart_config.primary_color || '#3b82f6'} onChange={e => updateWidget(selectedWidget.id, { chart_config: { ...selectedWidget.chart_config, primary_color: e.target.value } })} className="h-8" />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={selectedWidget.chart_config.show_legend || false} onCheckedChange={v => updateWidget(selectedWidget.id, { chart_config: { ...selectedWidget.chart_config, show_legend: v } })} />
                <Label className="text-xs">Mostrar Legenda</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={selectedWidget.chart_config.show_grid || true} onCheckedChange={v => updateWidget(selectedWidget.id, { chart_config: { ...selectedWidget.chart_config, show_grid: v } })} />
                <Label className="text-xs">Mostrar Grid</Label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
