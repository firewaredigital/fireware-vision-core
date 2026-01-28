-- =============================================
-- FIREWARE CRM - SALES MODULE DATABASE SCHEMA
-- =============================================

-- ENUMS
CREATE TYPE public.user_role AS ENUM ('user', 'manager', 'admin');
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'qualified', 'unqualified', 'converted');
CREATE TYPE public.opportunity_stage AS ENUM ('prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost');
CREATE TYPE public.activity_type AS ENUM ('call', 'email', 'meeting', 'task', 'note');
CREATE TYPE public.quote_status AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired');
CREATE TYPE public.cadence_step_type AS ENUM ('email', 'call', 'linkedin', 'task');
CREATE TYPE public.contact_role AS ENUM ('decision_maker', 'technical', 'financial', 'influencer', 'end_user', 'other');
CREATE TYPE public.forecast_category AS ENUM ('commit', 'best_case', 'pipeline', 'omitted');
CREATE TYPE public.timeline_event_type AS ENUM ('lead_created', 'lead_converted', 'opportunity_created', 'opportunity_stage_changed', 'opportunity_won', 'opportunity_lost', 'quote_created', 'quote_sent', 'activity_completed', 'note_added', 'contact_added', 'account_created');

-- =============================================
-- BASE TABLES
-- =============================================

-- Organizations (tenants)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Teams within organizations
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  parent_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  job_title TEXT,
  role public.user_role NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Territories
CREATE TABLE public.territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  region TEXT,
  parent_territory_id UUID REFERENCES public.territories(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  criteria JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Accounts (Companies)
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  address_street TEXT,
  address_city TEXT,
  address_state TEXT,
  address_postal_code TEXT,
  address_country TEXT,
  annual_revenue DECIMAL(15,2),
  employee_count INTEGER,
  description TEXT,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  territory_id UUID REFERENCES public.territories(id) ON DELETE SET NULL,
  parent_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  source TEXT,
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contacts
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  job_title TEXT,
  department TEXT,
  role public.contact_role DEFAULT 'other',
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  address_street TEXT,
  address_city TEXT,
  address_state TEXT,
  address_postal_code TEXT,
  address_country TEXT,
  description TEXT,
  do_not_call BOOLEAN DEFAULT false,
  do_not_email BOOLEAN DEFAULT false,
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Leads
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  company TEXT,
  job_title TEXT,
  industry TEXT,
  website TEXT,
  address_street TEXT,
  address_city TEXT,
  address_state TEXT,
  address_postal_code TEXT,
  address_country TEXT,
  status public.lead_status NOT NULL DEFAULT 'new',
  source TEXT,
  score INTEGER DEFAULT 0,
  rating TEXT,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  territory_id UUID REFERENCES public.territories(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,
  converted_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  converted_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  converted_opportunity_id UUID,
  description TEXT,
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Opportunity Stages (configurable per org)
CREATE TABLE public.opportunity_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  probability INTEGER NOT NULL DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  is_won BOOLEAN NOT NULL DEFAULT false,
  required_fields TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Opportunities
CREATE TABLE public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  stage public.opportunity_stage NOT NULL DEFAULT 'prospecting',
  stage_id UUID REFERENCES public.opportunity_stages(id) ON DELETE SET NULL,
  amount DECIMAL(15,2) DEFAULT 0,
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  expected_revenue DECIMAL(15,2) GENERATED ALWAYS AS (amount * probability / 100) STORED,
  close_date DATE,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  territory_id UUID REFERENCES public.territories(id) ON DELETE SET NULL,
  source TEXT,
  type TEXT,
  next_step TEXT,
  loss_reason TEXT,
  win_reason TEXT,
  competitor TEXT,
  forecast_category public.forecast_category DEFAULT 'pipeline',
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add reference from leads to opportunities (after opportunities table exists)
ALTER TABLE public.leads 
  ADD CONSTRAINT fk_leads_converted_opportunity 
  FOREIGN KEY (converted_opportunity_id) REFERENCES public.opportunities(id) ON DELETE SET NULL;

-- Opportunity Contacts (junction table for stakeholders)
CREATE TABLE public.opportunity_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  role public.contact_role DEFAULT 'other',
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(opportunity_id, contact_id)
);

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  category TEXT,
  unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  cost DECIMAL(15,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Price Lists
CREATE TABLE public.price_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Price List Items
CREATE TABLE public.price_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_list_id UUID NOT NULL REFERENCES public.price_lists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  unit_price DECIMAL(15,2) NOT NULL,
  min_quantity INTEGER DEFAULT 1,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(price_list_id, product_id)
);

-- Quotes
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  quote_number TEXT NOT NULL,
  name TEXT NOT NULL,
  status public.quote_status NOT NULL DEFAULT 'draft',
  valid_until DATE,
  subtotal DECIMAL(15,2) DEFAULT 0,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  tax_percent DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) DEFAULT 0,
  terms TEXT,
  notes TEXT,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  version INTEGER DEFAULT 1,
  parent_quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quote Items
