-- =============================================
-- FIREWARE IT/ITSM MODULE - COMPLETE SCHEMA
-- Phase 10: IT Service Management
-- =============================================

-- =============================================
-- ENUMS FOR IT/ITSM MODULE
-- =============================================

-- IT Priority (similar to ticket but separate for ITSM context)
CREATE TYPE public.it_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- IT Impact Level
CREATE TYPE public.it_impact AS ENUM ('low', 'medium', 'high', 'critical');

-- IT Urgency Level
CREATE TYPE public.it_urgency AS ENUM ('low', 'medium', 'high', 'critical');

-- IT Incident Status
CREATE TYPE public.it_incident_status AS ENUM (
  'new', 'acknowledged', 'in_progress', 'pending_info', 
  'pending_vendor', 'on_hold', 'resolved', 'closed', 'cancelled'
);

-- IT Request Status
CREATE TYPE public.it_request_status AS ENUM (
  'submitted', 'pending_approval', 'approved', 'rejected',
  'in_progress', 'pending_info', 'fulfilled', 'closed', 'cancelled'
);

-- IT Problem Status
CREATE TYPE public.it_problem_status AS ENUM (
  'logged', 'open', 'root_cause_analysis', 'known_error', 
  'resolution_identified', 'resolved', 'closed'
);

-- Change Type
CREATE TYPE public.it_change_type AS ENUM ('standard', 'normal', 'emergency');

-- Change Risk Level
CREATE TYPE public.it_change_risk AS ENUM ('low', 'medium', 'high', 'critical');

-- Change Status
CREATE TYPE public.it_change_status AS ENUM (
  'draft', 'submitted', 'under_assessment', 'pending_approval', 
  'approved', 'rejected', 'scheduled', 'implementing', 
  'under_review', 'completed', 'cancelled', 'failed', 'rolled_back'
);

-- CI Type (Configuration Item)
CREATE TYPE public.ci_type AS ENUM (
  'server', 'virtual_machine', 'container', 'application', 
  'database', 'network_device', 'storage', 'service', 
  'workstation', 'laptop', 'mobile_device', 'printer',
  'load_balancer', 'firewall', 'middleware', 'api', 'other'
);

-- CI Status
CREATE TYPE public.ci_status AS ENUM (
  'planned', 'in_development', 'testing', 'active', 
  'maintenance', 'degraded', 'inactive', 'retired', 'disposed'
);

-- CI Environment
CREATE TYPE public.ci_environment AS ENUM (
  'production', 'staging', 'development', 'testing', 
  'disaster_recovery', 'training'
);

-- Asset Type
CREATE TYPE public.it_asset_type AS ENUM (
  'hardware', 'software', 'license', 'subscription', 
  'virtual', 'cloud_resource'
);

-- Asset Status
CREATE TYPE public.it_asset_status AS ENUM (
  'ordered', 'received', 'available', 'in_use', 
  'in_repair', 'maintenance', 'retired', 'disposed', 
  'lost', 'stolen'
);

-- Asset Condition
CREATE TYPE public.it_asset_condition AS ENUM (
  'new', 'good', 'fair', 'poor', 'damaged', 'non_functional'
);

-- CMDB Relationship Type
CREATE TYPE public.cmdb_relationship_type AS ENUM (
  'runs_on', 'depends_on', 'connected_to', 'part_of',
  'managed_by', 'backed_up_by', 'replicated_to', 'load_balanced_by',
  'contained_in', 'uses', 'provides', 'supports'
);

-- =============================================
-- IT INCIDENTS TABLE
-- =============================================

CREATE TABLE public.it_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  incident_number TEXT NOT NULL,
  
  -- Basic Information
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  subcategory TEXT,
  
  -- Priority Matrix
  priority public.it_priority DEFAULT 'medium',
  impact public.it_impact DEFAULT 'medium',
  urgency public.it_urgency DEFAULT 'medium',
  
  -- Status
  status public.it_incident_status DEFAULT 'new',
  
  -- Assignment
  reported_by UUID REFERENCES public.profiles(id),
  assigned_to UUID REFERENCES public.profiles(id),
  assignment_group_id UUID REFERENCES public.teams(id),
  escalation_level INT DEFAULT 0,
  
  -- Affected Resources
  affected_service TEXT,
  affected_ci_id UUID,
  affected_accounts UUID[] DEFAULT '{}',
  affected_users_count INT DEFAULT 0,
  
  -- Resolution
  resolution TEXT,
  resolution_code TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id),
  
  -- SLA Tracking
  sla_id UUID,
  sla_response_due TIMESTAMPTZ,
  sla_resolution_due TIMESTAMPTZ,
  sla_response_met BOOLEAN,
  sla_resolution_met BOOLEAN,
  sla_breached BOOLEAN DEFAULT false,
  
  -- Related Records
  related_incidents UUID[] DEFAULT '{}',
  related_problem_id UUID,
  parent_incident_id UUID REFERENCES public.it_incidents(id),
  
  -- Root Cause Analysis
  root_cause TEXT,
  workaround TEXT,
  workaround_available BOOLEAN DEFAULT false,
  
  -- Communication
  customer_visible BOOLEAN DEFAULT false,
  customer_communication TEXT,
  
  -- Source
  source TEXT DEFAULT 'manual',
  external_id TEXT,
  
  -- Timestamps
  first_response_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_incident_number UNIQUE (organization_id, incident_number)
);

