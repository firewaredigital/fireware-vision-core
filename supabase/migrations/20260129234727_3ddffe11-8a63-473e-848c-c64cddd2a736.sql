-- =====================================================
-- FASE 7: FIREWARE AUTOMATIONS - WORKFLOW ENGINE
-- =====================================================

-- Enum para tipos de trigger de workflow
CREATE TYPE public.workflow_trigger AS ENUM (
  'record_created',
  'record_updated', 
  'field_changed',
  'scheduled',
  'manual',
  'approval_completed',
  'sla_breach',
  'stage_changed',
  'score_changed'
);

-- Enum para tipos de step do workflow
CREATE TYPE public.workflow_step_type AS ENUM (
  'condition',
  'action',
  'delay',
  'parallel',
  'approval',
  'loop',
  'webhook',
  'notification',
  'field_update',
  'create_record',
  'send_email',
  'assign_owner',
  'add_tag',
  'create_task',
  'call_function'
);

-- Enum para status de execução
CREATE TYPE public.workflow_run_status AS ENUM (
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
  'paused',
  'waiting_approval'
);

-- Enum para status de step execution
CREATE TYPE public.step_execution_status AS ENUM (
  'pending',
  'running',
  'completed',
  'failed',
  'skipped',
  'waiting'
);

-- Tabela principal de Workflows
CREATE TABLE public.workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type public.workflow_trigger NOT NULL,
  trigger_entity TEXT NOT NULL,
  trigger_conditions JSONB DEFAULT '{}',
  trigger_fields TEXT[],
  schedule_config JSONB,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  version INTEGER NOT NULL DEFAULT 1,
  is_template BOOLEAN DEFAULT false,
  template_category TEXT,
  run_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  avg_execution_time_ms INTEGER,
  max_concurrent_runs INTEGER DEFAULT 10,
  timeout_minutes INTEGER DEFAULT 60,
  retry_on_failure BOOLEAN DEFAULT false,
  max_retries INTEGER DEFAULT 3,
  notify_on_failure BOOLEAN DEFAULT true,
  failure_notification_emails TEXT[],
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Steps do Workflow
CREATE TABLE public.workflow_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_key TEXT NOT NULL,
  type public.workflow_step_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  conditions JSONB DEFAULT '[]',
  next_step_on_success TEXT,
  next_step_on_failure TEXT,
  parallel_branches JSONB,
  loop_config JSONB,
  timeout_seconds INTEGER DEFAULT 300,
  retry_count INTEGER DEFAULT 0,
  retry_delay_seconds INTEGER DEFAULT 30,
  is_entry_point BOOLEAN DEFAULT false,
  is_exit_point BOOLEAN DEFAULT false,
  continue_on_error BOOLEAN DEFAULT false,
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workflow_id, step_key)
);

-- Tabela de Execuções de Workflow
CREATE TABLE public.workflow_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  trigger_record_id UUID,
  trigger_record_type TEXT,
  trigger_data JSONB DEFAULT '{}',
  status public.workflow_run_status NOT NULL DEFAULT 'pending',
  current_step_id UUID REFERENCES public.workflow_steps(id),
  current_step_key TEXT,
  context JSONB DEFAULT '{}',
  execution_path TEXT[] DEFAULT '{}',
  error_message TEXT,
  error_step_key TEXT,
  error_details JSONB,
  retry_count INTEGER DEFAULT 0,
  parent_run_id UUID REFERENCES public.workflow_runs(id),
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  triggered_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Execuções de Steps
CREATE TABLE public.workflow_step_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.workflow_runs(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.workflow_steps(id) ON DELETE CASCADE,
  step_key TEXT NOT NULL,
  status public.step_execution_status NOT NULL DEFAULT 'pending',
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  error_details JSONB,
  retry_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Templates de Workflow
CREATE TABLE public.workflow_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  icon TEXT,
  trigger_type public.workflow_trigger NOT NULL,
  trigger_entity TEXT NOT NULL,
  steps_config JSONB NOT NULL DEFAULT '[]',
  variables JSONB DEFAULT '[]',
  is_global BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  rating NUMERIC(3,2),
  tags TEXT[],
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Logs de Workflow
CREATE TABLE public.workflow_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.workflow_runs(id) ON DELETE CASCADE,
  step_execution_id UUID REFERENCES public.workflow_step_executions(id),
  level TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('debug', 'info', 'warn', 'error')),
  message TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Agendamentos de Workflow
