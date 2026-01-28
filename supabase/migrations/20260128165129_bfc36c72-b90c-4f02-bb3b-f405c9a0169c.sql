-- Phase 4: Complete Fireware Sales - Database Schema

-- ===========================================
-- ENUMS
-- ===========================================

-- Contract status lifecycle
CREATE TYPE public.contract_status AS ENUM (
  'draft',
  'pending_approval',
  'sent',
  'negotiating',
  'signed',
  'active',
  'expired',
  'terminated',
  'renewed'
);

-- Approval request status
CREATE TYPE public.approval_request_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'cancelled',
  'escalated'
);

-- Approval type categories
CREATE TYPE public.approval_type AS ENUM (
  'discount',
  'special_terms',
  'contract',
  'price_override',
  'credit_limit',
  'exception'
);

-- Routing rule types
CREATE TYPE public.routing_rule_type AS ENUM (
  'round_robin',
  'territory',
  'segment',
  'load_balance',
  'skill_based',
  'priority'
);

-- ===========================================
-- CONTRACTS TABLE
-- ===========================================

CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contract_number TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Relationships
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Status and lifecycle
  status public.contract_status NOT NULL DEFAULT 'draft',
  
  -- Dates
  start_date DATE,
  end_date DATE,
  signed_date DATE,
  sent_date DATE,
  
  -- Financial
  total_value NUMERIC DEFAULT 0,
  recurring_value NUMERIC DEFAULT 0,
  billing_frequency TEXT DEFAULT 'monthly',
  payment_terms TEXT,
  
  -- Terms and conditions
  terms_and_conditions TEXT,
  special_conditions TEXT,
  
  -- Renewal tracking
  auto_renewal BOOLEAN DEFAULT false,
  renewal_notice_days INTEGER DEFAULT 30,
  renewal_reminder_sent BOOLEAN DEFAULT false,
  parent_contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  
  -- Version control
  version INTEGER DEFAULT 1,
  
  -- Metadata
  custom_fields JSONB DEFAULT '{}'::jsonb,
  tags TEXT[],
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT contracts_contract_number_org_unique UNIQUE (organization_id, contract_number)
);

-- Indexes for contracts
CREATE INDEX idx_contracts_organization ON public.contracts(organization_id);
CREATE INDEX idx_contracts_account ON public.contracts(account_id);
CREATE INDEX idx_contracts_status ON public.contracts(status);
CREATE INDEX idx_contracts_owner ON public.contracts(owner_id);
CREATE INDEX idx_contracts_end_date ON public.contracts(end_date);
CREATE INDEX idx_contracts_renewal ON public.contracts(auto_renewal, end_date) WHERE auto_renewal = true;

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contracts
CREATE POLICY "Users can view contracts in their org"
  ON public.contracts FOR SELECT
  USING (is_member_of_org(organization_id));

CREATE POLICY "Users can create contracts in their org"
  ON public.contracts FOR INSERT
  WITH CHECK (is_member_of_org(organization_id));

CREATE POLICY "Users can update contracts in their org"
  ON public.contracts FOR UPDATE
  USING (is_member_of_org(organization_id))
  WITH CHECK (is_member_of_org(organization_id));

CREATE POLICY "Users can delete contracts in their org"
  ON public.contracts FOR DELETE
  USING (is_member_of_org(organization_id));

-- Trigger for updated_at
CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- APPROVAL REQUESTS TABLE
-- ===========================================

CREATE TABLE public.approval_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- What needs approval
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  entity_name TEXT,
  approval_type public.approval_type NOT NULL,
  
  -- Request details
  title TEXT NOT NULL,
  description TEXT,
  reason TEXT,
  
  -- The values being requested
  requested_value JSONB DEFAULT '{}'::jsonb,
  original_value JSONB DEFAULT '{}'::jsonb,
  
  -- Approval chain
  requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approval_level INTEGER DEFAULT 1,
  max_approval_level INTEGER DEFAULT 1,
  
  -- Status
  status public.approval_request_status NOT NULL DEFAULT 'pending',
  
  -- Decision
  decision_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  decision_at TIMESTAMP WITH TIME ZONE,
  decision_notes TEXT,
  
  -- Escalation
  escalated_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  escalated_at TIMESTAMP WITH TIME ZONE,
  escalation_reason TEXT,
  
  -- Expiration
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for approval_requests
CREATE INDEX idx_approval_requests_organization ON public.approval_requests(organization_id);
CREATE INDEX idx_approval_requests_entity ON public.approval_requests(entity_type, entity_id);
CREATE INDEX idx_approval_requests_assigned_to ON public.approval_requests(assigned_to);
CREATE INDEX idx_approval_requests_requested_by ON public.approval_requests(requested_by);
CREATE INDEX idx_approval_requests_status ON public.approval_requests(status);
CREATE INDEX idx_approval_requests_pending ON public.approval_requests(assigned_to, status) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for approval_requests
CREATE POLICY "Users can view approval requests in their org"
  ON public.approval_requests FOR SELECT
  USING (is_member_of_org(organization_id));