-- Create index for faster queries
CREATE INDEX idx_it_incidents_org ON public.it_incidents(organization_id);
CREATE INDEX idx_it_incidents_status ON public.it_incidents(status);
CREATE INDEX idx_it_incidents_priority ON public.it_incidents(priority);
CREATE INDEX idx_it_incidents_assigned ON public.it_incidents(assigned_to);
CREATE INDEX idx_it_incidents_created ON public.it_incidents(created_at DESC);

-- Enable RLS
ALTER TABLE public.it_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view incidents in their org"
ON public.it_incidents FOR SELECT
TO authenticated
USING (organization_id = public.get_user_org_id());

CREATE POLICY "Users can create incidents in their org"
ON public.it_incidents FOR INSERT
TO authenticated
WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "Users can update incidents in their org"
ON public.it_incidents FOR UPDATE
TO authenticated
USING (organization_id = public.get_user_org_id());

CREATE POLICY "Admins can delete incidents"
ON public.it_incidents FOR DELETE
TO authenticated
USING (
  organization_id = public.get_user_org_id() AND 
  public.user_has_role(auth.uid(), 'admin'::user_role)
);

-- =============================================
-- IT SERVICE REQUESTS TABLE
-- =============================================

CREATE TABLE public.it_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  request_number TEXT NOT NULL,
  
  -- Basic Information
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  subcategory TEXT,
  request_type TEXT,
  
  -- Catalog Item Reference
  catalog_item_id UUID,
  catalog_item_name TEXT,
  
  -- Priority
  priority public.it_priority DEFAULT 'medium',
  
  -- Status
  status public.it_request_status DEFAULT 'submitted',
  
  -- Requester Information
  requester_id UUID REFERENCES public.profiles(id),
  requested_for_id UUID REFERENCES public.profiles(id),
  department TEXT,
  cost_center TEXT,
  
  -- Assignment
  assigned_to UUID REFERENCES public.profiles(id),
  assignment_group_id UUID REFERENCES public.teams(id),
  
  -- Approval
  approval_required BOOLEAN DEFAULT false,
  approver_id UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  approval_notes TEXT,
  
  -- Fulfillment
  fulfillment_notes TEXT,
  fulfilled_at TIMESTAMPTZ,
  fulfilled_by UUID REFERENCES public.profiles(id),
  
  -- SLA
  due_date TIMESTAMPTZ,
  sla_breached BOOLEAN DEFAULT false,
  
  -- Cost
  estimated_cost NUMERIC(15,2),
  actual_cost NUMERIC(15,2),
  
  -- Form Data
  form_data JSONB DEFAULT '{}',
  
  -- Attachments
  attachments_count INT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_request_number UNIQUE (organization_id, request_number)
);

-- Indexes
CREATE INDEX idx_it_requests_org ON public.it_requests(organization_id);
CREATE INDEX idx_it_requests_status ON public.it_requests(status);
CREATE INDEX idx_it_requests_requester ON public.it_requests(requester_id);
CREATE INDEX idx_it_requests_assigned ON public.it_requests(assigned_to);
CREATE INDEX idx_it_requests_created ON public.it_requests(created_at DESC);

-- Enable RLS
ALTER TABLE public.it_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view requests in their org"
ON public.it_requests FOR SELECT
TO authenticated
USING (organization_id = public.get_user_org_id());

CREATE POLICY "Users can create requests in their org"
ON public.it_requests FOR INSERT
TO authenticated
WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "Users can update requests in their org"
ON public.it_requests FOR UPDATE
TO authenticated
USING (organization_id = public.get_user_org_id());

CREATE POLICY "Admins can delete requests"
ON public.it_requests FOR DELETE
TO authenticated
USING (
  organization_id = public.get_user_org_id() AND 
  public.user_has_role(auth.uid(), 'admin'::user_role)
);