CREATE TABLE public.workflow_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  cron_expression TEXT NOT NULL,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para Automations
CREATE INDEX idx_workflows_org ON public.workflows(organization_id);
CREATE INDEX idx_workflows_status ON public.workflows(status);
CREATE INDEX idx_workflows_trigger ON public.workflows(trigger_type, trigger_entity);
CREATE INDEX idx_workflow_steps_workflow ON public.workflow_steps(workflow_id);
CREATE INDEX idx_workflow_runs_workflow ON public.workflow_runs(workflow_id);
CREATE INDEX idx_workflow_runs_status ON public.workflow_runs(status);
CREATE INDEX idx_workflow_runs_org ON public.workflow_runs(organization_id);
CREATE INDEX idx_workflow_runs_trigger ON public.workflow_runs(trigger_record_id, trigger_record_type);
CREATE INDEX idx_workflow_step_executions_run ON public.workflow_step_executions(run_id);
CREATE INDEX idx_workflow_logs_run ON public.workflow_logs(run_id);
CREATE INDEX idx_workflow_schedules_next ON public.workflow_schedules(next_run_at) WHERE is_active = true;

-- Triggers para updated_at
CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON public.workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workflow_steps_updated_at
  BEFORE UPDATE ON public.workflow_steps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS para Workflows
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workflows in their org"
  ON public.workflows FOR SELECT
  USING (is_member_of_org(organization_id));

CREATE POLICY "Managers can create workflows"
  ON public.workflows FOR INSERT
  WITH CHECK (is_member_of_org(organization_id) AND (user_has_role(auth.uid(), 'manager') OR user_has_role(auth.uid(), 'admin')));

CREATE POLICY "Managers can update workflows"
  ON public.workflows FOR UPDATE
  USING (is_member_of_org(organization_id) AND (user_has_role(auth.uid(), 'manager') OR user_has_role(auth.uid(), 'admin')))
  WITH CHECK (is_member_of_org(organization_id));

CREATE POLICY "Admins can delete workflows"
  ON public.workflows FOR DELETE
  USING (is_member_of_org(organization_id) AND user_has_role(auth.uid(), 'admin'));

-- RLS para workflow_steps
ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage steps via workflow access"
  ON public.workflow_steps FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.workflows w 
    WHERE w.id = workflow_steps.workflow_id 
    AND is_member_of_org(w.organization_id)
  ));

-- RLS para workflow_runs
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view runs in their org"
  ON public.workflow_runs FOR SELECT
  USING (is_member_of_org(organization_id));

CREATE POLICY "System can create runs"
  ON public.workflow_runs FOR INSERT
  WITH CHECK (is_member_of_org(organization_id));

CREATE POLICY "System can update runs"
  ON public.workflow_runs FOR UPDATE
  USING (is_member_of_org(organization_id));

-- RLS para workflow_step_executions
ALTER TABLE public.workflow_step_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view step executions via run access"
  ON public.workflow_step_executions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.workflow_runs r 
    WHERE r.id = workflow_step_executions.run_id 
    AND is_member_of_org(r.organization_id)
  ));

-- RLS para workflow_templates
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view templates"
  ON public.workflow_templates FOR SELECT
  USING (is_global = true OR (organization_id IS NOT NULL AND is_member_of_org(organization_id)));

CREATE POLICY "Admins can manage org templates"
  ON public.workflow_templates FOR ALL
  USING (organization_id IS NOT NULL AND is_member_of_org(organization_id) AND user_has_role(auth.uid(), 'admin'))
  WITH CHECK (organization_id IS NOT NULL AND is_member_of_org(organization_id) AND user_has_role(auth.uid(), 'admin'));

-- RLS para workflow_logs
ALTER TABLE public.workflow_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view logs via run access"
  ON public.workflow_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.workflow_runs r 
    WHERE r.id = workflow_logs.run_id 
    AND is_member_of_org(r.organization_id)
  ));

CREATE POLICY "System can create logs"
  ON public.workflow_logs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workflow_runs r 
    WHERE r.id = workflow_logs.run_id 
    AND is_member_of_org(r.organization_id)
  ));

-- RLS para workflow_schedules
ALTER TABLE public.workflow_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage schedules in their org"
  ON public.workflow_schedules FOR ALL
  USING (is_member_of_org(organization_id))
  WITH CHECK (is_member_of_org(organization_id));