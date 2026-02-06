
-- =====================================================
-- BLOCO 6: EVOLUÇÃO DO SISTEMA DE NOTIFICAÇÕES
-- =====================================================

-- Novos enums necessários
DO $$ BEGIN CREATE TYPE notification_channel AS ENUM ('in_app', 'email', 'push', 'sms', 'webhook'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE notification_priority_v2 AS ENUM ('low', 'normal', 'high', 'urgent'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE notification_category AS ENUM ('sales', 'service', 'marketing', 'commerce', 'itsm', 'ai', 'automation', 'governance', 'data', 'system', 'integrations'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Alterar tabela notifications existente para adicionar colunas faltantes
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS category notification_category DEFAULT 'system';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS entity_name TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS action_url TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS action_label TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS sender_name TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_actioned BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS actioned_at TIMESTAMPTZ;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS group_key TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS group_count INTEGER DEFAULT 1;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS delivered_channels TEXT[] DEFAULT '{}';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications (user_id, is_read, created_at DESC)
  WHERE is_read = false AND is_archived = false;
CREATE INDEX IF NOT EXISTS idx_notifications_user_all ON public.notifications (user_id, created_at DESC)
  WHERE is_archived = false;
CREATE INDEX IF NOT EXISTS idx_notifications_entity ON public.notifications (entity_type, entity_id)
  WHERE entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_group ON public.notifications (group_key, user_id)
  WHERE group_key IS NOT NULL;

-- 2. Preferências de notificação por usuário
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mute_all BOOLEAN NOT NULL DEFAULT false,
  mute_until TIMESTAMPTZ,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone TEXT DEFAULT 'America/Sao_Paulo',
  type_preferences JSONB DEFAULT '{}'::jsonb,
  category_preferences JSONB DEFAULT '{}'::jsonb,
  email_digest_enabled BOOLEAN NOT NULL DEFAULT false,
  email_digest_frequency TEXT DEFAULT 'daily',
  email_digest_last_sent_at TIMESTAMPTZ,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  sound_enabled BOOLEAN NOT NULL DEFAULT true,
  desktop_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT notification_preferences_user_org_unique UNIQUE (user_id, organization_id)
);

-- 3. Log de entregas
CREATE TABLE IF NOT EXISTS public.notification_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  channel notification_channel NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  external_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Templates de notificação
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_key TEXT NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'info',
  category notification_category NOT NULL DEFAULT 'system',
  priority TEXT NOT NULL DEFAULT 'normal',
  title_template TEXT NOT NULL,
  body_template TEXT,
  action_url_template TEXT,
  action_label TEXT,
  icon TEXT,
  channels TEXT[] DEFAULT '{in_app}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT false,
  cooldown_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT notification_templates_key_org_unique UNIQUE (template_key, organization_id)
);

-- Índices adicionais
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_notification ON public.notification_deliveries (notification_id);

-- RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  CREATE POLICY "Users manage own notification preferences"
    ON public.notification_preferences FOR ALL USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users view own delivery logs"
    ON public.notification_deliveries FOR SELECT
    USING (notification_id IN (SELECT id FROM public.notifications WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Org members insert deliveries"
    ON public.notification_deliveries FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Org members view notification templates"
    ON public.notification_templates FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage notification templates"
    ON public.notification_templates FOR ALL
    USING (
      organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
      AND public.user_has_role(auth.uid(), 'admin')
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Triggers
DO $$ BEGIN
  CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_notification_templates_updated_at
    BEFORE UPDATE ON public.notification_templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- RPCs
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_count INTEGER;
BEGIN
  UPDATE public.notifications
  SET is_read = true, read_at = now(), updated_at = now()
  WHERE user_id = p_user_id AND is_read = false AND is_archived = false;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_notification_counts(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_total INTEGER; v_urgent INTEGER; v_high INTEGER;
BEGIN
  SELECT COUNT(*), 
    COUNT(*) FILTER (WHERE priority = 'urgent'),
    COUNT(*) FILTER (WHERE priority = 'high')
  INTO v_total, v_urgent, v_high
  FROM public.notifications
  WHERE user_id = p_user_id AND is_read = false AND is_archived = false
    AND (expires_at IS NULL OR expires_at > now());
  
  RETURN jsonb_build_object('total', COALESCE(v_total, 0), 'urgent', COALESCE(v_urgent, 0), 'high', COALESCE(v_high, 0));
END;
$$;

CREATE OR REPLACE FUNCTION public.archive_old_notifications(p_user_id UUID, p_days_old INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_count INTEGER;
BEGIN
  UPDATE public.notifications
  SET is_archived = true, archived_at = now(), updated_at = now()
  WHERE user_id = p_user_id AND is_archived = false AND is_read = true
    AND created_at < now() - (p_days_old || ' days')::interval;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
