-- Create audit_logs table for comprehensive activity tracking
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'view', 'export', 'import', 'login', 'logout')),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_name TEXT,
  changes JSONB DEFAULT '{}',
  old_values JSONB DEFAULT '{}',
  new_values JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_audit_logs_organization ON public.audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies: Only admins and managers can view audit logs
CREATE POLICY "Users can view audit logs in their org"
  ON public.audit_logs FOR SELECT
  USING (is_member_of_org(organization_id) AND (has_role('admin') OR has_role('manager')));

-- Only system can insert (via security definer function)
CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (is_member_of_org(organization_id));

-- Create function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_organization_id UUID,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_entity_name TEXT DEFAULT NULL,
  p_changes JSONB DEFAULT '{}',
  p_old_values JSONB DEFAULT '{}',
  p_new_values JSONB DEFAULT '{}',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_audit_id UUID;
BEGIN
  -- Get current user info
  v_user_id := auth.uid();
  
  SELECT email INTO v_user_email
  FROM public.profiles
  WHERE id = v_user_id;
  
  -- Insert audit log
  INSERT INTO public.audit_logs (
    organization_id,
    user_id,
    user_email,
    action,
    entity_type,
    entity_id,
    entity_name,
    changes,
    old_values,
    new_values,
    metadata
  ) VALUES (
    p_organization_id,
    v_user_id,
    v_user_email,
    p_action,
    p_entity_type,
    p_entity_id,
    p_entity_name,
    p_changes,
    p_old_values,
    p_new_values,
    p_metadata
  )
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$;