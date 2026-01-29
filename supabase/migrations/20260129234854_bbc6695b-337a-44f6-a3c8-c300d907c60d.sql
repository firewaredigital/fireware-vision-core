-- =====================================================
-- FASE 8: FIREWARE MARKETING
-- =====================================================

-- Enum para tipos de campanha
CREATE TYPE public.campaign_type AS ENUM (
  'email',
  'sms', 
  'whatsapp',
  'push',
  'social',
  'ads',
  'event',
  'webinar',
  'content',
  'referral'
);

-- Enum para status de campanha
CREATE TYPE public.campaign_status AS ENUM (
  'draft',
  'scheduled',
  'sending',
  'active',
  'paused',
  'completed',
  'cancelled',
  'archived'
);

-- Enum para status de membro de campanha
CREATE TYPE public.campaign_member_status AS ENUM (
  'pending',
  'sent',
  'delivered',
  'opened',
  'clicked',
  'converted',
  'unsubscribed',
  'bounced',
  'complained',
  'failed'
);

-- Enum para status de jornada
CREATE TYPE public.journey_status AS ENUM (
  'draft',
  'active',
  'paused',
  'completed',
  'archived'
);

-- Enum para tipos de step de jornada
CREATE TYPE public.journey_step_type AS ENUM (
  'email',
  'sms',
  'whatsapp',
  'push',
  'wait',
  'condition',
  'split',
  'goal',
  'action',
  'webhook',
  'add_to_segment',
  'remove_from_segment',
  'update_field',
  'create_task',
  'notify_owner'
);

-- Enum para status de enrollment
CREATE TYPE public.enrollment_status AS ENUM (
  'active',
  'completed',
  'exited',
  'paused',
  'failed'
);

-- Tabela de Templates de Email (PRIMEIRO para ser referenciada)
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  subject TEXT NOT NULL,
  preview_text TEXT,
  body_html TEXT NOT NULL,
  body_text TEXT,
  body_json JSONB,
  layout TEXT DEFAULT 'custom',
  thumbnail_url TEXT,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  is_shared BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  avg_open_rate NUMERIC(5,2),
  avg_click_rate NUMERIC(5,2),
  tags TEXT[],
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Segmentos
CREATE TABLE public.segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'dynamic' CHECK (type IN ('static', 'dynamic')),
  filters JSONB DEFAULT '[]',
  filter_logic TEXT DEFAULT 'and',
  custom_filter_expression TEXT,
  entity_type TEXT DEFAULT 'contact' CHECK (entity_type IN ('contact', 'lead', 'account')),
  member_count INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMPTZ,
  calculation_duration_ms INTEGER,
  auto_refresh BOOLEAN DEFAULT true,
  refresh_interval_hours INTEGER DEFAULT 24,
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  tags TEXT[],
  color TEXT,
  icon TEXT,
  owner_id UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Membros de Segmento
CREATE TABLE public.segment_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  segment_id UUID NOT NULL REFERENCES public.segments(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id),
  lead_id UUID REFERENCES public.leads(id),
  account_id UUID REFERENCES public.accounts(id),
  added_at TIMESTAMPTZ DEFAULT now(),
  added_by UUID REFERENCES public.profiles(id),
  source TEXT DEFAULT 'manual'
);

