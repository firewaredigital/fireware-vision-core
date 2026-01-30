
-- =====================================================
-- FASE 11: FIREWARE DATA AVANÇADO
-- Identidades Unificadas, Merge, Behavioral Events, Attribution
-- =====================================================

-- =====================================================
-- ENUMS
-- =====================================================

-- Tipo de identificador
CREATE TYPE identifier_type AS ENUM (
  'email', 'phone', 'document', 'external_id', 
  'cookie', 'device_id', 'social_id'
);

-- Status de merge
CREATE TYPE merge_status AS ENUM (
  'pending', 'approved', 'rejected', 'in_progress', 
  'completed', 'failed', 'cancelled'
);

-- Tipo de evento comportamental
CREATE TYPE behavioral_event_type AS ENUM (
  'page_view', 'form_submit', 'button_click', 'link_click',
  'video_play', 'video_complete', 'file_download', 'search',
  'add_to_cart', 'remove_from_cart', 'checkout_start', 'checkout_complete',
  'signup', 'login', 'logout', 'profile_update',
  'email_open', 'email_click', 'sms_click', 'push_click',
  'custom'
);

-- Modelo de atribuição
CREATE TYPE attribution_model AS ENUM (
  'first_touch', 'last_touch', 'linear', 'time_decay',
  'position_based', 'data_driven', 'custom'
);

-- Status de duplicata
CREATE TYPE duplicate_status AS ENUM (
  'detected', 'confirmed', 'false_positive', 'merged', 'ignored'
);

-- =====================================================
-- TABELAS PRINCIPAIS
-- =====================================================

-- Identidades Unificadas (Customer 360 avançado)
CREATE TABLE customer_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Entidade principal
  primary_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  primary_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  
  -- Entidades vinculadas
  linked_account_ids UUID[] DEFAULT '{}',
  linked_contact_ids UUID[] DEFAULT '{}',
  linked_lead_ids UUID[] DEFAULT '{}',
  
  -- Identificadores conhecidos
  identifiers JSONB NOT NULL DEFAULT '[]',
  -- Formato: [{"type": "email", "value": "john@example.com", "verified": true, "source": "signup"}]
  
  -- Perfil unificado
  unified_profile JSONB DEFAULT '{}',
  -- Formato: {"name": "John Doe", "email": "john@example.com", "phone": "+55...", "company": "..."}
  
  -- Preferências e consentimentos agregados
  preferences JSONB DEFAULT '{}',
  consents JSONB DEFAULT '{}',
  
  -- Métricas agregadas
  total_orders INT DEFAULT 0,
  total_revenue NUMERIC(15,2) DEFAULT 0,
  total_tickets INT DEFAULT 0,
  total_opportunities INT DEFAULT 0,
  
  -- Scores
  health_score INT DEFAULT 50,
  engagement_score INT DEFAULT 0,
  churn_risk_score INT DEFAULT 0,
  
  -- Histórico de merge
  merge_history JSONB DEFAULT '[]',
  -- Formato: [{"merged_from": "uuid", "merged_at": "timestamp", "merged_by": "uuid"}]
  
  -- Confiança da identidade
  confidence_score NUMERIC(5,2) DEFAULT 100,
  
  -- Metadata
  first_seen_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para identidades
CREATE INDEX idx_customer_identities_org ON customer_identities(organization_id);
CREATE INDEX idx_customer_identities_account ON customer_identities(primary_account_id);
CREATE INDEX idx_customer_identities_contact ON customer_identities(primary_contact_id);
CREATE INDEX idx_customer_identities_identifiers ON customer_identities USING GIN(identifiers);

