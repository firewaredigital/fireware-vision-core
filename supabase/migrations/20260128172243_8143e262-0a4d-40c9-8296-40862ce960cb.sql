-- ===========================================
-- FIREWARE SERVICE MODULE - COMPLETE SCHEMA
-- Phase 5: Ticketing, SLA, Knowledge Base
-- ===========================================

-- =====================
-- ENUMS
-- =====================

-- Ticket type enum
CREATE TYPE public.ticket_type AS ENUM (
  'incident',
  'request', 
  'question',
  'complaint',
  'return'
);

-- Ticket priority enum
CREATE TYPE public.ticket_priority AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- Ticket status enum
CREATE TYPE public.ticket_status AS ENUM (
  'new',
  'open',
  'pending',
  'on_hold',
  'resolved',
  'closed'
);

-- Ticket channel enum
CREATE TYPE public.ticket_channel AS ENUM (
  'email',
  'chat',
  'phone',
  'whatsapp',
  'portal',
  'form'
);

-- Article status enum
CREATE TYPE public.article_status AS ENUM (
  'draft',
  'in_review',
  'published',
  'archived'
);

-- Message sender type enum
CREATE TYPE public.message_sender_type AS ENUM (
  'agent',
  'customer',
  'system'
);

-- =====================
-- TICKET CATEGORIES
-- =====================

CREATE TABLE public.ticket_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.ticket_categories(id) ON DELETE SET NULL,
  icon TEXT,
  color TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_ticket_categories_org ON public.ticket_categories(organization_id);
CREATE INDEX idx_ticket_categories_parent ON public.ticket_categories(parent_id);

-- =====================
-- TICKET QUEUES
-- =====================

CREATE TABLE public.ticket_queues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  email_address TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  auto_assign BOOLEAN NOT NULL DEFAULT false,
  assignment_method TEXT DEFAULT 'round_robin',
  business_hours_only BOOLEAN NOT NULL DEFAULT true,
  members UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_ticket_queues_org ON public.ticket_queues(organization_id);

-- =====================
-- TICKET SLAs
-- =====================

CREATE TABLE public.ticket_slas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  -- Response times in minutes
  first_response_low INTEGER NOT NULL DEFAULT 480,      -- 8 hours
  first_response_medium INTEGER NOT NULL DEFAULT 240,   -- 4 hours
  first_response_high INTEGER NOT NULL DEFAULT 60,      -- 1 hour
  first_response_critical INTEGER NOT NULL DEFAULT 15,  -- 15 minutes
  -- Resolution times in minutes
  resolution_low INTEGER NOT NULL DEFAULT 2880,         -- 48 hours
  resolution_medium INTEGER NOT NULL DEFAULT 1440,      -- 24 hours
  resolution_high INTEGER NOT NULL DEFAULT 480,         -- 8 hours
  resolution_critical INTEGER NOT NULL DEFAULT 120,     -- 2 hours
  -- Business hours configuration
  business_hours_only BOOLEAN NOT NULL DEFAULT true,
  business_hours_start TIME DEFAULT '09:00',
  business_hours_end TIME DEFAULT '18:00',
  business_days INTEGER[] DEFAULT '{1,2,3,4,5}',  -- Monday to Friday
  -- Escalation settings
  escalation_enabled BOOLEAN NOT NULL DEFAULT true,
  escalation_threshold_percent INTEGER DEFAULT 80,
  escalation_to UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_ticket_slas_org ON public.ticket_slas(organization_id);

-- =====================
-- TICKETS (Main Table)
-- =====================

CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  ticket_number TEXT NOT NULL,
  
  -- Classification
  type public.ticket_type NOT NULL DEFAULT 'request',
  priority public.ticket_priority NOT NULL DEFAULT 'medium',
  status public.ticket_status NOT NULL DEFAULT 'new',
  channel public.ticket_channel NOT NULL DEFAULT 'portal',
  
  -- Category
  category_id UUID REFERENCES public.ticket_categories(id) ON DELETE SET NULL,
  subcategory TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Content
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Relationships
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
  order_id UUID,  -- For future Commerce module
  
  -- Assignment
  queue_id UUID REFERENCES public.ticket_queues(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE,
  
  -- Reporter
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reporter_email TEXT,
  reporter_name TEXT,
  
  -- SLA tracking
  sla_id UUID REFERENCES public.ticket_slas(id) ON DELETE SET NULL,
  sla_first_response_due TIMESTAMP WITH TIME ZONE,
  sla_first_response_at TIMESTAMP WITH TIME ZONE,
  sla_first_response_breached BOOLEAN DEFAULT false,
  sla_resolution_due TIMESTAMP WITH TIME ZONE,
  sla_resolution_breached BOOLEAN DEFAULT false,
  sla_paused_at TIMESTAMP WITH TIME ZONE,
  sla_pause_reason TEXT,
  sla_total_paused_minutes INTEGER DEFAULT 0,
  
  -- Resolution
  resolution TEXT,
  resolution_code TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Closure
  closed_at TIMESTAMP WITH TIME ZONE,
  closed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  closure_code TEXT,
  
  -- Satisfaction
  csat_sent BOOLEAN DEFAULT false,
  csat_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Escalation
  is_escalated BOOLEAN DEFAULT false,
  escalated_at TIMESTAMP WITH TIME ZONE,
  escalated_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  escalation_reason TEXT,
  
  -- Metadata
  source_data JSONB DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  internal_notes TEXT,
  
  -- Timestamps
  first_response_at TIMESTAMP WITH TIME ZONE,
  last_customer_response_at TIMESTAMP WITH TIME ZONE,
  last_agent_response_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT ticket_number_org_unique UNIQUE(organization_id, ticket_number)
);

-- Indexes for tickets
CREATE INDEX idx_tickets_org ON public.tickets(organization_id);
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_priority ON public.tickets(priority);
CREATE INDEX idx_tickets_assigned_to ON public.tickets(assigned_to);
CREATE INDEX idx_tickets_queue ON public.tickets(queue_id);
CREATE INDEX idx_tickets_account ON public.tickets(account_id);
CREATE INDEX idx_tickets_contact ON public.tickets(contact_id);
CREATE INDEX idx_tickets_sla_response ON public.tickets(sla_first_response_due) WHERE sla_first_response_at IS NULL;
CREATE INDEX idx_tickets_sla_resolution ON public.tickets(sla_resolution_due) WHERE status NOT IN ('resolved', 'closed');
CREATE INDEX idx_tickets_created ON public.tickets(created_at DESC);

-- =====================
-- TICKET MESSAGES
-- =====================

CREATE TABLE public.ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  
  -- Sender info
  sender_type public.message_sender_type NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sender_name TEXT,
  sender_email TEXT,
  
  -- Content
  content TEXT NOT NULL,
  content_html TEXT,
  
  -- Message type
  is_internal BOOLEAN NOT NULL DEFAULT false,  -- Internal notes not visible to customer
  is_resolution BOOLEAN NOT NULL DEFAULT false,
  is_auto_reply BOOLEAN NOT NULL DEFAULT false,
  
  -- Attachments (references to attachments table)
  attachment_ids UUID[] DEFAULT '{}',
  
  -- Email specific
  email_message_id TEXT,
  email_in_reply_to TEXT,
  email_cc TEXT[],
  email_bcc TEXT[],
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_ticket_messages_ticket ON public.ticket_messages(ticket_id);
CREATE INDEX idx_ticket_messages_sender ON public.ticket_messages(sender_id);
CREATE INDEX idx_ticket_messages_created ON public.ticket_messages(created_at);

-- =====================
-- TICKET WATCHERS
-- =====================

CREATE TABLE public.ticket_watchers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ticket_id, user_id)
);

CREATE INDEX idx_ticket_watchers_ticket ON public.ticket_watchers(ticket_id);
CREATE INDEX idx_ticket_watchers_user ON public.ticket_watchers(user_id);

-- =====================
-- TICKET STATUS HISTORY
-- =====================

