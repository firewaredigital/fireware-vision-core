-- =====================================================
-- FASE 1: CORE PLATFORM - Fundação Modular
-- Feature Flags, Permission Sets, Observabilidade
-- =====================================================

-- ===================
-- NOVOS ENUMS
-- ===================

-- Enum para chaves de módulos do sistema
CREATE TYPE public.module_key AS ENUM (
  'sales',
  'service', 
  'contact_center',
  'marketing',
  'commerce',
  'billing',
  'cpq',
  'itsm',
  'data_hub',
  'automations',
  'integrations',
  'ai_agents',
  'analytics',
  'portals',
  'governance'
);

-- Enum para tiers de plano
CREATE TYPE public.plan_tier AS ENUM (
  'free',
  'starter',
  'professional',
  'enterprise'
);

-- Enum para severidade de eventos do sistema
CREATE TYPE public.event_severity AS ENUM (
  'info',
  'warning',
  'error',
  'critical'
);

-- Enum para status de execução de integração
CREATE TYPE public.integration_run_status AS ENUM (
  'pending',
  'running',
  'completed',
  'failed',
  'retrying'
);

-- ===================
-- TABELA: org_modules (Feature Flags / Licenciamento)
-- ===================
CREATE TABLE public.org_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  module_key public.module_key NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  plan_tier public.plan_tier NOT NULL DEFAULT 'free',
  starts_at timestamptz,
  ends_at timestamptz,
  limits_json jsonb DEFAULT '{}'::jsonb,
  usage_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id),
  updated_by uuid REFERENCES public.profiles(id),
  UNIQUE(organization_id, module_key)
);

-- Índices para org_modules
CREATE INDEX idx_org_modules_org_id ON public.org_modules(organization_id);
CREATE INDEX idx_org_modules_module_key ON public.org_modules(module_key);
CREATE INDEX idx_org_modules_enabled ON public.org_modules(organization_id, enabled);

-- RLS para org_modules
ALTER TABLE public.org_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_modules_select_own_org"
ON public.org_modules FOR SELECT
TO authenticated
USING (public.is_member_of_org(organization_id));

CREATE POLICY "org_modules_insert_admin"
ON public.org_modules FOR INSERT
TO authenticated
WITH CHECK (
  public.is_member_of_org(organization_id) 
  AND public.user_has_role(auth.uid(), 'admin')
);

CREATE POLICY "org_modules_update_admin"
ON public.org_modules FOR UPDATE
TO authenticated
USING (
  public.is_member_of_org(organization_id) 
  AND public.user_has_role(auth.uid(), 'admin')
);

CREATE POLICY "org_modules_delete_admin"
ON public.org_modules FOR DELETE
TO authenticated
USING (
  public.is_member_of_org(organization_id) 
  AND public.user_has_role(auth.uid(), 'admin')
);

-- Trigger para updated_at
CREATE TRIGGER update_org_modules_updated_at
BEFORE UPDATE ON public.org_modules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===================
-- TABELA: permission_sets
-- ===================
CREATE TABLE public.permission_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  conditions jsonb DEFAULT '{}'::jsonb,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id),
  updated_by uuid REFERENCES public.profiles(id),
  UNIQUE(organization_id, name)
);

-- Índices para permission_sets
CREATE INDEX idx_permission_sets_org_id ON public.permission_sets(organization_id);
CREATE INDEX idx_permission_sets_name ON public.permission_sets(organization_id, name);

-- RLS para permission_sets
ALTER TABLE public.permission_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "permission_sets_select_own_org"
ON public.permission_sets FOR SELECT
TO authenticated
USING (public.is_member_of_org(organization_id));

CREATE POLICY "permission_sets_insert_admin"
ON public.permission_sets FOR INSERT
TO authenticated
WITH CHECK (
  public.is_member_of_org(organization_id) 
  AND public.user_has_role(auth.uid(), 'admin')
);

CREATE POLICY "permission_sets_update_admin"
ON public.permission_sets FOR UPDATE
TO authenticated
USING (
  public.is_member_of_org(organization_id) 
  AND public.user_has_role(auth.uid(), 'admin')
  AND is_system = false
);

CREATE POLICY "permission_sets_delete_admin"
ON public.permission_sets FOR DELETE
TO authenticated
USING (
  public.is_member_of_org(organization_id) 
  AND public.user_has_role(auth.uid(), 'admin')
  AND is_system = false
);

-- Trigger para updated_at
CREATE TRIGGER update_permission_sets_updated_at
BEFORE UPDATE ON public.permission_sets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===================
-- TABELA: permission_set_assignments
-- ===================
CREATE TABLE public.permission_set_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  permission_set_id uuid NOT NULL REFERENCES public.permission_sets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  granted_by uuid REFERENCES public.profiles(id),
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(permission_set_id, user_id)
);

-- Índices para permission_set_assignments
CREATE INDEX idx_psa_org_id ON public.permission_set_assignments(organization_id);
CREATE INDEX idx_psa_user_id ON public.permission_set_assignments(user_id);
CREATE INDEX idx_psa_permission_set_id ON public.permission_set_assignments(permission_set_id);
CREATE INDEX idx_psa_expires_at ON public.permission_set_assignments(expires_at) WHERE expires_at IS NOT NULL;

