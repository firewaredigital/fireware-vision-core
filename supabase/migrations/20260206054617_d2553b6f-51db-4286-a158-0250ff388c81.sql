-- =====================================================
-- FASE 3: WHATSAPP + CHAT WIDGET + VOICE
-- Infraestrutura completa de canais de comunicação
-- =====================================================

-- =====================================================
-- PARTE 1: ENUMS PARA CANAIS
-- =====================================================

-- Status de conta WhatsApp
CREATE TYPE whatsapp_account_status AS ENUM (
  'pending_verification',
  'verified',
  'active',
  'suspended',
  'disconnected'
);

-- Status de template WhatsApp
CREATE TYPE whatsapp_template_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'paused',
  'disabled'
);

-- Categoria de template WhatsApp
CREATE TYPE whatsapp_template_category AS ENUM (
  'marketing',
  'utility',
  'authentication',
  'service'
);

-- Status de mensagem WhatsApp
CREATE TYPE whatsapp_message_status AS ENUM (
  'pending',
  'sent',
  'delivered',
  'read',
  'failed',
  'deleted'
);

-- Status de chamada de voz
CREATE TYPE voice_call_status AS ENUM (
  'initiated',
  'ringing',
  'in_progress',
  'on_hold',
  'completed',
  'missed',
  'failed',
  'cancelled',
  'busy',
  'no_answer'
);

-- Direção da chamada/mensagem
CREATE TYPE communication_direction AS ENUM (
  'inbound',
  'outbound'
);

-- Status de transcrição
CREATE TYPE transcription_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'not_available'
);

-- Status de sessão de chat
CREATE TYPE chat_session_status AS ENUM (
  'active',
  'idle',
  'waiting_agent',
  'with_agent',
  'ended',
  'abandoned'
);

-- =====================================================
-- PARTE 2: WHATSAPP BUSINESS API
-- =====================================================

-- Contas WhatsApp Business conectadas
CREATE TABLE public.whatsapp_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Identificadores da API WhatsApp
  phone_number_id TEXT NOT NULL,
  waba_id TEXT, -- WhatsApp Business Account ID
  display_phone TEXT NOT NULL,
  verified_name TEXT,
  
  -- Configurações
  business_name TEXT NOT NULL,
  business_description TEXT,
  business_vertical TEXT,
  business_website TEXT,
  
  -- Status e autenticação
  status whatsapp_account_status NOT NULL DEFAULT 'pending_verification',
  quality_rating TEXT, -- green, yellow, red
  messaging_limit TEXT, -- tier1, tier2, tier3, unlimited
  
  -- Tokens (criptografados em produção)
  api_token_encrypted TEXT,
  webhook_verify_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  
  -- Configurações de webhook
  webhook_url TEXT,
  webhook_secret TEXT,
  
  -- Configurações de mensageria
  default_template_language TEXT DEFAULT 'pt_BR',
  auto_reply_enabled BOOLEAN DEFAULT false,
  auto_reply_message TEXT,
  business_hours_enabled BOOLEAN DEFAULT false,
  business_hours_id UUID REFERENCES public.business_hours(id),
  
  -- Métricas
  messages_sent_today INTEGER DEFAULT 0,
  messages_received_today INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  
  -- Auditoria
  connected_at TIMESTAMPTZ,
  connected_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id),
  
  CONSTRAINT unique_phone_per_org UNIQUE (organization_id, phone_number_id)
);

-- Templates de mensagem WhatsApp
CREATE TABLE public.whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  whatsapp_account_id UUID NOT NULL REFERENCES public.whatsapp_accounts(id) ON DELETE CASCADE,
  
  -- Identificadores
  template_name TEXT NOT NULL,
  template_id TEXT, -- ID retornado pela Meta
  
  -- Classificação
  category whatsapp_template_category NOT NULL,
  language TEXT NOT NULL DEFAULT 'pt_BR',
  
  -- Conteúdo do template
  header_type TEXT, -- text, image, video, document
  header_content TEXT,
  header_media_url TEXT,
  body_text TEXT NOT NULL,
  footer_text TEXT,
  
  -- Botões (até 3)
  buttons JSONB DEFAULT '[]'::jsonb,
  
  -- Variáveis do template
  variables JSONB DEFAULT '[]'::jsonb,
  
  -- Status e aprovação
  status whatsapp_template_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  
  -- Métricas de uso
  times_used INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id),
  
  CONSTRAINT unique_template_per_account UNIQUE (whatsapp_account_id, template_name, language)
);

