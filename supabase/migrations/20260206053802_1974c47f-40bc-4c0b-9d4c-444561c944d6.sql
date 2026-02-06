-- ============================================================
-- FASE 2: OMNICHANNEL INBOX + CONVERSATIONS
-- Parte 1: ENUMs e Tabelas Base
-- ============================================================

-- ============================
-- ENUMS (criados primeiro)
-- ============================

-- Canais de conversação
CREATE TYPE public.conversation_channel AS ENUM (
  'email',
  'chat',
  'phone',
  'whatsapp',
  'sms',
  'social',
  'portal',
  'internal'
);

-- Status de conversação
CREATE TYPE public.conversation_status AS ENUM (
  'open',
  'waiting_customer',
  'waiting_agent',
  'bot_handling',
  'on_hold',
  'snoozed',
  'closed',
  'spam'
);

-- Status de entrega de mensagem
CREATE TYPE public.message_delivery_status AS ENUM (
  'pending',
  'sending',
  'sent',
  'delivered',
  'read',
  'failed',
  'bounced'
);

-- Tipo de remetente de mensagem
CREATE TYPE public.conversation_sender_type AS ENUM (
  'agent',
  'customer',
  'bot',
  'system'
);

-- Tipo de conteúdo de mensagem
CREATE TYPE public.message_content_type AS ENUM (
  'text',
  'html',
  'image',
  'audio',
  'video',
  'file',
  'location',
  'contact',
  'template',
  'interactive',
  'sticker',
  'reaction'
);

-- Tipo de participante
CREATE TYPE public.conversation_participant_type AS ENUM (
  'agent',
  'customer',
  'bot',
  'observer'
);

-- Método de roteamento
CREATE TYPE public.routing_method AS ENUM (
  'round_robin',
  'skill_based',
  'load_based',
  'priority_first',
  'least_idle',
  'random',
  'manual'
);

-- Status do agente
CREATE TYPE public.agent_availability_status AS ENUM (
  'available',
  'busy',
  'away',
  'offline',
  'in_meeting',
  'on_break',
  'after_call_work',
  'training'
);

-- ============================
-- TABELA DE HORÁRIOS (PRÉ-REQUISITO)
-- ============================

CREATE TABLE IF NOT EXISTS public.business_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  schedule jsonb NOT NULL DEFAULT '{}',
  holidays jsonb DEFAULT '[]',
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_business_hours_org ON public.business_hours(organization_id, is_active);

-- ============================
-- FILAS DE ROTEAMENTO
-- ============================

CREATE TABLE public.routing_queues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  routing_method routing_method NOT NULL DEFAULT 'round_robin',
  priority integer NOT NULL DEFAULT 50,
  max_capacity integer DEFAULT 100,
  skills_required text[] DEFAULT '{}',
  sla_id uuid REFERENCES public.ticket_slas(id) ON DELETE SET NULL,
  business_hours_id uuid REFERENCES public.business_hours(id) ON DELETE SET NULL,
  fallback_queue_id uuid REFERENCES public.routing_queues(id) ON DELETE SET NULL,
  auto_accept_enabled boolean DEFAULT false,
  auto_accept_delay_seconds integer DEFAULT 30,
  wrap_up_time_seconds integer DEFAULT 60,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX idx_routing_queues_org ON public.routing_queues(organization_id);
CREATE INDEX idx_routing_queues_active ON public.routing_queues(organization_id, is_active) WHERE is_active = true;
CREATE INDEX idx_routing_queues_default ON public.routing_queues(organization_id, is_default) WHERE is_default = true;

-- Membros das filas
CREATE TABLE public.queue_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  queue_id uuid REFERENCES public.routing_queues(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  priority integer DEFAULT 50,
  is_active boolean DEFAULT true,
  joined_at timestamptz DEFAULT now() NOT NULL,
  left_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(queue_id, user_id)
);

CREATE INDEX idx_queue_members_queue ON public.queue_members(queue_id, is_active) WHERE is_active = true;
CREATE INDEX idx_queue_members_user ON public.queue_members(user_id, is_active) WHERE is_active = true;

-- Skills dos agentes
CREATE TABLE public.agent_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  skill_name text NOT NULL,
  proficiency_level integer CHECK (proficiency_level >= 1 AND proficiency_level <= 5) DEFAULT 3,
  certified_at timestamptz,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, skill_name)
);