-- =============================================
-- IT PROBLEMS TABLE
-- =============================================

CREATE TABLE public.it_problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  problem_number TEXT NOT NULL,
  
  -- Basic Information
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  subcategory TEXT,
  
  -- Priority
  priority public.it_priority DEFAULT 'medium',
  impact public.it_impact DEFAULT 'medium',
  
  -- Status
  status public.it_problem_status DEFAULT 'logged',
  
  -- Assignment
  owner_id UUID REFERENCES public.profiles(id),
  assigned_to UUID REFERENCES public.profiles(id),
  assignment_group_id UUID REFERENCES public.teams(id),
  
  -- Related Incidents
  related_incidents UUID[] DEFAULT '{}',
  incident_count INT DEFAULT 0,
  
  -- Affected CI
  affected_ci_id UUID,
  affected_service TEXT,
  
  -- Root Cause Analysis
  root_cause TEXT,
  root_cause_identified_at TIMESTAMPTZ,
  root_cause_identified_by UUID REFERENCES public.profiles(id),
  
  -- Known Error
  known_error_id TEXT,
  known_error_created_at TIMESTAMPTZ,
  
  -- Workaround
  workaround TEXT,
  workaround_available BOOLEAN DEFAULT false,
  workaround_documented_at TIMESTAMPTZ,
  
  -- Permanent Fix
  permanent_fix TEXT,
  fix_implemented_at TIMESTAMPTZ,
  fix_verified BOOLEAN DEFAULT false,
  
  -- Related Change
  related_change_id UUID,
  
  -- Resolution
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id),
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES public.profiles(id),
  
  -- Business Impact
  business_impact TEXT,
  customers_affected INT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_problem_number UNIQUE (organization_id, problem_number)
);

-- Indexes
CREATE INDEX idx_it_problems_org ON public.it_problems(organization_id);
CREATE INDEX idx_it_problems_status ON public.it_problems(status);
CREATE INDEX idx_it_problems_priority ON public.it_problems(priority);
CREATE INDEX idx_it_problems_assigned ON public.it_problems(assigned_to);

-- Enable RLS
ALTER TABLE public.it_problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view problems in their org"
ON public.it_problems FOR SELECT
TO authenticated
USING (organization_id = public.get_user_org_id());

CREATE POLICY "Users can create problems in their org"
ON public.it_problems FOR INSERT
TO authenticated
WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "Users can update problems in their org"
ON public.it_problems FOR UPDATE
TO authenticated
USING (organization_id = public.get_user_org_id());

CREATE POLICY "Admins can delete problems"
ON public.it_problems FOR DELETE
TO authenticated
USING (
  organization_id = public.get_user_org_id() AND 
  public.user_has_role(auth.uid(), 'admin'::user_role)
);

-- =============================================
-- IT CHANGES TABLE (CHANGE MANAGEMENT)
-- =============================================

CREATE TABLE public.it_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  change_number TEXT NOT NULL,
  
  -- Basic Information
  title TEXT NOT NULL,
  description TEXT,
  business_justification TEXT,
  category TEXT,
  subcategory TEXT,
  
  -- Change Type and Risk
  change_type public.it_change_type DEFAULT 'normal',
  risk_level public.it_change_risk DEFAULT 'medium',
  
  -- Status
  status public.it_change_status DEFAULT 'draft',
  
  -- Assignment
  requested_by UUID REFERENCES public.profiles(id),
  assigned_to UUID REFERENCES public.profiles(id),
  change_manager_id UUID REFERENCES public.profiles(id),
  assignment_group_id UUID REFERENCES public.teams(id),
  
  -- CAB (Change Advisory Board)
  cab_required BOOLEAN DEFAULT false,
  cab_date TIMESTAMPTZ,
  cab_outcome TEXT,
  cab_notes TEXT,
  
  -- Approval Workflow
  approval_required BOOLEAN DEFAULT true,
  approvers UUID[] DEFAULT '{}',
  approvals JSONB DEFAULT '[]',
  approval_status TEXT DEFAULT 'pending',
  
  -- Planning
  implementation_plan TEXT,
  rollback_plan TEXT,
  test_plan TEXT,
  communication_plan TEXT,
  
  -- Impact Analysis
  impact_analysis TEXT,
  affected_services TEXT[] DEFAULT '{}',
  affected_cis UUID[] DEFAULT '{}',
  downtime_required BOOLEAN DEFAULT false,
  downtime_duration_minutes INT,
  
  -- Schedule
  requested_date TIMESTAMPTZ,
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  
  -- Implementation
  implementation_notes TEXT,
  implementation_result TEXT,
  
  -- Review
  review_notes TEXT,
  review_date TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id),
  lessons_learned TEXT,
  
  -- Related Records
  related_incidents UUID[] DEFAULT '{}',
  related_problems UUID[] DEFAULT '{}',
  parent_change_id UUID REFERENCES public.it_changes(id),
  
  -- Closure
  closure_code TEXT,
  closure_notes TEXT,
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES public.profiles(id),
  
  -- Metrics
  success_rating INT CHECK (success_rating BETWEEN 1 AND 5),
  
  -- Timestamps
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_change_number UNIQUE (organization_id, change_number)
);