-- Duplicatas Detectadas
CREATE TABLE detected_duplicates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Tipo de entidade
  entity_type TEXT NOT NULL, -- 'account', 'contact', 'lead'
  
  -- IDs dos registros duplicados
  entity_ids UUID[] NOT NULL,
  
  -- Razão da detecção
  match_reasons JSONB NOT NULL DEFAULT '[]',
  -- Formato: [{"field": "email", "values": ["a@b.com"], "confidence": 100}]
  
  -- Score de similaridade (0-100)
  similarity_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  
  -- Status
  status duplicate_status DEFAULT 'detected',
  
  -- Registro sugerido como principal
  suggested_primary_id UUID,
  
  -- Decisão
  decision_by UUID REFERENCES profiles(id),
  decision_at TIMESTAMPTZ,
  decision_notes TEXT,
  
  -- Merge resultante
  merge_request_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_detected_duplicates_org ON detected_duplicates(organization_id);
CREATE INDEX idx_detected_duplicates_status ON detected_duplicates(status);
CREATE INDEX idx_detected_duplicates_entity ON detected_duplicates(entity_type);

-- Solicitações de Merge
CREATE TABLE merge_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Tipo de entidade
  entity_type TEXT NOT NULL, -- 'account', 'contact', 'lead'
  
  -- IDs fonte (serão mesclados)
  source_ids UUID[] NOT NULL,
  
  -- ID destino (registro que permanece)
  target_id UUID NOT NULL,
  
  -- Regras de merge
  merge_rules JSONB DEFAULT '{}',
  -- Formato: {"name": "target", "email": "source_0", "phone": "keep_all"}
  
  -- Preview do resultado
  preview_result JSONB DEFAULT '{}',
  
  -- Status do processo
  status merge_status DEFAULT 'pending',
  
  -- Aprovação
  requires_approval BOOLEAN DEFAULT true,
  approval_level INT DEFAULT 1,
  
  -- Solicitante
  requested_by UUID REFERENCES profiles(id),
  requested_at TIMESTAMPTZ DEFAULT now(),
  
  -- Aprovador
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  
  -- Execução
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Resultado
  result_entity_id UUID,
  affected_records JSONB DEFAULT '{}',
  -- Formato: {"activities": 10, "opportunities": 2, "tickets": 5}
  
  -- Erro (se falhou)
  error_message TEXT,
  error_details JSONB,
  
  -- Rollback info
  rollback_data JSONB,
  rolled_back_at TIMESTAMPTZ,
  rolled_back_by UUID REFERENCES profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_merge_requests_org ON merge_requests(organization_id);
CREATE INDEX idx_merge_requests_status ON merge_requests(status);
CREATE INDEX idx_merge_requests_entity ON merge_requests(entity_type);

-- Eventos Comportamentais
CREATE TABLE behavioral_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Evento
  event_type behavioral_event_type NOT NULL,
  event_name TEXT NOT NULL,
  event_category TEXT,
  
  -- Entidade relacionada
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  customer_identity_id UUID REFERENCES customer_identities(id) ON DELETE SET NULL,
  
  -- Sessão e visitante
  session_id TEXT,
  visitor_id TEXT,
  anonymous_id TEXT,
  
  -- Propriedades do evento
  properties JSONB DEFAULT '{}',
  -- Formato: {"button_text": "Buy Now", "product_id": "...", "value": 100}
  
  -- Contexto
  source TEXT, -- 'web', 'mobile', 'api', 'email', 'sms'
  channel TEXT, -- 'organic', 'paid', 'social', 'email', 'direct'
  
  -- Página/Tela
  page_url TEXT,
  page_title TEXT,
  page_path TEXT,
  referrer TEXT,
  referrer_domain TEXT,
  
  -- UTM Parameters
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  
  -- Campanha relacionada
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  journey_id UUID REFERENCES journeys(id) ON DELETE SET NULL,
  
  -- Dispositivo
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'
  device_info JSONB DEFAULT '{}',
  -- Formato: {"browser": "Chrome", "os": "Windows", "screen": "1920x1080"}
  
  -- Localização
  ip_address TEXT,
  location JSONB DEFAULT '{}',
  -- Formato: {"country": "BR", "region": "SP", "city": "São Paulo"}
  
  -- Valor do evento (se aplicável)
  event_value NUMERIC(15,2),
  currency TEXT DEFAULT 'BRL',
  
  -- Timestamp preciso
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  received_at TIMESTAMPTZ DEFAULT now(),
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para eventos comportamentais
CREATE INDEX idx_behavioral_events_org ON behavioral_events(organization_id);
CREATE INDEX idx_behavioral_events_type ON behavioral_events(event_type);
CREATE INDEX idx_behavioral_events_contact ON behavioral_events(contact_id);
CREATE INDEX idx_behavioral_events_lead ON behavioral_events(lead_id);
CREATE INDEX idx_behavioral_events_account ON behavioral_events(account_id);
CREATE INDEX idx_behavioral_events_session ON behavioral_events(session_id);
CREATE INDEX idx_behavioral_events_occurred ON behavioral_events(occurred_at);
CREATE INDEX idx_behavioral_events_campaign ON behavioral_events(campaign_id);

