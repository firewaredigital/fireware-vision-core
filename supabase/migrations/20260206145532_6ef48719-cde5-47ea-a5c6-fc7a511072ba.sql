
-- =============================================================================
-- FIREWARE CRM — FASES 5-8: iPaaS + Data Hub + Marketing Exec + Portals
-- Migration completa com enums, tabelas, RLS, indices, RPCs e seeds
-- =============================================================================

-- ===================== FASE 5: iPaaS NATIVO =====================

-- Enums Fase 5
DO $$ BEGIN
  CREATE TYPE public.connector_type AS ENUM (
    'email', 'sms', 'whatsapp', 'voice', 'crm', 'erp', 'payment', 'storage', 'analytics', 'custom'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.connector_auth_type AS ENUM (
    'none', 'api_key', 'oauth2', 'basic_auth', 'custom'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.connector_instance_status AS ENUM (
    'active', 'inactive', 'error', 'configuring'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.integration_run_status AS ENUM (
    'pending', 'running', 'completed', 'failed', 'retrying', 'dead_letter'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.dlq_status AS ENUM (
    'pending_review', 'retrying', 'resolved', 'expired', 'manually_resolved'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.outbox_status AS ENUM (
    'pending', 'processing', 'completed', 'failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5.1 connectors (catálogo de conectores nativos)
CREATE TABLE IF NOT EXISTS public.connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  connector_type public.connector_type NOT NULL DEFAULT 'custom',
  icon_url TEXT,
  auth_type public.connector_auth_type NOT NULL DEFAULT 'api_key',
  config_schema JSONB NOT NULL DEFAULT '{}',
  capabilities JSONB NOT NULL DEFAULT '{"actions":[],"triggers":[]}',
  documentation_url TEXT,
  is_native BOOLEAN NOT NULL DEFAULT true,
  version TEXT NOT NULL DEFAULT '1.0.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5.2 connector_instances
CREATE TABLE IF NOT EXISTS public.connector_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  connector_id UUID NOT NULL REFERENCES public.connectors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  credentials_encrypted TEXT,
  status public.connector_instance_status NOT NULL DEFAULT 'configuring',
  last_health_check TIMESTAMPTZ,
  health_status TEXT DEFAULT 'unknown',
  error_message TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5.3 connector_actions
CREATE TABLE IF NOT EXISTS public.connector_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id UUID NOT NULL REFERENCES public.connectors(id) ON DELETE CASCADE,
  action_name TEXT NOT NULL,
  action_type TEXT NOT NULL DEFAULT 'action',
  description TEXT,
  input_schema JSONB NOT NULL DEFAULT '{}',
  output_schema JSONB NOT NULL DEFAULT '{}',
  is_async BOOLEAN NOT NULL DEFAULT false,
  rate_limit INT DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5.4 integration_runs
CREATE TABLE IF NOT EXISTS public.integration_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  connector_instance_id UUID REFERENCES public.connector_instances(id) ON DELETE SET NULL,
  workflow_run_id UUID,
  action_name TEXT NOT NULL,
  status public.integration_run_status NOT NULL DEFAULT 'pending',
  input_payload JSONB,
  output_payload JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INT,
  retry_count INT NOT NULL DEFAULT 0,
  error_code TEXT,
  error_message TEXT,
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5.5 dlq_messages
CREATE TABLE IF NOT EXISTS public.dlq_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  original_run_id UUID REFERENCES public.integration_runs(id) ON DELETE SET NULL,
  connector_instance_id UUID REFERENCES public.connector_instances(id) ON DELETE SET NULL,
  action_name TEXT NOT NULL,
  payload JSONB NOT NULL,
  error_history JSONB NOT NULL DEFAULT '[]',
  retry_count INT NOT NULL DEFAULT 0,
  max_retries INT NOT NULL DEFAULT 5,
  status public.dlq_status NOT NULL DEFAULT 'pending_review',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_retry_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id)
);

-- 5.6 replay_requests
CREATE TABLE IF NOT EXISTS public.replay_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  dlq_message_id UUID NOT NULL REFERENCES public.dlq_messages(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES public.profiles(id),
  request_reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  new_run_id UUID,
  replayed_at TIMESTAMPTZ,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5.7 outbox_events
CREATE TABLE IF NOT EXISTS public.outbox_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  status public.outbox_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processor_id TEXT,
  retry_count INT NOT NULL DEFAULT 0
);

-- 5.8 event_subscriptions
CREATE TABLE IF NOT EXISTS public.event_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  subscriber_type TEXT NOT NULL DEFAULT 'webhook',
  subscriber_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5.9 webhook_endpoints
CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT,
  events TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  failure_count INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5.10 webhook_deliveries
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_endpoint_id UUID NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  response_status INT,
  response_body TEXT,
  attempt_count INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ
);

-- Fase 5 RLS
ALTER TABLE public.connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connector_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connector_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dlq_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replay_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- connectors é um catálogo global, leitura pública para autenticados
CREATE POLICY "connectors_select_all" ON public.connectors FOR SELECT TO authenticated USING (true);
CREATE POLICY "connectors_manage_admin" ON public.connectors FOR ALL TO authenticated
  USING (public.has_role('admin'::public.user_role)) WITH CHECK (public.has_role('admin'::public.user_role));

-- connector_actions também é catálogo
CREATE POLICY "connector_actions_select_all" ON public.connector_actions FOR SELECT TO authenticated USING (true);

-- Org-scoped RLS pattern
CREATE POLICY "ci_select" ON public.connector_instances FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "ci_insert" ON public.connector_instances FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "ci_update" ON public.connector_instances FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "ci_delete" ON public.connector_instances FOR DELETE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    AND public.has_role('admin'::public.user_role));

CREATE POLICY "ir_select" ON public.integration_runs FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "ir_insert" ON public.integration_runs FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "dlq_select" ON public.dlq_messages FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "dlq_insert" ON public.dlq_messages FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "dlq_update" ON public.dlq_messages FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "rr_select" ON public.replay_requests FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "rr_insert" ON public.replay_requests FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "oe_select" ON public.outbox_events FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "oe_insert" ON public.outbox_events FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "oe_update" ON public.outbox_events FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "es_select" ON public.event_subscriptions FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "es_insert" ON public.event_subscriptions FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "es_update" ON public.event_subscriptions FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "es_delete" ON public.event_subscriptions FOR DELETE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    AND public.has_role('admin'::public.user_role));

CREATE POLICY "we_select" ON public.webhook_endpoints FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "we_insert" ON public.webhook_endpoints FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "we_update" ON public.webhook_endpoints FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "we_delete" ON public.webhook_endpoints FOR DELETE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    AND public.has_role('admin'::public.user_role));

