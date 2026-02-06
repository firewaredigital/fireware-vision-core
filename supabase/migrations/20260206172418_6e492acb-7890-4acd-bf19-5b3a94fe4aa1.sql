
-- =====================================================
-- BLOCO 4: Analytics Engine + Revenue Ops Dashboards
-- Tabelas: dashboards, dashboard_widgets, report_definitions, report_runs
-- Enums: widget_type, report_format, report_status, dashboard_visibility
-- =====================================================

-- ===================== ENUMS =====================

-- Tipo de widget de dashboard
CREATE TYPE public.widget_type AS ENUM (
  'kpi_card',
  'bar_chart',
  'line_chart',
  'area_chart',
  'pie_chart',
  'donut_chart',
  'table',
  'funnel',
  'gauge',
  'heatmap',
  'scatter',
  'treemap',
  'metric_comparison',
  'sparkline'
);

-- Formato de exportação de relatório
CREATE TYPE public.report_format AS ENUM (
  'pdf',
  'csv',
  'xlsx',
  'json',
  'html'
);

-- Status de execução de relatório
CREATE TYPE public.report_status AS ENUM (
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
  'expired'
);

-- Visibilidade do dashboard
CREATE TYPE public.dashboard_visibility AS ENUM (
  'private',
  'team',
  'organization',
  'public'
);

-- Módulo de contexto do dashboard
CREATE TYPE public.dashboard_module AS ENUM (
  'sales',
  'service',
  'marketing',
  'commerce',
  'itsm',
  'ai_agents',
  'data_hub',
  'integrations',
  'general'
);

-- Período de agregação
CREATE TYPE public.aggregation_period AS ENUM (
  'realtime',
  'hourly',
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'yearly',
  'custom'
);

-- ===================== TABELAS =====================

-- 1. Dashboards customizáveis
CREATE TABLE public.dashboards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  module public.dashboard_module NOT NULL DEFAULT 'general',
  visibility public.dashboard_visibility NOT NULL DEFAULT 'private',
  
  -- Layout
  layout_config JSONB NOT NULL DEFAULT '{"columns": 12, "row_height": 80}'::jsonb,
  theme_config JSONB DEFAULT '{}'::jsonb,
  
  -- Filtros globais do dashboard
  global_filters JSONB DEFAULT '[]'::jsonb,
  default_date_range TEXT DEFAULT '30d',
  auto_refresh_seconds INTEGER DEFAULT 0,
  
  -- Compartilhamento
  shared_with_users UUID[] DEFAULT '{}',
  shared_with_roles TEXT[] DEFAULT '{}',
  
  -- Metadados
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  thumbnail_url TEXT,
  
  -- Versionamento
  version INTEGER NOT NULL DEFAULT 1,
  last_viewed_at TIMESTAMPTZ,
  view_count INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Widgets individuais de dashboard
