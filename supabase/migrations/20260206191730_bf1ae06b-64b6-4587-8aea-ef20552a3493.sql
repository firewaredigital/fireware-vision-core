
-- ================================================
-- BLOCO 7: A/B Test Variants + Template Sections
-- ================================================

-- Tabela de variantes A/B para campanhas
CREATE TABLE public.campaign_ab_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  variant_key TEXT NOT NULL DEFAULT 'A', -- A, B, C...
  name TEXT NOT NULL,
  subject TEXT,
  preview_text TEXT,
  content TEXT,
  content_html TEXT,
  template_id UUID REFERENCES public.email_templates(id),
  from_name TEXT,
  from_email TEXT,
  traffic_percentage INTEGER NOT NULL DEFAULT 50 CHECK (traffic_percentage >= 0 AND traffic_percentage <= 100),
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  unique_opens INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  unsubscribe_count INTEGER DEFAULT 0,
  bounce_count INTEGER DEFAULT 0,
  open_rate NUMERIC(5,2),
  click_rate NUMERIC(5,2),
  conversion_rate NUMERIC(5,2),
  is_winner BOOLEAN DEFAULT false,
  is_control BOOLEAN DEFAULT false,
  won_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, variant_key)
);

-- Tabela de seções do template (blocos visuais)
CREATE TABLE public.email_template_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.email_templates(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  section_type TEXT NOT NULL DEFAULT 'text', -- header, text, image, button, divider, spacer, columns, hero, footer, social, video
  display_order INTEGER NOT NULL DEFAULT 0,
  content JSONB NOT NULL DEFAULT '{}',
  styles JSONB NOT NULL DEFAULT '{}',
  is_locked BOOLEAN DEFAULT false,
  is_visible BOOLEAN DEFAULT true,
  conditions JSONB, -- condições de exibição dinâmica
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de versões de template (histórico)
CREATE TABLE public.email_template_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.email_templates(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  version_number INTEGER NOT NULL,
  body_html TEXT NOT NULL,
  body_json JSONB,
  sections JSONB,
  changelog TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(template_id, version_number)
);

-- RLS
ALTER TABLE public.campaign_ab_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_template_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_template_versions ENABLE ROW LEVEL SECURITY;

-- Policies campaign_ab_variants
CREATE POLICY "Users can view variants of their org" ON public.campaign_ab_variants
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can insert variants for their org" ON public.campaign_ab_variants
  FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can update variants of their org" ON public.campaign_ab_variants
  FOR UPDATE USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can delete variants of their org" ON public.campaign_ab_variants
  FOR DELETE USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Policies email_template_sections
CREATE POLICY "Users can view template sections of their org" ON public.email_template_sections
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can manage template sections of their org" ON public.email_template_sections
  FOR ALL USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Policies email_template_versions
CREATE POLICY "Users can view template versions of their org" ON public.email_template_versions
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can insert template versions for their org" ON public.email_template_versions
  FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Triggers updated_at
CREATE TRIGGER update_campaign_ab_variants_updated_at BEFORE UPDATE ON public.campaign_ab_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_email_template_sections_updated_at BEFORE UPDATE ON public.email_template_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RPC: Declarar vencedor A/B
CREATE OR REPLACE FUNCTION public.declare_ab_winner(p_campaign_id UUID, p_variant_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  -- Marcar todos como não vencedores
  UPDATE public.campaign_ab_variants
  SET is_winner = false, won_at = NULL
  WHERE campaign_id = p_campaign_id;
  
  -- Marcar o vencedor
  UPDATE public.campaign_ab_variants
  SET is_winner = true, won_at = now()
  WHERE id = p_variant_id AND campaign_id = p_campaign_id;
  
  -- Atualizar a campanha com o variant vencedor
  UPDATE public.campaigns
  SET ab_winner_variant_id = p_variant_id::text,
      updated_at = now()
  WHERE id = p_campaign_id;
END;
$$;

-- RPC: Clonar template
CREATE OR REPLACE FUNCTION public.clone_email_template(p_template_id UUID, p_new_name TEXT)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_new_id UUID;
  v_org_id UUID;
BEGIN
  SELECT organization_id INTO v_org_id FROM email_templates WHERE id = p_template_id;
  
  INSERT INTO email_templates (organization_id, name, description, category, subject, preview_text, body_html, body_text, body_json, layout, variables, tags, created_by)
  SELECT organization_id, p_new_name, description, category, subject, preview_text, body_html, body_text, body_json, layout, variables, tags, auth.uid()
  FROM email_templates WHERE id = p_template_id
  RETURNING id INTO v_new_id;
  
  -- Clonar seções
  INSERT INTO email_template_sections (template_id, organization_id, section_type, display_order, content, styles, is_locked, is_visible, conditions)
  SELECT v_new_id, organization_id, section_type, display_order, content, styles, is_locked, is_visible, conditions
  FROM email_template_sections WHERE template_id = p_template_id;
  
  RETURN v_new_id;
END;
$$;