-- Indexes
CREATE INDEX idx_it_changes_org ON public.it_changes(organization_id);
CREATE INDEX idx_it_changes_status ON public.it_changes(status);
CREATE INDEX idx_it_changes_type ON public.it_changes(change_type);
CREATE INDEX idx_it_changes_scheduled ON public.it_changes(scheduled_start);
CREATE INDEX idx_it_changes_assigned ON public.it_changes(assigned_to);

-- Enable RLS
ALTER TABLE public.it_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view changes in their org"
ON public.it_changes FOR SELECT
TO authenticated
USING (organization_id = public.get_user_org_id());

CREATE POLICY "Users can create changes in their org"
ON public.it_changes FOR INSERT
TO authenticated
WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "Users can update changes in their org"
ON public.it_changes FOR UPDATE
TO authenticated
USING (organization_id = public.get_user_org_id());

CREATE POLICY "Admins can delete changes"
ON public.it_changes FOR DELETE
TO authenticated
USING (
  organization_id = public.get_user_org_id() AND 
  public.user_has_role(auth.uid(), 'admin'::user_role)
);

-- =============================================
-- CMDB ITEMS (CONFIGURATION ITEMS)
-- =============================================

CREATE TABLE public.cmdb_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  ci_number TEXT NOT NULL,
  
  -- Basic Information
  name TEXT NOT NULL,
  display_name TEXT,
  description TEXT,
  
  -- Classification
  ci_type public.ci_type NOT NULL,
  category TEXT,
  subcategory TEXT,
  
  -- Status
  status public.ci_status DEFAULT 'active',
  criticality TEXT DEFAULT 'medium',
  
  -- Environment
  environment public.ci_environment DEFAULT 'production',
  
  -- Ownership
  owner_id UUID REFERENCES public.profiles(id),
  support_team_id UUID REFERENCES public.teams(id),
  managed_by TEXT,
  
  -- Location
  location TEXT,
  data_center TEXT,
  rack TEXT,
  
  -- Technical Details
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  version TEXT,
  firmware_version TEXT,
  
  -- Network
  ip_address TEXT,
  mac_address TEXT,
  hostname TEXT,
  dns_name TEXT,
  
  -- Compute Resources
  cpu_cores INT,
  memory_gb NUMERIC(10,2),
  storage_gb NUMERIC(15,2),
  operating_system TEXT,
  
  -- Business Context
  business_service TEXT,
  business_unit TEXT,
  cost_center TEXT,
  
  -- Compliance
  compliance_requirements TEXT[] DEFAULT '{}',
  data_classification TEXT,
  
  -- Documentation
  documentation_url TEXT,
  runbook_url TEXT,
  
  -- Custom Attributes
  attributes JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- Lifecycle
  installed_date DATE,
  go_live_date DATE,
  end_of_life_date DATE,
  decommission_date DATE,
  
  -- Related Asset
  asset_id UUID,
  
  -- Discovery
  last_discovered_at TIMESTAMPTZ,
  discovery_source TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_ci_number UNIQUE (organization_id, ci_number)
);

-- Indexes
CREATE INDEX idx_cmdb_items_org ON public.cmdb_items(organization_id);
CREATE INDEX idx_cmdb_items_type ON public.cmdb_items(ci_type);
CREATE INDEX idx_cmdb_items_status ON public.cmdb_items(status);
CREATE INDEX idx_cmdb_items_environment ON public.cmdb_items(environment);
CREATE INDEX idx_cmdb_items_name ON public.cmdb_items(name);

-- Enable RLS
ALTER TABLE public.cmdb_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view CIs in their org"
ON public.cmdb_items FOR SELECT
TO authenticated
USING (organization_id = public.get_user_org_id());

CREATE POLICY "Users can create CIs in their org"
ON public.cmdb_items FOR INSERT
TO authenticated
WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "Users can update CIs in their org"
ON public.cmdb_items FOR UPDATE
TO authenticated
USING (organization_id = public.get_user_org_id());