CREATE TABLE public.ticket_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  old_status public.ticket_status,
  new_status public.ticket_status NOT NULL,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT,
  duration_minutes INTEGER,  -- Time spent in old status
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_ticket_status_history_ticket ON public.ticket_status_history(ticket_id);

-- =====================
-- KNOWLEDGE BASE CATEGORIES
-- =====================

CREATE TABLE public.knowledge_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  parent_id UUID REFERENCES public.knowledge_categories(id) ON DELETE SET NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_public BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  article_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT knowledge_category_slug_org_unique UNIQUE(organization_id, slug)
);

CREATE INDEX idx_knowledge_categories_org ON public.knowledge_categories(organization_id);
CREATE INDEX idx_knowledge_categories_parent ON public.knowledge_categories(parent_id);
CREATE INDEX idx_knowledge_categories_slug ON public.knowledge_categories(slug);

-- =====================
-- KNOWLEDGE ARTICLES
-- =====================

CREATE TABLE public.knowledge_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  content_html TEXT,
  
  -- Classification
  category_id UUID REFERENCES public.knowledge_categories(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  
  -- Status & workflow
  status public.article_status NOT NULL DEFAULT 'draft',
  
  -- Authorship
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_edited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Review workflow
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  
  -- Publishing
  published_at TIMESTAMP WITH TIME ZONE,
  published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Visibility
  is_public BOOLEAN NOT NULL DEFAULT true,  -- Visible to customers
  is_internal BOOLEAN NOT NULL DEFAULT false,  -- Internal docs only
  is_featured BOOLEAN NOT NULL DEFAULT false,
  
  -- Analytics
  view_count INTEGER NOT NULL DEFAULT 0,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  not_helpful_count INTEGER NOT NULL DEFAULT 0,
  
  -- Related content
  related_article_ids UUID[] DEFAULT '{}',
  related_product_ids UUID[] DEFAULT '{}',
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  
  -- Version control
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Metadata
  custom_fields JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT knowledge_article_slug_org_unique UNIQUE(organization_id, slug)
);

CREATE INDEX idx_knowledge_articles_org ON public.knowledge_articles(organization_id);
CREATE INDEX idx_knowledge_articles_category ON public.knowledge_articles(category_id);
CREATE INDEX idx_knowledge_articles_status ON public.knowledge_articles(status);
CREATE INDEX idx_knowledge_articles_author ON public.knowledge_articles(author_id);
CREATE INDEX idx_knowledge_articles_slug ON public.knowledge_articles(slug);
CREATE INDEX idx_knowledge_articles_published ON public.knowledge_articles(published_at) WHERE status = 'published';

-- Full text search on articles
CREATE INDEX idx_knowledge_articles_search ON public.knowledge_articles 
  USING gin(to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(content, '')));

-- =====================
-- ARTICLE VERSION HISTORY
-- =====================