-- RLS para permission_set_assignments
ALTER TABLE public.permission_set_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "psa_select_own_org"
ON public.permission_set_assignments FOR SELECT
TO authenticated
USING (public.is_member_of_org(organization_id));

CREATE POLICY "psa_insert_admin"
ON public.permission_set_assignments FOR INSERT
TO authenticated
WITH CHECK (
  public.is_member_of_org(organization_id) 
  AND public.user_has_role(auth.uid(), 'admin')
);

CREATE POLICY "psa_delete_admin"
ON public.permission_set_assignments FOR DELETE
TO authenticated
USING (
  public.is_member_of_org(organization_id) 
  AND public.user_has_role(auth.uid(), 'admin')
);

-- ===================
-- TABELA: system_metrics (Observabilidade)
-- ===================
CREATE TABLE public.system_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  metric_type text NOT NULL,
  metric_value numeric NOT NULL,
  dimensions jsonb DEFAULT '{}'::jsonb,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para system_metrics
CREATE INDEX idx_system_metrics_org_id ON public.system_metrics(organization_id);
CREATE INDEX idx_system_metrics_type ON public.system_metrics(metric_type);
CREATE INDEX idx_system_metrics_recorded_at ON public.system_metrics(recorded_at DESC);
CREATE INDEX idx_system_metrics_org_type_time ON public.system_metrics(organization_id, metric_type, recorded_at DESC);

-- RLS para system_metrics
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_metrics_select_admin"
ON public.system_metrics FOR SELECT
TO authenticated
USING (
  public.is_member_of_org(organization_id) 
  AND public.user_has_role(auth.uid(), 'admin')
);

CREATE POLICY "system_metrics_insert_system"
ON public.system_metrics FOR INSERT
TO authenticated
WITH CHECK (public.is_member_of_org(organization_id));

-- ===================
-- TABELA: system_events (Observabilidade)
-- ===================
CREATE TABLE public.system_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  severity public.event_severity NOT NULL DEFAULT 'info',
  message text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  source_module public.module_key,
  source_entity_type text,
  source_entity_id uuid,
  user_id uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para system_events
CREATE INDEX idx_system_events_org_id ON public.system_events(organization_id);
CREATE INDEX idx_system_events_severity ON public.system_events(severity);
CREATE INDEX idx_system_events_type ON public.system_events(event_type);
CREATE INDEX idx_system_events_created_at ON public.system_events(created_at DESC);
CREATE INDEX idx_system_events_org_severity_time ON public.system_events(organization_id, severity, created_at DESC);

-- RLS para system_events
ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_events_select_admin_manager"
ON public.system_events FOR SELECT
TO authenticated
USING (
  public.is_member_of_org(organization_id) 
  AND (public.user_has_role(auth.uid(), 'admin') OR public.user_has_role(auth.uid(), 'manager'))
);

CREATE POLICY "system_events_insert_system"
ON public.system_events FOR INSERT
TO authenticated
WITH CHECK (public.is_member_of_org(organization_id));

-- ===================
-- TABELA: integration_run_logs (Observabilidade)
-- ===================
CREATE TABLE public.integration_run_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  connector_name text NOT NULL,
  instance_name text,
  action_name text,
  status public.integration_run_status NOT NULL DEFAULT 'pending',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  duration_ms integer,
  request_payload jsonb,
  response_payload jsonb,
  error_code text,
  error_message text,
  retry_count integer DEFAULT 0,
  idempotency_key text,
  workflow_run_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id)
);

-- Índices para integration_run_logs
CREATE INDEX idx_integration_run_logs_org_id ON public.integration_run_logs(organization_id);
CREATE INDEX idx_integration_run_logs_status ON public.integration_run_logs(status);
CREATE INDEX idx_integration_run_logs_connector ON public.integration_run_logs(connector_name);
CREATE INDEX idx_integration_run_logs_started_at ON public.integration_run_logs(started_at DESC);
CREATE INDEX idx_integration_run_logs_org_connector_time ON public.integration_run_logs(organization_id, connector_name, started_at DESC);
CREATE INDEX idx_integration_run_logs_idempotency ON public.integration_run_logs(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- RLS para integration_run_logs
ALTER TABLE public.integration_run_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integration_run_logs_select_admin"
ON public.integration_run_logs FOR SELECT
TO authenticated
USING (
  public.is_member_of_org(organization_id) 
  AND (public.user_has_role(auth.uid(), 'admin') OR public.user_has_role(auth.uid(), 'manager'))
);

CREATE POLICY "integration_run_logs_insert_system"
ON public.integration_run_logs FOR INSERT
TO authenticated
WITH CHECK (public.is_member_of_org(organization_id));

-- ===================
-- FUNÇÕES RPC
-- ===================

-- Função para verificar se módulo está habilitado para a organização
CREATE OR REPLACE FUNCTION public.is_module_enabled(
  _org_id uuid,
  _module_key public.module_key
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_modules
    WHERE organization_id = _org_id
      AND module_key = _module_key
      AND enabled = true
      AND (starts_at IS NULL OR starts_at <= now())
      AND (ends_at IS NULL OR ends_at > now())
  )
$$;

-- Função para verificar se usuário tem uma permissão específica
CREATE OR REPLACE FUNCTION public.user_has_permission(
  _user_id uuid,
  _capability text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.permission_set_assignments psa
    JOIN public.permission_sets ps ON ps.id = psa.permission_set_id
    WHERE psa.user_id = _user_id
      AND (psa.expires_at IS NULL OR psa.expires_at > now())
      AND ps.permissions ? _capability
  )
$$;

-- Função para obter todas as permissões de um usuário
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    jsonb_agg(DISTINCT perm),
    '[]'::jsonb
  )
  FROM public.permission_set_assignments psa
  JOIN public.permission_sets ps ON ps.id = psa.permission_set_id
  CROSS JOIN LATERAL jsonb_array_elements_text(ps.permissions) AS perm
  WHERE psa.user_id = _user_id
    AND (psa.expires_at IS NULL OR psa.expires_at > now())