-- Tabela de Jornadas
CREATE TABLE public.journeys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status public.journey_status NOT NULL DEFAULT 'draft',
  trigger_type TEXT NOT NULL,
  trigger_segment_id UUID REFERENCES public.segments(id),
  trigger_event_name TEXT,
  trigger_config JSONB DEFAULT '{}',
  allow_reentry BOOLEAN DEFAULT false,
  reentry_wait_days INTEGER DEFAULT 30,
  max_enrollments INTEGER,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  goal_type TEXT,
  goal_config JSONB,
  goal_segment_id UUID REFERENCES public.segments(id),
  entry_count INTEGER DEFAULT 0,
  active_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  exited_count INTEGER DEFAULT 0,
  goal_achieved_count INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5,2),
  avg_duration_hours NUMERIC(10,2),
  tags TEXT[],
  owner_id UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Campanhas
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type public.campaign_type NOT NULL,
  status public.campaign_status NOT NULL DEFAULT 'draft',
  subject TEXT,
  preview_text TEXT,
  content TEXT,
  content_html TEXT,
  template_id UUID REFERENCES public.email_templates(id),
  from_name TEXT,
  from_email TEXT,
  reply_to TEXT,
  segment_id UUID REFERENCES public.segments(id),
  target_list JSONB,
  exclusion_list JSONB,
  scheduled_at TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  budget NUMERIC(12,2),
  actual_cost NUMERIC(12,2) DEFAULT 0,
  cost_per_send NUMERIC(8,4),
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  unique_opens INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  conversion_value NUMERIC(12,2) DEFAULT 0,
  unsubscribe_count INTEGER DEFAULT 0,
  bounce_count INTEGER DEFAULT 0,
  complaint_count INTEGER DEFAULT 0,
  open_rate NUMERIC(5,2),
  click_rate NUMERIC(5,2),
  conversion_rate NUMERIC(5,2),
  unsubscribe_rate NUMERIC(5,2),
  bounce_rate NUMERIC(5,2),
  is_ab_test BOOLEAN DEFAULT false,
  ab_variants JSONB,
  ab_winner_criteria TEXT,
  ab_test_duration_hours INTEGER,
  ab_winner_variant_id TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}',
  owner_id UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Membros de Campanha
CREATE TABLE public.campaign_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id),
  lead_id UUID REFERENCES public.leads(id),
  email TEXT,
  phone TEXT,
  status public.campaign_member_status NOT NULL DEFAULT 'pending',
  variant_id TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  open_count INTEGER DEFAULT 0,
  first_open_at TIMESTAMPTZ,
  last_open_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  click_count INTEGER DEFAULT 0,
  first_click_at TIMESTAMPTZ,
  last_click_at TIMESTAMPTZ,
  clicked_links JSONB DEFAULT '[]',
  converted_at TIMESTAMPTZ,
  conversion_value NUMERIC(12,2),
  unsubscribed_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  bounce_type TEXT,
  bounce_reason TEXT,
  complained_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  device_type TEXT,
  email_client TEXT,
  os TEXT,
  browser TEXT,
  ip_address TEXT,
  location JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Steps da Jornada
CREATE TABLE public.journey_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journey_id UUID NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  step_key TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  type public.journey_step_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  wait_duration_value INTEGER,
  wait_duration_unit TEXT,
  wait_until_time TEXT,
  wait_until_day TEXT,
  conditions JSONB DEFAULT '[]',
  next_step_on_success TEXT,
  next_step_on_failure TEXT,
  branches JSONB DEFAULT '[]',
  entered_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  avg_duration_ms INTEGER,
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  is_entry_point BOOLEAN DEFAULT false,
  is_exit_point BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(journey_id, step_key)
);

-- Tabela de Enrollments na Jornada
CREATE TABLE public.journey_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journey_id UUID NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id),
  lead_id UUID REFERENCES public.leads(id),
  status public.enrollment_status NOT NULL DEFAULT 'active',
  current_step_id UUID REFERENCES public.journey_steps(id),
  current_step_key TEXT,
  entered_at TIMESTAMPTZ DEFAULT now(),
  last_step_at TIMESTAMPTZ,
  next_step_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  exited_at TIMESTAMPTZ,
  exit_reason TEXT,
  goal_achieved_at TIMESTAMPTZ,
  context JSONB DEFAULT '{}',
  step_history JSONB DEFAULT '[]',
  entry_source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Consentimentos Marketing
CREATE TABLE public.marketing_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id),
  lead_id UUID REFERENCES public.leads(id),
  email TEXT,
  phone TEXT,
  email_marketing BOOLEAN DEFAULT false,
  sms_marketing BOOLEAN DEFAULT false,
  whatsapp_marketing BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT false,
  phone_calls BOOLEAN DEFAULT false,
  preferred_frequency TEXT DEFAULT 'weekly',
  preferred_time TEXT,
  preferred_language TEXT DEFAULT 'pt-BR',
  interests TEXT[],
  global_unsubscribe BOOLEAN DEFAULT false,
  unsubscribed_at TIMESTAMPTZ,
  unsubscribe_reason TEXT,
  last_consent_update TIMESTAMPTZ DEFAULT now(),
  consent_source TEXT,
  consent_ip TEXT,
  consent_user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Links de Campanha