CREATE POLICY "wd_select" ON public.webhook_deliveries FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "wd_insert" ON public.webhook_deliveries FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Fase 5 Indices
CREATE INDEX IF NOT EXISTS idx_connector_instances_org ON public.connector_instances(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_integration_runs_org ON public.integration_runs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_integration_runs_status ON public.integration_runs(status);
CREATE INDEX IF NOT EXISTS idx_integration_runs_idempotency ON public.integration_runs(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dlq_org_status ON public.dlq_messages(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_outbox_status ON public.outbox_events(status, created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_endpoint ON public.webhook_deliveries(webhook_endpoint_id, created_at DESC);

-- Triggers updated_at Fase 5
CREATE TRIGGER update_connector_instances_updated_at BEFORE UPDATE ON public.connector_instances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_event_subscriptions_updated_at BEFORE UPDATE ON public.event_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_webhook_endpoints_updated_at BEFORE UPDATE ON public.webhook_endpoints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ===================== FASE 6: DATA HUB =====================

-- Enums Fase 6
DO $$ BEGIN
  CREATE TYPE public.golden_profile_type AS ENUM ('person', 'company');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.data_source_type AS ENUM ('internal', 'api', 'file_upload', 'webhook', 'connector');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.ingestion_status AS ENUM ('pending', 'running', 'completed', 'failed', 'partial');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.activation_destination_type AS ENUM (
    'marketing_campaign', 'cadence', 'routing_queue', 'personalization', 'external_system'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.activation_status AS ENUM ('pending', 'running', 'completed', 'failed', 'paused');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6.1 golden_profiles
CREATE TABLE IF NOT EXISTS public.golden_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  profile_type public.golden_profile_type NOT NULL DEFAULT 'person',
  display_name TEXT,
  primary_email TEXT,
  primary_phone TEXT,
  primary_document TEXT,
  consolidated_data JSONB NOT NULL DEFAULT '{}',
  confidence_score NUMERIC(5,2) DEFAULT 0,
  source_count INT NOT NULL DEFAULT 0,
  tags TEXT[],
  first_seen_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6.2 golden_profile_links
CREATE TABLE IF NOT EXISTS public.golden_profile_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  golden_profile_id UUID NOT NULL REFERENCES public.golden_profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  source TEXT NOT NULL DEFAULT 'system',
  link_confidence NUMERIC(5,2) DEFAULT 100,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  linked_by UUID REFERENCES public.profiles(id)
);

-- 6.3 profile_merge_history
CREATE TABLE IF NOT EXISTS public.profile_merge_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  target_golden_profile_id UUID NOT NULL REFERENCES public.golden_profiles(id) ON DELETE CASCADE,
  source_golden_profile_ids UUID[] NOT NULL,
  merge_reason TEXT,
  field_resolutions JSONB NOT NULL DEFAULT '{}',
  merged_by UUID REFERENCES public.profiles(id),
  merged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  can_undo BOOLEAN NOT NULL DEFAULT true,
  undo_deadline TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days')
);

-- 6.4 data_sources
CREATE TABLE IF NOT EXISTS public.data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  source_type public.data_source_type NOT NULL DEFAULT 'internal',
  connection_config JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  last_sync_at TIMESTAMPTZ,
  sync_frequency TEXT,
  record_count INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6.5 data_source_connectors (vínculo fonte↔conector)
CREATE TABLE IF NOT EXISTS public.data_source_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  data_source_id UUID NOT NULL REFERENCES public.data_sources(id) ON DELETE CASCADE,
  connector_instance_id UUID REFERENCES public.connector_instances(id) ON DELETE SET NULL,
  sync_config JSONB NOT NULL DEFAULT '{}',
  field_mappings JSONB NOT NULL DEFAULT '{}',
  last_sync_status TEXT DEFAULT 'never',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6.6 ingestion_jobs
CREATE TABLE IF NOT EXISTS public.ingestion_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  data_source_id UUID NOT NULL REFERENCES public.data_sources(id) ON DELETE CASCADE,
  status public.ingestion_status NOT NULL DEFAULT 'pending',
  records_processed INT NOT NULL DEFAULT 0,
  records_created INT NOT NULL DEFAULT 0,
  records_updated INT NOT NULL DEFAULT 0,
  records_failed INT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_summary JSONB,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6.7 event_schemas
CREATE TABLE IF NOT EXISTS public.event_schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  schema_version INT NOT NULL DEFAULT 1,
  properties_schema JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, event_name, schema_version)
);

-- 6.8 segment_versions
CREATE TABLE IF NOT EXISTS public.segment_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID NOT NULL REFERENCES public.segments(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  version_number INT NOT NULL DEFAULT 1,
  rules_snapshot JSONB NOT NULL DEFAULT '{}',
  member_count INT NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6.9 activation_destinations
CREATE TABLE IF NOT EXISTS public.activation_destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  destination_type public.activation_destination_type NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6.10 activation_jobs
CREATE TABLE IF NOT EXISTS public.activation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES public.segments(id) ON DELETE CASCADE,
  destination_id UUID NOT NULL REFERENCES public.activation_destinations(id) ON DELETE CASCADE,
  status public.activation_status NOT NULL DEFAULT 'pending',
  records_synced INT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  error_message TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fase 6 RLS
ALTER TABLE public.golden_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golden_profile_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_merge_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_source_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.segment_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_jobs ENABLE ROW LEVEL SECURITY;

-- Macro para org-scoped RLS
DO $$ 
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'golden_profiles', 'golden_profile_links', 'profile_merge_history',
    'data_sources', 'data_source_connectors', 'ingestion_jobs',
    'event_schemas', 'segment_versions', 'activation_destinations', 'activation_jobs'
  ])
  LOOP
    EXECUTE format('CREATE POLICY "%s_org_select" ON public.%I FOR SELECT TO authenticated
      USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_org_insert" ON public.%I FOR INSERT TO authenticated
      WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_org_update" ON public.%I FOR UPDATE TO authenticated
      USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))', tbl, tbl);
  END LOOP;
