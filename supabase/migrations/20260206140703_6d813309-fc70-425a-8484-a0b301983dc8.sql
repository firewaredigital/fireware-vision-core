
-- =====================================================
-- FASE 4: AI AGENTS (Agent Studio) — Migration Completa
-- 6 Enums + 12 Tabelas + Índices + RLS + Triggers + Seed
-- =====================================================

-- ===== ENUMS =====

CREATE TYPE public.ai_agent_type AS ENUM (
  'sales', 'service', 'marketing', 'commerce', 'itsm', 'data_steward', 'compliance', 'custom'
);

CREATE TYPE public.ai_agent_status AS ENUM (
  'draft', 'testing', 'active', 'paused', 'deprecated'
);

CREATE TYPE public.ai_tool_type AS ENUM (
  'http_request', 'database_query', 'rpc_call', 'connector_action', 'workflow_trigger'
);

CREATE TYPE public.ai_policy_type AS ENUM (
  'pii_protection', 'rate_limit', 'action_restriction', 'content_filter', 'approval_required'
);

CREATE TYPE public.ai_run_status AS ENUM (
  'pending', 'running', 'waiting_approval', 'completed', 'failed', 'cancelled'
);

CREATE TYPE public.ai_risk_level AS ENUM (
  'low', 'medium', 'high', 'critical'
);

-- ===== TABELA 1: ai_agents =====
CREATE TABLE public.ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  agent_type public.ai_agent_type NOT NULL DEFAULT 'custom',
  scope TEXT, -- módulos que o agente pode acessar (csv ou jsonb key)
  system_prompt TEXT,
  model_config JSONB NOT NULL DEFAULT '{"model": "google/gemini-3-flash-preview", "temperature": 0.7, "max_tokens": 4096}'::jsonb,
  version INT NOT NULL DEFAULT 1,
  status public.ai_agent_status NOT NULL DEFAULT 'draft',
  is_native BOOLEAN NOT NULL DEFAULT false,
  icon TEXT,
  max_turns INT DEFAULT 10,
  timeout_seconds INT DEFAULT 120,
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_agents_select" ON public.ai_agents FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "ai_agents_insert" ON public.ai_agents FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "ai_agents_update" ON public.ai_agents FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "ai_agents_delete" ON public.ai_agents FOR DELETE
  USING (public.user_has_role(auth.uid(), 'admin'));

CREATE INDEX idx_ai_agents_org_status ON public.ai_agents(organization_id, status);
CREATE INDEX idx_ai_agents_type ON public.ai_agents(agent_type);
CREATE INDEX idx_ai_agents_created ON public.ai_agents(created_at DESC);

CREATE TRIGGER update_ai_agents_updated_at
  BEFORE UPDATE ON public.ai_agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== TABELA 2: ai_agent_versions =====
CREATE TABLE public.ai_agent_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  config_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  changelog TEXT,
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agent_id, version_number)
);

ALTER TABLE public.ai_agent_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_agent_versions_select" ON public.ai_agent_versions FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "ai_agent_versions_insert" ON public.ai_agent_versions FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "ai_agent_versions_update" ON public.ai_agent_versions FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "ai_agent_versions_delete" ON public.ai_agent_versions FOR DELETE
  USING (public.user_has_role(auth.uid(), 'admin'));

CREATE INDEX idx_ai_agent_versions_agent ON public.ai_agent_versions(agent_id, version_number DESC);

-- ===== TABELA 3: ai_tools =====
CREATE TABLE public.ai_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  tool_type public.ai_tool_type NOT NULL DEFAULT 'rpc_call',
  parameters_schema JSONB NOT NULL DEFAULT '{"type": "object", "properties": {}}'::jsonb,
  action_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  risk_level public.ai_risk_level NOT NULL DEFAULT 'low',
  is_system BOOLEAN NOT NULL DEFAULT false,
  category TEXT,
  icon TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_tools_select" ON public.ai_tools FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "ai_tools_insert" ON public.ai_tools FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "ai_tools_update" ON public.ai_tools FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "ai_tools_delete" ON public.ai_tools FOR DELETE
  USING (public.user_has_role(auth.uid(), 'admin'));