CREATE POLICY "Users can create approval requests in their org"
  ON public.approval_requests FOR INSERT
  WITH CHECK (is_member_of_org(organization_id));

CREATE POLICY "Managers can update approval requests"
  ON public.approval_requests FOR UPDATE
  USING (is_member_of_org(organization_id) AND (
    assigned_to = auth.uid() OR 
    requested_by = auth.uid() OR 
    has_role('manager'::user_role) OR 
    has_role('admin'::user_role)
  ))
  WITH CHECK (is_member_of_org(organization_id));

-- Trigger for updated_at
CREATE TRIGGER update_approval_requests_updated_at
  BEFORE UPDATE ON public.approval_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- ATTACHMENTS TABLE
-- ===========================================

CREATE TABLE public.attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- File metadata
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  mime_type TEXT,
  
  -- Entity relationships (polymorphic)
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  
  -- Optional specific references
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  
  -- Version control
  version INTEGER DEFAULT 1,
  parent_attachment_id UUID REFERENCES public.attachments(id) ON DELETE SET NULL,
  is_latest BOOLEAN DEFAULT true,
  
  -- Categorization
  category TEXT,
  description TEXT,
  tags TEXT[],
  
  -- Access control
  is_public BOOLEAN DEFAULT false,
  access_level TEXT DEFAULT 'private',
  
  -- Upload info
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for attachments
CREATE INDEX idx_attachments_organization ON public.attachments(organization_id);
CREATE INDEX idx_attachments_entity ON public.attachments(entity_type, entity_id);
CREATE INDEX idx_attachments_account ON public.attachments(account_id);
CREATE INDEX idx_attachments_opportunity ON public.attachments(opportunity_id);
CREATE INDEX idx_attachments_quote ON public.attachments(quote_id);
CREATE INDEX idx_attachments_contract ON public.attachments(contract_id);
CREATE INDEX idx_attachments_uploaded_by ON public.attachments(uploaded_by);

-- Enable RLS
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attachments
CREATE POLICY "Users can view attachments in their org"
  ON public.attachments FOR SELECT
  USING (is_member_of_org(organization_id));

CREATE POLICY "Users can upload attachments in their org"
  ON public.attachments FOR INSERT
  WITH CHECK (is_member_of_org(organization_id));

CREATE POLICY "Users can update their own attachments"
  ON public.attachments FOR UPDATE
  USING (uploaded_by = auth.uid() OR has_role('admin'::user_role))
  WITH CHECK (is_member_of_org(organization_id));

CREATE POLICY "Users can delete their own attachments"
  ON public.attachments FOR DELETE
  USING (uploaded_by = auth.uid() OR has_role('admin'::user_role));

-- Trigger for updated_at
CREATE TRIGGER update_attachments_updated_at
  BEFORE UPDATE ON public.attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- ROUTING RULES TABLE
-- ===========================================

CREATE TABLE public.routing_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Rule identification
  name TEXT NOT NULL,
  description TEXT,
  
  -- Rule type and configuration
  rule_type public.routing_rule_type NOT NULL DEFAULT 'round_robin',
  entity_type TEXT NOT NULL DEFAULT 'lead',
  
  -- Conditions (when to apply this rule)
  conditions JSONB DEFAULT '[]'::jsonb,
  
  -- Actions (what to do when conditions match)
  actions JSONB DEFAULT '{}'::jsonb,
  
  -- Target assignments
  target_user_ids UUID[],
  target_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  target_territory_id UUID REFERENCES public.territories(id) ON DELETE SET NULL,
  
  -- Round-robin tracking
  last_assigned_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assignment_index INTEGER DEFAULT 0,
  
  -- Priority and ordering
  priority INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  -- Schedule (optional time-based activation)
  active_start_time TIME,
  active_end_time TIME,
  active_days TEXT[],
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for routing_rules
CREATE INDEX idx_routing_rules_organization ON public.routing_rules(organization_id);
CREATE INDEX idx_routing_rules_entity_type ON public.routing_rules(entity_type);
CREATE INDEX idx_routing_rules_active ON public.routing_rules(organization_id, is_active) WHERE is_active = true;
CREATE INDEX idx_routing_rules_priority ON public.routing_rules(organization_id, priority);

-- Enable RLS
ALTER TABLE public.routing_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for routing_rules
CREATE POLICY "Users can view routing rules in their org"
  ON public.routing_rules FOR SELECT
  USING (is_member_of_org(organization_id));