-- Touchpoints de Atribuição
CREATE TABLE attribution_touchpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Entidade convertida
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Contato/Lead
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  
  -- Touchpoint
  touchpoint_type TEXT NOT NULL, -- 'campaign', 'journey', 'ad', 'content', 'event', 'referral', 'organic', 'direct'
  touchpoint_name TEXT,
  
  -- Fonte
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  journey_id UUID REFERENCES journeys(id) ON DELETE SET NULL,
  
  -- UTM
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  
  -- Channel
  channel TEXT,
  source TEXT,
  
  -- Posição na jornada
  touchpoint_position INT, -- 1, 2, 3...
  is_first_touch BOOLEAN DEFAULT false,
  is_last_touch BOOLEAN DEFAULT false,
  is_conversion_touch BOOLEAN DEFAULT false,
  
  -- Timestamp
  touchpoint_date TIMESTAMPTZ NOT NULL,
  conversion_date TIMESTAMPTZ,
  days_to_conversion INT,
  
  -- Valor
  conversion_value NUMERIC(15,2),
  currency TEXT DEFAULT 'BRL',
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_attribution_touchpoints_org ON attribution_touchpoints(organization_id);
CREATE INDEX idx_attribution_touchpoints_opp ON attribution_touchpoints(opportunity_id);
CREATE INDEX idx_attribution_touchpoints_order ON attribution_touchpoints(order_id);
CREATE INDEX idx_attribution_touchpoints_campaign ON attribution_touchpoints(campaign_id);

-- Atribuição Calculada
CREATE TABLE marketing_attribution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Conversão
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Contato/Lead
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  
  -- Campanha/Journey
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  journey_id UUID REFERENCES journeys(id) ON DELETE SET NULL,
  
  -- Touchpoint referenciado
  touchpoint_id UUID REFERENCES attribution_touchpoints(id) ON DELETE SET NULL,
  
  -- Modelo de atribuição
  attribution_model attribution_model NOT NULL,
  
  -- Peso/Crédito
  attribution_weight NUMERIC(5,4) NOT NULL, -- 0.0000 a 1.0000
  
  -- Receita atribuída
  revenue_attributed NUMERIC(15,2),
  currency TEXT DEFAULT 'BRL',
  
  -- Período
  attribution_period_start TIMESTAMPTZ,
  attribution_period_end TIMESTAMPTZ,
  
  -- Metadata
  calculation_details JSONB DEFAULT '{}',
  
  calculated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_marketing_attribution_org ON marketing_attribution(organization_id);
CREATE INDEX idx_marketing_attribution_campaign ON marketing_attribution(campaign_id);
CREATE INDEX idx_marketing_attribution_model ON marketing_attribution(attribution_model);