CREATE TABLE public.quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(15,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activities
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type public.activity_type NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'open',
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
  duration_minutes INTEGER,
  outcome TEXT,
  call_result TEXT,
  meeting_location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notes (attachable to any record)
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cadences
CREATE TABLE public.cadences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  total_steps INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cadence Steps
CREATE TABLE public.cadence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cadence_id UUID NOT NULL REFERENCES public.cadences(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  type public.cadence_step_type NOT NULL,
  subject TEXT,
  body TEXT,
  delay_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cadence_id, step_number)
);

-- Cadence Enrollments
CREATE TABLE public.cadence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  cadence_id UUID NOT NULL REFERENCES public.cadences(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active',
  enrolled_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  next_step_due TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT contact_or_lead CHECK (contact_id IS NOT NULL OR lead_id IS NOT NULL)
);

-- Forecasts
CREATE TABLE public.forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type TEXT NOT NULL DEFAULT 'monthly',
  target_amount DECIMAL(15,2) DEFAULT 0,
  commit_amount DECIMAL(15,2) DEFAULT 0,
  best_case_amount DECIMAL(15,2) DEFAULT 0,
  pipeline_amount DECIMAL(15,2) DEFAULT 0,
  closed_amount DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, owner_id, period_start, period_end)
);

-- Timeline Events (Customer 360)
CREATE TABLE public.timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_type public.timeline_event_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Win/Loss Reasons (configurable per org)
CREATE TABLE public.win_loss_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('win', 'loss')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lead Sources (configurable per org)
CREATE TABLE public.lead_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_profiles_organization ON public.profiles(organization_id);
CREATE INDEX idx_profiles_team ON public.profiles(team_id);
CREATE INDEX idx_teams_organization ON public.teams(organization_id);
CREATE INDEX idx_accounts_organization ON public.accounts(organization_id);
CREATE INDEX idx_accounts_owner ON public.accounts(owner_id);
CREATE INDEX idx_accounts_territory ON public.accounts(territory_id);
CREATE INDEX idx_contacts_organization ON public.contacts(organization_id);
CREATE INDEX idx_contacts_account ON public.contacts(account_id);
CREATE INDEX idx_contacts_owner ON public.contacts(owner_id);
CREATE INDEX idx_leads_organization ON public.leads(organization_id);
CREATE INDEX idx_leads_owner ON public.leads(owner_id);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_opportunities_organization ON public.opportunities(organization_id);
CREATE INDEX idx_opportunities_account ON public.opportunities(account_id);
CREATE INDEX idx_opportunities_owner ON public.opportunities(owner_id);
CREATE INDEX idx_opportunities_stage ON public.opportunities(stage);
CREATE INDEX idx_opportunities_close_date ON public.opportunities(close_date);
CREATE INDEX idx_activities_organization ON public.activities(organization_id);
CREATE INDEX idx_activities_owner ON public.activities(owner_id);
CREATE INDEX idx_activities_due_date ON public.activities(due_date);
CREATE INDEX idx_quotes_organization ON public.quotes(organization_id);
CREATE INDEX idx_quotes_opportunity ON public.quotes(opportunity_id);
CREATE INDEX idx_timeline_events_account ON public.timeline_events(account_id);
CREATE INDEX idx_timeline_events_contact ON public.timeline_events(contact_id);
CREATE INDEX idx_timeline_events_lead ON public.timeline_events(lead_id);
CREATE INDEX idx_timeline_events_opportunity ON public.timeline_events(opportunity_id);
CREATE INDEX idx_timeline_events_created_at ON public.timeline_events(created_at DESC);
CREATE INDEX idx_forecasts_owner ON public.forecasts(owner_id);
CREATE INDEX idx_forecasts_period ON public.forecasts(period_start, period_end);
CREATE INDEX idx_cadence_enrollments_cadence ON public.cadence_enrollments(cadence_id);
CREATE INDEX idx_cadence_enrollments_contact ON public.cadence_enrollments(contact_id);
CREATE INDEX idx_cadence_enrollments_lead ON public.cadence_enrollments(lead_id);