CREATE POLICY "Admins can delete CIs"
ON public.cmdb_items FOR DELETE
TO authenticated
USING (
  organization_id = public.get_user_org_id() AND 
  public.user_has_role(auth.uid(), 'admin'::user_role)
);

-- =============================================
-- CMDB RELATIONSHIPS
-- =============================================

CREATE TABLE public.cmdb_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Relationship
  source_ci_id UUID NOT NULL REFERENCES public.cmdb_items(id) ON DELETE CASCADE,
  target_ci_id UUID NOT NULL REFERENCES public.cmdb_items(id) ON DELETE CASCADE,
  relationship_type public.cmdb_relationship_type NOT NULL,
  
  -- Details
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  discovered_by TEXT,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_relationship UNIQUE (source_ci_id, target_ci_id, relationship_type)
);

-- Indexes
CREATE INDEX idx_cmdb_relationships_source ON public.cmdb_relationships(source_ci_id);
CREATE INDEX idx_cmdb_relationships_target ON public.cmdb_relationships(target_ci_id);

-- Enable RLS
ALTER TABLE public.cmdb_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view relationships in their org"
ON public.cmdb_relationships FOR SELECT
TO authenticated
USING (organization_id = public.get_user_org_id());

CREATE POLICY "Users can create relationships in their org"
ON public.cmdb_relationships FOR INSERT
TO authenticated
WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "Users can update relationships in their org"
ON public.cmdb_relationships FOR UPDATE
TO authenticated
USING (organization_id = public.get_user_org_id());

CREATE POLICY "Users can delete relationships in their org"
ON public.cmdb_relationships FOR DELETE
TO authenticated
USING (organization_id = public.get_user_org_id());

-- =============================================
-- IT ASSETS TABLE
-- =============================================

CREATE TABLE public.it_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  asset_tag TEXT NOT NULL,
  
  -- Basic Information
  name TEXT NOT NULL,
  description TEXT,
  
  -- Classification
  asset_type public.it_asset_type NOT NULL,
  category TEXT,
  subcategory TEXT,
  
  -- Status
  status public.it_asset_status DEFAULT 'available',
  condition public.it_asset_condition DEFAULT 'good',
  
  -- Hardware Details
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  part_number TEXT,
  
  -- Assignment
  assigned_to UUID REFERENCES public.profiles(id),
  assigned_at TIMESTAMPTZ,
  department TEXT,
  location TEXT,
  
  -- Procurement
  vendor_id UUID,
  vendor_name TEXT,
  purchase_date DATE,
  purchase_order_number TEXT,
  purchase_cost NUMERIC(15,2),
  invoice_number TEXT,
  
  -- Warranty
  warranty_start_date DATE,
  warranty_end_date DATE,
  warranty_type TEXT,
  warranty_provider TEXT,
  warranty_contract_number TEXT,
  
  -- Lease (if applicable)
  is_leased BOOLEAN DEFAULT false,
  lease_start_date DATE,
  lease_end_date DATE,
  lease_cost_monthly NUMERIC(15,2),
  lease_contract_number TEXT,
  
  -- License (for software assets)
  license_key TEXT,
  license_type TEXT,
  license_seats INT,
  license_start_date DATE,
  license_end_date DATE,
  license_cost NUMERIC(15,2),
  
  -- Subscription (for cloud/SaaS)
  subscription_id TEXT,
  subscription_tier TEXT,
  subscription_renewal_date DATE,
  subscription_cost_monthly NUMERIC(15,2),
  
  -- Depreciation
  depreciation_method TEXT,
  depreciation_period_months INT,
  salvage_value NUMERIC(15,2),
  current_book_value NUMERIC(15,2),
  
  -- Maintenance
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  maintenance_notes TEXT,
  
  -- Disposal
  disposal_date DATE,
  disposal_method TEXT,
  disposal_notes TEXT,
  disposal_value NUMERIC(15,2),
  
  -- Related CMDB Item
  cmdb_item_id UUID REFERENCES public.cmdb_items(id),
  
  -- Parent Asset (for components)
  parent_asset_id UUID REFERENCES public.it_assets(id),
  
  -- Tracking
  barcode TEXT,
  qr_code TEXT,
  rfid_tag TEXT,
  
  -- Custom Fields
  custom_fields JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_asset_tag UNIQUE (organization_id, asset_tag)
);