-- Logs de mensagens WhatsApp
CREATE TABLE public.whatsapp_message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  whatsapp_account_id UUID NOT NULL REFERENCES public.whatsapp_accounts(id) ON DELETE CASCADE,
  
  -- Vínculos com sistema
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  message_id UUID REFERENCES public.conversation_messages(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  
  -- Identificadores WhatsApp
  whatsapp_message_id TEXT NOT NULL,
  whatsapp_conversation_id TEXT,
  
  -- Direção e tipo
  direction communication_direction NOT NULL,
  message_type TEXT NOT NULL,
  
  -- Conteúdo
  content TEXT,
  media_url TEXT,
  media_mime_type TEXT,
  media_sha256 TEXT,
  media_id TEXT,
  caption TEXT,
  
  -- Para templates
  template_id UUID REFERENCES public.whatsapp_templates(id),
  template_name TEXT,
  template_variables JSONB,
  
  -- Para mensagens interativas
  interactive_type TEXT,
  interactive_data JSONB,
  
  -- Contexto
  context_message_id TEXT,
  is_forwarded BOOLEAN DEFAULT false,
  is_frequently_forwarded BOOLEAN DEFAULT false,
  
  -- Status e timestamps
  status whatsapp_message_status NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  
  -- Erros
  error_code TEXT,
  error_title TEXT,
  error_message TEXT,
  error_details JSONB,
  
  -- Pricing
  pricing_model TEXT,
  pricing_category TEXT,
  billable BOOLEAN DEFAULT true,
  
  -- Metadados
  from_phone TEXT,
  to_phone TEXT,
  profile_name TEXT,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_whatsapp_message UNIQUE (whatsapp_message_id)
);

-- Opt-ins de WhatsApp
CREATE TABLE public.whatsapp_optins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  whatsapp_account_id UUID NOT NULL REFERENCES public.whatsapp_accounts(id) ON DELETE CASCADE,
  
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  
  is_opted_in BOOLEAN NOT NULL DEFAULT false,
  opt_in_method TEXT,
  opt_in_source TEXT,
  
  opted_in_at TIMESTAMPTZ,
  opted_out_at TIMESTAMPTZ,
  
  marketing_opted_in BOOLEAN DEFAULT false,
  transactional_opted_in BOOLEAN DEFAULT true,
  support_opted_in BOOLEAN DEFAULT true,
  
  consent_text TEXT,
  ip_address TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_optin_per_phone UNIQUE (whatsapp_account_id, phone_number)
);

-- =====================================================
-- PARTE 3: CHAT WIDGET WEB
-- =====================================================

-- Widgets de chat configurados
CREATE TABLE public.chat_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  widget_key TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  
  -- Configurações visuais
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#1E40AF',
  text_color TEXT DEFAULT '#FFFFFF',
  background_color TEXT DEFAULT '#FFFFFF',
  position TEXT DEFAULT 'bottom-right',
  button_size TEXT DEFAULT 'medium',
  button_icon TEXT DEFAULT 'chat',
  custom_icon_url TEXT,
  
  -- Textos
  greeting_message TEXT DEFAULT 'Olá! Como podemos ajudar?',
  offline_message TEXT DEFAULT 'No momento não estamos disponíveis. Deixe sua mensagem.',
  placeholder_text TEXT DEFAULT 'Digite sua mensagem...',
  window_title TEXT DEFAULT 'Chat',
  
  -- Formulário pré-chat
  pre_chat_form_enabled BOOLEAN DEFAULT true,
  pre_chat_fields JSONB DEFAULT '[
    {"field": "name", "label": "Nome", "type": "text", "required": true},
    {"field": "email", "label": "Email", "type": "email", "required": true}
  ]'::jsonb,
  
  -- Comportamento
  auto_open BOOLEAN DEFAULT false,
  auto_open_delay_seconds INTEGER DEFAULT 30,
  show_agent_avatar BOOLEAN DEFAULT true,
  show_agent_name BOOLEAN DEFAULT true,
  play_sound_on_message BOOLEAN DEFAULT true,
  show_powered_by BOOLEAN DEFAULT true,
  
  -- Bot/Triagem
  bot_enabled BOOLEAN DEFAULT false,
  bot_greeting TEXT,
  bot_options JSONB,
  
  -- Roteamento - usando TEXT para priority em vez de enum inexistente
  queue_id UUID REFERENCES public.routing_queues(id),
  default_priority TEXT DEFAULT 'medium',
  
  -- Horário de funcionamento
  business_hours_enabled BOOLEAN DEFAULT false,
  business_hours_id UUID REFERENCES public.business_hours(id),
  
  -- Domínios permitidos
  allowed_domains TEXT[] DEFAULT ARRAY[]::TEXT[],
  block_vpn BOOLEAN DEFAULT false,
  
  is_active BOOLEAN DEFAULT true,
  
  -- Métricas
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  avg_response_time_seconds INTEGER,
  satisfaction_score NUMERIC(3,2),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Sessões de chat