CREATE TABLE public.dashboard_widgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dashboard_id UUID NOT NULL REFERENCES public.dashboards(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  widget_type public.widget_type NOT NULL,
  
  -- Posição no grid (x, y, w, h)
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  width INTEGER NOT NULL DEFAULT 4,
  height INTEGER NOT NULL DEFAULT 3,
  min_width INTEGER DEFAULT 2,
  min_height INTEGER DEFAULT 2,
  
  -- Fonte de dados
  data_source TEXT NOT NULL, -- 'opportunities', 'tickets', 'ai_runs', etc.
  query_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- query_config exemplo: 
  -- {
  --   "table": "opportunities",
  --   "select": ["stage", "count(*)", "sum(amount)"],
  --   "filters": [{"field": "stage", "op": "not_in", "value": ["closed_lost"]}],
  --   "group_by": ["stage"],
  --   "order_by": [{"field": "count", "direction": "desc"}],
  --   "limit": 10,
  --   "aggregation": "count"
  -- }
  
  -- Configuração visual
  chart_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- chart_config exemplo:
  -- {
  --   "colors": ["#4F46E5", "#10B981", "#F59E0B"],
  --   "show_legend": true,
  --   "show_labels": true,
  --   "axis_config": {"x_label": "Estágio", "y_label": "Quantidade"},
  --   "format": {"type": "currency", "locale": "pt-BR"},
  --   "thresholds": [{"value": 80, "color": "green"}, {"value": 50, "color": "yellow"}]
  -- }
  
  -- Filtros específicos do widget
  filters JSONB DEFAULT '[]'::jsonb,
  date_range TEXT DEFAULT 'inherit', -- 'inherit' usa o do dashboard
  aggregation_period public.aggregation_period DEFAULT 'daily',
  
  -- Drill-down
  drill_down_config JSONB DEFAULT NULL,
  click_action TEXT DEFAULT 'none', -- 'none', 'drill_down', 'navigate', 'filter'
  click_target TEXT,
  
  -- Cache
  cache_ttl_seconds INTEGER DEFAULT 300,
  last_data_refresh TIMESTAMPTZ,
  cached_data JSONB,
  
  -- Estado
  is_visible BOOLEAN NOT NULL DEFAULT true,
  is_loading BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Definições de relatórios salvos
CREATE TABLE public.report_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  module public.dashboard_module NOT NULL DEFAULT 'general',
  
  -- Configuração do relatório
  report_type TEXT NOT NULL DEFAULT 'tabular', -- 'tabular', 'summary', 'matrix', 'chart'
  data_source TEXT NOT NULL,
  query_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Colunas e agrupamentos
  columns JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- columns exemplo: [{"field": "name", "label": "Nome", "width": 200}, {"field": "amount", "label": "Valor", "format": "currency"}]
  group_by JSONB DEFAULT '[]'::jsonb,
  sort_by JSONB DEFAULT '[]'::jsonb,
  filters JSONB DEFAULT '[]'::jsonb,
  
  -- Formatação
  formatting_rules JSONB DEFAULT '[]'::jsonb,
  -- formatting_rules exemplo: [{"condition": {"field": "amount", "op": ">", "value": 100000}, "style": {"background": "#dcfce7"}}]
  
  -- Sumários e totais
  summary_fields JSONB DEFAULT '[]'::jsonb,
  -- summary_fields exemplo: [{"field": "amount", "aggregation": "sum", "label": "Total"}, {"field": "id", "aggregation": "count", "label": "Qtd"}]
  
  -- Agendamento
  is_scheduled BOOLEAN NOT NULL DEFAULT false,
  schedule_cron TEXT,
  schedule_timezone TEXT DEFAULT 'America/Sao_Paulo',
  schedule_recipients TEXT[] DEFAULT '{}',
  schedule_format public.report_format DEFAULT 'pdf',
  next_scheduled_at TIMESTAMPTZ,
  
  -- Compartilhamento
  visibility public.dashboard_visibility NOT NULL DEFAULT 'private',
  shared_with_users UUID[] DEFAULT '{}',
  
  -- Metadados
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  
  -- Estatísticas
  run_count INTEGER NOT NULL DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  avg_run_duration_ms INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Histórico de execuções de relatórios
CREATE TABLE public.report_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.report_definitions(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  triggered_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Execução
  status public.report_status NOT NULL DEFAULT 'pending',
  trigger_type TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'scheduled', 'api'
  
  -- Parâmetros usados nesta execução
  parameters JSONB DEFAULT '{}'::jsonb,
  applied_filters JSONB DEFAULT '[]'::jsonb,
  date_range_start TIMESTAMPTZ,
  date_range_end TIMESTAMPTZ,
  
  -- Resultado
  format public.report_format NOT NULL DEFAULT 'pdf',
  row_count INTEGER,
  file_size_bytes BIGINT,
  file_url TEXT,
  result_preview JSONB, -- Primeiras linhas para preview rápido
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Erro
  error_message TEXT,
  error_details JSONB,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  
  -- Expiração
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  
  -- Notificações
  notification_sent BOOLEAN NOT NULL DEFAULT false,
  notification_sent_at TIMESTAMPTZ,
  notified_users UUID[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================== ÍNDICES =====================

-- Dashboards
CREATE INDEX idx_dashboards_org ON public.dashboards(organization_id);
CREATE INDEX idx_dashboards_module ON public.dashboards(organization_id, module);
CREATE INDEX idx_dashboards_created_by ON public.dashboards(created_by);
CREATE INDEX idx_dashboards_visibility ON public.dashboards(organization_id, visibility);
CREATE INDEX idx_dashboards_default ON public.dashboards(organization_id, module, is_default) WHERE is_default = true;

-- Dashboard Widgets
CREATE INDEX idx_dashboard_widgets_dashboard ON public.dashboard_widgets(dashboard_id);
CREATE INDEX idx_dashboard_widgets_org ON public.dashboard_widgets(organization_id);
CREATE INDEX idx_dashboard_widgets_type ON public.dashboard_widgets(widget_type);

-- Report Definitions
CREATE INDEX idx_report_definitions_org ON public.report_definitions(organization_id);
CREATE INDEX idx_report_definitions_module ON public.report_definitions(organization_id, module);
CREATE INDEX idx_report_definitions_created_by ON public.report_definitions(created_by);
CREATE INDEX idx_report_definitions_scheduled ON public.report_definitions(is_scheduled, next_scheduled_at) WHERE is_scheduled = true;

-- Report Runs
CREATE INDEX idx_report_runs_report ON public.report_runs(report_id);
CREATE INDEX idx_report_runs_org ON public.report_runs(organization_id);
CREATE INDEX idx_report_runs_status ON public.report_runs(organization_id, status);
CREATE INDEX idx_report_runs_triggered ON public.report_runs(triggered_by);
CREATE INDEX idx_report_runs_expires ON public.report_runs(expires_at) WHERE status = 'completed';

-- ===================== TRIGGERS =====================

-- Timestamp automático
CREATE TRIGGER update_dashboards_updated_at
  BEFORE UPDATE ON public.dashboards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dashboard_widgets_updated_at
  BEFORE UPDATE ON public.dashboard_widgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_report_definitions_updated_at
  BEFORE UPDATE ON public.report_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar estatísticas do relatório ao completar uma execução
CREATE OR REPLACE FUNCTION public.update_report_run_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE public.report_definitions
    SET 
      run_count = run_count + 1,
      last_run_at = NEW.completed_at,
      avg_run_duration_ms = CASE 
        WHEN avg_run_duration_ms IS NULL THEN NEW.duration_ms
        ELSE (avg_run_duration_ms + NEW.duration_ms) / 2
      END,
      updated_at = now()
    WHERE id = NEW.report_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_report_run_stats
  AFTER UPDATE ON public.report_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_report_run_stats();

-- Trigger para incrementar view_count de dashboards
CREATE OR REPLACE FUNCTION public.increment_dashboard_views()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.last_viewed_at IS DISTINCT FROM OLD.last_viewed_at THEN
    NEW.view_count := OLD.view_count + 1;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_increment_dashboard_views
  BEFORE UPDATE ON public.dashboards
  FOR EACH ROW EXECUTE FUNCTION public.increment_dashboard_views();

-- ===================== RPC =====================

-- Gerar número de relatório
CREATE OR REPLACE FUNCTION public.generate_report_number(org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
  v_year TEXT;
BEGIN
  v_year := to_char(now(), 'YYYY');
  SELECT COUNT(*) + 1 INTO v_count
  FROM public.report_runs
  WHERE organization_id = org_id AND created_at >= date_trunc('year', now());
  RETURN 'RPT-' || v_year || '-' || lpad(v_count::text, 6, '0');
END;
$$;

-- Clonar dashboard
CREATE OR REPLACE FUNCTION public.clone_dashboard(
  p_dashboard_id UUID,
  p_new_name TEXT DEFAULT NULL,
  p_new_owner UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_new_dashboard_id UUID;
  v_dashboard RECORD;
BEGIN
  SELECT * INTO v_dashboard FROM public.dashboards WHERE id = p_dashboard_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dashboard não encontrado';
  END IF;
  
  INSERT INTO public.dashboards (
    organization_id, created_by, name, description, module, visibility,
    layout_config, theme_config, global_filters, default_date_range,
    auto_refresh_seconds, is_default, tags
  )
  VALUES (
    v_dashboard.organization_id,
    COALESCE(p_new_owner, v_dashboard.created_by),
    COALESCE(p_new_name, v_dashboard.name || ' (Cópia)'),
    v_dashboard.description,
    v_dashboard.module,
    'private',
    v_dashboard.layout_config,
    v_dashboard.theme_config,
    v_dashboard.global_filters,
    v_dashboard.default_date_range,
    v_dashboard.auto_refresh_seconds,
    false,
    v_dashboard.tags
  )
  RETURNING id INTO v_new_dashboard_id;
  
  -- Clonar widgets
  INSERT INTO public.dashboard_widgets (
    dashboard_id, organization_id, name, description, widget_type,
    position_x, position_y, width, height, min_width, min_height,
    data_source, query_config, chart_config, filters, date_range,
    aggregation_period, drill_down_config, click_action, click_target,
    cache_ttl_seconds, is_visible, display_order
  )
  SELECT
    v_new_dashboard_id, organization_id, name, description, widget_type,
    position_x, position_y, width, height, min_width, min_height,
    data_source, query_config, chart_config, filters, date_range,
    aggregation_period, drill_down_config, click_action, click_target,
    cache_ttl_seconds, is_visible, display_order
  FROM public.dashboard_widgets
  WHERE dashboard_id = p_dashboard_id;
  
  RETURN v_new_dashboard_id;
END;
$$;

-- ===================== RLS =====================

ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_runs ENABLE ROW LEVEL SECURITY;

-- Dashboards
CREATE POLICY "Users can view org dashboards"
  ON public.dashboards FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create dashboards"
  ON public.dashboards FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own or org dashboards"
  ON public.dashboards FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
    AND (
      created_by = auth.uid()
      OR visibility IN ('team', 'organization', 'public')
    )
  );

CREATE POLICY "Users can delete own dashboards"
  ON public.dashboards FOR DELETE
  USING (
    created_by = auth.uid()
    AND is_system = false
  );

-- Dashboard Widgets
CREATE POLICY "Users can view org widgets"
  ON public.dashboard_widgets FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage widgets in their dashboards"
  ON public.dashboard_widgets FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update org widgets"
  ON public.dashboard_widgets FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete org widgets"
  ON public.dashboard_widgets FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Report Definitions
CREATE POLICY "Users can view org reports"
  ON public.report_definitions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create reports"
  ON public.report_definitions FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own reports"
  ON public.report_definitions FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
    AND (created_by = auth.uid() OR is_system = false)
  );

CREATE POLICY "Users can delete own reports"
  ON public.report_definitions FOR DELETE
  USING (
    created_by = auth.uid()
    AND is_system = false
  );

-- Report Runs
CREATE POLICY "Users can view org report runs"
  ON public.report_runs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create report runs"
  ON public.report_runs FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own report runs"
  ON public.report_runs FOR UPDATE
  USING (
    triggered_by = auth.uid()
  );