-- =============================================
-- HELPER FUNCTIONS (SECURITY DEFINER)
-- =============================================

-- Get the current user's organization ID
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Get the current user's team ID
CREATE OR REPLACE FUNCTION public.get_user_team_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Check if user is member of organization
CREATE OR REPLACE FUNCTION public.is_member_of_org(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND organization_id = org_id
  )
$$;

-- Check if user is manager of team
CREATE OR REPLACE FUNCTION public.is_manager_of_team(team_id_param UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND team_id = team_id_param 
    AND role IN ('manager', 'admin')
  )
$$;

-- Check if user has role
CREATE OR REPLACE FUNCTION public.has_role(role_name public.user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = role_name
  )
$$;

-- =============================================
-- TRIGGER FUNCTIONS
-- =============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create timeline event on opportunity stage change
CREATE OR REPLACE FUNCTION public.log_opportunity_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO public.timeline_events (
      organization_id, event_type, title, description, metadata,
      created_by, account_id, opportunity_id
    ) VALUES (
      NEW.organization_id,
      CASE 
        WHEN NEW.stage = 'closed_won' THEN 'opportunity_won'::public.timeline_event_type
        WHEN NEW.stage = 'closed_lost' THEN 'opportunity_lost'::public.timeline_event_type
        ELSE 'opportunity_stage_changed'::public.timeline_event_type
      END,
      'Stage changed to ' || NEW.stage,
      'Opportunity "' || NEW.name || '" moved from ' || OLD.stage || ' to ' || NEW.stage,
      jsonb_build_object('old_stage', OLD.stage, 'new_stage', NEW.stage, 'amount', NEW.amount),
      NEW.owner_id,
      NEW.account_id,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update quote totals
CREATE OR REPLACE FUNCTION public.calculate_quote_totals()
RETURNS TRIGGER AS $$
DECLARE
  quote_record RECORD;
BEGIN
  SELECT 
    COALESCE(SUM(total), 0) as subtotal
  INTO quote_record
  FROM public.quote_items 
  WHERE quote_id = COALESCE(NEW.quote_id, OLD.quote_id);
  
  UPDATE public.quotes SET
    subtotal = quote_record.subtotal,
    discount_amount = quote_record.subtotal * discount_percent / 100,
    tax_amount = (quote_record.subtotal - (quote_record.subtotal * discount_percent / 100)) * tax_percent / 100,
    total = (quote_record.subtotal - (quote_record.subtotal * discount_percent / 100)) * (1 + tax_percent / 100),
    updated_at = now()
  WHERE id = COALESCE(NEW.quote_id, OLD.quote_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =============================================
-- TRIGGERS
-- =============================================

-- Auth trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cadences_updated_at BEFORE UPDATE ON public.cadences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_territories_updated_at BEFORE UPDATE ON public.territories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_forecasts_updated_at BEFORE UPDATE ON public.forecasts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Opportunity stage change trigger
CREATE TRIGGER on_opportunity_stage_change
  AFTER UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.log_opportunity_stage_change();

-- Quote totals trigger
CREATE TRIGGER on_quote_item_change
  AFTER INSERT OR UPDATE OR DELETE ON public.quote_items
  FOR EACH ROW EXECUTE FUNCTION public.calculate_quote_totals();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cadences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cadence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cadence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.win_loss_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Organizations: Users can only see their own organization
CREATE POLICY "Users can view their organization" ON public.organizations
  FOR SELECT USING (public.is_member_of_org(id));

-- Teams: Users can see teams in their organization
CREATE POLICY "Users can view teams in their org" ON public.teams
  FOR SELECT USING (public.is_member_of_org(organization_id));

CREATE POLICY "Admins can manage teams" ON public.teams
  FOR ALL USING (public.is_member_of_org(organization_id) AND public.has_role('admin'))
  WITH CHECK (public.is_member_of_org(organization_id) AND public.has_role('admin'));

-- Profiles: Users can see profiles in their organization
CREATE POLICY "Users can view profiles in their org" ON public.profiles
  FOR SELECT USING (public.is_member_of_org(organization_id) OR id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Accounts
CREATE POLICY "Users can view accounts in their org" ON public.accounts
  FOR SELECT USING (public.is_member_of_org(organization_id));

CREATE POLICY "Users can create accounts in their org" ON public.accounts
  FOR INSERT WITH CHECK (public.is_member_of_org(organization_id));

CREATE POLICY "Users can update accounts in their org" ON public.accounts
  FOR UPDATE USING (public.is_member_of_org(organization_id))
  WITH CHECK (public.is_member_of_org(organization_id));

CREATE POLICY "Users can delete accounts in their org" ON public.accounts
  FOR DELETE USING (public.is_member_of_org(organization_id));

-- Contacts
CREATE POLICY "Users can view contacts in their org" ON public.contacts
  FOR SELECT USING (public.is_member_of_org(organization_id));

CREATE POLICY "Users can create contacts in their org" ON public.contacts
  FOR INSERT WITH CHECK (public.is_member_of_org(organization_id));

CREATE POLICY "Users can update contacts in their org" ON public.contacts
  FOR UPDATE USING (public.is_member_of_org(organization_id))
  WITH CHECK (public.is_member_of_org(organization_id));

CREATE POLICY "Users can delete contacts in their org" ON public.contacts
  FOR DELETE USING (public.is_member_of_org(organization_id));

-- Leads
CREATE POLICY "Users can view leads in their org" ON public.leads
  FOR SELECT USING (public.is_member_of_org(organization_id));

CREATE POLICY "Users can create leads in their org" ON public.leads
  FOR INSERT WITH CHECK (public.is_member_of_org(organization_id));

CREATE POLICY "Users can update leads in their org" ON public.leads
  FOR UPDATE USING (public.is_member_of_org(organization_id))
  WITH CHECK (public.is_member_of_org(organization_id));

CREATE POLICY "Users can delete leads in their org" ON public.leads
  FOR DELETE USING (public.is_member_of_org(organization_id));

-- Opportunities
CREATE POLICY "Users can view opportunities in their org" ON public.opportunities
  FOR SELECT USING (public.is_member_of_org(organization_id));

CREATE POLICY "Users can create opportunities in their org" ON public.opportunities
  FOR INSERT WITH CHECK (public.is_member_of_org(organization_id));

CREATE POLICY "Users can update opportunities in their org" ON public.opportunities
  FOR UPDATE USING (public.is_member_of_org(organization_id))
  WITH CHECK (public.is_member_of_org(organization_id));

CREATE POLICY "Users can delete opportunities in their org" ON public.opportunities
  FOR DELETE USING (public.is_member_of_org(organization_id));

-- Opportunity Contacts
CREATE POLICY "Users can manage opportunity contacts" ON public.opportunity_contacts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.opportunities o 
      WHERE o.id = opportunity_id 
      AND public.is_member_of_org(o.organization_id)
    )
  );

-- Opportunity Stages
CREATE POLICY "Users can view stages in their org" ON public.opportunity_stages
  FOR SELECT USING (public.is_member_of_org(organization_id));

CREATE POLICY "Admins can manage stages" ON public.opportunity_stages
  FOR ALL USING (public.is_member_of_org(organization_id) AND public.has_role('admin'))
  WITH CHECK (public.is_member_of_org(organization_id) AND public.has_role('admin'));

-- Products
CREATE POLICY "Users can view products in their org" ON public.products
  FOR SELECT USING (public.is_member_of_org(organization_id));

CREATE POLICY "Users can create products in their org" ON public.products
  FOR INSERT WITH CHECK (public.is_member_of_org(organization_id));

CREATE POLICY "Users can update products in their org" ON public.products
  FOR UPDATE USING (public.is_member_of_org(organization_id))
  WITH CHECK (public.is_member_of_org(organization_id));

CREATE POLICY "Users can delete products in their org" ON public.products
  FOR DELETE USING (public.is_member_of_org(organization_id));

-- Price Lists
CREATE POLICY "Users can view price lists in their org" ON public.price_lists
  FOR SELECT USING (public.is_member_of_org(organization_id));

CREATE POLICY "Admins can manage price lists" ON public.price_lists
  FOR ALL USING (public.is_member_of_org(organization_id) AND public.has_role('admin'))
  WITH CHECK (public.is_member_of_org(organization_id) AND public.has_role('admin'));

-- Price List Items
CREATE POLICY "Users can view price list items" ON public.price_list_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.price_lists pl 
      WHERE pl.id = price_list_id 
      AND public.is_member_of_org(pl.organization_id)
    )
  );

