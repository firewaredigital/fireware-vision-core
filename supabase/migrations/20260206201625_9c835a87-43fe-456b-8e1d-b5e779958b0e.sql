
-- =====================================================
-- PASSO 2: CUSTOM FIELDS ENGINE + AUDIT TRAIL
-- =====================================================

-- =====================================================
-- PART 1: CUSTOM FIELDS ENGINE
-- =====================================================

-- 1.1 Enum for custom field types
CREATE TYPE public.custom_field_type AS ENUM (
  'text', 'number', 'decimal', 'date', 'datetime', 'boolean',
  'select', 'multiselect', 'url', 'email', 'phone', 'textarea', 'lookup'
);

-- 1.2 Enum for entity types that support custom fields
CREATE TYPE public.custom_field_entity_type AS ENUM (
  'lead', 'contact', 'account', 'opportunity', 'ticket', 'order'
);

-- 1.3 Custom Field Definitions table
CREATE TABLE public.custom_field_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type public.custom_field_entity_type NOT NULL,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type public.custom_field_type NOT NULL DEFAULT 'text',
  is_required BOOLEAN NOT NULL DEFAULT false,
  default_value TEXT,
  options JSONB DEFAULT '[]'::jsonb,
  validation_rules JSONB DEFAULT '{}'::jsonb,
  display_order INTEGER NOT NULL DEFAULT 0,
  section_name TEXT DEFAULT 'Campos Personalizados',
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  placeholder TEXT,
  lookup_entity TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_custom_field_name UNIQUE (organization_id, entity_type, field_name)
);

-- 1.4 Custom Field Values table
CREATE TABLE public.custom_field_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  field_definition_id UUID NOT NULL REFERENCES public.custom_field_definitions(id) ON DELETE CASCADE,
  entity_type public.custom_field_entity_type NOT NULL,
  entity_id UUID NOT NULL,
  value_text TEXT,
  value_number NUMERIC(20, 6),
  value_date TIMESTAMPTZ,
  value_boolean BOOLEAN,
  value_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_custom_field_value UNIQUE (field_definition_id, entity_id)
);

-- 1.5 Indexes for custom fields
CREATE INDEX idx_cfd_org_entity ON public.custom_field_definitions(organization_id, entity_type);
CREATE INDEX idx_cfd_org_entity_active ON public.custom_field_definitions(organization_id, entity_type) WHERE is_active = true;
CREATE INDEX idx_cfv_entity ON public.custom_field_values(entity_type, entity_id);
CREATE INDEX idx_cfv_org_entity ON public.custom_field_values(organization_id, entity_type, entity_id);
CREATE INDEX idx_cfv_definition ON public.custom_field_values(field_definition_id);

-- 1.6 RLS for custom_field_definitions
ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view custom field definitions for their org"
  ON public.custom_field_definitions FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create custom field definitions for their org"
  ON public.custom_field_definitions FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update custom field definitions for their org"
  ON public.custom_field_definitions FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete custom field definitions for their org"
  ON public.custom_field_definitions FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

-- 1.7 RLS for custom_field_values
ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view custom field values for their org"
  ON public.custom_field_values FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create custom field values for their org"
  ON public.custom_field_values FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update custom field values for their org"
  ON public.custom_field_values FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete custom field values for their org"
  ON public.custom_field_values FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

-- 1.8 Triggers for updated_at
CREATE TRIGGER update_custom_field_definitions_updated_at
  BEFORE UPDATE ON public.custom_field_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_field_values_updated_at
  BEFORE UPDATE ON public.custom_field_values
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- PART 2: AUDIT TRAIL - ENTITY CHANGE LOG
-- =====================================================

-- 2.1 Enum for change action types
CREATE TYPE public.entity_change_action AS ENUM ('create', 'update', 'delete');