CREATE TABLE public.campaign_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  tracking_url TEXT NOT NULL,
  short_code TEXT NOT NULL,
  name TEXT,
  click_count INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Eventos de Marketing
CREATE TABLE public.marketing_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_category TEXT,
  contact_id UUID REFERENCES public.contacts(id),
  lead_id UUID REFERENCES public.leads(id),
  campaign_id UUID REFERENCES public.campaigns(id),
  journey_id UUID REFERENCES public.journeys(id),
  properties JSONB DEFAULT '{}',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  referrer TEXT,
  landing_page TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  ip_address TEXT,
  location JSONB,
  session_id TEXT,
  page_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Forms de Marketing
CREATE TABLE public.marketing_forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  fields JSONB NOT NULL DEFAULT '[]',
  submit_button_text TEXT DEFAULT 'Enviar',
  success_message TEXT,
  redirect_url TEXT,
  style_config JSONB DEFAULT '{}',
  create_lead BOOLEAN DEFAULT true,
  assign_to_owner UUID REFERENCES public.profiles(id),
  add_to_segment_id UUID REFERENCES public.segments(id),
  enroll_in_journey_id UUID REFERENCES public.journeys(id),
  notify_emails TEXT[],
  enable_captcha BOOLEAN DEFAULT true,
  double_opt_in BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  submission_count INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5,2),
  is_active BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ,
  embed_code TEXT,
  public_url TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Submissions de Forms