-- Quotes
CREATE POLICY "Users can view quotes in their org" ON public.quotes
  FOR SELECT USING (public.is_member_of_org(organization_id));

CREATE POLICY "Users can create quotes in their org" ON public.quotes
  FOR INSERT WITH CHECK (public.is_member_of_org(organization_id));

CREATE POLICY "Users can update quotes in their org" ON public.quotes
  FOR UPDATE USING (public.is_member_of_org(organization_id))
  WITH CHECK (public.is_member_of_org(organization_id));

CREATE POLICY "Users can delete quotes in their org" ON public.quotes
  FOR DELETE USING (public.is_member_of_org(organization_id));

-- Quote Items
CREATE POLICY "Users can manage quote items" ON public.quote_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.quotes q 
      WHERE q.id = quote_id 
      AND public.is_member_of_org(q.organization_id)
    )
  );

-- Activities
CREATE POLICY "Users can view activities in their org" ON public.activities
  FOR SELECT USING (public.is_member_of_org(organization_id));

CREATE POLICY "Users can create activities in their org" ON public.activities
  FOR INSERT WITH CHECK (public.is_member_of_org(organization_id));

CREATE POLICY "Users can update activities in their org" ON public.activities
  FOR UPDATE USING (public.is_member_of_org(organization_id))
  WITH CHECK (public.is_member_of_org(organization_id));