-- Indexes
CREATE INDEX idx_it_assets_org ON public.it_assets(organization_id);
CREATE INDEX idx_it_assets_type ON public.it_assets(asset_type);
CREATE INDEX idx_it_assets_status ON public.it_assets(status);
CREATE INDEX idx_it_assets_assigned ON public.it_assets(assigned_to);
CREATE INDEX idx_it_assets_warranty ON public.it_assets(warranty_end_date);

-- Enable RLS
ALTER TABLE public.it_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assets in their org"
ON public.it_assets FOR SELECT
TO authenticated
USING (organization_id = public.get_user_org_id());

CREATE POLICY "Users can create assets in their org"
ON public.it_assets FOR INSERT
TO authenticated
WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "Users can update assets in their org"
ON public.it_assets FOR UPDATE
TO authenticated
USING (organization_id = public.get_user_org_id());

CREATE POLICY "Admins can delete assets"
ON public.it_assets FOR DELETE
TO authenticated
USING (
  organization_id = public.get_user_org_id() AND 
  public.user_has_role(auth.uid(), 'admin'::user_role)
);

-- =============================================
-- IT SERVICE CATALOG
-- =============================================

CREATE TABLE public.it_service_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Basic Information
  name TEXT NOT NULL,
  short_description TEXT,
  description TEXT,
  
  -- Classification
  category TEXT NOT NULL,
  subcategory TEXT,
  
  -- Display
  icon TEXT,
  image_url TEXT,
  display_order INT DEFAULT 0,
  
  -- Availability
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  visibility TEXT DEFAULT 'all',
  allowed_roles TEXT[] DEFAULT '{}',
  
  -- Fulfillment
  fulfillment_group_id UUID REFERENCES public.teams(id),
  default_assignee_id UUID REFERENCES public.profiles(id),
  estimated_time_minutes INT,
  
  -- Approval
  approval_required BOOLEAN DEFAULT false,
  approver_roles TEXT[] DEFAULT '{}',
  
  -- SLA
  sla_id UUID,
  target_resolution_hours INT,
  
  -- Cost
  has_cost BOOLEAN DEFAULT false,
  base_cost NUMERIC(15,2),
  cost_type TEXT DEFAULT 'one_time',
  
  -- Form Configuration
  form_schema JSONB DEFAULT '[]',
  
  -- Related CI
  related_ci_id UUID REFERENCES public.cmdb_items(id),
  
  -- Documentation
  instructions TEXT,
  knowledge_article_id UUID,
  
  -- Metrics
  request_count INT DEFAULT 0,
  avg_fulfillment_time_hours NUMERIC(10,2),
  satisfaction_score NUMERIC(3,2),
  
  -- Timestamps
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_it_service_catalog_org ON public.it_service_catalog(organization_id);
CREATE INDEX idx_it_service_catalog_category ON public.it_service_catalog(category);
CREATE INDEX idx_it_service_catalog_active ON public.it_service_catalog(is_active);

-- Enable RLS
ALTER TABLE public.it_service_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view catalog in their org"
ON public.it_service_catalog FOR SELECT
TO authenticated
USING (organization_id = public.get_user_org_id());

CREATE POLICY "Admins can manage catalog"
ON public.it_service_catalog FOR ALL
TO authenticated
USING (
  organization_id = public.get_user_org_id() AND 
  public.user_has_role(auth.uid(), 'admin'::user_role)
);

-- =============================================
-- IT SLAs TABLE
-- =============================================

CREATE TABLE public.it_slas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Basic Information
  name TEXT NOT NULL,
  description TEXT,
  
  -- Type
  applies_to TEXT NOT NULL DEFAULT 'incident',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Response Times (in minutes)
  response_critical INT DEFAULT 15,
  response_high INT DEFAULT 60,
  response_medium INT DEFAULT 240,
  response_low INT DEFAULT 480,
  
  -- Resolution Times (in minutes)
  resolution_critical INT DEFAULT 120,
  resolution_high INT DEFAULT 480,
  resolution_medium INT DEFAULT 1440,
  resolution_low INT DEFAULT 2880,
  
  -- Business Hours
  business_hours_only BOOLEAN DEFAULT true,
  business_hours_start TIME DEFAULT '09:00',
  business_hours_end TIME DEFAULT '18:00',
  business_days INT[] DEFAULT '{1,2,3,4,5}',
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  
  -- Escalation
  escalation_enabled BOOLEAN DEFAULT true,
  escalation_thresholds JSONB DEFAULT '[]',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.it_slas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view SLAs in their org"
ON public.it_slas FOR SELECT
TO authenticated
USING (organization_id = public.get_user_org_id());

CREATE POLICY "Admins can manage SLAs"
ON public.it_slas FOR ALL
TO authenticated
USING (
  organization_id = public.get_user_org_id() AND 
  public.user_has_role(auth.uid(), 'admin'::user_role)
);