$$;

-- Função para obter módulos habilitados para uma organização
CREATE OR REPLACE FUNCTION public.get_org_enabled_modules(_org_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'module_key', module_key,
        'plan_tier', plan_tier,
        'limits', limits_json,
        'usage', usage_json
      )
    ),
    '[]'::jsonb
  )
  FROM public.org_modules
  WHERE organization_id = _org_id
    AND enabled = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at > now())
$$;

-- Função para registrar evento do sistema
CREATE OR REPLACE FUNCTION public.log_system_event(
  _org_id uuid,
  _event_type text,
  _severity public.event_severity,
  _message text,
  _metadata jsonb DEFAULT '{}'::jsonb,
  _source_module public.module_key DEFAULT NULL,
  _source_entity_type text DEFAULT NULL,
  _source_entity_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _event_id uuid;
BEGIN
  INSERT INTO public.system_events (
    organization_id, event_type, severity, message, metadata,
    source_module, source_entity_type, source_entity_id, user_id
  ) VALUES (
    _org_id, _event_type, _severity, _message, _metadata,
    _source_module, _source_entity_type, _source_entity_id, auth.uid()
  )
  RETURNING id INTO _event_id;
  
  RETURN _event_id;
END;
$$;

-- Função para registrar métrica do sistema
CREATE OR REPLACE FUNCTION public.record_system_metric(
  _org_id uuid,
  _metric_type text,
  _metric_value numeric,
  _dimensions jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _metric_id uuid;
BEGIN
  INSERT INTO public.system_metrics (
    organization_id, metric_type, metric_value, dimensions
  ) VALUES (
    _org_id, _metric_type, _metric_value, _dimensions
  )
  RETURNING id INTO _metric_id;
  
  RETURN _metric_id;
END;
$$;

-- Função para atualizar uso de módulo
CREATE OR REPLACE FUNCTION public.update_module_usage(
  _org_id uuid,
  _module_key public.module_key,
  _usage_key text,
  _increment integer DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.org_modules
  SET 
    usage_json = jsonb_set(
      COALESCE(usage_json, '{}'::jsonb),
      ARRAY[_usage_key],
      to_jsonb(COALESCE((usage_json->>_usage_key)::integer, 0) + _increment)
    ),
    updated_at = now()
  WHERE organization_id = _org_id
    AND module_key = _module_key;
END;
$$;

-- ===================
-- PERMISSION SETS PADRÃO DO SISTEMA
-- ===================

-- Nota: Estes serão inseridos via seed ou na primeira inicialização da organização
-- Exemplos de permission sets padrão:

COMMENT ON TABLE public.org_modules IS 'Controla quais módulos estão habilitados para cada organização (feature flags/licenciamento)';
COMMENT ON TABLE public.permission_sets IS 'Define conjuntos de permissões granulares que podem ser atribuídos a usuários';
COMMENT ON TABLE public.permission_set_assignments IS 'Vincula usuários a permission sets';
COMMENT ON TABLE public.system_metrics IS 'Armazena métricas do sistema para observabilidade';
COMMENT ON TABLE public.system_events IS 'Log de eventos do sistema para monitoramento e debugging';
COMMENT ON TABLE public.integration_run_logs IS 'Log de execuções de integrações e conectores';

COMMENT ON FUNCTION public.is_module_enabled IS 'Verifica se um módulo está habilitado para uma organização';
COMMENT ON FUNCTION public.user_has_permission IS 'Verifica se um usuário possui uma permissão específica (capability)';
COMMENT ON FUNCTION public.get_user_permissions IS 'Retorna todas as permissões de um usuário';
COMMENT ON FUNCTION public.get_org_enabled_modules IS 'Retorna lista de módulos habilitados para uma organização';
COMMENT ON FUNCTION public.log_system_event IS 'Registra um evento do sistema para observabilidade';
COMMENT ON FUNCTION public.record_system_metric IS 'Registra uma métrica do sistema';
COMMENT ON FUNCTION public.update_module_usage IS 'Atualiza contadores de uso de um módulo';