CREATE INDEX idx_agent_skills_user ON public.agent_skills(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_agent_skills_skill ON public.agent_skills(organization_id, skill_name, is_active);

-- Capacidade dos agentes por canal
CREATE TABLE public.agent_capacity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  channel conversation_channel NOT NULL,
  max_concurrent integer NOT NULL DEFAULT 5,
  current_active integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, channel)
);

CREATE INDEX idx_agent_capacity_user ON public.agent_capacity(user_id);
CREATE INDEX idx_agent_capacity_available ON public.agent_capacity(organization_id, channel) 
  WHERE current_active < max_concurrent;

-- Status de disponibilidade do agente
CREATE TABLE public.agent_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status agent_availability_status NOT NULL DEFAULT 'offline',
  status_reason text,
  custom_status_text text,
  available_channels conversation_channel[] DEFAULT '{}',
  last_activity_at timestamptz DEFAULT now(),
  status_changed_at timestamptz DEFAULT now(),
  auto_away_enabled boolean DEFAULT true,
  auto_away_minutes integer DEFAULT 15,
  is_accepting_new boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

CREATE INDEX idx_agent_status_available ON public.agent_status(organization_id, status) 
  WHERE status = 'available';
CREATE INDEX idx_agent_status_user ON public.agent_status(user_id);

-- ============================
-- CONVERSAÇÕES
-- ============================

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  conversation_number text NOT NULL,
  channel conversation_channel NOT NULL,
  status conversation_status NOT NULL DEFAULT 'open',
  priority ticket_priority NOT NULL DEFAULT 'medium',
  subject text,
  summary text,
  tags text[] DEFAULT '{}',
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  queue_id uuid REFERENCES public.routing_queues(id) ON DELETE SET NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  ticket_id uuid REFERENCES public.tickets(id) ON DELETE SET NULL,
  external_id text,
  external_thread_id text,
  external_metadata jsonb DEFAULT '{}',
  message_count integer DEFAULT 0,
  unread_count integer DEFAULT 0,
  participant_count integer DEFAULT 1,
  first_message_at timestamptz,
  last_message_at timestamptz,
  last_customer_message_at timestamptz,
  last_agent_message_at timestamptz,
  first_response_at timestamptz,
  sla_id uuid REFERENCES public.ticket_slas(id) ON DELETE SET NULL,
  sla_response_due_at timestamptz,
  sla_resolution_due_at timestamptz,
  sla_response_breached boolean DEFAULT false,
  sla_resolution_breached boolean DEFAULT false,
  bot_handled boolean DEFAULT false,
  bot_id uuid,
  handoff_requested boolean DEFAULT false,
  handoff_at timestamptz,
  snoozed_until timestamptz,
  snooze_reason text,
  satisfaction_rating integer CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  satisfaction_comment text,
  satisfaction_submitted_at timestamptz,
  source text,
  source_url text,
  visitor_info jsonb DEFAULT '{}',
  device_info jsonb DEFAULT '{}',
  location_info jsonb DEFAULT '{}',
  custom_fields jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  closed_at timestamptz,
  closed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  deleted_at timestamptz
);

-- Índices para conversations
CREATE INDEX idx_conversations_org ON public.conversations(organization_id);
CREATE INDEX idx_conversations_status ON public.conversations(organization_id, status);
CREATE INDEX idx_conversations_channel ON public.conversations(organization_id, channel);
CREATE INDEX idx_conversations_owner ON public.conversations(owner_id, status);
CREATE INDEX idx_conversations_queue ON public.conversations(queue_id, status);
CREATE INDEX idx_conversations_contact ON public.conversations(contact_id);
CREATE INDEX idx_conversations_account ON public.conversations(account_id);
CREATE INDEX idx_conversations_ticket ON public.conversations(ticket_id);
CREATE INDEX idx_conversations_last_message ON public.conversations(organization_id, last_message_at DESC);
CREATE INDEX idx_conversations_sla ON public.conversations(organization_id, sla_response_due_at) 
  WHERE status NOT IN ('closed', 'spam');
CREATE INDEX idx_conversations_unread ON public.conversations(organization_id, owner_id, unread_count) 
  WHERE unread_count > 0;
CREATE INDEX idx_conversations_number ON public.conversations(organization_id, conversation_number);
CREATE INDEX idx_conversations_external ON public.conversations(organization_id, channel, external_id);