CREATE TABLE public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  widget_id UUID NOT NULL REFERENCES public.chat_widgets(id) ON DELETE CASCADE,
  
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  
  visitor_id TEXT NOT NULL,
  session_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  
  -- Informações do visitante
  visitor_name TEXT,
  visitor_email TEXT,
  visitor_phone TEXT,
  visitor_custom_fields JSONB DEFAULT '{}'::jsonb,
  
  -- Contexto da página
  source_url TEXT,
  referrer_url TEXT,
  current_page_title TEXT,
  current_page_url TEXT,
  
  -- Informações do dispositivo
  device_type TEXT,
  browser TEXT,
  browser_version TEXT,
  os TEXT,
  os_version TEXT,
  screen_resolution TEXT,
  timezone TEXT,
  language TEXT,
  
  -- Localização
  ip_address TEXT,
  country TEXT,
  country_code TEXT,
  region TEXT,
  city TEXT,
  
  -- Status
  status chat_session_status NOT NULL DEFAULT 'active',
  is_blocked BOOLEAN DEFAULT false,
  block_reason TEXT,
  
  agent_id UUID REFERENCES public.profiles(id),
  
  -- Métricas
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  pages_viewed INTEGER DEFAULT 0,
  
  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  agent_joined_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  
  -- Feedback
  satisfaction_rating INTEGER,
  satisfaction_comment TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Eventos do chat widget
