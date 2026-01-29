-- ========================================
-- PHASE 6: GOVERNANCE + SERVICE COMPLETION
-- Critical Security + LGPD Compliance
-- ========================================

-- 1. Create user_roles table using existing user_role enum
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'user',
  granted_by UUID REFERENCES public.profiles(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Security definer function to check roles from new table
CREATE OR REPLACE FUNCTION public.user_has_role(_user_id UUID, _role public.user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND is_active = true
      AND revoked_at IS NULL
  )
$$;

-- Function to get user's highest role
CREATE OR REPLACE FUNCTION public.get_user_highest_role(_user_id UUID)
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
    AND is_active = true
    AND revoked_at IS NULL
  ORDER BY 
    CASE role 
      WHEN 'admin' THEN 1 
      WHEN 'manager' THEN 2 
      WHEN 'user' THEN 3 
    END
  LIMIT 1
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles in org"
  ON public.user_roles FOR SELECT
  USING (
    public.user_has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.user_has_role(auth.uid(), 'admin'))
  WITH CHECK (public.user_has_role(auth.uid(), 'admin'));

-- 3. LGPD Request Types
DO $$ BEGIN
  CREATE TYPE public.lgpd_request_type AS ENUM (
    'access',
    'rectification',
    'deletion',
    'portability',
    'objection',
    'restriction'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.lgpd_status AS ENUM (
    'received',
    'verified',
    'processing',
    'completed',
    'denied',
    'expired'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 4. LGPD Requests table
CREATE TABLE IF NOT EXISTS public.lgpd_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  type public.lgpd_request_type NOT NULL,
  status public.lgpd_status NOT NULL DEFAULT 'received',
  requester_email TEXT NOT NULL,
  requester_name TEXT,
  requester_document TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  verification_method TEXT,
  verification_token TEXT,
  request_details TEXT,
  response_notes TEXT,
  data_export_path TEXT,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES public.profiles(id),
  denied_reason TEXT,
  deadline TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 days'),
  priority TEXT DEFAULT 'normal',
  attachments JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lgpd_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view LGPD requests in their org"
  ON public.lgpd_requests FOR SELECT
  USING (is_member_of_org(organization_id));

CREATE POLICY "Admins can manage LGPD requests"
  ON public.lgpd_requests FOR ALL
  USING (is_member_of_org(organization_id) AND public.user_has_role(auth.uid(), 'admin'))
  WITH CHECK (is_member_of_org(organization_id) AND public.user_has_role(auth.uid(), 'admin'));

-- 5. Data Retention Policies
CREATE TABLE IF NOT EXISTS public.data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  entity_type TEXT NOT NULL,
  retention_days INT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('archive', 'anonymize', 'delete')),
  conditions JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  records_affected INT DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view retention policies in org"
  ON public.data_retention_policies FOR SELECT
  USING (is_member_of_org(organization_id));

CREATE POLICY "Admins can manage retention policies"
  ON public.data_retention_policies FOR ALL
  USING (is_member_of_org(organization_id) AND public.user_has_role(auth.uid(), 'admin'))
  WITH CHECK (is_member_of_org(organization_id) AND public.user_has_role(auth.uid(), 'admin'));

-- 6. Consent Log
CREATE TABLE IF NOT EXISTS public.consent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  consent_type TEXT NOT NULL,
  channel TEXT,
  action TEXT NOT NULL CHECK (action IN ('granted', 'revoked', 'updated')),
  previous_status TEXT,
  new_status TEXT,
  legal_basis TEXT,
  purpose TEXT,
  source TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.consent_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view consent logs in org"
  ON public.consent_log FOR SELECT
  USING (is_member_of_org(organization_id));

CREATE POLICY "System can create consent logs"
  ON public.consent_log FOR INSERT
  WITH CHECK (is_member_of_org(organization_id));

-- 7. Customer Health Scores
CREATE TABLE IF NOT EXISTS public.customer_health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  score INT NOT NULL CHECK (score >= 0 AND score <= 100),
  previous_score INT,
  trend TEXT CHECK (trend IN ('improving', 'stable', 'declining')),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  factors JSONB NOT NULL DEFAULT '{}',
  usage_score INT,
  engagement_score INT,
  support_score INT,
  payment_score INT,
  nps_score INT,
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  next_calculation_at TIMESTAMPTZ,
  alerts JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(account_id)
);

ALTER TABLE public.customer_health_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view health scores in org"
  ON public.customer_health_scores FOR SELECT
  USING (is_member_of_org(organization_id));

CREATE POLICY "Users can manage health scores in org"
  ON public.customer_health_scores FOR ALL
  USING (is_member_of_org(organization_id))
  WITH CHECK (is_member_of_org(organization_id));

-- 8. Playbook Type Enum
DO $$ BEGIN
  CREATE TYPE public.playbook_type AS ENUM (
    'onboarding',
    'adoption',
    'renewal',
    'expansion',
    'risk_mitigation',
    'reactivation',
    'offboarding'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 9. Customer Success Playbooks
CREATE TABLE IF NOT EXISTS public.customer_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type public.playbook_type NOT NULL,
  trigger_conditions JSONB DEFAULT '{}',
  steps JSONB NOT NULL DEFAULT '[]',
  duration_days INT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  auto_enroll BOOLEAN NOT NULL DEFAULT false,
  success_criteria JSONB DEFAULT '{}',
  owner_id UUID REFERENCES public.profiles(id),
  enrollment_count INT DEFAULT 0,
  success_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_playbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view playbooks in org"
  ON public.customer_playbooks FOR SELECT
  USING (is_member_of_org(organization_id));

CREATE POLICY "Managers can manage playbooks"
  ON public.customer_playbooks FOR ALL
  USING (is_member_of_org(organization_id) AND (public.user_has_role(auth.uid(), 'manager') OR public.user_has_role(auth.uid(), 'admin')))
  WITH CHECK (is_member_of_org(organization_id) AND (public.user_has_role(auth.uid(), 'manager') OR public.user_has_role(auth.uid(), 'admin')));

-- 10. Playbook Enrollments
CREATE TABLE IF NOT EXISTS public.playbook_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  playbook_id UUID NOT NULL REFERENCES public.customer_playbooks(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled', 'failed')),
  current_step INT NOT NULL DEFAULT 1,
  progress_percent INT DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paused_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  success BOOLEAN,
  outcome_notes TEXT,
  step_history JSONB DEFAULT '[]',
  next_step_due TIMESTAMPTZ,
  assigned_to UUID REFERENCES public.profiles(id),
  enrolled_by UUID REFERENCES public.profiles(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.playbook_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view enrollments in org"
  ON public.playbook_enrollments FOR SELECT
  USING (is_member_of_org(organization_id));

CREATE POLICY "Users can manage enrollments in org"
  ON public.playbook_enrollments FOR ALL
  USING (is_member_of_org(organization_id))
  WITH CHECK (is_member_of_org(organization_id));

-- 11. Triggers for updated_at
CREATE TRIGGER update_lgpd_requests_updated_at
  BEFORE UPDATE ON public.lgpd_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_data_retention_policies_updated_at
  BEFORE UPDATE ON public.data_retention_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_health_scores_updated_at
  BEFORE UPDATE ON public.customer_health_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_playbooks_updated_at
  BEFORE UPDATE ON public.customer_playbooks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_playbook_enrollments_updated_at
  BEFORE UPDATE ON public.playbook_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_lgpd_requests_org ON public.lgpd_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_lgpd_requests_status ON public.lgpd_requests(status);
CREATE INDEX IF NOT EXISTS idx_lgpd_requests_deadline ON public.lgpd_requests(deadline);
CREATE INDEX IF NOT EXISTS idx_consent_log_contact ON public.consent_log(contact_id);
CREATE INDEX IF NOT EXISTS idx_consent_log_lead ON public.consent_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_health_scores_account ON public.customer_health_scores(account_id);
CREATE INDEX IF NOT EXISTS idx_health_scores_risk ON public.customer_health_scores(risk_level);
CREATE INDEX IF NOT EXISTS idx_playbook_enrollments_account ON public.playbook_enrollments(account_id);
CREATE INDEX IF NOT EXISTS idx_playbook_enrollments_status ON public.playbook_enrollments(status);

-- 13. Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role, granted_at)
SELECT id, role, created_at
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 14. Function to calculate health score
CREATE OR REPLACE FUNCTION public.calculate_health_score(p_account_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score INT := 50;
  v_ticket_count INT;
  v_open_tickets INT;
  v_opp_count INT;
  v_won_opps INT;
  v_last_activity TIMESTAMPTZ;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status NOT IN ('resolved', 'closed'))
  INTO v_ticket_count, v_open_tickets
  FROM public.tickets
  WHERE account_id = p_account_id;
  
  SELECT COUNT(*), COUNT(*) FILTER (WHERE stage = 'closed_won')
  INTO v_opp_count, v_won_opps
  FROM public.opportunities
  WHERE account_id = p_account_id;
  
  SELECT MAX(created_at) INTO v_last_activity
  FROM public.activities
  WHERE account_id = p_account_id;
  
  v_score := v_score - (v_open_tickets * 5);
  v_score := v_score + (v_won_opps * 10);
  
  IF v_last_activity > now() - interval '7 days' THEN
    v_score := v_score + 10;
  ELSIF v_last_activity > now() - interval '30 days' THEN
    v_score := v_score + 5;
  ELSIF v_last_activity IS NULL OR v_last_activity < now() - interval '90 days' THEN
    v_score := v_score - 15;
  END IF;
  
  RETURN GREATEST(0, LEAST(100, v_score));
END;
$$;