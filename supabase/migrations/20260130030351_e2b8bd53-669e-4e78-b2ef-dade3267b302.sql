-- =====================================================
-- PHASE 12: Customer Portal & Enhanced Canned Responses
-- =====================================================

-- Enum for portal user status
CREATE TYPE portal_user_status AS ENUM ('pending', 'active', 'suspended', 'deactivated');

-- Enum for portal ticket visibility
CREATE TYPE portal_ticket_visibility AS ENUM ('all', 'own', 'company');

-- =====================================================
-- Customer Portal Users
-- =====================================================
CREATE TABLE customer_portal_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  
  -- Authentication
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  
  -- Status
  status portal_user_status DEFAULT 'pending',
  email_verified BOOLEAN DEFAULT false,
  email_verification_token TEXT,
  email_verification_sent_at TIMESTAMPTZ,
  email_verified_at TIMESTAMPTZ,
  
  -- Password reset
  password_reset_token TEXT,
  password_reset_expires_at TIMESTAMPTZ,
  password_changed_at TIMESTAMPTZ,
  
  -- Profile
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  language TEXT DEFAULT 'pt-BR',
  
  -- Permissions
  ticket_visibility portal_ticket_visibility DEFAULT 'own',
  can_create_tickets BOOLEAN DEFAULT true,
  can_view_knowledge_base BOOLEAN DEFAULT true,
  can_view_contracts BOOLEAN DEFAULT false,
  can_view_invoices BOOLEAN DEFAULT false,
  
  -- Session tracking
  last_login_at TIMESTAMPTZ,
  last_login_ip TEXT,
  login_count INTEGER DEFAULT 0,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  
  -- Preferences
  notification_preferences JSONB DEFAULT '{"email_ticket_updates": true, "email_new_articles": false}'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  
  CONSTRAINT unique_portal_user_email_per_org UNIQUE (organization_id, email)
);

-- =====================================================
-- Portal Sessions
-- =====================================================
CREATE TABLE portal_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_user_id UUID NOT NULL REFERENCES customer_portal_users(id) ON DELETE CASCADE,
  
  -- Session token
  session_token TEXT NOT NULL UNIQUE,
  refresh_token TEXT UNIQUE,
  
  -- Session info
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  
  -- Location
  country TEXT,
  city TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT
);

-- =====================================================
-- Portal Activity Log
-- =====================================================
CREATE TABLE portal_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_user_id UUID NOT NULL REFERENCES customer_portal_users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES portal_sessions(id) ON DELETE SET NULL,
  
  -- Activity details
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  entity_name TEXT,
  
  -- Context
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Portal Announcements
-- =====================================================
CREATE TABLE portal_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_html TEXT,
  
  -- Display settings
  type TEXT DEFAULT 'info', -- info, warning, success, error
  is_dismissible BOOLEAN DEFAULT true,
  is_sticky BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  
  -- Targeting
  target_accounts UUID[],
  target_all BOOLEAN DEFAULT true,
  
  -- Schedule
  starts_at TIMESTAMPTZ DEFAULT now(),
  ends_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Portal Notification Preferences
-- =====================================================
CREATE TABLE portal_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_user_id UUID NOT NULL REFERENCES customer_portal_users(id) ON DELETE CASCADE,
  
  -- Notification details
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  
  -- Related entity
  entity_type TEXT,
  entity_id UUID,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Enhanced Canned Responses (already exists, adding more fields)
-- =====================================================