CREATE POLICY "Admins can manage routing rules"
  ON public.routing_rules FOR ALL
  USING (is_member_of_org(organization_id) AND has_role('admin'::user_role))
  WITH CHECK (is_member_of_org(organization_id) AND has_role('admin'::user_role));

-- Trigger for updated_at
CREATE TRIGGER update_routing_rules_updated_at
  BEFORE UPDATE ON public.routing_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- ASSIGNMENT LOG TABLE
-- ===========================================

CREATE TABLE public.assignment_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- What was assigned
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  entity_name TEXT,
  
  -- Who was assigned
  assigned_to UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_from UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- How it was assigned
  assignment_method TEXT NOT NULL DEFAULT 'manual',
  routing_rule_id UUID REFERENCES public.routing_rules(id) ON DELETE SET NULL,
  
  -- Reason and context
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for assignment_log
CREATE INDEX idx_assignment_log_organization ON public.assignment_log(organization_id);
CREATE INDEX idx_assignment_log_entity ON public.assignment_log(entity_type, entity_id);
CREATE INDEX idx_assignment_log_assigned_to ON public.assignment_log(assigned_to);
CREATE INDEX idx_assignment_log_routing_rule ON public.assignment_log(routing_rule_id);
CREATE INDEX idx_assignment_log_created_at ON public.assignment_log(created_at);

-- Enable RLS
ALTER TABLE public.assignment_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assignment_log
CREATE POLICY "Users can view assignment logs in their org"
  ON public.assignment_log FOR SELECT
  USING (is_member_of_org(organization_id));

CREATE POLICY "System can create assignment logs"
  ON public.assignment_log FOR INSERT
  WITH CHECK (is_member_of_org(organization_id));

-- ===========================================
-- NOTIFICATIONS TABLE (for alerts)
-- ===========================================

CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Target user
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Notification content
  title TEXT NOT NULL,
  message TEXT,
  type TEXT NOT NULL DEFAULT 'info',
  
  -- Related entity
  entity_type TEXT,
  entity_id UUID,
  link TEXT,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Priority and expiration
  priority TEXT DEFAULT 'normal',
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for notifications
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (is_member_of_org(organization_id));

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (user_id = auth.uid());

-- ===========================================
-- STALE DEAL SETTINGS (org-level configuration)
-- ===========================================

-- Add stale deal threshold to organization settings
-- This will be stored in organizations.settings JSONB field

-- ===========================================
-- STORAGE BUCKET FOR ATTACHMENTS
-- ===========================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  false,
  52428800,
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'text/plain', 'text/csv']
);

-- Storage policies for attachments bucket
CREATE POLICY "Users can view attachments in their org"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'attachments' AND
    EXISTS (
      SELECT 1 FROM public.attachments a
      WHERE a.file_path = name
      AND is_member_of_org(a.organization_id)
    )
  );

CREATE POLICY "Users can upload attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'attachments' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their attachments"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'attachments' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete their attachments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'attachments' AND
    auth.role() = 'authenticated'
  );

-- ===========================================
-- HELPER FUNCTIONS
-- ===========================================

-- Function to generate contract number
CREATE OR REPLACE FUNCTION public.generate_contract_number(org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_year TEXT;
BEGIN
  v_year := to_char(now(), 'YYYY');
  
  SELECT COUNT(*) + 1 INTO v_count
  FROM public.contracts
  WHERE organization_id = org_id
  AND created_at >= date_trunc('year', now());
  
  RETURN 'CTR-' || v_year || '-' || lpad(v_count::text, 5, '0');
END;
$$;

-- Function to check if deal is stale
CREATE OR REPLACE FUNCTION public.is_deal_stale(
  opp_id UUID,
  threshold_days INTEGER DEFAULT 14
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_activity TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get the most recent activity for this opportunity
  SELECT MAX(created_at) INTO v_last_activity
  FROM (
    SELECT created_at FROM public.activities WHERE opportunity_id = opp_id
    UNION ALL
    SELECT created_at FROM public.notes WHERE opportunity_id = opp_id
    UNION ALL
    SELECT created_at FROM public.timeline_events WHERE opportunity_id = opp_id
  ) recent_activity;
  
  -- If no activity found, use opportunity updated_at
  IF v_last_activity IS NULL THEN
    SELECT updated_at INTO v_last_activity
    FROM public.opportunities
    WHERE id = opp_id;
  END IF;
  
  RETURN v_last_activity < (now() - (threshold_days || ' days')::interval);
END;
$$;

-- Function to get stale opportunities count
CREATE OR REPLACE FUNCTION public.get_stale_opportunities_count(
  org_id UUID,
  threshold_days INTEGER DEFAULT 14
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.opportunities o
  WHERE o.organization_id = org_id
  AND o.stage NOT IN ('closed_won', 'closed_lost')
  AND public.is_deal_stale(o.id, threshold_days);
  
  RETURN v_count;
END;
$$;