CREATE INDEX idx_ai_tools_org ON public.ai_tools(organization_id);
CREATE INDEX idx_ai_tools_type ON public.ai_tools(tool_type);
CREATE INDEX idx_ai_tools_risk ON public.ai_tools(risk_level);

CREATE TRIGGER update_ai_tools_updated_at
  BEFORE UPDATE ON public.ai_tools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== TABELA 4: ai_tool_permissions =====
CREATE TABLE public.ai_tool_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID NOT NULL REFERENCES public.ai_tools(id) ON DELETE CASCADE,
  permission_set_id UUID NOT NULL REFERENCES public.permission_sets(id) ON DELETE CASCADE,
  can_execute BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tool_id, permission_set_id)
);

ALTER TABLE public.ai_tool_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_tool_permissions_select" ON public.ai_tool_permissions FOR SELECT
  USING (
    tool_id IN (
      SELECT id FROM public.ai_tools
      WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "ai_tool_permissions_insert" ON public.ai_tool_permissions FOR INSERT
  WITH CHECK (
    tool_id IN (
      SELECT id FROM public.ai_tools
      WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "ai_tool_permissions_update" ON public.ai_tool_permissions FOR UPDATE
  USING (
    tool_id IN (
      SELECT id FROM public.ai_tools
      WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "ai_tool_permissions_delete" ON public.ai_tool_permissions FOR DELETE
  USING (public.user_has_role(auth.uid(), 'admin'));

-- ===== TABELA 5: ai_agent_tools (M:N) =====
CREATE TABLE public.ai_agent_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES public.ai_tools(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  custom_config JSONB,
  execution_order INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agent_id, tool_id)
);

ALTER TABLE public.ai_agent_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_agent_tools_select" ON public.ai_agent_tools FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM public.ai_agents
      WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "ai_agent_tools_insert" ON public.ai_agent_tools FOR INSERT
  WITH CHECK (
    agent_id IN (
      SELECT id FROM public.ai_agents
      WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "ai_agent_tools_update" ON public.ai_agent_tools FOR UPDATE
  USING (
    agent_id IN (
      SELECT id FROM public.ai_agents
      WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "ai_agent_tools_delete" ON public.ai_agent_tools FOR DELETE
  USING (public.user_has_role(auth.uid(), 'admin'));

CREATE INDEX idx_ai_agent_tools_agent ON public.ai_agent_tools(agent_id);

-- ===== TABELA 6: ai_policies =====
CREATE TABLE public.ai_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  policy_type public.ai_policy_type NOT NULL,
  rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  actions_on_violation TEXT NOT NULL DEFAULT 'block',
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INT NOT NULL DEFAULT 100,
  scope TEXT, -- módulos afetados
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_policies_select" ON public.ai_policies FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "ai_policies_insert" ON public.ai_policies FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "ai_policies_update" ON public.ai_policies FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "ai_policies_delete" ON public.ai_policies FOR DELETE
  USING (public.user_has_role(auth.uid(), 'admin'));

CREATE INDEX idx_ai_policies_org ON public.ai_policies(organization_id, is_active);
CREATE INDEX idx_ai_policies_type ON public.ai_policies(policy_type);

CREATE TRIGGER update_ai_policies_updated_at
  BEFORE UPDATE ON public.ai_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== TABELA 7: ai_agent_policies (M:N) =====
CREATE TABLE public.ai_agent_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES public.ai_policies(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  override_config JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agent_id, policy_id)
);

ALTER TABLE public.ai_agent_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_agent_policies_select" ON public.ai_agent_policies FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM public.ai_agents
      WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "ai_agent_policies_insert" ON public.ai_agent_policies FOR INSERT
  WITH CHECK (
    agent_id IN (
      SELECT id FROM public.ai_agents
      WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "ai_agent_policies_update" ON public.ai_agent_policies FOR UPDATE
  USING (
    agent_id IN (
      SELECT id FROM public.ai_agents
      WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "ai_agent_policies_delete" ON public.ai_agent_policies FOR DELETE
  USING (public.user_has_role(auth.uid(), 'admin'));

CREATE INDEX idx_ai_agent_policies_agent ON public.ai_agent_policies(agent_id);

-- ===== TABELA 8: ai_evals =====
CREATE TABLE public.ai_evals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  test_cases JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_run_at TIMESTAMPTZ,
  last_run_results JSONB,
  pass_rate NUMERIC(5,2),
  total_runs INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_evals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_evals_select" ON public.ai_evals FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "ai_evals_insert" ON public.ai_evals FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "ai_evals_update" ON public.ai_evals FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "ai_evals_delete" ON public.ai_evals FOR DELETE
  USING (public.user_has_role(auth.uid(), 'admin'));

CREATE INDEX idx_ai_evals_agent ON public.ai_evals(agent_id);

CREATE TRIGGER update_ai_evals_updated_at
  BEFORE UPDATE ON public.ai_evals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== TABELA 9: ai_runs =====
CREATE TABLE public.ai_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  triggered_by UUID REFERENCES public.profiles(id),
  trigger_type TEXT NOT NULL DEFAULT 'user_request',
  input_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_result JSONB,
  status public.ai_run_status NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  total_tokens_used INT DEFAULT 0,
  prompt_tokens INT DEFAULT 0,
  completion_tokens INT DEFAULT 0,
  cost_estimate NUMERIC(10,6) DEFAULT 0,
  error_message TEXT,
  model_used TEXT,
  total_steps INT DEFAULT 0,
  approval_request_id UUID,
  parent_run_id UUID REFERENCES public.ai_runs(id),
  correlation_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_runs_select" ON public.ai_runs FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "ai_runs_insert" ON public.ai_runs FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "ai_runs_update" ON public.ai_runs FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Runs NÃO podem ser deletados (auditoria imutável)
CREATE POLICY "ai_runs_delete" ON public.ai_runs FOR DELETE
  USING (false);

CREATE INDEX idx_ai_runs_org_agent ON public.ai_runs(organization_id, agent_id, created_at DESC);
CREATE INDEX idx_ai_runs_status ON public.ai_runs(status);
CREATE INDEX idx_ai_runs_triggered_by ON public.ai_runs(triggered_by, created_at DESC);
CREATE INDEX idx_ai_runs_correlation ON public.ai_runs(correlation_id) WHERE correlation_id IS NOT NULL;

-- ===== TABELA 10: ai_run_steps =====
CREATE TABLE public.ai_run_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.ai_runs(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  step_type TEXT NOT NULL, -- 'reasoning', 'tool_call', 'response', 'approval_wait'
  tool_id UUID REFERENCES public.ai_tools(id),
  tool_name TEXT,
  input_data JSONB,
  output_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INT,
  error_message TEXT,
  tokens_used INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_run_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_run_steps_select" ON public.ai_run_steps FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "ai_run_steps_insert" ON public.ai_run_steps FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "ai_run_steps_update" ON public.ai_run_steps FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Steps NÃO podem ser deletados (auditoria imutável)
CREATE POLICY "ai_run_steps_delete" ON public.ai_run_steps FOR DELETE
  USING (false);

CREATE INDEX idx_ai_run_steps_run ON public.ai_run_steps(run_id, step_order);
CREATE INDEX idx_ai_run_steps_tool ON public.ai_run_steps(tool_id) WHERE tool_id IS NOT NULL;

-- ===== TABELA 11: ai_run_audit_receipts =====
CREATE TABLE public.ai_run_audit_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.ai_runs(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  step_id UUID REFERENCES public.ai_run_steps(id),
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  affected_entity_type TEXT,
  affected_entity_id TEXT,
  data_accessed JSONB, -- campos acessados com PII mascarado
  data_modified JSONB, -- campos alterados (old/new)
  tool_used TEXT,
  risk_level public.ai_risk_level DEFAULT 'low',
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES public.profiles(id),
  approval_timestamp TIMESTAMPTZ,
  approval_status TEXT, -- 'pending', 'approved', 'rejected'
  rejection_reason TEXT,
  evidence_attachments JSONB,
  pii_detected BOOLEAN DEFAULT false,
  pii_fields_masked TEXT[],
  execution_context JSONB, -- informações do contexto de execução
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_run_audit_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_run_audit_receipts_select" ON public.ai_run_audit_receipts FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "ai_run_audit_receipts_insert" ON public.ai_run_audit_receipts FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "ai_run_audit_receipts_update" ON public.ai_run_audit_receipts FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Receipts NÃO podem ser deletados (auditoria imutável)
CREATE POLICY "ai_run_audit_receipts_delete" ON public.ai_run_audit_receipts FOR DELETE
  USING (false);

CREATE INDEX idx_ai_run_audit_receipts_run ON public.ai_run_audit_receipts(run_id, created_at DESC);
CREATE INDEX idx_ai_run_audit_receipts_org ON public.ai_run_audit_receipts(organization_id, created_at DESC);
CREATE INDEX idx_ai_run_audit_receipts_entity ON public.ai_run_audit_receipts(affected_entity_type, affected_entity_id) WHERE affected_entity_id IS NOT NULL;
CREATE INDEX idx_ai_run_audit_receipts_approval ON public.ai_run_audit_receipts(approval_status) WHERE requires_approval = true;

-- ===== TABELA 12: ai_conversations =====
CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  message_count INT NOT NULL DEFAULT 0,
  total_tokens_used INT DEFAULT 0,
  last_run_id UUID REFERENCES public.ai_runs(id),
  pinned BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- Usuários só veem suas próprias conversas com agentes
CREATE POLICY "ai_conversations_select" ON public.ai_conversations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "ai_conversations_insert" ON public.ai_conversations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "ai_conversations_update" ON public.ai_conversations FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "ai_conversations_delete" ON public.ai_conversations FOR DELETE
  USING (user_id = auth.uid());

-- Admins podem ver todas as conversas da org (para auditoria)
CREATE POLICY "ai_conversations_admin_select" ON public.ai_conversations FOR SELECT
  USING (
    public.user_has_role(auth.uid(), 'admin') AND
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE INDEX idx_ai_conversations_user ON public.ai_conversations(user_id, created_at DESC);
CREATE INDEX idx_ai_conversations_agent ON public.ai_conversations(agent_id);
CREATE INDEX idx_ai_conversations_org ON public.ai_conversations(organization_id, created_at DESC);

CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== RPCs DE SUPORTE =====

-- RPC: Registrar execução de agente com auditoria automática
CREATE OR REPLACE FUNCTION public.create_ai_run(
  _org_id UUID,
  _agent_id UUID,
  _trigger_type TEXT DEFAULT 'user_request',
  _input_context JSONB DEFAULT '{}'::jsonb,
  _correlation_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _run_id UUID;
  _agent RECORD;
BEGIN
  -- Verificar se o agente existe e está ativo
  SELECT * INTO _agent FROM public.ai_agents
  WHERE id = _agent_id AND organization_id = _org_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Agente não encontrado';
  END IF;
  
  IF _agent.status NOT IN ('active', 'testing') THEN
    RAISE EXCEPTION 'Agente não está ativo para execução';
  END IF;
  
  -- Criar o run
  INSERT INTO public.ai_runs (
    organization_id, agent_id, triggered_by, trigger_type,
    input_context, status, started_at, model_used, correlation_id
  ) VALUES (
    _org_id, _agent_id, auth.uid(), _trigger_type,
    _input_context, 'running', now(),
    _agent.model_config->>'model', _correlation_id
  )
  RETURNING id INTO _run_id;
  
  -- Atualizar uso do módulo ai_agents
  PERFORM public.update_module_usage(_org_id, 'ai_agents', 'total_runs');
  
  RETURN _run_id;
END;
$$;

-- RPC: Completar execução de agente
CREATE OR REPLACE FUNCTION public.complete_ai_run(
  _run_id UUID,
  _output_result JSONB,
  _total_tokens INT DEFAULT 0,
  _prompt_tokens INT DEFAULT 0,
  _completion_tokens INT DEFAULT 0,
  _status public.ai_run_status DEFAULT 'completed',
  _error_message TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.ai_runs
  SET
    output_result = _output_result,
    status = _status,
    completed_at = now(),
    total_tokens_used = _total_tokens,
    prompt_tokens = _prompt_tokens,
    completion_tokens = _completion_tokens,
    error_message = _error_message
  WHERE id = _run_id;
END;
$$;

-- RPC: Registrar step de execução
CREATE OR REPLACE FUNCTION public.add_ai_run_step(
  _run_id UUID,
  _org_id UUID,
  _step_order INT,
  _step_type TEXT,
  _tool_id UUID DEFAULT NULL,
  _tool_name TEXT DEFAULT NULL,
  _input_data JSONB DEFAULT NULL,
  _output_data JSONB DEFAULT NULL,
  _status TEXT DEFAULT 'completed',
  _duration_ms INT DEFAULT NULL,
  _tokens_used INT DEFAULT 0,
  _error_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _step_id UUID;
BEGIN
  INSERT INTO public.ai_run_steps (
    run_id, organization_id, step_order, step_type,
    tool_id, tool_name, input_data, output_data,
    status, started_at, completed_at, duration_ms,
    tokens_used, error_message
  ) VALUES (
    _run_id, _org_id, _step_order, _step_type,
    _tool_id, _tool_name, _input_data, _output_data,
    _status, now() - make_interval(secs => COALESCE(_duration_ms, 0)::float / 1000), now(),
    _duration_ms, _tokens_used, _error_message
  )
  RETURNING id INTO _step_id;
  
  -- Atualizar total_steps no run
  UPDATE public.ai_runs
  SET total_steps = total_steps + 1
  WHERE id = _run_id;
  
  RETURN _step_id;
END;
$$;

-- RPC: Criar comprovante de auditoria de execução IA
CREATE OR REPLACE FUNCTION public.create_ai_audit_receipt(
  _run_id UUID,
  _org_id UUID,
  _step_id UUID DEFAULT NULL,
  _action_type TEXT DEFAULT 'data_read',
  _action_description TEXT DEFAULT '',
  _affected_entity_type TEXT DEFAULT NULL,
  _affected_entity_id TEXT DEFAULT NULL,
  _data_accessed JSONB DEFAULT NULL,
  _data_modified JSONB DEFAULT NULL,
  _tool_used TEXT DEFAULT NULL,
  _risk_level public.ai_risk_level DEFAULT 'low',
  _requires_approval BOOLEAN DEFAULT false,
  _pii_detected BOOLEAN DEFAULT false,
  _pii_fields_masked TEXT[] DEFAULT NULL,
  _execution_context JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _receipt_id UUID;
BEGIN
  INSERT INTO public.ai_run_audit_receipts (
    run_id, organization_id, step_id, action_type, action_description,
    affected_entity_type, affected_entity_id, data_accessed, data_modified,
    tool_used, risk_level, requires_approval, pii_detected, pii_fields_masked,
    execution_context,
    approval_status
  ) VALUES (
    _run_id, _org_id, _step_id, _action_type, _action_description,
    _affected_entity_type, _affected_entity_id, _data_accessed, _data_modified,
    _tool_used, _risk_level, _requires_approval, _pii_detected, _pii_fields_masked,
    _execution_context,
    CASE WHEN _requires_approval THEN 'pending' ELSE NULL END
  )
  RETURNING id INTO _receipt_id;
  
  -- Se requer aprovação, criar um approval_request
  IF _requires_approval THEN
    INSERT INTO public.approval_requests (
      organization_id, approval_type, entity_type, entity_id,
      title, description, requested_by, metadata, status
    ) VALUES (
      _org_id, 'ai_action', 'ai_run_audit_receipt', _receipt_id::text,
      'Aprovação de ação IA: ' || _action_type,
      _action_description,
      auth.uid(),
      jsonb_build_object(
        'run_id', _run_id, 'step_id', _step_id,
        'tool_used', _tool_used, 'risk_level', _risk_level
      ),
      'pending'
    );
    
    -- Pausar o run para aguardar aprovação
    UPDATE public.ai_runs
    SET status = 'waiting_approval'
    WHERE id = _run_id;
  END IF;
  
  -- Também registrar no audit_logs geral
  INSERT INTO public.audit_logs (
    organization_id, action, entity_type, entity_id,
    user_id, metadata
  ) VALUES (
    _org_id, 'ai_agent_action', _affected_entity_type, _affected_entity_id,
    auth.uid(),
    jsonb_build_object(
      'run_id', _run_id, 'action_type', _action_type,
      'tool_used', _tool_used, 'risk_level', _risk_level,
      'pii_detected', _pii_detected, 'receipt_id', _receipt_id
    )
  );
  
  RETURN _receipt_id;
END;
$$;

-- RPC: Obter métricas de uso de IA por organização
CREATE OR REPLACE FUNCTION public.get_ai_usage_metrics(_org_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_agents', (SELECT COUNT(*) FROM public.ai_agents WHERE organization_id = _org_id),
    'active_agents', (SELECT COUNT(*) FROM public.ai_agents WHERE organization_id = _org_id AND status = 'active'),
    'total_runs_today', (SELECT COUNT(*) FROM public.ai_runs WHERE organization_id = _org_id AND created_at >= CURRENT_DATE),
    'total_runs_month', (SELECT COUNT(*) FROM public.ai_runs WHERE organization_id = _org_id AND created_at >= date_trunc('month', CURRENT_DATE)),
    'total_tokens_today', (SELECT COALESCE(SUM(total_tokens_used), 0) FROM public.ai_runs WHERE organization_id = _org_id AND created_at >= CURRENT_DATE),
    'total_tokens_month', (SELECT COALESCE(SUM(total_tokens_used), 0) FROM public.ai_runs WHERE organization_id = _org_id AND created_at >= date_trunc('month', CURRENT_DATE)),
    'success_rate', (
      SELECT CASE
        WHEN COUNT(*) > 0 THEN ROUND(COUNT(*) FILTER (WHERE status = 'completed')::numeric / COUNT(*) * 100, 1)
        ELSE 0
      END
      FROM public.ai_runs WHERE organization_id = _org_id AND created_at >= date_trunc('month', CURRENT_DATE)
    ),
    'pending_approvals', (SELECT COUNT(*) FROM public.ai_run_audit_receipts WHERE organization_id = _org_id AND approval_status = 'pending'),
    'tools_count', (SELECT COUNT(*) FROM public.ai_tools WHERE organization_id = _org_id),
    'policies_count', (SELECT COUNT(*) FROM public.ai_policies WHERE organization_id = _org_id AND is_active = true),
    'avg_response_time_ms', (
      SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000)::int, 0)
      FROM public.ai_runs
      WHERE organization_id = _org_id AND status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '7 days'
    )
  ) INTO _result;
  
  RETURN _result;
END;
$$;

-- ===== ENABLE REALTIME para ai_runs (monitoring) =====
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_runs;