CREATE TABLE public.form_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES public.marketing_forms(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  lead_id UUID REFERENCES public.leads(id),
  contact_id UUID REFERENCES public.contacts(id),
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  page_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para Marketing
CREATE INDEX idx_email_templates_org ON public.email_templates(organization_id);
CREATE INDEX idx_campaigns_org ON public.campaigns(organization_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaigns_type ON public.campaigns(type);
CREATE INDEX idx_campaigns_dates ON public.campaigns(start_date, end_date);
CREATE INDEX idx_campaign_members_campaign ON public.campaign_members(campaign_id);
CREATE INDEX idx_campaign_members_contact ON public.campaign_members(contact_id);
CREATE INDEX idx_campaign_members_lead ON public.campaign_members(lead_id);
CREATE INDEX idx_campaign_members_status ON public.campaign_members(status);
CREATE INDEX idx_segments_org ON public.segments(organization_id);
CREATE INDEX idx_segment_members_segment ON public.segment_members(segment_id);
CREATE INDEX idx_journeys_org ON public.journeys(organization_id);
CREATE INDEX idx_journeys_status ON public.journeys(status);
CREATE INDEX idx_journey_steps_journey ON public.journey_steps(journey_id);
CREATE INDEX idx_journey_enrollments_journey ON public.journey_enrollments(journey_id);
CREATE INDEX idx_journey_enrollments_contact ON public.journey_enrollments(contact_id);
CREATE INDEX idx_journey_enrollments_status ON public.journey_enrollments(status);
CREATE INDEX idx_marketing_consents_org ON public.marketing_consents(organization_id);
CREATE INDEX idx_marketing_consents_email ON public.marketing_consents(email);
CREATE INDEX idx_marketing_events_org ON public.marketing_events(organization_id);
CREATE INDEX idx_marketing_events_name ON public.marketing_events(event_name);
CREATE INDEX idx_marketing_events_created ON public.marketing_events(created_at);
CREATE INDEX idx_marketing_forms_org ON public.marketing_forms(organization_id);
CREATE INDEX idx_form_submissions_form ON public.form_submissions(form_id);

-- Triggers para updated_at
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_segments_updated_at
  BEFORE UPDATE ON public.segments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_journeys_updated_at
  BEFORE UPDATE ON public.journeys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketing_consents_updated_at
  BEFORE UPDATE ON public.marketing_consents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketing_forms_updated_at
  BEFORE UPDATE ON public.marketing_forms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS para email_templates
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view templates in their org"
  ON public.email_templates FOR SELECT
  USING (is_member_of_org(organization_id) OR is_system = true);

CREATE POLICY "Users can create templates in their org"
  ON public.email_templates FOR INSERT
  WITH CHECK (is_member_of_org(organization_id));

CREATE POLICY "Users can update templates in their org"
  ON public.email_templates FOR UPDATE
  USING (is_member_of_org(organization_id))
  WITH CHECK (is_member_of_org(organization_id));

CREATE POLICY "Managers can delete templates"
  ON public.email_templates FOR DELETE
  USING (is_member_of_org(organization_id) AND (user_has_role(auth.uid(), 'manager') OR user_has_role(auth.uid(), 'admin')));

-- RLS para campaigns
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view campaigns in their org"
  ON public.campaigns FOR SELECT
  USING (is_member_of_org(organization_id));

CREATE POLICY "Users can create campaigns in their org"
  ON public.campaigns FOR INSERT
  WITH CHECK (is_member_of_org(organization_id));

CREATE POLICY "Users can update campaigns in their org"
  ON public.campaigns FOR UPDATE
  USING (is_member_of_org(organization_id))
  WITH CHECK (is_member_of_org(organization_id));

CREATE POLICY "Managers can delete campaigns"
  ON public.campaigns FOR DELETE
  USING (is_member_of_org(organization_id) AND (user_has_role(auth.uid(), 'manager') OR user_has_role(auth.uid(), 'admin')));

-- RLS para campaign_members
ALTER TABLE public.campaign_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage campaign members in their org"
  ON public.campaign_members FOR ALL
  USING (is_member_of_org(organization_id))
  WITH CHECK (is_member_of_org(organization_id));

-- RLS para segments
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view segments in their org"
  ON public.segments FOR SELECT
  USING (is_member_of_org(organization_id));

CREATE POLICY "Users can create segments in their org"
  ON public.segments FOR INSERT
  WITH CHECK (is_member_of_org(organization_id));

CREATE POLICY "Users can update segments in their org"
  ON public.segments FOR UPDATE
  USING (is_member_of_org(organization_id))
  WITH CHECK (is_member_of_org(organization_id));

CREATE POLICY "Managers can delete segments"
  ON public.segments FOR DELETE
  USING (is_member_of_org(organization_id) AND (user_has_role(auth.uid(), 'manager') OR user_has_role(auth.uid(), 'admin')));

-- RLS para segment_members
ALTER TABLE public.segment_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage segment members via segment access"
  ON public.segment_members FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.segments s 
    WHERE s.id = segment_members.segment_id 
    AND is_member_of_org(s.organization_id)
  ));

-- RLS para journeys
ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view journeys in their org"
  ON public.journeys FOR SELECT
  USING (is_member_of_org(organization_id));

CREATE POLICY "Users can create journeys in their org"
  ON public.journeys FOR INSERT
  WITH CHECK (is_member_of_org(organization_id));

CREATE POLICY "Users can update journeys in their org"
  ON public.journeys FOR UPDATE
  USING (is_member_of_org(organization_id))
  WITH CHECK (is_member_of_org(organization_id));

CREATE POLICY "Managers can delete journeys"
  ON public.journeys FOR DELETE
  USING (is_member_of_org(organization_id) AND (user_has_role(auth.uid(), 'manager') OR user_has_role(auth.uid(), 'admin')));

-- RLS para journey_steps
ALTER TABLE public.journey_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage journey steps via journey access"
  ON public.journey_steps FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.journeys j 
    WHERE j.id = journey_steps.journey_id 
    AND is_member_of_org(j.organization_id)
  ));

-- RLS para journey_enrollments
ALTER TABLE public.journey_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view enrollments in their org"
  ON public.journey_enrollments FOR SELECT
  USING (is_member_of_org(organization_id));

CREATE POLICY "System can manage enrollments"
  ON public.journey_enrollments FOR ALL
  USING (is_member_of_org(organization_id))
  WITH CHECK (is_member_of_org(organization_id));