END $$;

-- Delete policies restritivas para dados críticos (merge_history imutável)
CREATE POLICY "pmh_no_delete" ON public.profile_merge_history FOR DELETE TO authenticated
  USING (false);

-- Fase 6 Indices
CREATE INDEX IF NOT EXISTS idx_golden_profiles_org ON public.golden_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_golden_profiles_email ON public.golden_profiles(organization_id, primary_email);
CREATE INDEX IF NOT EXISTS idx_golden_profiles_phone ON public.golden_profiles(organization_id, primary_phone);
CREATE INDEX IF NOT EXISTS idx_golden_profile_links_profile ON public.golden_profile_links(golden_profile_id);
CREATE INDEX IF NOT EXISTS idx_golden_profile_links_entity ON public.golden_profile_links(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_data_sources_org ON public.data_sources(organization_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_org ON public.ingestion_jobs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activation_jobs_org ON public.activation_jobs(organization_id, status);

-- Triggers updated_at Fase 6
CREATE TRIGGER update_golden_profiles_updated_at BEFORE UPDATE ON public.golden_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_data_sources_updated_at BEFORE UPDATE ON public.data_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_activation_destinations_updated_at BEFORE UPDATE ON public.activation_destinations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RPCs Fase 6
CREATE OR REPLACE FUNCTION public.resolve_identity(
  _org_id UUID,
  _identifiers JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_profile_id UUID;
  v_email TEXT;
  v_phone TEXT;
  v_document TEXT;
BEGIN
  v_email := _identifiers->>'email';
  v_phone := _identifiers->>'phone';
  v_document := _identifiers->>'document';

  -- Try email match first
  IF v_email IS NOT NULL THEN
    SELECT id INTO v_profile_id FROM public.golden_profiles
    WHERE organization_id = _org_id AND lower(primary_email) = lower(v_email) LIMIT 1;
    IF FOUND THEN RETURN v_profile_id; END IF;
  END IF;

  -- Try phone match
  IF v_phone IS NOT NULL THEN
    SELECT id INTO v_profile_id FROM public.golden_profiles
    WHERE organization_id = _org_id AND regexp_replace(primary_phone, '[^0-9]', '', 'g') = regexp_replace(v_phone, '[^0-9]', '', 'g') LIMIT 1;
    IF FOUND THEN RETURN v_profile_id; END IF;
  END IF;

  -- Try document match
  IF v_document IS NOT NULL THEN
    SELECT id INTO v_profile_id FROM public.golden_profiles
    WHERE organization_id = _org_id AND primary_document = v_document LIMIT 1;
    IF FOUND THEN RETURN v_profile_id; END IF;
  END IF;

  -- No match found, create new golden profile
  INSERT INTO public.golden_profiles (
    organization_id, profile_type, primary_email, primary_phone, primary_document,
    display_name, consolidated_data, source_count, first_seen_at
  ) VALUES (
    _org_id, 
    COALESCE((_identifiers->>'type')::public.golden_profile_type, 'person'),
    v_email, v_phone, v_document,
    _identifiers->>'name',
    _identifiers,
    1, now()
  )
  RETURNING id INTO v_profile_id;

  RETURN v_profile_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_unified_customer_view(_golden_profile_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_profile RECORD;
  v_links JSONB;
  v_contacts JSONB;
  v_leads JSONB;
  v_accounts JSONB;
  v_tickets JSONB;
  v_orders JSONB;
BEGIN
  SELECT * INTO v_profile FROM public.golden_profiles WHERE id = _golden_profile_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'entity_type', gpl.entity_type, 'entity_id', gpl.entity_id,
    'source', gpl.source, 'confidence', gpl.link_confidence, 'is_primary', gpl.is_primary
  )), '[]') INTO v_links
  FROM public.golden_profile_links gpl WHERE gpl.golden_profile_id = _golden_profile_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', c.id, 'name', c.first_name || ' ' || c.last_name, 'email', c.email, 'phone', c.phone
  )), '[]') INTO v_contacts
  FROM public.contacts c
  JOIN public.golden_profile_links gpl ON gpl.entity_id = c.id AND gpl.entity_type = 'contact'
  WHERE gpl.golden_profile_id = _golden_profile_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', l.id, 'name', l.first_name || ' ' || l.last_name, 'email', l.email, 'status', l.status
  )), '[]') INTO v_leads
  FROM public.leads l
  JOIN public.golden_profile_links gpl ON gpl.entity_id = l.id AND gpl.entity_type = 'lead'
  WHERE gpl.golden_profile_id = _golden_profile_id;

  RETURN jsonb_build_object(
    'profile', jsonb_build_object(
      'id', v_profile.id, 'type', v_profile.profile_type,
      'display_name', v_profile.display_name,
      'email', v_profile.primary_email, 'phone', v_profile.primary_phone,
      'confidence', v_profile.confidence_score, 'sources', v_profile.source_count,
      'first_seen', v_profile.first_seen_at, 'last_activity', v_profile.last_activity_at,
      'data', v_profile.consolidated_data
    ),
    'links', v_links,
    'contacts', v_contacts,
    'leads', v_leads
  );