CREATE TABLE public.article_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.knowledge_articles(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  change_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_article_versions_article ON public.article_versions(article_id);

-- =====================
-- ARTICLE FEEDBACK
-- =====================

CREATE TABLE public.article_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.knowledge_articles(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  feedback TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_article_feedback_article ON public.article_feedback(article_id);

-- =====================
-- CSAT RESPONSES
-- =====================

CREATE TABLE public.csat_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  
  -- Rating (1-5 stars)
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  
  -- Detailed ratings (optional)
  rating_response_time INTEGER CHECK (rating_response_time >= 1 AND rating_response_time <= 5),
  rating_knowledge INTEGER CHECK (rating_knowledge >= 1 AND rating_knowledge <= 5),
  rating_friendliness INTEGER CHECK (rating_friendliness >= 1 AND rating_friendliness <= 5),
  rating_resolution INTEGER CHECK (rating_resolution >= 1 AND rating_resolution <= 5),
  
  -- Feedback
  feedback TEXT,
  would_recommend BOOLEAN,
  
  -- Respondent
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  respondent_email TEXT,
  respondent_name TEXT,
  
  -- Agent being rated
  agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Metadata
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  survey_sent_at TIMESTAMP WITH TIME ZONE,
  ip_address TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_csat_responses_org ON public.csat_responses(organization_id);
CREATE INDEX idx_csat_responses_ticket ON public.csat_responses(ticket_id);
CREATE INDEX idx_csat_responses_agent ON public.csat_responses(agent_id);
CREATE INDEX idx_csat_responses_score ON public.csat_responses(score);

-- =====================
-- CANNED RESPONSES (Macros)
-- =====================

CREATE TABLE public.canned_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  shortcut TEXT,
  content TEXT NOT NULL,
  content_html TEXT,
  category TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,  -- Shared with team
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_canned_responses_org ON public.canned_responses(organization_id);
CREATE INDEX idx_canned_responses_owner ON public.canned_responses(owner_id);
CREATE INDEX idx_canned_responses_shortcut ON public.canned_responses(shortcut);

-- =====================
-- HELPER FUNCTIONS
-- =====================

-- Generate ticket number
CREATE OR REPLACE FUNCTION public.generate_ticket_number(org_id UUID)
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
  FROM public.tickets
  WHERE organization_id = org_id
  AND created_at >= date_trunc('year', now());
  
  RETURN 'TKT-' || v_year || '-' || lpad(v_count::text, 6, '0');
END;
$$;

-- Calculate SLA due dates
CREATE OR REPLACE FUNCTION public.calculate_sla_due_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sla RECORD;
  v_response_minutes INTEGER;
  v_resolution_minutes INTEGER;
BEGIN
  -- Only calculate on insert or when SLA/priority changes
  IF TG_OP = 'INSERT' OR 
     (TG_OP = 'UPDATE' AND (OLD.sla_id IS DISTINCT FROM NEW.sla_id OR OLD.priority IS DISTINCT FROM NEW.priority)) THEN
    
    -- Get SLA settings
    IF NEW.sla_id IS NOT NULL THEN
      SELECT * INTO v_sla FROM public.ticket_slas WHERE id = NEW.sla_id;
    ELSE
      SELECT * INTO v_sla FROM public.ticket_slas 
      WHERE organization_id = NEW.organization_id AND is_default = true
      LIMIT 1;
      
      IF v_sla.id IS NOT NULL THEN
        NEW.sla_id := v_sla.id;
      END IF;
    END IF;
    
    IF v_sla.id IS NOT NULL THEN
      -- Get response time based on priority
      CASE NEW.priority
        WHEN 'low' THEN v_response_minutes := v_sla.first_response_low;
        WHEN 'medium' THEN v_response_minutes := v_sla.first_response_medium;
        WHEN 'high' THEN v_response_minutes := v_sla.first_response_high;
        WHEN 'critical' THEN v_response_minutes := v_sla.first_response_critical;
        ELSE v_response_minutes := v_sla.first_response_medium;
      END CASE;
      
      -- Get resolution time based on priority
      CASE NEW.priority
        WHEN 'low' THEN v_resolution_minutes := v_sla.resolution_low;
        WHEN 'medium' THEN v_resolution_minutes := v_sla.resolution_medium;
        WHEN 'high' THEN v_resolution_minutes := v_sla.resolution_high;
        WHEN 'critical' THEN v_resolution_minutes := v_sla.resolution_critical;
        ELSE v_resolution_minutes := v_sla.resolution_medium;
      END CASE;
      
      -- Calculate due dates (simple calculation, business hours logic would be more complex)
      IF NEW.sla_first_response_due IS NULL THEN
        NEW.sla_first_response_due := NEW.created_at + (v_response_minutes || ' minutes')::interval;
      END IF;
      
      IF NEW.sla_resolution_due IS NULL THEN
        NEW.sla_resolution_due := NEW.created_at + (v_resolution_minutes || ' minutes')::interval;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER calculate_ticket_sla
  BEFORE INSERT OR UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_sla_due_dates();

-- Track ticket status changes
CREATE OR REPLACE FUNCTION public.track_ticket_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_duration INTEGER;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Calculate duration in old status
    v_duration := EXTRACT(EPOCH FROM (now() - OLD.updated_at)) / 60;
    
    -- Insert status history
    INSERT INTO public.ticket_status_history (
      ticket_id, old_status, new_status, changed_by, duration_minutes
    ) VALUES (
      NEW.id, OLD.status, NEW.status, auth.uid(), v_duration
    );
    
    -- Update timestamps based on new status
    IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
      NEW.resolved_at := now();
      NEW.resolved_by := auth.uid();
    END IF;
    
    IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
      NEW.closed_at := now();
      NEW.closed_by := auth.uid();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER track_ticket_status
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.track_ticket_status_change();

-- Update first response time
CREATE OR REPLACE FUNCTION public.update_ticket_first_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only for agent messages that aren't internal
  IF NEW.sender_type = 'agent' AND NEW.is_internal = false THEN
    UPDATE public.tickets
    SET 
      first_response_at = COALESCE(first_response_at, now()),
      sla_first_response_at = COALESCE(sla_first_response_at, now()),
      sla_first_response_breached = CASE 
        WHEN sla_first_response_at IS NULL AND sla_first_response_due < now() THEN true 
        ELSE sla_first_response_breached 
      END,
      last_agent_response_at = now()
    WHERE id = NEW.ticket_id;
  END IF;
  
  -- Track customer responses
  IF NEW.sender_type = 'customer' THEN
    UPDATE public.tickets
    SET last_customer_response_at = now()
    WHERE id = NEW.ticket_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_first_response
  AFTER INSERT ON public.ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ticket_first_response();

-- Update article feedback counts
CREATE OR REPLACE FUNCTION public.update_article_feedback_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_helpful THEN
      UPDATE public.knowledge_articles
      SET helpful_count = helpful_count + 1
      WHERE id = NEW.article_id;
    ELSE
      UPDATE public.knowledge_articles
      SET not_helpful_count = not_helpful_count + 1
      WHERE id = NEW.article_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_feedback_counts
  AFTER INSERT ON public.article_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_article_feedback_counts();

-- =====================
-- ROW LEVEL SECURITY
-- =====================

-- Enable RLS on all tables
ALTER TABLE public.ticket_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_slas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_watchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csat_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canned_responses ENABLE ROW LEVEL SECURITY;

-- Ticket Categories policies
CREATE POLICY "Users can view categories in their org" ON public.ticket_categories
  FOR SELECT USING (is_member_of_org(organization_id));

CREATE POLICY "Admins can manage categories" ON public.ticket_categories
  FOR ALL USING (is_member_of_org(organization_id) AND has_role('admin'::user_role))
  WITH CHECK (is_member_of_org(organization_id) AND has_role('admin'::user_role));

-- Ticket Queues policies
CREATE POLICY "Users can view queues in their org" ON public.ticket_queues
  FOR SELECT USING (is_member_of_org(organization_id));

CREATE POLICY "Admins can manage queues" ON public.ticket_queues
  FOR ALL USING (is_member_of_org(organization_id) AND has_role('admin'::user_role))
  WITH CHECK (is_member_of_org(organization_id) AND has_role('admin'::user_role));

-- Ticket SLAs policies
CREATE POLICY "Users can view SLAs in their org" ON public.ticket_slas
  FOR SELECT USING (is_member_of_org(organization_id));

CREATE POLICY "Admins can manage SLAs" ON public.ticket_slas
  FOR ALL USING (is_member_of_org(organization_id) AND has_role('admin'::user_role))
  WITH CHECK (is_member_of_org(organization_id) AND has_role('admin'::user_role));

-- Tickets policies
CREATE POLICY "Users can view tickets in their org" ON public.tickets
  FOR SELECT USING (is_member_of_org(organization_id));

CREATE POLICY "Users can create tickets in their org" ON public.tickets
  FOR INSERT WITH CHECK (is_member_of_org(organization_id));

CREATE POLICY "Users can update tickets in their org" ON public.tickets
  FOR UPDATE USING (is_member_of_org(organization_id))
  WITH CHECK (is_member_of_org(organization_id));

CREATE POLICY "Users can delete tickets in their org" ON public.tickets
  FOR DELETE USING (is_member_of_org(organization_id));

-- Ticket Messages policies
CREATE POLICY "Users can view messages for org tickets" ON public.ticket_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tickets t 
      WHERE t.id = ticket_id AND is_member_of_org(t.organization_id)
    )
  );