-- RLS para marketing_consents
ALTER TABLE public.marketing_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage consents in their org"
  ON public.marketing_consents FOR ALL
  USING (is_member_of_org(organization_id))
  WITH CHECK (is_member_of_org(organization_id));

-- RLS para campaign_links
ALTER TABLE public.campaign_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage links via campaign access"
  ON public.campaign_links FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.campaigns c 
    WHERE c.id = campaign_links.campaign_id 
    AND is_member_of_org(c.organization_id)
  ));

-- RLS para marketing_events
ALTER TABLE public.marketing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view events in their org"
  ON public.marketing_events FOR SELECT
  USING (is_member_of_org(organization_id));

CREATE POLICY "System can create events"
  ON public.marketing_events FOR INSERT
  WITH CHECK (is_member_of_org(organization_id));

-- RLS para marketing_forms
ALTER TABLE public.marketing_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage forms in their org"
  ON public.marketing_forms FOR ALL
  USING (is_member_of_org(organization_id))
  WITH CHECK (is_member_of_org(organization_id));

-- RLS para form_submissions
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view submissions in their org"
  ON public.form_submissions FOR SELECT
  USING (is_member_of_org(organization_id));

CREATE POLICY "Anyone can submit forms"
  ON public.form_submissions FOR INSERT
  WITH CHECK (is_member_of_org(organization_id));

-- Função para calcular membros do segmento
CREATE OR REPLACE FUNCTION public.calculate_segment_members(p_segment_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_segment RECORD;
  v_count INTEGER := 0;
BEGIN
  SELECT * INTO v_segment FROM segments WHERE id = p_segment_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  IF v_segment.type = 'static' THEN
    SELECT COUNT(*) INTO v_count FROM segment_members WHERE segment_id = p_segment_id;
  ELSE
    IF v_segment.entity_type = 'contact' THEN
      SELECT COUNT(*) INTO v_count FROM contacts WHERE organization_id = v_segment.organization_id;
    ELSIF v_segment.entity_type = 'lead' THEN
      SELECT COUNT(*) INTO v_count FROM leads WHERE organization_id = v_segment.organization_id;
    ELSIF v_segment.entity_type = 'account' THEN
      SELECT COUNT(*) INTO v_count FROM accounts WHERE organization_id = v_segment.organization_id;
    END IF;
  END IF;
  
  UPDATE segments 
  SET member_count = v_count, 
      last_calculated_at = now()
  WHERE id = p_segment_id;
  
  RETURN v_count;
END;
$$;

-- Função para atualizar métricas de campanha
CREATE OR REPLACE FUNCTION public.update_campaign_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    UPDATE campaigns
    SET 
      sent_count = (SELECT COUNT(*) FROM campaign_members WHERE campaign_id = NEW.campaign_id AND status != 'pending'),
      delivered_count = (SELECT COUNT(*) FROM campaign_members WHERE campaign_id = NEW.campaign_id AND delivered_at IS NOT NULL),
      open_count = (SELECT SUM(open_count) FROM campaign_members WHERE campaign_id = NEW.campaign_id),
      unique_opens = (SELECT COUNT(*) FROM campaign_members WHERE campaign_id = NEW.campaign_id AND opened_at IS NOT NULL),
      click_count = (SELECT SUM(click_count) FROM campaign_members WHERE campaign_id = NEW.campaign_id),
      unique_clicks = (SELECT COUNT(*) FROM campaign_members WHERE campaign_id = NEW.campaign_id AND clicked_at IS NOT NULL),
      conversion_count = (SELECT COUNT(*) FROM campaign_members WHERE campaign_id = NEW.campaign_id AND converted_at IS NOT NULL),
      unsubscribe_count = (SELECT COUNT(*) FROM campaign_members WHERE campaign_id = NEW.campaign_id AND unsubscribed_at IS NOT NULL),
      bounce_count = (SELECT COUNT(*) FROM campaign_members WHERE campaign_id = NEW.campaign_id AND bounced_at IS NOT NULL),
      updated_at = now()
    WHERE id = NEW.campaign_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_campaign_metrics
  AFTER UPDATE ON public.campaign_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_campaign_metrics();