-- Funil Completo (Snapshot diário)
CREATE TABLE funnel_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Data do snapshot
  snapshot_date DATE NOT NULL,
  
  -- Período
  period_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  
  -- Marketing Metrics
  marketing_visitors INT DEFAULT 0,
  marketing_leads INT DEFAULT 0,
  marketing_mqls INT DEFAULT 0, -- Marketing Qualified Leads
  marketing_campaigns_active INT DEFAULT 0,
  marketing_emails_sent INT DEFAULT 0,
  marketing_email_opens INT DEFAULT 0,
  marketing_email_clicks INT DEFAULT 0,
  marketing_conversions INT DEFAULT 0,
  marketing_spend NUMERIC(15,2) DEFAULT 0,
  
  -- Sales Metrics
  sales_leads_received INT DEFAULT 0,
  sales_sqls INT DEFAULT 0, -- Sales Qualified Leads
  sales_opportunities_created INT DEFAULT 0,
  sales_opportunities_won INT DEFAULT 0,
  sales_opportunities_lost INT DEFAULT 0,
  sales_pipeline_value NUMERIC(15,2) DEFAULT 0,
  sales_closed_value NUMERIC(15,2) DEFAULT 0,
  sales_avg_deal_size NUMERIC(15,2) DEFAULT 0,
  sales_avg_cycle_days INT DEFAULT 0,
  sales_win_rate NUMERIC(5,2) DEFAULT 0,
  
  -- Service Metrics
  service_tickets_created INT DEFAULT 0,
  service_tickets_resolved INT DEFAULT 0,
  service_tickets_backlog INT DEFAULT 0,
  service_avg_resolution_hours NUMERIC(10,2) DEFAULT 0,
  service_sla_compliance NUMERIC(5,2) DEFAULT 0,
  service_csat_score NUMERIC(3,2) DEFAULT 0,
  service_nps_score INT DEFAULT 0,
  
  -- Commerce Metrics
  commerce_orders INT DEFAULT 0,
  commerce_revenue NUMERIC(15,2) DEFAULT 0,
  commerce_avg_order_value NUMERIC(15,2) DEFAULT 0,
  commerce_cart_abandonment_rate NUMERIC(5,2) DEFAULT 0,
  commerce_returns INT DEFAULT 0,
  commerce_return_rate NUMERIC(5,2) DEFAULT 0,
  
  -- Customer Metrics
  customers_total INT DEFAULT 0,
  customers_new INT DEFAULT 0,
  customers_churned INT DEFAULT 0,
  customers_at_risk INT DEFAULT 0,
  customer_lifetime_value NUMERIC(15,2) DEFAULT 0,
  
  -- Conversion Rates
  visitor_to_lead_rate NUMERIC(5,2) DEFAULT 0,
  lead_to_mql_rate NUMERIC(5,2) DEFAULT 0,
  mql_to_sql_rate NUMERIC(5,2) DEFAULT 0,
  sql_to_opportunity_rate NUMERIC(5,2) DEFAULT 0,
  opportunity_to_customer_rate NUMERIC(5,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_funnel_snapshots_org ON funnel_snapshots(organization_id);
CREATE INDEX idx_funnel_snapshots_date ON funnel_snapshots(snapshot_date);
CREATE UNIQUE INDEX idx_funnel_snapshots_unique ON funnel_snapshots(organization_id, snapshot_date, period_type);

-- Configurações de Detecção de Duplicatas
CREATE TABLE duplicate_detection_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Entidade
  entity_type TEXT NOT NULL, -- 'account', 'contact', 'lead'
  
  -- Nome da regra
  name TEXT NOT NULL,
  description TEXT,
  
  -- Campos para comparação
  match_fields JSONB NOT NULL DEFAULT '[]',
  -- Formato: [{"field": "email", "match_type": "exact", "weight": 40}, {"field": "phone", "match_type": "fuzzy", "weight": 30}]
  
  -- Threshold mínimo para considerar duplicata (0-100)
  threshold_score NUMERIC(5,2) DEFAULT 80,
  
  -- Auto-merge se score >= threshold
  auto_merge_threshold NUMERIC(5,2),
  
  -- Ativo
  is_active BOOLEAN DEFAULT true,
  
  -- Prioridade (menor = maior prioridade)
  priority INT DEFAULT 100,
  
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_duplicate_rules_org ON duplicate_detection_rules(organization_id);
CREATE INDEX idx_duplicate_rules_entity ON duplicate_detection_rules(entity_type);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE customer_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE detected_duplicates ENABLE ROW LEVEL SECURITY;
ALTER TABLE merge_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribution_touchpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_attribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE duplicate_detection_rules ENABLE ROW LEVEL SECURITY;

-- Customer Identities
CREATE POLICY "Users can view customer identities in their org"
  ON customer_identities FOR SELECT
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "Users can manage customer identities in their org"
  ON customer_identities FOR ALL
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

-- Detected Duplicates
CREATE POLICY "Users can view duplicates in their org"
  ON detected_duplicates FOR SELECT
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "Users can manage duplicates in their org"
  ON detected_duplicates FOR ALL
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

-- Merge Requests
CREATE POLICY "Users can view merge requests in their org"
  ON merge_requests FOR SELECT
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "Users can manage merge requests in their org"
  ON merge_requests FOR ALL
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

-- Behavioral Events
CREATE POLICY "Users can view behavioral events in their org"
  ON behavioral_events FOR SELECT
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "Users can manage behavioral events in their org"
  ON behavioral_events FOR ALL
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

-- Attribution Touchpoints
CREATE POLICY "Users can view attribution touchpoints in their org"
  ON attribution_touchpoints FOR SELECT
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "Users can manage attribution touchpoints in their org"
  ON attribution_touchpoints FOR ALL
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

-- Marketing Attribution
CREATE POLICY "Users can view marketing attribution in their org"
  ON marketing_attribution FOR SELECT
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "Users can manage marketing attribution in their org"
  ON marketing_attribution FOR ALL
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

-- Funnel Snapshots
CREATE POLICY "Users can view funnel snapshots in their org"
  ON funnel_snapshots FOR SELECT
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "Users can manage funnel snapshots in their org"
  ON funnel_snapshots FOR ALL
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

-- Duplicate Detection Rules
CREATE POLICY "Users can view duplicate rules in their org"
  ON duplicate_detection_rules FOR SELECT
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "Users can manage duplicate rules in their org"
  ON duplicate_detection_rules FOR ALL
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

-- =====================================================
-- FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para detectar duplicatas
CREATE OR REPLACE FUNCTION public.detect_duplicates(
  p_organization_id UUID,
  p_entity_type TEXT,
  p_entity_id UUID
)
RETURNS TABLE (
  duplicate_id UUID,
  similarity_score NUMERIC,
  match_reasons JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entity RECORD;
  v_candidate RECORD;
  v_score NUMERIC;
  v_reasons JSONB;
BEGIN
  -- Esta é uma implementação simplificada
  -- Em produção, seria mais sofisticada com fuzzy matching
  
  IF p_entity_type = 'contact' THEN
    SELECT * INTO v_entity FROM contacts WHERE id = p_entity_id;
    
    FOR v_candidate IN 
      SELECT * FROM contacts 
      WHERE organization_id = p_organization_id 
      AND id != p_entity_id
    LOOP
      v_score := 0;
      v_reasons := '[]'::jsonb;
      
      -- Email match
      IF v_entity.email IS NOT NULL AND v_candidate.email IS NOT NULL 
         AND lower(v_entity.email) = lower(v_candidate.email) THEN
        v_score := v_score + 50;
        v_reasons := v_reasons || jsonb_build_object('field', 'email', 'confidence', 100);
      END IF;
      
      -- Phone match
      IF v_entity.phone IS NOT NULL AND v_candidate.phone IS NOT NULL 
         AND regexp_replace(v_entity.phone, '[^0-9]', '', 'g') = regexp_replace(v_candidate.phone, '[^0-9]', '', 'g') THEN
        v_score := v_score + 30;
        v_reasons := v_reasons || jsonb_build_object('field', 'phone', 'confidence', 100);
      END IF;
      
      -- Name similarity (simple)
      IF v_entity.first_name IS NOT NULL AND v_candidate.first_name IS NOT NULL
         AND lower(v_entity.first_name) = lower(v_candidate.first_name)
         AND lower(COALESCE(v_entity.last_name, '')) = lower(COALESCE(v_candidate.last_name, '')) THEN
        v_score := v_score + 20;
        v_reasons := v_reasons || jsonb_build_object('field', 'name', 'confidence', 80);
      END IF;
      
      IF v_score >= 50 THEN
        RETURN QUERY SELECT v_candidate.id, v_score, v_reasons;
      END IF;
    END LOOP;
  END IF;
  
  -- Similar logic for accounts and leads...
  
  RETURN;
END;
$$;

-- Função para calcular atribuição
CREATE OR REPLACE FUNCTION public.calculate_attribution(
  p_organization_id UUID,
  p_opportunity_id UUID,
  p_model attribution_model DEFAULT 'linear'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_touchpoints RECORD;
  v_count INT;
  v_weight NUMERIC;
  v_revenue NUMERIC;
  v_position INT := 0;
BEGIN
  -- Obter valor da oportunidade
  SELECT amount INTO v_revenue FROM opportunities WHERE id = p_opportunity_id;
  
  -- Contar touchpoints
  SELECT COUNT(*) INTO v_count 
  FROM attribution_touchpoints 
  WHERE opportunity_id = p_opportunity_id;
  
  IF v_count = 0 THEN
    RETURN;
  END IF;
  
  -- Limpar atribuições anteriores
  DELETE FROM marketing_attribution 
  WHERE opportunity_id = p_opportunity_id 
  AND attribution_model = p_model;
  
  -- Calcular peso baseado no modelo
  FOR v_touchpoints IN 
    SELECT * FROM attribution_touchpoints 
    WHERE opportunity_id = p_opportunity_id 
    ORDER BY touchpoint_date
  LOOP
    v_position := v_position + 1;
    
    CASE p_model
      WHEN 'first_touch' THEN
        IF v_touchpoints.is_first_touch THEN
          v_weight := 1.0;
        ELSE
          v_weight := 0.0;
        END IF;
        
      WHEN 'last_touch' THEN
        IF v_touchpoints.is_last_touch THEN
          v_weight := 1.0;
        ELSE
          v_weight := 0.0;
        END IF;
        
      WHEN 'linear' THEN
        v_weight := 1.0 / v_count;
        
      WHEN 'position_based' THEN
        -- 40% primeiro, 40% último, 20% distribuído no meio
        IF v_touchpoints.is_first_touch THEN
          v_weight := 0.4;
        ELSIF v_touchpoints.is_last_touch THEN
          v_weight := 0.4;
        ELSE
          v_weight := 0.2 / GREATEST(v_count - 2, 1);
        END IF;
        
      ELSE
        v_weight := 1.0 / v_count;
    END CASE;
    
    -- Inserir atribuição
    INSERT INTO marketing_attribution (
      organization_id, opportunity_id, contact_id, lead_id, account_id,
      campaign_id, journey_id, touchpoint_id, attribution_model,
      attribution_weight, revenue_attributed
    ) VALUES (
      p_organization_id, p_opportunity_id, v_touchpoints.contact_id,
      v_touchpoints.lead_id, v_touchpoints.account_id,
      v_touchpoints.campaign_id, v_touchpoints.journey_id,
      v_touchpoints.id, p_model, v_weight,
      COALESCE(v_revenue, 0) * v_weight
    );
  END LOOP;
END;
$$;

-- Função para criar snapshot do funil
CREATE OR REPLACE FUNCTION public.create_funnel_snapshot(
  p_organization_id UUID,
  p_date DATE DEFAULT CURRENT_DATE,
  p_period_type TEXT DEFAULT 'daily'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_snapshot_id UUID;
  v_start_date TIMESTAMPTZ;
  v_end_date TIMESTAMPTZ;
BEGIN
  -- Determinar período
  v_end_date := (p_date + interval '1 day')::timestamptz;
  
  CASE p_period_type
    WHEN 'daily' THEN v_start_date := p_date::timestamptz;
    WHEN 'weekly' THEN v_start_date := (p_date - interval '7 days')::timestamptz;
    WHEN 'monthly' THEN v_start_date := (p_date - interval '30 days')::timestamptz;
    ELSE v_start_date := p_date::timestamptz;
  END CASE;
  
  -- Criar snapshot
  INSERT INTO funnel_snapshots (
    organization_id, snapshot_date, period_type,
    -- Marketing
    marketing_leads,
    marketing_campaigns_active,
    -- Sales
    sales_opportunities_created,
    sales_opportunities_won,
    sales_opportunities_lost,
    sales_pipeline_value,
    sales_closed_value,
    -- Service
    service_tickets_created,
    service_tickets_resolved,
    service_tickets_backlog,
    -- Commerce
    commerce_orders,
    commerce_revenue
  )
  SELECT
    p_organization_id,
    p_date,
    p_period_type,
    -- Marketing leads
    (SELECT COUNT(*) FROM leads WHERE organization_id = p_organization_id AND created_at BETWEEN v_start_date AND v_end_date),
    -- Active campaigns
    (SELECT COUNT(*) FROM campaigns WHERE organization_id = p_organization_id AND status = 'active'),
    -- Opportunities created
    (SELECT COUNT(*) FROM opportunities WHERE organization_id = p_organization_id AND created_at BETWEEN v_start_date AND v_end_date),
    -- Opportunities won
    (SELECT COUNT(*) FROM opportunities WHERE organization_id = p_organization_id AND stage = 'closed_won' AND updated_at BETWEEN v_start_date AND v_end_date),
    -- Opportunities lost
    (SELECT COUNT(*) FROM opportunities WHERE organization_id = p_organization_id AND stage = 'closed_lost' AND updated_at BETWEEN v_start_date AND v_end_date),
    -- Pipeline value
    (SELECT COALESCE(SUM(amount), 0) FROM opportunities WHERE organization_id = p_organization_id AND stage NOT IN ('closed_won', 'closed_lost')),
    -- Closed value
    (SELECT COALESCE(SUM(amount), 0) FROM opportunities WHERE organization_id = p_organization_id AND stage = 'closed_won' AND updated_at BETWEEN v_start_date AND v_end_date),
    -- Tickets created
    (SELECT COUNT(*) FROM tickets WHERE organization_id = p_organization_id AND created_at BETWEEN v_start_date AND v_end_date),
    -- Tickets resolved
    (SELECT COUNT(*) FROM tickets WHERE organization_id = p_organization_id AND status = 'resolved' AND resolved_at BETWEEN v_start_date AND v_end_date),
    -- Tickets backlog
    (SELECT COUNT(*) FROM tickets WHERE organization_id = p_organization_id AND status NOT IN ('resolved', 'closed')),
    -- Orders
    (SELECT COUNT(*) FROM orders WHERE organization_id = p_organization_id AND created_at BETWEEN v_start_date AND v_end_date),
    -- Commerce revenue
    (SELECT COALESCE(SUM(grand_total), 0) FROM orders WHERE organization_id = p_organization_id AND status = 'delivered' AND created_at BETWEEN v_start_date AND v_end_date)
  RETURNING id INTO v_snapshot_id;
  
  RETURN v_snapshot_id;
END;
$$;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_customer_identities_updated_at
  BEFORE UPDATE ON customer_identities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_detected_duplicates_updated_at
  BEFORE UPDATE ON detected_duplicates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_merge_requests_updated_at
  BEFORE UPDATE ON merge_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_duplicate_rules_updated_at
  BEFORE UPDATE ON duplicate_detection_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