-- =============================================
-- IT WORK NOTES / COMMENTS
-- =============================================

CREATE TABLE public.it_work_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Polymorphic Reference
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  
  -- Content
  content TEXT NOT NULL,
  content_html TEXT,
  
  -- Type
  note_type TEXT DEFAULT 'work_note',
  is_internal BOOLEAN DEFAULT true,
  is_resolution BOOLEAN DEFAULT false,
  
  -- Time Tracking
  time_spent_minutes INT DEFAULT 0,
  
  -- Author
  created_by UUID REFERENCES public.profiles(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_it_work_notes_entity ON public.it_work_notes(entity_type, entity_id);
CREATE INDEX idx_it_work_notes_created ON public.it_work_notes(created_at DESC);

-- Enable RLS
ALTER TABLE public.it_work_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notes in their org"
ON public.it_work_notes FOR SELECT
TO authenticated
USING (organization_id = public.get_user_org_id());

CREATE POLICY "Users can create notes in their org"
ON public.it_work_notes FOR INSERT
TO authenticated
WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "Users can update their notes"
ON public.it_work_notes FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

-- =============================================
-- IT KNOWLEDGE BASE (ITSM specific)
-- =============================================

CREATE TABLE public.it_knowledge_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  article_number TEXT NOT NULL,
  
  -- Basic Information
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_html TEXT,
  
  -- Classification
  category TEXT NOT NULL,
  subcategory TEXT,
  article_type TEXT DEFAULT 'how_to',
  
  -- Status
  status TEXT DEFAULT 'draft',
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  
  -- Audience
  visibility TEXT DEFAULT 'internal',
  target_audience TEXT DEFAULT 'support_staff',
  
  -- Versioning
  version INT DEFAULT 1,
  
  -- Author
  author_id UUID REFERENCES public.profiles(id),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  
  -- Related
  related_cis UUID[] DEFAULT '{}',
  related_services TEXT[] DEFAULT '{}',
  
  -- Keywords
  keywords TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- Metrics
  view_count INT DEFAULT 0,
  helpful_count INT DEFAULT 0,
  not_helpful_count INT DEFAULT 0,
  
  -- Expiration
  expires_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_it_article_number UNIQUE (organization_id, article_number)
);

-- Enable RLS
ALTER TABLE public.it_knowledge_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view IT KB in their org"
ON public.it_knowledge_articles FOR SELECT
TO authenticated
USING (organization_id = public.get_user_org_id());

CREATE POLICY "Users can manage IT KB in their org"
ON public.it_knowledge_articles FOR ALL
TO authenticated
USING (organization_id = public.get_user_org_id());

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Generate Incident Number
CREATE OR REPLACE FUNCTION public.generate_incident_number(org_id UUID)
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
  FROM public.it_incidents
  WHERE organization_id = org_id AND created_at >= date_trunc('year', now());
  RETURN 'INC-' || v_year || '-' || lpad(v_count::text, 6, '0');
END;
$$;

-- Generate Request Number
CREATE OR REPLACE FUNCTION public.generate_request_number(org_id UUID)
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
  FROM public.it_requests
  WHERE organization_id = org_id AND created_at >= date_trunc('year', now());
  RETURN 'REQ-' || v_year || '-' || lpad(v_count::text, 6, '0');
END;
$$;

-- Generate Problem Number
CREATE OR REPLACE FUNCTION public.generate_problem_number(org_id UUID)
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
  FROM public.it_problems
  WHERE organization_id = org_id AND created_at >= date_trunc('year', now());
  RETURN 'PRB-' || v_year || '-' || lpad(v_count::text, 5, '0');
END;
$$;

-- Generate Change Number
CREATE OR REPLACE FUNCTION public.generate_change_number(org_id UUID)
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
  FROM public.it_changes
  WHERE organization_id = org_id AND created_at >= date_trunc('year', now());
  RETURN 'CHG-' || v_year || '-' || lpad(v_count::text, 5, '0');
END;
$$;