CREATE POLICY "Users can delete activities in their org" ON public.activities
  FOR DELETE USING (public.is_member_of_org(organization_id));

-- Notes
CREATE POLICY "Users can view notes in their org" ON public.notes
  FOR SELECT USING (public.is_member_of_org(organization_id));

CREATE POLICY "Users can create notes in their org" ON public.notes
  FOR INSERT WITH CHECK (public.is_member_of_org(organization_id));

CREATE POLICY "Users can update their own notes" ON public.notes
  FOR UPDATE USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete their own notes" ON public.notes
  FOR DELETE USING (owner_id = auth.uid());

-- Cadences
CREATE POLICY "Users can view cadences in their org" ON public.cadences
  FOR SELECT USING (public.is_member_of_org(organization_id));

CREATE POLICY "Users can create cadences in their org" ON public.cadences
  FOR INSERT WITH CHECK (public.is_member_of_org(organization_id));

CREATE POLICY "Users can update cadences in their org" ON public.cadences
  FOR UPDATE USING (public.is_member_of_org(organization_id))
  WITH CHECK (public.is_member_of_org(organization_id));

CREATE POLICY "Users can delete cadences in their org" ON public.cadences
  FOR DELETE USING (public.is_member_of_org(organization_id));

-- Cadence Steps
CREATE POLICY "Users can manage cadence steps" ON public.cadence_steps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.cadences c 
      WHERE c.id = cadence_id 
      AND public.is_member_of_org(c.organization_id)
    )
  );