-- Participantes da conversação
CREATE TABLE public.conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  participant_type conversation_participant_type NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  external_id text,
  display_name text,
  email text,
  phone text,
  avatar_url text,
  role text DEFAULT 'participant',
  is_primary boolean DEFAULT false,
  can_reply boolean DEFAULT true,
  joined_at timestamptz DEFAULT now() NOT NULL,
  left_at timestamptz,
  last_read_at timestamptz,
  last_typed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_conversation_participants_conv ON public.conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_user ON public.conversation_participants(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_conversation_participants_contact ON public.conversation_participants(contact_id) WHERE contact_id IS NOT NULL;

-- Mensagens da conversação
CREATE TABLE public.conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_type conversation_sender_type NOT NULL,
  sender_id uuid,
  sender_name text,
  sender_email text,
  sender_avatar_url text,
  content text,
  content_html text,
  content_type message_content_type NOT NULL DEFAULT 'text',
  attachments jsonb DEFAULT '[]',
  template_id text,
  template_data jsonb,
  interactive_data jsonb,
  quick_replies jsonb,
  external_message_id text,
  in_reply_to_id uuid REFERENCES public.conversation_messages(id) ON DELETE SET NULL,
  thread_id text,
  delivery_status message_delivery_status NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  is_internal boolean DEFAULT false,
  is_automated boolean DEFAULT false,
  is_edited boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  is_pinned boolean DEFAULT false,
  reactions jsonb DEFAULT '{}',
  ai_generated boolean DEFAULT false,
  ai_model text,
  ai_confidence numeric,
  ai_suggestions jsonb,
  canned_response_id uuid REFERENCES public.canned_responses(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  edited_at timestamptz,
  deleted_at timestamptz
);

CREATE INDEX idx_conversation_messages_conv ON public.conversation_messages(conversation_id, created_at DESC);
CREATE INDEX idx_conversation_messages_org ON public.conversation_messages(organization_id, created_at DESC);
CREATE INDEX idx_conversation_messages_sender ON public.conversation_messages(sender_id, sender_type);
CREATE INDEX idx_conversation_messages_external ON public.conversation_messages(external_message_id) WHERE external_message_id IS NOT NULL;
CREATE INDEX idx_conversation_messages_internal ON public.conversation_messages(conversation_id, is_internal);
CREATE INDEX idx_conversation_messages_search ON public.conversation_messages 
  USING gin(to_tsvector('portuguese', COALESCE(content, '')));

-- Regras de roteamento v2
CREATE TABLE public.routing_rules_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  conditions jsonb NOT NULL DEFAULT '[]',
  action_type text NOT NULL DEFAULT 'assign_queue',
  action_config jsonb NOT NULL DEFAULT '{}',
  priority integer NOT NULL DEFAULT 50,
  is_active boolean DEFAULT true,
  schedule jsonb,
  max_daily_matches integer,
  current_daily_matches integer DEFAULT 0,
  daily_reset_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX idx_routing_rules_v2_org ON public.routing_rules_v2(organization_id, is_active, priority);

-- Log de atribuições
CREATE TABLE public.routing_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  assigned_from uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_to_queue uuid REFERENCES public.routing_queues(id) ON DELETE SET NULL,
  assigned_to_team uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  assignment_method text NOT NULL DEFAULT 'manual',
  routing_rule_id uuid REFERENCES public.routing_rules_v2(id) ON DELETE SET NULL,
  reason text,
  notes text,
  assigned_at timestamptz DEFAULT now() NOT NULL,
  accepted_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  ended_at timestamptz,
  response_time_seconds integer,
  handle_time_seconds integer,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_routing_assignments_conv ON public.routing_assignments(conversation_id, assigned_at DESC);
CREATE INDEX idx_routing_assignments_agent ON public.routing_assignments(assigned_to, status);
CREATE INDEX idx_routing_assignments_queue ON public.routing_assignments(assigned_to_queue, status);

-- ============================
-- FUNÇÕES RPC
-- ============================

CREATE OR REPLACE FUNCTION public.generate_conversation_number(org_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $func$
DECLARE
  v_count INTEGER;
  v_year TEXT;
BEGIN
  v_year := to_char(now(), 'YYYY');
  SELECT COUNT(*) + 1 INTO v_count
  FROM public.conversations
  WHERE organization_id = org_id AND created_at >= date_trunc('year', now());
  RETURN 'CNV-' || v_year || '-' || lpad(v_count::text, 7, '0');
END;
$func$;

CREATE OR REPLACE FUNCTION public.assign_conversation_to_agent(
  p_conversation_id uuid,
  p_agent_id uuid,
  p_method text DEFAULT 'manual',
  p_rule_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $func$
DECLARE
  v_conversation RECORD;
  v_old_owner_id uuid;
BEGIN
  SELECT * INTO v_conversation FROM public.conversations WHERE id = p_conversation_id;
  IF NOT FOUND THEN RETURN false; END IF;
  v_old_owner_id := v_conversation.owner_id;
  
  UPDATE public.conversations 
  SET owner_id = p_agent_id, status = CASE WHEN status = 'open' THEN 'waiting_agent' ELSE status END, updated_at = now()
  WHERE id = p_conversation_id;
  
  UPDATE public.agent_capacity 
  SET current_active = current_active + 1, updated_at = now()
  WHERE user_id = p_agent_id AND channel = v_conversation.channel;
  
  IF v_old_owner_id IS NOT NULL AND v_old_owner_id != p_agent_id THEN
    UPDATE public.agent_capacity 
    SET current_active = GREATEST(0, current_active - 1), updated_at = now()
    WHERE user_id = v_old_owner_id AND channel = v_conversation.channel;
  END IF;
  
  INSERT INTO public.routing_assignments (organization_id, conversation_id, assigned_from, assigned_to, assignment_method, routing_rule_id, status, accepted_at)
  VALUES (v_conversation.organization_id, p_conversation_id, v_old_owner_id, p_agent_id, p_method, p_rule_id, 'accepted', now());
  
  RETURN true;
END;
$func$;

CREATE OR REPLACE FUNCTION public.get_next_conversation(p_agent_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $func$
DECLARE
  v_agent_status RECORD;
  v_conversation_id uuid;
BEGIN
  SELECT * INTO v_agent_status FROM public.agent_status WHERE user_id = p_agent_id;
  IF NOT FOUND OR v_agent_status.status != 'available' OR NOT v_agent_status.is_accepting_new THEN RETURN NULL; END IF;
  
  SELECT c.id INTO v_conversation_id
  FROM public.conversations c
  JOIN public.queue_members qm ON qm.queue_id = c.queue_id
  WHERE qm.user_id = p_agent_id AND qm.is_active = true AND c.owner_id IS NULL AND c.status IN ('open', 'waiting_agent')
  ORDER BY c.priority DESC, c.sla_response_due_at ASC NULLS LAST, c.created_at ASC
  LIMIT 1 FOR UPDATE OF c SKIP LOCKED;
  
  IF v_conversation_id IS NOT NULL THEN
    PERFORM public.assign_conversation_to_agent(v_conversation_id, p_agent_id, 'pick_from_queue');
  END IF;
  RETURN v_conversation_id;
END;
$func$;

CREATE OR REPLACE FUNCTION public.update_agent_availability(p_user_id uuid, p_status agent_availability_status, p_reason text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $func$
BEGIN
  INSERT INTO public.agent_status (user_id, organization_id, status, status_reason, status_changed_at)
  SELECT p_user_id, organization_id, p_status, p_reason, now()
  FROM public.profiles WHERE id = p_user_id
  ON CONFLICT (user_id) DO UPDATE SET status = EXCLUDED.status, status_reason = EXCLUDED.status_reason, status_changed_at = now(), updated_at = now();
  RETURN true;
END;
$func$;

-- Trigger para atualizar contadores de mensagens
CREATE OR REPLACE FUNCTION public.update_conversation_message_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $func$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.conversations
    SET 
      message_count = message_count + 1,
      unread_count = CASE WHEN NEW.sender_type = 'customer' THEN unread_count + 1 ELSE unread_count END,
      last_message_at = NEW.created_at,
      first_message_at = COALESCE(first_message_at, NEW.created_at),
      last_customer_message_at = CASE WHEN NEW.sender_type = 'customer' THEN NEW.created_at ELSE last_customer_message_at END,
      last_agent_message_at = CASE WHEN NEW.sender_type = 'agent' THEN NEW.created_at ELSE last_agent_message_at END,
      first_response_at = CASE WHEN first_response_at IS NULL AND NEW.sender_type = 'agent' THEN NEW.created_at ELSE first_response_at END,
      status = CASE
        WHEN NEW.sender_type = 'customer' AND status = 'waiting_customer' THEN 'open'::conversation_status
        WHEN NEW.sender_type = 'agent' AND status = 'waiting_agent' THEN 'waiting_customer'::conversation_status
        ELSE status
      END,
      updated_at = now()
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$func$;

CREATE TRIGGER trg_update_conversation_counts
  AFTER INSERT ON public.conversation_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_message_counts();

-- Trigger para gerar número de conversação
CREATE OR REPLACE FUNCTION public.set_conversation_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $func$
BEGIN
  IF NEW.conversation_number IS NULL OR NEW.conversation_number = '' THEN
    NEW.conversation_number := public.generate_conversation_number(NEW.organization_id);
  END IF;
  RETURN NEW;
END;
$func$;

CREATE TRIGGER trg_set_conversation_number
  BEFORE INSERT ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_conversation_number();

-- ============================
-- RLS POLICIES
-- ============================

ALTER TABLE public.routing_queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_capacity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routing_rules_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routing_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

-- routing_queues policies
CREATE POLICY "Members can view org routing queues" ON public.routing_queues FOR SELECT USING (public.is_member_of_org(organization_id));
CREATE POLICY "Admins can manage routing queues" ON public.routing_queues FOR ALL USING (public.is_member_of_org(organization_id) AND public.has_role('admin'));

-- queue_members policies
CREATE POLICY "Members can view queue members" ON public.queue_members FOR SELECT USING (public.is_member_of_org(organization_id));
CREATE POLICY "Admins can manage queue members" ON public.queue_members FOR ALL USING (public.is_member_of_org(organization_id) AND public.has_role('admin'));

-- agent_skills policies
CREATE POLICY "Members can view agent skills" ON public.agent_skills FOR SELECT USING (public.is_member_of_org(organization_id));
CREATE POLICY "Users can manage own skills" ON public.agent_skills FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all skills" ON public.agent_skills FOR ALL USING (public.is_member_of_org(organization_id) AND public.has_role('admin'));

-- agent_capacity policies
CREATE POLICY "Members can view agent capacity" ON public.agent_capacity FOR SELECT USING (public.is_member_of_org(organization_id));
CREATE POLICY "Users can manage own capacity" ON public.agent_capacity FOR ALL USING (user_id = auth.uid());

-- agent_status policies
CREATE POLICY "Members can view agent status" ON public.agent_status FOR SELECT USING (public.is_member_of_org(organization_id));
CREATE POLICY "Users can manage own status" ON public.agent_status FOR ALL USING (user_id = auth.uid());

-- conversations policies
CREATE POLICY "Members can view org conversations" ON public.conversations FOR SELECT USING (public.is_member_of_org(organization_id));
CREATE POLICY "Members can create conversations" ON public.conversations FOR INSERT WITH CHECK (public.is_member_of_org(organization_id));
CREATE POLICY "Members can update org conversations" ON public.conversations FOR UPDATE USING (public.is_member_of_org(organization_id));

-- conversation_participants policies
CREATE POLICY "Members can view participants" ON public.conversation_participants FOR SELECT USING (public.is_member_of_org(organization_id));
CREATE POLICY "Members can manage participants" ON public.conversation_participants FOR ALL USING (public.is_member_of_org(organization_id));

-- conversation_messages policies
CREATE POLICY "Members can view messages" ON public.conversation_messages FOR SELECT USING (public.is_member_of_org(organization_id));
CREATE POLICY "Members can send messages" ON public.conversation_messages FOR INSERT WITH CHECK (public.is_member_of_org(organization_id));
CREATE POLICY "Senders can update own messages" ON public.conversation_messages FOR UPDATE USING (sender_id = auth.uid());

-- routing_rules_v2 policies
CREATE POLICY "Members can view routing rules" ON public.routing_rules_v2 FOR SELECT USING (public.is_member_of_org(organization_id));
CREATE POLICY "Admins can manage routing rules" ON public.routing_rules_v2 FOR ALL USING (public.is_member_of_org(organization_id) AND public.has_role('admin'));

-- routing_assignments policies
CREATE POLICY "Members can view assignments" ON public.routing_assignments FOR SELECT USING (public.is_member_of_org(organization_id));
CREATE POLICY "Members can create assignments" ON public.routing_assignments FOR INSERT WITH CHECK (public.is_member_of_org(organization_id));

-- business_hours policies
CREATE POLICY "Members can view business hours" ON public.business_hours FOR SELECT USING (public.is_member_of_org(organization_id));
CREATE POLICY "Admins can manage business hours" ON public.business_hours FOR ALL USING (public.is_member_of_org(organization_id) AND public.has_role('admin'));