CREATE TABLE public.chat_widget_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  widget_id UUID NOT NULL REFERENCES public.chat_widgets(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
  
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  
  page_url TEXT,
  page_title TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- PARTE 4: VOICE/TELEFONIA
-- =====================================================

-- Configuração de provedores de voz
CREATE TABLE public.voice_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  
  account_sid TEXT,
  auth_token_encrypted TEXT,
  api_key TEXT,
  api_secret_encrypted TEXT,
  
  phone_numbers TEXT[] DEFAULT ARRAY[]::TEXT[],
  default_caller_id TEXT,
  
  webhook_url TEXT,
  status_callback_url TEXT,
  recording_callback_url TEXT,
  
  max_call_duration_minutes INTEGER DEFAULT 60,
  recording_enabled BOOLEAN DEFAULT true,
  transcription_enabled BOOLEAN DEFAULT true,
  voicemail_enabled BOOLEAN DEFAULT true,
  voicemail_timeout_seconds INTEGER DEFAULT 25,
  
  is_active BOOLEAN DEFAULT true,
  last_health_check TIMESTAMPTZ,
  health_status TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Chamadas de voz
CREATE TABLE public.voice_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  voice_provider_id UUID REFERENCES public.voice_providers(id) ON DELETE SET NULL,
  
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE SET NULL,
  
  external_call_id TEXT,
  parent_call_id UUID REFERENCES public.voice_calls(id),
  
  direction communication_direction NOT NULL,
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  forwarded_from TEXT,
  caller_name TEXT,
  
  agent_id UUID REFERENCES public.profiles(id),
  queue_id UUID REFERENCES public.routing_queues(id),
  
  status voice_call_status NOT NULL DEFAULT 'initiated',
  end_reason TEXT,
  
  initiated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ringing_at TIMESTAMPTZ,
  answered_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  
  ring_duration_seconds INTEGER,
  talk_duration_seconds INTEGER,
  hold_duration_seconds INTEGER DEFAULT 0,
  total_duration_seconds INTEGER,
  
  recording_enabled BOOLEAN DEFAULT true,
  recording_status TEXT,
  recording_url TEXT,
  recording_duration_seconds INTEGER,
  recording_file_size_bytes BIGINT,
  
  transcription_status transcription_status DEFAULT 'not_available',
  transcription_id UUID,
  
  audio_quality_score NUMERIC(3,2),
  
  ivr_path JSONB,
  dtmf_input TEXT,
  
  notes TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  disposition TEXT,
  
  billable BOOLEAN DEFAULT true,
  cost_cents INTEGER,
  currency TEXT DEFAULT 'BRL',
  
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Eventos durante a chamada
CREATE TABLE public.voice_call_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  call_id UUID NOT NULL REFERENCES public.voice_calls(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  
  participant_type TEXT,
  participant_id TEXT,
  
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transcrições de chamadas
CREATE TABLE public.voice_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  call_id UUID NOT NULL REFERENCES public.voice_calls(id) ON DELETE CASCADE,
  
  full_text TEXT,
  segments JSONB DEFAULT '[]'::jsonb,
  
  language TEXT DEFAULT 'pt-BR',
  duration_seconds NUMERIC(10,2),
  word_count INTEGER,
  
  overall_confidence NUMERIC(3,2),
  
  sentiment_score NUMERIC(3,2),
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  topics TEXT[] DEFAULT ARRAY[]::TEXT[],
  action_items JSONB DEFAULT '[]'::jsonb,
  summary TEXT,
  
  status transcription_status NOT NULL DEFAULT 'pending',
  error_message TEXT,
  
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  processing_time_ms INTEGER,
  
  provider TEXT,
  model_version TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Voicemails
CREATE TABLE public.voice_voicemails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  call_id UUID NOT NULL REFERENCES public.voice_calls(id) ON DELETE CASCADE,
  
  agent_id UUID REFERENCES public.profiles(id),
  queue_id UUID REFERENCES public.routing_queues(id),
  
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  
  transcription_text TEXT,
  transcription_status transcription_status DEFAULT 'pending',
  
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  read_by UUID REFERENCES public.profiles(id),
  
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  archived_by UUID REFERENCES public.profiles(id),
  
  callback_requested BOOLEAN DEFAULT false,
  callback_completed BOOLEAN DEFAULT false,
  callback_at TIMESTAMPTZ,
  callback_by UUID REFERENCES public.profiles(id),
  callback_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- PARTE 5: ÍNDICES
-- =====================================================

CREATE INDEX idx_whatsapp_accounts_org ON public.whatsapp_accounts(organization_id);
CREATE INDEX idx_whatsapp_accounts_status ON public.whatsapp_accounts(status);
CREATE INDEX idx_whatsapp_templates_org ON public.whatsapp_templates(organization_id);
CREATE INDEX idx_whatsapp_templates_account ON public.whatsapp_templates(whatsapp_account_id);
CREATE INDEX idx_whatsapp_templates_status ON public.whatsapp_templates(status);
CREATE INDEX idx_whatsapp_message_logs_org ON public.whatsapp_message_logs(organization_id);
CREATE INDEX idx_whatsapp_message_logs_conversation ON public.whatsapp_message_logs(conversation_id);
CREATE INDEX idx_whatsapp_message_logs_status ON public.whatsapp_message_logs(status);
CREATE INDEX idx_whatsapp_message_logs_created ON public.whatsapp_message_logs(created_at DESC);
CREATE INDEX idx_whatsapp_optins_org ON public.whatsapp_optins(organization_id);
CREATE INDEX idx_whatsapp_optins_phone ON public.whatsapp_optins(phone_number);

CREATE INDEX idx_chat_widgets_org ON public.chat_widgets(organization_id);
CREATE INDEX idx_chat_widgets_active ON public.chat_widgets(is_active);
CREATE INDEX idx_chat_sessions_org ON public.chat_sessions(organization_id);
CREATE INDEX idx_chat_sessions_widget ON public.chat_sessions(widget_id);
CREATE INDEX idx_chat_sessions_visitor ON public.chat_sessions(visitor_id);
CREATE INDEX idx_chat_sessions_status ON public.chat_sessions(status);
CREATE INDEX idx_chat_sessions_created ON public.chat_sessions(created_at DESC);
CREATE INDEX idx_chat_widget_events_session ON public.chat_widget_events(session_id);
CREATE INDEX idx_chat_widget_events_type ON public.chat_widget_events(event_type);
CREATE INDEX idx_chat_widget_events_created ON public.chat_widget_events(created_at DESC);

CREATE INDEX idx_voice_providers_org ON public.voice_providers(organization_id);
CREATE INDEX idx_voice_calls_org ON public.voice_calls(organization_id);
CREATE INDEX idx_voice_calls_conversation ON public.voice_calls(conversation_id);
CREATE INDEX idx_voice_calls_agent ON public.voice_calls(agent_id);
CREATE INDEX idx_voice_calls_contact ON public.voice_calls(contact_id);
CREATE INDEX idx_voice_calls_status ON public.voice_calls(status);
CREATE INDEX idx_voice_calls_direction ON public.voice_calls(direction);
CREATE INDEX idx_voice_calls_initiated ON public.voice_calls(initiated_at DESC);
CREATE INDEX idx_voice_call_events_call ON public.voice_call_events(call_id);
CREATE INDEX idx_voice_call_events_type ON public.voice_call_events(event_type);
CREATE INDEX idx_voice_transcripts_call ON public.voice_transcripts(call_id);
CREATE INDEX idx_voice_voicemails_agent ON public.voice_voicemails(agent_id);
CREATE INDEX idx_voice_voicemails_unread ON public.voice_voicemails(is_read) WHERE is_read = false;

-- =====================================================
-- PARTE 6: TRIGGERS
-- =====================================================

CREATE TRIGGER update_whatsapp_accounts_updated_at
  BEFORE UPDATE ON public.whatsapp_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_templates_updated_at
  BEFORE UPDATE ON public.whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_message_logs_updated_at
  BEFORE UPDATE ON public.whatsapp_message_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_optins_updated_at
  BEFORE UPDATE ON public.whatsapp_optins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_widgets_updated_at
  BEFORE UPDATE ON public.chat_widgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_voice_providers_updated_at
  BEFORE UPDATE ON public.voice_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_voice_calls_updated_at
  BEFORE UPDATE ON public.voice_calls
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_voice_transcripts_updated_at
  BEFORE UPDATE ON public.voice_transcripts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_voice_voicemails_updated_at
  BEFORE UPDATE ON public.voice_voicemails
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para métricas do widget
CREATE OR REPLACE FUNCTION public.update_widget_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.chat_widgets
    SET total_conversations = total_conversations + 1, updated_at = now()
    WHERE id = NEW.widget_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_chat_widget_metrics
  AFTER INSERT ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_widget_metrics();

-- Trigger para contadores WhatsApp
CREATE OR REPLACE FUNCTION public.update_whatsapp_message_counters()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.direction = 'outbound' THEN
      UPDATE public.whatsapp_accounts
      SET messages_sent_today = messages_sent_today + 1, 
          last_message_at = now(),
          updated_at = now()
      WHERE id = NEW.whatsapp_account_id;
    ELSE
      UPDATE public.whatsapp_accounts
      SET messages_received_today = messages_received_today + 1,
          last_message_at = now(),
          updated_at = now()
      WHERE id = NEW.whatsapp_account_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_whatsapp_counters
  AFTER INSERT ON public.whatsapp_message_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_whatsapp_message_counters();

-- Trigger para duração da chamada
CREATE OR REPLACE FUNCTION public.calculate_call_duration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN
    IF NEW.ringing_at IS NOT NULL AND NEW.answered_at IS NOT NULL THEN
      NEW.ring_duration_seconds := EXTRACT(EPOCH FROM (NEW.answered_at - NEW.ringing_at))::INTEGER;
    END IF;
    
    IF NEW.answered_at IS NOT NULL THEN
      NEW.talk_duration_seconds := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.answered_at))::INTEGER - COALESCE(NEW.hold_duration_seconds, 0);
    END IF;
    
    NEW.total_duration_seconds := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.initiated_at))::INTEGER;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER calculate_voice_call_duration
  BEFORE UPDATE ON public.voice_calls
  FOR EACH ROW EXECUTE FUNCTION public.calculate_call_duration();