-- 2.2 Entity Change Log table
CREATE TABLE public.entity_change_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  entity_name TEXT,
  action public.entity_change_action NOT NULL,
  changed_by UUID REFERENCES public.profiles(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  changes JSONB NOT NULL DEFAULT '[]'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 2.3 Indexes for entity_change_log
CREATE INDEX idx_ecl_entity ON public.entity_change_log(entity_type, entity_id);
CREATE INDEX idx_ecl_org_entity ON public.entity_change_log(organization_id, entity_type, entity_id);
CREATE INDEX idx_ecl_changed_at ON public.entity_change_log(changed_at DESC);
CREATE INDEX idx_ecl_changed_by ON public.entity_change_log(changed_by);
CREATE INDEX idx_ecl_org_type_date ON public.entity_change_log(organization_id, entity_type, changed_at DESC);

-- 2.4 RLS for entity_change_log
ALTER TABLE public.entity_change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view change logs for their org"
  ON public.entity_change_log FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "System can insert change logs"
  ON public.entity_change_log FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

-- 2.5 Generic trigger function for tracking entity changes
CREATE OR REPLACE FUNCTION public.track_entity_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_changes JSONB := '[]'::jsonb;
  v_action public.entity_change_action;
  v_entity_name TEXT;
  v_org_id UUID;
  v_column_name TEXT;
  v_old_value TEXT;
  v_new_value TEXT;
  v_record_old JSONB;
  v_record_new JSONB;
  v_key TEXT;
  v_skip_columns TEXT[] := ARRAY['updated_at', 'created_at', 'id', 'organization_id'];
BEGIN
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_org_id := NEW.organization_id;
    v_record_new := to_jsonb(NEW);
    
    -- Try to get entity name from common columns
    v_entity_name := COALESCE(
      v_record_new->>'name',
      v_record_new->>'title',
      v_record_new->>'subject',
      CONCAT(v_record_new->>'first_name', ' ', v_record_new->>'last_name'),
      v_record_new->>'ticket_number',
      v_record_new->>'order_number',
      v_record_new->>'contract_number',
      v_record_new->>'quote_number',
      NEW.id::text
    );
    
    -- For INSERT, record all non-null fields
    FOR v_key IN SELECT jsonb_object_keys(v_record_new) LOOP
      IF NOT (v_key = ANY(v_skip_columns)) AND v_record_new->>v_key IS NOT NULL THEN
        v_changes := v_changes || jsonb_build_object(
          'field', v_key,
          'old_value', NULL,
          'new_value', v_record_new->>v_key,
          'field_label', REPLACE(INITCAP(REPLACE(v_key, '_', ' ')), ' ', ' ')
        );
      END IF;
    END LOOP;
    
    INSERT INTO public.entity_change_log (
      organization_id, entity_type, entity_id, entity_name, action, changed_by, changes
    ) VALUES (
      v_org_id, TG_TABLE_NAME, NEW.id, v_entity_name, v_action, auth.uid(), v_changes
    );
    
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_org_id := NEW.organization_id;
    v_record_old := to_jsonb(OLD);
    v_record_new := to_jsonb(NEW);
    
    v_entity_name := COALESCE(
      v_record_new->>'name',
      v_record_new->>'title',
      v_record_new->>'subject',
      CONCAT(v_record_new->>'first_name', ' ', v_record_new->>'last_name'),
      v_record_new->>'ticket_number',
      v_record_new->>'order_number',
      v_record_new->>'contract_number',
      v_record_new->>'quote_number',
      NEW.id::text
    );
    
    -- Compare each field, recording only changes
    FOR v_key IN SELECT jsonb_object_keys(v_record_new) LOOP
      IF NOT (v_key = ANY(v_skip_columns)) THEN
        v_old_value := v_record_old->>v_key;
        v_new_value := v_record_new->>v_key;
        
        IF v_old_value IS DISTINCT FROM v_new_value THEN
          v_changes := v_changes || jsonb_build_object(
            'field', v_key,
            'old_value', v_old_value,
            'new_value', v_new_value,
            'field_label', REPLACE(INITCAP(REPLACE(v_key, '_', ' ')), ' ', ' ')
          );
        END IF;
      END IF;
    END LOOP;
    
    -- Only log if there are actual changes
    IF jsonb_array_length(v_changes) > 0 THEN
      INSERT INTO public.entity_change_log (
        organization_id, entity_type, entity_id, entity_name, action, changed_by, changes
      ) VALUES (
        v_org_id, TG_TABLE_NAME, NEW.id, v_entity_name, v_action, auth.uid(), v_changes
      );
    END IF;
    
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_org_id := OLD.organization_id;
    v_record_old := to_jsonb(OLD);
    
    v_entity_name := COALESCE(
      v_record_old->>'name',
      v_record_old->>'title',
      v_record_old->>'subject',
      CONCAT(v_record_old->>'first_name', ' ', v_record_old->>'last_name'),
      v_record_old->>'ticket_number',
      v_record_old->>'order_number',
      v_record_old->>'contract_number',
      v_record_old->>'quote_number',
      OLD.id::text
    );
    
    -- For DELETE, record all non-null fields
    FOR v_key IN SELECT jsonb_object_keys(v_record_old) LOOP
      IF NOT (v_key = ANY(v_skip_columns)) AND v_record_old->>v_key IS NOT NULL THEN
        v_changes := v_changes || jsonb_build_object(
          'field', v_key,
          'old_value', v_record_old->>v_key,
          'new_value', NULL,
          'field_label', REPLACE(INITCAP(REPLACE(v_key, '_', ' ')), ' ', ' ')
        );
      END IF;
    END LOOP;
    
    INSERT INTO public.entity_change_log (
      organization_id, entity_type, entity_id, entity_name, action, changed_by, changes
    ) VALUES (
      v_org_id, TG_TABLE_NAME, OLD.id, v_entity_name, v_action, auth.uid(), v_changes
    );
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- 2.6 Apply change tracking triggers to all major entities
CREATE TRIGGER track_leads_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.track_entity_changes();

CREATE TRIGGER track_contacts_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.track_entity_changes();

CREATE TRIGGER track_accounts_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.track_entity_changes();

CREATE TRIGGER track_opportunities_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.track_entity_changes();

CREATE TRIGGER track_tickets_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.track_entity_changes();

CREATE TRIGGER track_orders_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.track_entity_changes();

CREATE TRIGGER track_contracts_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.track_entity_changes();

CREATE TRIGGER track_quotes_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.track_entity_changes();

-- 2.7 RPC to get change history with pagination
CREATE OR REPLACE FUNCTION public.get_entity_change_history(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_changed_by UUID DEFAULT NULL,
  p_field_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  entity_type TEXT,
  entity_id UUID,
  entity_name TEXT,
  action public.entity_change_action,
  changed_by UUID,
  changed_by_name TEXT,
  changed_by_email TEXT,
  changed_by_avatar TEXT,
  changed_at TIMESTAMPTZ,
  changes JSONB,
  metadata JSONB,
  total_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total BIGINT;
BEGIN
  -- Get total count
  SELECT COUNT(*) INTO v_total
  FROM public.entity_change_log ecl
  WHERE ecl.entity_type = p_entity_type
    AND ecl.entity_id = p_entity_id
    AND ecl.organization_id IN (
      SELECT p.organization_id FROM public.profiles p WHERE p.id = auth.uid()
    )
    AND (p_changed_by IS NULL OR ecl.changed_by = p_changed_by)
    AND (p_field_filter IS NULL OR ecl.changes @> ('[{"field":"' || p_field_filter || '"}]')::jsonb);
  
  RETURN QUERY
  SELECT 
    ecl.id,
    ecl.entity_type,
    ecl.entity_id,
    ecl.entity_name,
    ecl.action,
    ecl.changed_by,
    COALESCE(p.full_name, p.email, 'Sistema') AS changed_by_name,
    p.email AS changed_by_email,
    p.avatar_url AS changed_by_avatar,
    ecl.changed_at,
    CASE 
      WHEN p_field_filter IS NOT NULL THEN (
        SELECT jsonb_agg(elem)
        FROM jsonb_array_elements(ecl.changes) elem
        WHERE elem->>'field' = p_field_filter
      )
      ELSE ecl.changes
    END AS changes,
    ecl.metadata,
    v_total AS total_count
  FROM public.entity_change_log ecl
  LEFT JOIN public.profiles p ON p.id = ecl.changed_by
  WHERE ecl.entity_type = p_entity_type
    AND ecl.entity_id = p_entity_id
    AND ecl.organization_id IN (
      SELECT pr.organization_id FROM public.profiles pr WHERE pr.id = auth.uid()
    )
    AND (p_changed_by IS NULL OR ecl.changed_by = p_changed_by)
    AND (p_field_filter IS NULL OR ecl.changes @> ('[{"field":"' || p_field_filter || '"}]')::jsonb)
  ORDER BY ecl.changed_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