CREATE POLICY "Users can create messages for org tickets" ON public.ticket_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tickets t 
      WHERE t.id = ticket_id AND is_member_of_org(t.organization_id)
    )
  );

CREATE POLICY "Users can update their own messages" ON public.ticket_messages
  FOR UPDATE USING (sender_id = auth.uid());

-- Ticket Watchers policies
CREATE POLICY "Users can manage their own watches" ON public.ticket_watchers
  FOR ALL USING (user_id = auth.uid());

-- Ticket Status History policies
CREATE POLICY "Users can view history for org tickets" ON public.ticket_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tickets t 
      WHERE t.id = ticket_id AND is_member_of_org(t.organization_id)
    )
  );

-- Knowledge Categories policies
CREATE POLICY "Users can view categories in their org" ON public.knowledge_categories
  FOR SELECT USING (is_member_of_org(organization_id));

CREATE POLICY "Admins can manage knowledge categories" ON public.knowledge_categories
  FOR ALL USING (is_member_of_org(organization_id) AND has_role('admin'::user_role))
  WITH CHECK (is_member_of_org(organization_id) AND has_role('admin'::user_role));

-- Knowledge Articles policies
CREATE POLICY "Users can view articles in their org" ON public.knowledge_articles
  FOR SELECT USING (is_member_of_org(organization_id));