-- Cadence Enrollments
CREATE POLICY "Users can view enrollments in their org" ON public.cadence_enrollments
  FOR SELECT USING (public.is_member_of_org(organization_id));

CREATE POLICY "Users can create enrollments in their org" ON public.cadence_enrollments
  FOR INSERT WITH CHECK (public.is_member_of_org(organization_id));

CREATE POLICY "Users can update enrollments in their org" ON public.cadence_enrollments
  FOR UPDATE USING (public.is_member_of_org(organization_id))
  WITH CHECK (public.is_member_of_org(organization_id));

CREATE POLICY "Users can delete enrollments in their org" ON public.cadence_enrollments
  FOR DELETE USING (public.is_member_of_org(organization_id));

-- Territories
CREATE POLICY "Users can view territories in their org" ON public.territories
  FOR SELECT USING (public.is_member_of_org(organization_id));

CREATE POLICY "Admins can manage territories" ON public.territories
  FOR ALL USING (public.is_member_of_org(organization_id) AND public.has_role('admin'))
  WITH CHECK (public.is_member_of_org(organization_id) AND public.has_role('admin'));

-- Forecasts
CREATE POLICY "Users can view forecasts in their org" ON public.forecasts
  FOR SELECT USING (public.is_member_of_org(organization_id));

CREATE POLICY "Users can manage their own forecasts" ON public.forecasts
  FOR INSERT WITH CHECK (public.is_member_of_org(organization_id) AND owner_id = auth.uid());

CREATE POLICY "Users can update their own forecasts" ON public.forecasts
  FOR UPDATE USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Timeline Events
CREATE POLICY "Users can view timeline events in their org" ON public.timeline_events
  FOR SELECT USING (public.is_member_of_org(organization_id));

CREATE POLICY "Users can create timeline events in their org" ON public.timeline_events
  FOR INSERT WITH CHECK (public.is_member_of_org(organization_id));

-- Win/Loss Reasons
CREATE POLICY "Users can view reasons in their org" ON public.win_loss_reasons
  FOR SELECT USING (public.is_member_of_org(organization_id));

CREATE POLICY "Admins can manage reasons" ON public.win_loss_reasons
  FOR ALL USING (public.is_member_of_org(organization_id) AND public.has_role('admin'))
  WITH CHECK (public.is_member_of_org(organization_id) AND public.has_role('admin'));

-- Lead Sources
CREATE POLICY "Users can view lead sources in their org" ON public.lead_sources
  FOR SELECT USING (public.is_member_of_org(organization_id));

CREATE POLICY "Admins can manage lead sources" ON public.lead_sources
  FOR ALL USING (public.is_member_of_org(organization_id) AND public.has_role('admin'))
  WITH CHECK (public.is_member_of_org(organization_id) AND public.has_role('admin'));