-- Generate CI Number
CREATE OR REPLACE FUNCTION public.generate_ci_number(org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count
  FROM public.cmdb_items
  WHERE organization_id = org_id;
  RETURN 'CI-' || lpad(v_count::text, 7, '0');
END;
$$;

-- Generate Asset Tag
CREATE OR REPLACE FUNCTION public.generate_asset_tag(org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count
  FROM public.it_assets
  WHERE organization_id = org_id;
  RETURN 'AST-' || lpad(v_count::text, 7, '0');
END;
$$;

-- Calculate Priority from Impact and Urgency (Priority Matrix)
CREATE OR REPLACE FUNCTION public.calculate_it_priority(
  p_impact public.it_impact, 
  p_urgency public.it_urgency
)
RETURNS public.it_priority
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Priority Matrix:
  -- Impact/Urgency | Critical | High | Medium | Low
  -- Critical       | Critical | Critical | High | Medium
  -- High           | Critical | High | High | Medium
  -- Medium         | High | Medium | Medium | Low
  -- Low            | Medium | Medium | Low | Low
  
  IF p_impact = 'critical' AND p_urgency = 'critical' THEN RETURN 'critical';
  ELSIF p_impact = 'critical' AND p_urgency = 'high' THEN RETURN 'critical';
  ELSIF p_impact = 'critical' AND p_urgency = 'medium' THEN RETURN 'high';
  ELSIF p_impact = 'critical' AND p_urgency = 'low' THEN RETURN 'medium';
  ELSIF p_impact = 'high' AND p_urgency = 'critical' THEN RETURN 'critical';
  ELSIF p_impact = 'high' AND p_urgency = 'high' THEN RETURN 'high';
  ELSIF p_impact = 'high' AND p_urgency = 'medium' THEN RETURN 'high';
  ELSIF p_impact = 'high' AND p_urgency = 'low' THEN RETURN 'medium';
  ELSIF p_impact = 'medium' AND p_urgency = 'critical' THEN RETURN 'high';
  ELSIF p_impact = 'medium' AND p_urgency = 'high' THEN RETURN 'medium';
  ELSIF p_impact = 'medium' AND p_urgency = 'medium' THEN RETURN 'medium';
  ELSIF p_impact = 'medium' AND p_urgency = 'low' THEN RETURN 'low';
  ELSIF p_impact = 'low' AND p_urgency = 'critical' THEN RETURN 'medium';
  ELSIF p_impact = 'low' AND p_urgency = 'high' THEN RETURN 'medium';
  ELSIF p_impact = 'low' AND p_urgency = 'medium' THEN RETURN 'low';
  ELSE RETURN 'low';
  END IF;
END;
$$;

-- Trigger to auto-calculate priority on incident insert/update
CREATE OR REPLACE FUNCTION public.set_incident_priority()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.priority := public.calculate_it_priority(NEW.impact, NEW.urgency);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_incident_priority
BEFORE INSERT OR UPDATE OF impact, urgency ON public.it_incidents
FOR EACH ROW
EXECUTE FUNCTION public.set_incident_priority();

-- Track incident status changes
CREATE OR REPLACE FUNCTION public.track_incident_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Update timestamps based on status
    IF NEW.status = 'acknowledged' AND OLD.status = 'new' THEN
      NEW.acknowledged_at := COALESCE(NEW.acknowledged_at, now());
      NEW.first_response_at := COALESCE(NEW.first_response_at, now());
    END IF;
    
    IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
      NEW.resolved_at := now();
      NEW.resolved_by := auth.uid();
    END IF;
    
    -- Create work note for status change
    INSERT INTO public.it_work_notes (
      organization_id, entity_type, entity_id, content, note_type, is_internal, created_by
    ) VALUES (
      NEW.organization_id, 'incident', NEW.id,
      'Status changed from ' || OLD.status || ' to ' || NEW.status,
      'status_change', true, auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_track_incident_status
BEFORE UPDATE OF status ON public.it_incidents
FOR EACH ROW
EXECUTE FUNCTION public.track_incident_status_change();

-- Track change status changes
CREATE OR REPLACE FUNCTION public.track_change_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'submitted' AND OLD.status = 'draft' THEN
      NEW.submitted_at := now();
    END IF;
    
    IF NEW.status = 'approved' AND OLD.status IN ('pending_approval', 'under_assessment') THEN
      NEW.approved_at := now();
    END IF;
    
    IF NEW.status = 'rejected' THEN
      NEW.rejected_at := now();
    END IF;
    
    IF NEW.status = 'implementing' AND OLD.status = 'scheduled' THEN
      NEW.actual_start := now();
    END IF;
    
    IF NEW.status IN ('completed', 'failed', 'rolled_back') AND OLD.status = 'implementing' THEN
      NEW.actual_end := now();
    END IF;
    
    IF NEW.status IN ('completed', 'cancelled', 'failed') THEN
      NEW.closed_at := now();
      NEW.closed_by := auth.uid();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_track_change_status
BEFORE UPDATE OF status ON public.it_changes
FOR EACH ROW
EXECUTE FUNCTION public.track_change_status_change();