CREATE POLICY "Users can create articles in their org" ON public.knowledge_articles
  FOR INSERT WITH CHECK (is_member_of_org(organization_id));

CREATE POLICY "Users can update articles in their org" ON public.knowledge_articles
  FOR UPDATE USING (is_member_of_org(organization_id))
  WITH CHECK (is_member_of_org(organization_id));

CREATE POLICY "Admins can delete articles" ON public.knowledge_articles
  FOR DELETE USING (is_member_of_org(organization_id) AND (author_id = auth.uid() OR has_role('admin'::user_role)));

-- Article Versions policies
CREATE POLICY "Users can view versions for org articles" ON public.article_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.knowledge_articles a 
      WHERE a.id = article_id AND is_member_of_org(a.organization_id)
    )
  );

-- Article Feedback policies
CREATE POLICY "Anyone can submit feedback" ON public.article_feedback
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view feedback for org articles" ON public.article_feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.knowledge_articles a 
      WHERE a.id = article_id AND is_member_of_org(a.organization_id)
    )
  );

-- CSAT Responses policies
CREATE POLICY "Users can view CSAT in their org" ON public.csat_responses
  FOR SELECT USING (is_member_of_org(organization_id));

CREATE POLICY "Anyone can submit CSAT" ON public.csat_responses
  FOR INSERT WITH CHECK (is_member_of_org(organization_id));

-- Canned Responses policies
CREATE POLICY "Users can view canned responses" ON public.canned_responses
  FOR SELECT USING (
    is_member_of_org(organization_id) AND (is_public = true OR owner_id = auth.uid())
  );

CREATE POLICY "Users can manage their own canned responses" ON public.canned_responses
  FOR ALL USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Admins can manage all canned responses" ON public.canned_responses
  FOR ALL USING (is_member_of_org(organization_id) AND has_role('admin'::user_role))
  WITH CHECK (is_member_of_org(organization_id) AND has_role('admin'::user_role));

-- =====================
-- UPDATED_AT TRIGGERS
-- =====================

CREATE TRIGGER update_ticket_categories_updated_at
  BEFORE UPDATE ON public.ticket_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ticket_queues_updated_at
  BEFORE UPDATE ON public.ticket_queues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ticket_slas_updated_at
  BEFORE UPDATE ON public.ticket_slas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ticket_messages_updated_at
  BEFORE UPDATE ON public.ticket_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_categories_updated_at
  BEFORE UPDATE ON public.knowledge_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_articles_updated_at
  BEFORE UPDATE ON public.knowledge_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_canned_responses_updated_at
  BEFORE UPDATE ON public.canned_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();