END;
$$;


-- ===================== FASE 7: MARKETING EXECUÇÃO =====================

-- Enums Fase 7
DO $$ BEGIN
  CREATE TYPE public.message_provider_type AS ENUM ('email', 'sms', 'whatsapp', 'push');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.message_send_status AS ENUM (
    'pending', 'sending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.journey_run_status AS ENUM ('active', 'paused', 'completed', 'failed', 'waiting');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 7.1 message_providers
CREATE TABLE IF NOT EXISTS public.message_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider_type public.message_provider_type NOT NULL,
  name TEXT NOT NULL,
  connector_instance_id UUID REFERENCES public.connector_instances(id) ON DELETE SET NULL,
  config JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active',
  daily_limit INT,
  monthly_limit INT,
  daily_usage INT NOT NULL DEFAULT 0,
  monthly_usage INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7.2 message_sends
CREATE TABLE IF NOT EXISTS public.message_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.message_providers(id) ON DELETE SET NULL,
  campaign_id UUID,
  journey_run_id UUID,
  recipient_type TEXT,
  recipient_id TEXT,
  recipient_address TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'transactional',
  subject TEXT,
  content TEXT,
  template_id TEXT,
  status public.message_send_status NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounce_type TEXT,
  error_message TEXT,
  external_message_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7.3 journey_runs
CREATE TABLE IF NOT EXISTS public.journey_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  journey_id UUID NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  enrollment_id UUID,
  current_step_id UUID,
  status public.journey_run_status NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  next_step_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7.4 journey_step_runs
CREATE TABLE IF NOT EXISTS public.journey_step_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_run_id UUID NOT NULL REFERENCES public.journey_runs(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  step_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  input_data JSONB,
  output_data JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  message_send_id UUID REFERENCES public.message_sends(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7.5 journey_event_log
CREATE TABLE IF NOT EXISTS public.journey_event_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_run_id UUID NOT NULL REFERENCES public.journey_runs(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  external_event_id TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7.6 preference_centers
CREATE TABLE IF NOT EXISTS public.preference_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{"channels":["email","sms","whatsapp","push"],"topics":[]}',
  public_url_slug TEXT,
  branding JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7.7 contact_preferences
CREATE TABLE IF NOT EXISTS public.contact_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  golden_profile_id UUID REFERENCES public.golden_profiles(id) ON DELETE SET NULL,
  channel_preferences JSONB NOT NULL DEFAULT '{"email":"opt_in","sms":"opt_in","whatsapp":"opt_in","push":"opt_in"}',
  topic_preferences JSONB NOT NULL DEFAULT '{}',
  frequency_limit TEXT DEFAULT 'normal',
  global_optout BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_source TEXT DEFAULT 'system'
);

-- 7.8 ad_spend
CREATE TABLE IF NOT EXISTS public.ad_spend (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  date DATE NOT NULL,
  spend NUMERIC(15,2) NOT NULL DEFAULT 0,
  impressions INT NOT NULL DEFAULT 0,
  clicks INT NOT NULL DEFAULT 0,
  conversions INT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fase 7 RLS
ALTER TABLE public.message_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_step_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_event_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preference_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_spend ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'message_providers', 'message_sends', 'journey_runs', 'journey_step_runs',
    'journey_event_log', 'preference_centers', 'contact_preferences', 'ad_spend'
  ])
  LOOP
    EXECUTE format('CREATE POLICY "%s_org_sel" ON public.%I FOR SELECT TO authenticated
      USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_org_ins" ON public.%I FOR INSERT TO authenticated
      WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_org_upd" ON public.%I FOR UPDATE TO authenticated
      USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))', tbl, tbl);
  END LOOP;
END $$;

-- Fase 7 Indices
CREATE INDEX IF NOT EXISTS idx_message_providers_org ON public.message_providers(organization_id, provider_type);
CREATE INDEX IF NOT EXISTS idx_message_sends_org ON public.message_sends(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_sends_status ON public.message_sends(status);
CREATE INDEX IF NOT EXISTS idx_message_sends_campaign ON public.message_sends(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_journey_runs_org ON public.journey_runs(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_journey_runs_journey ON public.journey_runs(journey_id, status);
CREATE INDEX IF NOT EXISTS idx_contact_preferences_contact ON public.contact_preferences(contact_id);
CREATE INDEX IF NOT EXISTS idx_ad_spend_org_date ON public.ad_spend(organization_id, date DESC);

-- Triggers updated_at Fase 7
CREATE TRIGGER update_message_providers_updated_at BEFORE UPDATE ON public.message_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_preference_centers_updated_at BEFORE UPDATE ON public.preference_centers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ===================== FASE 8: PORTALS =====================

-- Enums Fase 8
DO $$ BEGIN
  CREATE TYPE public.partner_type AS ENUM ('reseller', 'referral', 'affiliate', 'technology', 'service');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.partner_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.partner_status AS ENUM ('prospect', 'pending_approval', 'active', 'suspended', 'terminated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.partner_user_role AS ENUM ('admin', 'sales', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.partner_deal_type AS ENUM ('lead_referral', 'co_sell', 'resale');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.partner_deal_status AS ENUM ('submitted', 'under_review', 'approved', 'rejected', 'won', 'lost');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.commission_status AS ENUM ('pending', 'approved', 'paid', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 8.1 partners
CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  partner_type public.partner_type NOT NULL DEFAULT 'referral',
  company_name TEXT NOT NULL,
  trading_name TEXT,
  tax_id TEXT,
  tier public.partner_tier NOT NULL DEFAULT 'bronze',
  status public.partner_status NOT NULL DEFAULT 'prospect',
  commission_rate NUMERIC(5,2) DEFAULT 0,
  territory_ids UUID[],
  contact_email TEXT,
  contact_phone TEXT,
  address JSONB NOT NULL DEFAULT '{}',
  website TEXT,
  logo_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8.2 partner_users
CREATE TABLE IF NOT EXISTS public.partner_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role public.partner_user_role NOT NULL DEFAULT 'viewer',
  permissions JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  last_login_at TIMESTAMPTZ,
  login_count INT NOT NULL DEFAULT 0,
  failed_login_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8.3 partner_deals
CREATE TABLE IF NOT EXISTS public.partner_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  deal_type public.partner_deal_type NOT NULL DEFAULT 'lead_referral',
  lead_id UUID,
  opportunity_id UUID,
  order_id UUID,
  status public.partner_deal_status NOT NULL DEFAULT 'submitted',
  deal_value NUMERIC(15,2) NOT NULL DEFAULT 0,
  commission_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  commission_status public.commission_status NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8.4 partner_commissions
CREATE TABLE IF NOT EXISTS public.partner_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.partner_deals(id) ON DELETE SET NULL,
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  status public.commission_status NOT NULL DEFAULT 'pending',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.profiles(id),
  paid_at TIMESTAMPTZ,
  payment_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8.5 partner_entitlements
CREATE TABLE IF NOT EXISTS public.partner_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entitlement_type TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8.6 partner_sessions
CREATE TABLE IF NOT EXISTS public.partner_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.partner_users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

-- 8.7 portal_preferences
CREATE TABLE IF NOT EXISTS public.portal_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_user_id UUID REFERENCES public.customer_portal_users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  channel_preferences JSONB NOT NULL DEFAULT '{}',
  notification_settings JSONB NOT NULL DEFAULT '{"email_notifications":true,"sms_notifications":false}',
  language TEXT NOT NULL DEFAULT 'pt-BR',
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fase 8 RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_preferences ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'partners', 'partner_users', 'partner_deals', 'partner_commissions',
    'partner_entitlements', 'partner_sessions', 'portal_preferences'
  ])
  LOOP
    EXECUTE format('CREATE POLICY "%s_org_sel" ON public.%I FOR SELECT TO authenticated
      USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_org_ins" ON public.%I FOR INSERT TO authenticated
      WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_org_upd" ON public.%I FOR UPDATE TO authenticated
      USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))', tbl, tbl);
  END LOOP;
END $$;

-- Partner portal: acesso anônimo para login
CREATE POLICY "partner_users_anon_login" ON public.partner_users FOR SELECT TO anon
  USING (true);
CREATE POLICY "partner_sessions_anon_access" ON public.partner_sessions FOR SELECT TO anon
  USING (true);
CREATE POLICY "partner_sessions_anon_insert" ON public.partner_sessions FOR INSERT TO anon
  WITH CHECK (true);
CREATE POLICY "partner_sessions_anon_update" ON public.partner_sessions FOR UPDATE TO anon
  USING (true);

-- Portal preferences: anon access for customer portal
CREATE POLICY "portal_prefs_anon_sel" ON public.portal_preferences FOR SELECT TO anon
  USING (true);
CREATE POLICY "portal_prefs_anon_upd" ON public.portal_preferences FOR UPDATE TO anon
  USING (true);

-- Fase 8 Indices
CREATE INDEX IF NOT EXISTS idx_partners_org ON public.partners(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_partner_users_partner ON public.partner_users(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_users_email ON public.partner_users(email);
CREATE INDEX IF NOT EXISTS idx_partner_deals_org ON public.partner_deals(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_partner_deals_partner ON public.partner_deals(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_commissions_partner ON public.partner_commissions(partner_id, status);
CREATE INDEX IF NOT EXISTS idx_partner_sessions_token ON public.partner_sessions(session_token) WHERE is_active = true;

-- Triggers updated_at Fase 8
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_partner_users_updated_at BEFORE UPDATE ON public.partner_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_partner_deals_updated_at BEFORE UPDATE ON public.partner_deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RPCs Partner Portal
CREATE OR REPLACE FUNCTION public.authenticate_partner_user(
  p_email TEXT, p_password TEXT, p_organization_id UUID
)
RETURNS TABLE(user_id UUID, partner_id UUID, success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user RECORD;
BEGIN
  SELECT * INTO v_user FROM public.partner_users 
  WHERE email = p_email AND organization_id = p_organization_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, false, 'Credenciais inválidas'::TEXT;
    RETURN;
  END IF;
  
  IF v_user.locked_until IS NOT NULL AND v_user.locked_until > now() THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, false, 'Conta temporariamente bloqueada'::TEXT;
    RETURN;
  END IF;
  
  IF v_user.status != 'active' THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, false, 'Conta inativa. Entre em contato com o suporte.'::TEXT;
    RETURN;
  END IF;
  
  IF v_user.password_hash = crypt(p_password, v_user.password_hash) THEN
    UPDATE public.partner_users SET
      last_login_at = now(), login_count = login_count + 1,
      failed_login_attempts = 0, locked_until = NULL
    WHERE id = v_user.id;
    RETURN QUERY SELECT v_user.id, v_user.partner_id, true, 'Autenticação bem-sucedida'::TEXT;
  ELSE
    UPDATE public.partner_users SET
      failed_login_attempts = failed_login_attempts + 1,
      locked_until = CASE WHEN failed_login_attempts >= 4 THEN now() + INTERVAL '30 minutes' ELSE NULL END
    WHERE id = v_user.id;
    IF v_user.failed_login_attempts >= 4 THEN
      RETURN QUERY SELECT NULL::UUID, NULL::UUID, false, 'Conta bloqueada por excesso de tentativas'::TEXT;
    ELSE
      RETURN QUERY SELECT NULL::UUID, NULL::UUID, false, 'Credenciais inválidas'::TEXT;
    END IF;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_partner_session(
  p_user_id UUID, p_ip_address TEXT DEFAULT NULL, p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE(session_id UUID, session_token TEXT, expires_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_session_id UUID;
  v_session_token TEXT;
  v_expires_at TIMESTAMPTZ;
  v_org_id UUID;
BEGIN
  SELECT organization_id INTO v_org_id FROM public.partner_users WHERE id = p_user_id AND status = 'active';
  IF NOT FOUND THEN RAISE EXCEPTION 'Usuário parceiro não encontrado ou inativo'; END IF;
  
  UPDATE public.partner_sessions SET is_active = false, ended_at = now()
  WHERE user_id = p_user_id AND is_active = true;
  
  v_session_id := gen_random_uuid();
  v_session_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := now() + INTERVAL '24 hours';
  
  INSERT INTO public.partner_sessions (id, user_id, organization_id, session_token, ip_address, user_agent, expires_at)
  VALUES (v_session_id, p_user_id, v_org_id, v_session_token, p_ip_address, p_user_agent, v_expires_at);
  
  RETURN QUERY SELECT v_session_id, v_session_token, v_expires_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_partner_session(p_session_token TEXT)
RETURNS TABLE(user_id UUID, partner_id UUID, organization_id UUID, is_valid BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_session RECORD;
  v_user RECORD;
BEGIN
  SELECT s.*, u.status AS user_status, u.partner_id AS p_id INTO v_session
  FROM public.partner_sessions s
  JOIN public.partner_users u ON u.id = s.user_id
  WHERE s.session_token = p_session_token AND s.is_active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::UUID, false, 'Sessão inválida'::TEXT;
    RETURN;
  END IF;
  
  IF v_session.expires_at < now() THEN
    UPDATE public.partner_sessions SET is_active = false, ended_at = now() WHERE session_token = p_session_token;
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::UUID, false, 'Sessão expirada'::TEXT;
    RETURN;
  END IF;
  
  IF v_session.user_status != 'active' THEN
    UPDATE public.partner_sessions SET is_active = false, ended_at = now() WHERE session_token = p_session_token;
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::UUID, false, 'Usuário inativo'::TEXT;
    RETURN;
  END IF;
  
  UPDATE public.partner_sessions SET last_activity_at = now() WHERE session_token = p_session_token;
  RETURN QUERY SELECT v_session.user_id, v_session.p_id, v_session.organization_id, true, 'Sessão válida'::TEXT;
END;
$$;

-- ============ SEED: Conectores Nativos (Fase 5) ============
INSERT INTO public.connectors (name, description, connector_type, auth_type, is_native, capabilities, config_schema) VALUES
  ('WhatsApp Business API', 'Conector oficial para a API WhatsApp Business. Envio e recebimento de mensagens, templates e rastreamento de status.', 'whatsapp', 'api_key', true,
   '{"actions":["send_text","send_template","send_media","get_templates"],"triggers":["message_received","status_update"]}',
   '{"properties":{"phone_number_id":{"type":"string"},"access_token":{"type":"string","secret":true},"webhook_verify_token":{"type":"string"}}}'),
  
  ('Chat Widget', 'Widget de chat embarcável para sites externos com bot de triagem e handoff para agentes humanos.', 'custom', 'api_key', true,
   '{"actions":["send_message","close_session","transfer_agent"],"triggers":["session_started","message_received","session_ended"]}',
   '{"properties":{"widget_key":{"type":"string"},"allowed_domains":{"type":"array"}}}'),
  
  ('Voice Provider', 'Conector de telefonia para chamadas inbound/outbound com gravação e transcrição.', 'voice', 'api_key', true,
   '{"actions":["make_call","transfer_call","record_call"],"triggers":["call_incoming","call_ended","recording_ready"]}',
   '{"properties":{"api_key":{"type":"string","secret":true},"phone_number":{"type":"string"},"webhook_url":{"type":"string"}}}'),
  
  ('Email SMTP', 'Provedor de email via SMTP para envio de campanhas, notificações e emails transacionais.', 'email', 'basic_auth', true,
   '{"actions":["send_email","send_template_email"],"triggers":["email_delivered","email_opened","email_clicked","email_bounced"]}',
   '{"properties":{"host":{"type":"string"},"port":{"type":"integer"},"username":{"type":"string"},"password":{"type":"string","secret":true},"from_address":{"type":"string"}}}'),
  
  ('SMS Provider', 'Provedor de SMS para envio de mensagens de texto, notificações e campanhas.', 'sms', 'api_key', true,
   '{"actions":["send_sms","send_bulk_sms"],"triggers":["sms_delivered","sms_failed"]}',
   '{"properties":{"api_key":{"type":"string","secret":true},"sender_id":{"type":"string"},"webhook_url":{"type":"string"}}}'),
  
  ('Push Notifications', 'Envio de notificações push para dispositivos mobile e web via FCM/APNS.', 'custom', 'api_key', true,
   '{"actions":["send_push","send_topic_push"],"triggers":["push_delivered","push_clicked"]}',
   '{"properties":{"server_key":{"type":"string","secret":true},"project_id":{"type":"string"}}}')
ON CONFLICT DO NOTHING;