-- Add more columns to canned_responses if they don't exist
DO $$ 
BEGIN
  -- Add variables column for template variables
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'canned_responses' AND column_name = 'variables'
  ) THEN
    ALTER TABLE canned_responses ADD COLUMN variables JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Add attachments column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'canned_responses' AND column_name = 'attachments'
  ) THEN
    ALTER TABLE canned_responses ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Add tags for better organization
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'canned_responses' AND column_name = 'tags'
  ) THEN
    ALTER TABLE canned_responses ADD COLUMN tags TEXT[];
  END IF;

  -- Add language support
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'canned_responses' AND column_name = 'language'
  ) THEN
    ALTER TABLE canned_responses ADD COLUMN language TEXT DEFAULT 'pt-BR';
  END IF;

  -- Add approval workflow
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'canned_responses' AND column_name = 'requires_approval'
  ) THEN
    ALTER TABLE canned_responses ADD COLUMN requires_approval BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'canned_responses' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE canned_responses ADD COLUMN approved_by UUID REFERENCES profiles(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'canned_responses' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE canned_responses ADD COLUMN approved_at TIMESTAMPTZ;
  END IF;
END $$;

-- =====================================================
-- Canned Response Categories
-- =====================================================
CREATE TABLE IF NOT EXISTS canned_response_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  
  parent_id UUID REFERENCES canned_response_categories(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Canned Response Usage Analytics
-- =====================================================
CREATE TABLE IF NOT EXISTS canned_response_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canned_response_id UUID NOT NULL REFERENCES canned_responses(id) ON DELETE CASCADE,
  
  used_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  used_in_ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
  
  -- Analytics
  time_saved_seconds INTEGER,
  customer_response_time_seconds INTEGER,
  customer_satisfaction INTEGER, -- 1-5
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Portal Settings per Organization
-- =====================================================
CREATE TABLE portal_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Branding
  portal_name TEXT DEFAULT 'Portal do Cliente',
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#1E40AF',
  
  -- Custom domain
  custom_domain TEXT,
  
  -- Features
  enable_ticket_creation BOOLEAN DEFAULT true,
  enable_knowledge_base BOOLEAN DEFAULT true,
  enable_live_chat BOOLEAN DEFAULT false,
  enable_community BOOLEAN DEFAULT false,
  
  -- Ticket settings
  default_ticket_visibility portal_ticket_visibility DEFAULT 'own',
  require_category BOOLEAN DEFAULT true,
  allowed_file_types TEXT[] DEFAULT ARRAY['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx'],
  max_file_size_mb INTEGER DEFAULT 10,
  
  -- Registration
  allow_self_registration BOOLEAN DEFAULT false,
  require_email_verification BOOLEAN DEFAULT true,
  allowed_email_domains TEXT[],
  
  -- Session settings
  session_timeout_minutes INTEGER DEFAULT 60,
  max_sessions_per_user INTEGER DEFAULT 5,
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  
  -- Custom content
  welcome_message TEXT,
  footer_text TEXT,
  custom_css TEXT,
  custom_js TEXT,
  
  -- Legal
  terms_of_service_url TEXT,
  privacy_policy_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_portal_settings_per_org UNIQUE (organization_id)
);

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX idx_portal_users_org ON customer_portal_users(organization_id);
CREATE INDEX idx_portal_users_email ON customer_portal_users(email);
CREATE INDEX idx_portal_users_contact ON customer_portal_users(contact_id);
CREATE INDEX idx_portal_users_account ON customer_portal_users(account_id);
CREATE INDEX idx_portal_users_status ON customer_portal_users(status);

CREATE INDEX idx_portal_sessions_user ON portal_sessions(portal_user_id);
CREATE INDEX idx_portal_sessions_token ON portal_sessions(session_token);
CREATE INDEX idx_portal_sessions_expires ON portal_sessions(expires_at);

CREATE INDEX idx_portal_activity_user ON portal_activity_log(portal_user_id);
CREATE INDEX idx_portal_activity_action ON portal_activity_log(action);
CREATE INDEX idx_portal_activity_created ON portal_activity_log(created_at DESC);

CREATE INDEX idx_portal_announcements_org ON portal_announcements(organization_id);
CREATE INDEX idx_portal_announcements_active ON portal_announcements(is_active);

CREATE INDEX idx_portal_notifications_user ON portal_notifications(portal_user_id);
CREATE INDEX idx_portal_notifications_unread ON portal_notifications(portal_user_id, is_read) WHERE NOT is_read;

CREATE INDEX idx_canned_categories_org ON canned_response_categories(organization_id);
CREATE INDEX idx_canned_analytics_response ON canned_response_analytics(canned_response_id);
CREATE INDEX idx_canned_analytics_user ON canned_response_analytics(used_by);

-- =====================================================
-- RLS Policies
-- =====================================================

-- Portal Users
ALTER TABLE customer_portal_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view portal users in their org" ON customer_portal_users
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage portal users" ON customer_portal_users
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Portal Sessions
ALTER TABLE portal_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sessions of portal users in their org" ON portal_sessions
  FOR SELECT USING (
    portal_user_id IN (
      SELECT id FROM customer_portal_users WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Portal Activity Log
ALTER TABLE portal_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activity of portal users in their org" ON portal_activity_log
  FOR SELECT USING (
    portal_user_id IN (
      SELECT id FROM customer_portal_users WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Portal Announcements
ALTER TABLE portal_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view announcements in their org" ON portal_announcements
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage announcements" ON portal_announcements
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Portal Notifications
ALTER TABLE portal_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notifications of portal users in their org" ON portal_notifications
  FOR SELECT USING (
    portal_user_id IN (
      SELECT id FROM customer_portal_users WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Portal Settings
ALTER TABLE portal_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view portal settings in their org" ON portal_settings
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage portal settings" ON portal_settings
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Canned Response Categories
ALTER TABLE canned_response_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view categories in their org" ON canned_response_categories
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage categories" ON canned_response_categories
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Canned Response Analytics
ALTER TABLE canned_response_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analytics in their org" ON canned_response_analytics
  FOR SELECT USING (
    canned_response_id IN (
      SELECT id FROM canned_responses WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert their own analytics" ON canned_response_analytics
  FOR INSERT WITH CHECK (used_by = auth.uid());

-- =====================================================
-- Triggers
-- =====================================================

-- Update portal user updated_at
CREATE TRIGGER update_portal_users_updated_at
  BEFORE UPDATE ON customer_portal_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update portal settings updated_at
CREATE TRIGGER update_portal_settings_updated_at
  BEFORE UPDATE ON portal_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update canned response categories updated_at
CREATE TRIGGER update_canned_categories_updated_at
  BEFORE UPDATE ON canned_response_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update portal announcements updated_at
CREATE TRIGGER update_portal_announcements_updated_at
  BEFORE UPDATE ON portal_announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Functions
-- =====================================================

-- Function to create a portal user from a contact
CREATE OR REPLACE FUNCTION create_portal_user_from_contact(
  p_contact_id UUID,
  p_email TEXT,
  p_password TEXT,
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_contact RECORD;
  v_portal_user_id UUID;
BEGIN
  -- Get contact details
  SELECT * INTO v_contact FROM contacts WHERE id = p_contact_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contact not found';
  END IF;
  
  -- Create portal user
  INSERT INTO customer_portal_users (
    organization_id,
    contact_id,
    account_id,
    email,
    password_hash,
    first_name,
    last_name,
    phone,
    status,
    created_by
  )
  VALUES (
    v_contact.organization_id,
    p_contact_id,
    v_contact.account_id,
    p_email,
    crypt(p_password, gen_salt('bf')),
    v_contact.first_name,
    v_contact.last_name,
    v_contact.phone,
    'pending',
    p_created_by
  )
  RETURNING id INTO v_portal_user_id;
  
  RETURN v_portal_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to authenticate portal user
CREATE OR REPLACE FUNCTION authenticate_portal_user(
  p_email TEXT,
  p_password TEXT,
  p_organization_id UUID
)
RETURNS TABLE (
  user_id UUID,
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_user RECORD;
BEGIN
  -- Find user
  SELECT * INTO v_user 
  FROM customer_portal_users 
  WHERE email = p_email 
    AND organization_id = p_organization_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, false, 'Invalid credentials'::TEXT;
    RETURN;
  END IF;
  
  -- Check if locked
  IF v_user.locked_until IS NOT NULL AND v_user.locked_until > now() THEN
    RETURN QUERY SELECT NULL::UUID, false, 'Account is locked'::TEXT;
    RETURN;
  END IF;
  
  -- Check status
  IF v_user.status != 'active' THEN
    RETURN QUERY SELECT NULL::UUID, false, 'Account is not active'::TEXT;
    RETURN;
  END IF;
  
  -- Verify password
  IF v_user.password_hash = crypt(p_password, v_user.password_hash) THEN
    -- Update login info
    UPDATE customer_portal_users
    SET 
      last_login_at = now(),
      login_count = login_count + 1,
      failed_login_attempts = 0,
      locked_until = NULL
    WHERE id = v_user.id;
    
    RETURN QUERY SELECT v_user.id, true, 'Success'::TEXT;
  ELSE
    -- Increment failed attempts
    UPDATE customer_portal_users
    SET 
      failed_login_attempts = failed_login_attempts + 1,
      locked_until = CASE 
        WHEN failed_login_attempts >= 4 THEN now() + interval '30 minutes'
        ELSE NULL
      END
    WHERE id = v_user.id;
    
    RETURN QUERY SELECT NULL::UUID, false, 'Invalid credentials'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to parse canned response variables
CREATE OR REPLACE FUNCTION parse_canned_response(
  p_content TEXT,
  p_ticket_id UUID DEFAULT NULL,
  p_contact_id UUID DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  v_result TEXT;
  v_ticket RECORD;
  v_contact RECORD;
  v_account RECORD;
BEGIN
  v_result := p_content;
  
  -- Get ticket data if provided
  IF p_ticket_id IS NOT NULL THEN
    SELECT * INTO v_ticket FROM tickets WHERE id = p_ticket_id;
    IF FOUND THEN
      v_result := replace(v_result, '{{ticket.number}}', COALESCE(v_ticket.ticket_number, ''));
      v_result := replace(v_result, '{{ticket.subject}}', COALESCE(v_ticket.subject, ''));
      v_result := replace(v_result, '{{ticket.status}}', COALESCE(v_ticket.status::text, ''));
      v_result := replace(v_result, '{{ticket.priority}}', COALESCE(v_ticket.priority::text, ''));
    END IF;
  END IF;
  
  -- Get contact data
  IF p_contact_id IS NOT NULL THEN
    SELECT * INTO v_contact FROM contacts WHERE id = p_contact_id;
    IF FOUND THEN
      v_result := replace(v_result, '{{contact.first_name}}', COALESCE(v_contact.first_name, ''));
      v_result := replace(v_result, '{{contact.last_name}}', COALESCE(v_contact.last_name, ''));
      v_result := replace(v_result, '{{contact.email}}', COALESCE(v_contact.email, ''));
      v_result := replace(v_result, '{{contact.phone}}', COALESCE(v_contact.phone, ''));
      
      -- Get account if contact has one
      IF v_contact.account_id IS NOT NULL THEN
        SELECT * INTO v_account FROM accounts WHERE id = v_contact.account_id;
        IF FOUND THEN
          v_result := replace(v_result, '{{account.name}}', COALESCE(v_account.name, ''));
        END IF;
      END IF;
    END IF;
  END IF;
  
  -- Clean up any remaining variables
  v_result := regexp_replace(v_result, '\{\{[^}]+\}\}', '', 'g');
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;