-- =====================================================
-- PARTE 7: FUNÇÕES RPC
-- =====================================================

-- Criar conversa a partir de WhatsApp
CREATE OR REPLACE FUNCTION public.create_conversation_from_whatsapp(
  p_organization_id UUID,
  p_whatsapp_account_id UUID,
  p_from_phone TEXT,
  p_message_content TEXT,
  p_whatsapp_message_id TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_conversation_id UUID;
  v_contact_id UUID;
  v_message_id UUID;
  v_queue_id UUID;
BEGIN
  SELECT id INTO v_contact_id
  FROM public.contacts
  WHERE organization_id = p_organization_id AND phone = p_from_phone
  LIMIT 1;
  
  SELECT id INTO v_queue_id
  FROM public.routing_queues
  WHERE organization_id = p_organization_id AND is_default = true
  LIMIT 1;
  
  INSERT INTO public.conversations (
    organization_id, channel, status, priority, contact_id, queue_id
  )
  VALUES (
    p_organization_id, 'whatsapp', 'open', 'medium', v_contact_id, v_queue_id
  )
  RETURNING id INTO v_conversation_id;
  
  INSERT INTO public.conversation_messages (
    organization_id, conversation_id, sender_type, content, content_type, external_message_id
  )
  VALUES (
    p_organization_id, v_conversation_id, 'customer', p_message_content, 'text', p_whatsapp_message_id
  )
  RETURNING id INTO v_message_id;
  
  INSERT INTO public.whatsapp_message_logs (
    organization_id, whatsapp_account_id, conversation_id, message_id,
    whatsapp_message_id, direction, message_type, content, from_phone, status
  )
  VALUES (
    p_organization_id, p_whatsapp_account_id, v_conversation_id, v_message_id,
    p_whatsapp_message_id, 'inbound', 'text', p_message_content, p_from_phone, 'delivered'
  );
  
  RETURN v_conversation_id;
END;
$$;

-- Criar sessão de chat
CREATE OR REPLACE FUNCTION public.create_chat_session(
  p_widget_key TEXT,
  p_visitor_id TEXT,
  p_visitor_info JSONB DEFAULT '{}'::jsonb,
  p_source_url TEXT DEFAULT NULL,
  p_device_info JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(session_id UUID, session_token TEXT, conversation_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_widget RECORD;
  v_session_id UUID;
  v_session_token TEXT;
  v_conversation_id UUID;
BEGIN
  SELECT * INTO v_widget
  FROM public.chat_widgets
  WHERE widget_key = p_widget_key AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Widget não encontrado ou inativo';
  END IF;
  
  v_session_id := gen_random_uuid();
  v_session_token := encode(gen_random_bytes(32), 'hex');
  
  INSERT INTO public.conversations (
    organization_id, channel, status, priority, queue_id
  )
  VALUES (
    v_widget.organization_id, 'chat', 'open', 'medium', v_widget.queue_id
  )
  RETURNING id INTO v_conversation_id;
  
  INSERT INTO public.chat_sessions (
    id, organization_id, widget_id, conversation_id, visitor_id, session_token,
    visitor_name, visitor_email, visitor_phone, visitor_custom_fields,
    source_url, device_type, browser, os
  )
  VALUES (
    v_session_id, v_widget.organization_id, v_widget.id, v_conversation_id, p_visitor_id, v_session_token,
    p_visitor_info->>'name', p_visitor_info->>'email', p_visitor_info->>'phone', p_visitor_info,
    p_source_url, p_device_info->>'device_type', p_device_info->>'browser', p_device_info->>'os'
  );
  
  INSERT INTO public.chat_widget_events (
    organization_id, widget_id, session_id, event_type, event_data, page_url
  )
  VALUES (
    v_widget.organization_id, v_widget.id, v_session_id, 'session_started', 
    jsonb_build_object('visitor_id', p_visitor_id), p_source_url
  );
  
  RETURN QUERY SELECT v_session_id, v_session_token, v_conversation_id;
END;
$$;

-- Registrar chamada de voz
CREATE OR REPLACE FUNCTION public.register_voice_call(
  p_organization_id UUID,
  p_provider_id UUID,
  p_external_call_id TEXT,
  p_direction communication_direction,
  p_from_number TEXT,
  p_to_number TEXT,
  p_agent_id UUID DEFAULT NULL,
  p_contact_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_call_id UUID;
  v_conversation_id UUID;
  v_queue_id UUID;
BEGIN
  SELECT id INTO v_queue_id
  FROM public.routing_queues
  WHERE organization_id = p_organization_id AND is_default = true
  LIMIT 1;
  
  INSERT INTO public.conversations (
    organization_id, channel, status, priority, contact_id, owner_id, queue_id
  )
  VALUES (
    p_organization_id, 'phone', 'open', 'medium', p_contact_id, p_agent_id, v_queue_id
  )
  RETURNING id INTO v_conversation_id;
  
  INSERT INTO public.voice_calls (
    organization_id, voice_provider_id, conversation_id, external_call_id,
    direction, from_number, to_number, agent_id, contact_id, queue_id, status
  )
  VALUES (
    p_organization_id, p_provider_id, v_conversation_id, p_external_call_id,
    p_direction, p_from_number, p_to_number, p_agent_id, p_contact_id, v_queue_id, 'initiated'
  )
  RETURNING id INTO v_call_id;
  
  INSERT INTO public.voice_call_events (
    organization_id, call_id, event_type, event_data
  )
  VALUES (
    p_organization_id, v_call_id, 'initiated',
    jsonb_build_object('direction', p_direction, 'from', p_from_number, 'to', p_to_number)
  );
  
  RETURN v_call_id;
END;
$$;

-- Atualizar status da chamada
CREATE OR REPLACE FUNCTION public.update_voice_call_status(
  p_call_id UUID,
  p_status voice_call_status,
  p_event_data JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_call RECORD;
BEGIN
  SELECT * INTO v_call FROM public.voice_calls WHERE id = p_call_id;
  IF NOT FOUND THEN RETURN false; END IF;
  
  UPDATE public.voice_calls
  SET 
    status = p_status,
    ringing_at = CASE WHEN p_status = 'ringing' THEN now() ELSE ringing_at END,
    answered_at = CASE WHEN p_status = 'in_progress' THEN now() ELSE answered_at END,
    ended_at = CASE WHEN p_status IN ('completed', 'missed', 'failed', 'cancelled', 'busy', 'no_answer') THEN now() ELSE ended_at END,
    end_reason = CASE WHEN p_status IN ('completed', 'missed', 'failed', 'cancelled', 'busy', 'no_answer') THEN p_status::text ELSE end_reason END,
    updated_at = now()
  WHERE id = p_call_id;
  
  INSERT INTO public.voice_call_events (
    organization_id, call_id, event_type, event_data
  )
  VALUES (
    v_call.organization_id, p_call_id, p_status::text, p_event_data
  );
  
  IF p_status IN ('completed', 'missed', 'failed', 'cancelled', 'busy', 'no_answer') THEN
    UPDATE public.conversations
    SET status = 'closed', closed_at = now(), updated_at = now()
    WHERE id = v_call.conversation_id;
  END IF;
  
  RETURN true;
END;
$$;

-- =====================================================
-- PARTE 8: RLS POLICIES
-- =====================================================

ALTER TABLE public.whatsapp_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view whatsapp accounts of their organization" ON public.whatsapp_accounts FOR SELECT USING (public.is_member_of_org(organization_id));
CREATE POLICY "Admins can insert whatsapp accounts" ON public.whatsapp_accounts FOR INSERT WITH CHECK (public.is_member_of_org(organization_id) AND public.has_role('admin'::user_role));
CREATE POLICY "Admins can update whatsapp accounts" ON public.whatsapp_accounts FOR UPDATE USING (public.is_member_of_org(organization_id) AND public.has_role('admin'::user_role));
CREATE POLICY "Admins can delete whatsapp accounts" ON public.whatsapp_accounts FOR DELETE USING (public.is_member_of_org(organization_id) AND public.has_role('admin'::user_role));

ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view whatsapp templates of their organization" ON public.whatsapp_templates FOR SELECT USING (public.is_member_of_org(organization_id));
CREATE POLICY "Managers can insert whatsapp templates" ON public.whatsapp_templates FOR INSERT WITH CHECK (public.is_member_of_org(organization_id) AND public.has_role('manager'::user_role));
CREATE POLICY "Managers can update whatsapp templates" ON public.whatsapp_templates FOR UPDATE USING (public.is_member_of_org(organization_id) AND public.has_role('manager'::user_role));
CREATE POLICY "Managers can delete whatsapp templates" ON public.whatsapp_templates FOR DELETE USING (public.is_member_of_org(organization_id) AND public.has_role('manager'::user_role));

ALTER TABLE public.whatsapp_message_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view whatsapp message logs of their organization" ON public.whatsapp_message_logs FOR SELECT USING (public.is_member_of_org(organization_id));
CREATE POLICY "Users can insert whatsapp message logs" ON public.whatsapp_message_logs FOR INSERT WITH CHECK (public.is_member_of_org(organization_id));
CREATE POLICY "Users can update whatsapp message logs" ON public.whatsapp_message_logs FOR UPDATE USING (public.is_member_of_org(organization_id));

ALTER TABLE public.whatsapp_optins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view whatsapp optins of their organization" ON public.whatsapp_optins FOR SELECT USING (public.is_member_of_org(organization_id));
CREATE POLICY "Users can insert whatsapp optins" ON public.whatsapp_optins FOR INSERT WITH CHECK (public.is_member_of_org(organization_id));
CREATE POLICY "Users can update whatsapp optins" ON public.whatsapp_optins FOR UPDATE USING (public.is_member_of_org(organization_id));

ALTER TABLE public.chat_widgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view chat widgets of their organization" ON public.chat_widgets FOR SELECT USING (public.is_member_of_org(organization_id));
CREATE POLICY "Admins can insert chat widgets" ON public.chat_widgets FOR INSERT WITH CHECK (public.is_member_of_org(organization_id) AND public.has_role('admin'::user_role));
CREATE POLICY "Admins can update chat widgets" ON public.chat_widgets FOR UPDATE USING (public.is_member_of_org(organization_id) AND public.has_role('admin'::user_role));
CREATE POLICY "Admins can delete chat widgets" ON public.chat_widgets FOR DELETE USING (public.is_member_of_org(organization_id) AND public.has_role('admin'::user_role));

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view chat sessions of their organization" ON public.chat_sessions FOR SELECT USING (public.is_member_of_org(organization_id));
CREATE POLICY "System can insert chat sessions" ON public.chat_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update chat sessions" ON public.chat_sessions FOR UPDATE USING (public.is_member_of_org(organization_id));

ALTER TABLE public.chat_widget_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view chat widget events of their organization" ON public.chat_widget_events FOR SELECT USING (public.is_member_of_org(organization_id));
CREATE POLICY "System can insert chat widget events" ON public.chat_widget_events FOR INSERT WITH CHECK (true);

ALTER TABLE public.voice_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view voice providers of their organization" ON public.voice_providers FOR SELECT USING (public.is_member_of_org(organization_id));
CREATE POLICY "Admins can insert voice providers" ON public.voice_providers FOR INSERT WITH CHECK (public.is_member_of_org(organization_id) AND public.has_role('admin'::user_role));
CREATE POLICY "Admins can update voice providers" ON public.voice_providers FOR UPDATE USING (public.is_member_of_org(organization_id) AND public.has_role('admin'::user_role));
CREATE POLICY "Admins can delete voice providers" ON public.voice_providers FOR DELETE USING (public.is_member_of_org(organization_id) AND public.has_role('admin'::user_role));

ALTER TABLE public.voice_calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view voice calls of their organization" ON public.voice_calls FOR SELECT USING (public.is_member_of_org(organization_id));
CREATE POLICY "Users can insert voice calls" ON public.voice_calls FOR INSERT WITH CHECK (public.is_member_of_org(organization_id));
CREATE POLICY "Users can update voice calls" ON public.voice_calls FOR UPDATE USING (public.is_member_of_org(organization_id));

ALTER TABLE public.voice_call_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view voice call events of their organization" ON public.voice_call_events FOR SELECT USING (public.is_member_of_org(organization_id));
CREATE POLICY "System can insert voice call events" ON public.voice_call_events FOR INSERT WITH CHECK (true);

ALTER TABLE public.voice_transcripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view voice transcripts of their organization" ON public.voice_transcripts FOR SELECT USING (public.is_member_of_org(organization_id));
CREATE POLICY "System can insert voice transcripts" ON public.voice_transcripts FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update voice transcripts" ON public.voice_transcripts FOR UPDATE USING (public.is_member_of_org(organization_id));

ALTER TABLE public.voice_voicemails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view voice voicemails of their organization" ON public.voice_voicemails FOR SELECT USING (public.is_member_of_org(organization_id));
CREATE POLICY "System can insert voice voicemails" ON public.voice_voicemails FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update voice voicemails" ON public.voice_voicemails FOR UPDATE USING (public.is_member_of_org(organization_id));

-- =====================================================
-- PARTE 9: HABILITAR REALTIME
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_message_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.voice_calls;