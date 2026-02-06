
-- =====================================================
-- BLOCO 3: QA/Quality Assurance + Social Inbox
-- Fireware CRM - Service Enterprise Expansion
-- =====================================================

-- =====================================================
-- PART 1: ENUMS
-- =====================================================

-- QA Review Status
CREATE TYPE public.qa_review_status AS ENUM (
  'pending',
  'in_progress', 
  'completed',
  'disputed',
  'calibrated'
);

-- QA Rating Scale
CREATE TYPE public.qa_rating AS ENUM (
  'excellent',
  'good',
  'satisfactory',
  'needs_improvement',
  'unsatisfactory'
);

-- QA Scorecard Status
CREATE TYPE public.qa_scorecard_status AS ENUM (
  'draft',
  'active',
  'archived'
);

-- NPS Survey Status
CREATE TYPE public.nps_survey_status AS ENUM (
  'draft',
  'active',
  'paused',
  'completed',
  'archived'
);

-- NPS Survey Trigger Type
CREATE TYPE public.nps_trigger_type AS ENUM (
  'ticket_resolved',
  'conversation_closed',
  'order_delivered',
  'manual',
  'scheduled',
  'milestone'
);

-- Social Platform
CREATE TYPE public.social_platform AS ENUM (
  'instagram',
  'facebook',
  'twitter',
  'linkedin',
  'tiktok',
  'youtube'
);

-- Social Account Status
CREATE TYPE public.social_account_status AS ENUM (
  'connected',
  'disconnected',
  'expired',
  'error'
);

-- Social Message Direction
CREATE TYPE public.social_message_direction AS ENUM (
  'inbound',
  'outbound'
);

-- Social Message Type
CREATE TYPE public.social_message_type AS ENUM (
  'direct_message',
  'comment',
  'mention',
  'reply',
  'story_reply',
  'post'
);

-- Social Mention Sentiment
CREATE TYPE public.social_mention_sentiment AS ENUM (
  'positive',
  'negative',
  'neutral',
  'mixed'
);

-- =====================================================
-- PART 2: QA SCORECARDS
-- =====================================================

CREATE TABLE public.qa_scorecards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status public.qa_scorecard_status NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1,
  -- Criteria definitions stored as JSONB array
  -- Each item: { name, description, weight, max_score, category }
  criteria_definitions JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Scoring configuration
  total_max_score INTEGER NOT NULL DEFAULT 100,
  passing_score INTEGER NOT NULL DEFAULT 70,
  -- Applicability: which interaction types this scorecard applies to
  applies_to_channels TEXT[] DEFAULT '{}'::text[],
  applies_to_queues UUID[] DEFAULT '{}'::uuid[],
  -- Auto-assignment
  auto_assign_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_assign_percentage INTEGER DEFAULT 10, -- % of interactions to auto-review
  auto_assign_reviewers UUID[] DEFAULT '{}'::uuid[],
  -- Metadata
  tags TEXT[] DEFAULT '{}'::text[],
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.qa_scorecards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qa_scorecards_select" ON public.qa_scorecards FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "qa_scorecards_insert" ON public.qa_scorecards FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "qa_scorecards_update" ON public.qa_scorecards FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "qa_scorecards_delete" ON public.qa_scorecards FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE INDEX idx_qa_scorecards_org ON public.qa_scorecards(organization_id);
CREATE INDEX idx_qa_scorecards_status ON public.qa_scorecards(status);

-- =====================================================
-- PART 3: QA REVIEWS
-- =====================================================

CREATE TABLE public.qa_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  scorecard_id UUID NOT NULL REFERENCES public.qa_scorecards(id) ON DELETE CASCADE,
  -- What was reviewed
  entity_type TEXT NOT NULL, -- 'ticket', 'conversation', 'call'
  entity_id UUID NOT NULL,
  -- Who was reviewed
  agent_id UUID NOT NULL REFERENCES public.profiles(id),
  -- Who reviewed
  reviewer_id UUID REFERENCES public.profiles(id),
  -- Status
  status public.qa_review_status NOT NULL DEFAULT 'pending',
  -- Scores
  total_score NUMERIC(6,2) DEFAULT 0,
  max_possible_score NUMERIC(6,2) DEFAULT 100,
  percentage_score NUMERIC(5,2) DEFAULT 0,
  overall_rating public.qa_rating,
  -- Review details
  feedback TEXT,
  strengths TEXT,
  improvement_areas TEXT,
  coaching_recommendations TEXT,
  -- Agent acknowledgment
  agent_acknowledged_at TIMESTAMPTZ,
  agent_comments TEXT,
  agent_disputed BOOLEAN DEFAULT false,
  dispute_reason TEXT,
  dispute_resolved_at TIMESTAMPTZ,
  dispute_resolution TEXT,
  -- Calibration
  is_calibration_review BOOLEAN NOT NULL DEFAULT false,
  calibration_session_id UUID,
  -- Timing
  review_started_at TIMESTAMPTZ,
  review_completed_at TIMESTAMPTZ,
  review_duration_seconds INTEGER,
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.qa_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qa_reviews_select" ON public.qa_reviews FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "qa_reviews_insert" ON public.qa_reviews FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "qa_reviews_update" ON public.qa_reviews FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "qa_reviews_delete" ON public.qa_reviews FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE INDEX idx_qa_reviews_org ON public.qa_reviews(organization_id);
CREATE INDEX idx_qa_reviews_scorecard ON public.qa_reviews(scorecard_id);
CREATE INDEX idx_qa_reviews_agent ON public.qa_reviews(agent_id);
CREATE INDEX idx_qa_reviews_reviewer ON public.qa_reviews(reviewer_id);
CREATE INDEX idx_qa_reviews_status ON public.qa_reviews(status);
CREATE INDEX idx_qa_reviews_entity ON public.qa_reviews(entity_type, entity_id);
CREATE INDEX idx_qa_reviews_created ON public.qa_reviews(created_at DESC);

-- =====================================================
-- PART 4: QA REVIEW CRITERIA (Individual scores)
-- =====================================================

CREATE TABLE public.qa_review_criteria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  review_id UUID NOT NULL REFERENCES public.qa_reviews(id) ON DELETE CASCADE,
  -- Criterion identification (matches criteria_definitions in scorecard)
  criterion_name TEXT NOT NULL,
  criterion_category TEXT,
  -- Scoring
  score NUMERIC(6,2) NOT NULL DEFAULT 0,
  max_score NUMERIC(6,2) NOT NULL DEFAULT 10,
  weight NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  weighted_score NUMERIC(6,2) GENERATED ALWAYS AS (score * weight) STORED,
  -- Rating
  rating public.qa_rating,
  -- Feedback
  notes TEXT,
  is_critical_fail BOOLEAN NOT NULL DEFAULT false, -- auto-fail the review if true
  -- Evidence
  evidence_timestamps TEXT[], -- specific moments in the interaction
  evidence_quotes TEXT[], -- direct quotes
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.qa_review_criteria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qa_review_criteria_select" ON public.qa_review_criteria FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "qa_review_criteria_insert" ON public.qa_review_criteria FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "qa_review_criteria_update" ON public.qa_review_criteria FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "qa_review_criteria_delete" ON public.qa_review_criteria FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE INDEX idx_qa_review_criteria_review ON public.qa_review_criteria(review_id);

-- =====================================================
-- PART 5: NPS SURVEYS
-- =====================================================

CREATE TABLE public.nps_surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status public.nps_survey_status NOT NULL DEFAULT 'draft',
  -- Trigger configuration
  trigger_type public.nps_trigger_type NOT NULL DEFAULT 'manual',
  trigger_config JSONB DEFAULT '{}'::jsonb, -- e.g. { delay_hours: 2, channels: ['email'] }
  -- Survey customization
  question_text TEXT NOT NULL DEFAULT 'Em uma escala de 0 a 10, qual a probabilidade de você recomendar nossa empresa?',
  follow_up_question TEXT DEFAULT 'O que motivou sua nota?',
  thank_you_message TEXT DEFAULT 'Obrigado pelo seu feedback!',
  -- Targeting
  target_segment_id UUID,
  target_channels TEXT[] DEFAULT '{}'::text[],
  -- Limits
  max_responses INTEGER,
  cooldown_days INTEGER DEFAULT 90, -- min days between surveys to same contact
  -- Schedule
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  -- Metrics
  total_sent INTEGER NOT NULL DEFAULT 0,
  total_responses INTEGER NOT NULL DEFAULT 0,
  response_rate NUMERIC(5,2) DEFAULT 0,
  avg_score NUMERIC(4,2),
  nps_score NUMERIC(5,2), -- -100 to +100
  promoters_count INTEGER NOT NULL DEFAULT 0,
  passives_count INTEGER NOT NULL DEFAULT 0,
  detractors_count INTEGER NOT NULL DEFAULT 0,
  -- Metadata
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.nps_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nps_surveys_select" ON public.nps_surveys FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "nps_surveys_insert" ON public.nps_surveys FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "nps_surveys_update" ON public.nps_surveys FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "nps_surveys_delete" ON public.nps_surveys FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE INDEX idx_nps_surveys_org ON public.nps_surveys(organization_id);
CREATE INDEX idx_nps_surveys_status ON public.nps_surveys(status);

-- =====================================================
-- PART 6: NPS RESPONSES
-- =====================================================

CREATE TABLE public.nps_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  survey_id UUID NOT NULL REFERENCES public.nps_surveys(id) ON DELETE CASCADE,
  -- Respondent
  contact_id UUID REFERENCES public.contacts(id),
  account_id UUID REFERENCES public.accounts(id),
  -- Context
  entity_type TEXT, -- 'ticket', 'conversation', 'order'
  entity_id UUID,
  channel TEXT, -- delivery channel: 'email', 'sms', 'in_app', 'portal'
  -- Response
  score INTEGER NOT NULL, -- 0-10
  category TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN score >= 9 THEN 'promoter'
      WHEN score >= 7 THEN 'passive'
      ELSE 'detractor'
    END
  ) STORED,
  feedback TEXT,
  follow_up_response TEXT,
  -- Timing
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  -- Agent follow-up
  follow_up_agent_id UUID REFERENCES public.profiles(id),
  follow_up_notes TEXT,
  follow_up_completed_at TIMESTAMPTZ,
  follow_up_action TEXT, -- 'none', 'contact_planned', 'escalated', 'resolved'
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.nps_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nps_responses_select" ON public.nps_responses FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "nps_responses_insert" ON public.nps_responses FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "nps_responses_update" ON public.nps_responses FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE INDEX idx_nps_responses_survey ON public.nps_responses(survey_id);
CREATE INDEX idx_nps_responses_contact ON public.nps_responses(contact_id);
CREATE INDEX idx_nps_responses_score ON public.nps_responses(score);
CREATE INDEX idx_nps_responses_category ON public.nps_responses(category);

-- =====================================================
-- PART 7: SOCIAL ACCOUNTS
-- =====================================================

CREATE TABLE public.social_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  platform public.social_platform NOT NULL,
  account_name TEXT NOT NULL,
  account_handle TEXT, -- @handle
  account_id_external TEXT, -- platform-specific ID
  -- Auth
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  -- Status
  status public.social_account_status NOT NULL DEFAULT 'connected',
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  -- Configuration
  auto_import_messages BOOLEAN NOT NULL DEFAULT true,
  auto_import_mentions BOOLEAN NOT NULL DEFAULT true,
  auto_create_conversations BOOLEAN NOT NULL DEFAULT true,
  default_queue_id UUID REFERENCES public.routing_queues(id),
  -- Metrics
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  total_messages_imported INTEGER NOT NULL DEFAULT 0,
  total_mentions_imported INTEGER NOT NULL DEFAULT 0,
  -- Metadata
  profile_image_url TEXT,
  profile_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  connected_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_accounts_select" ON public.social_accounts FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "social_accounts_insert" ON public.social_accounts FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "social_accounts_update" ON public.social_accounts FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "social_accounts_delete" ON public.social_accounts FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE INDEX idx_social_accounts_org ON public.social_accounts(organization_id);
CREATE INDEX idx_social_accounts_platform ON public.social_accounts(platform);
CREATE INDEX idx_social_accounts_status ON public.social_accounts(status);

-- =====================================================
-- PART 8: SOCIAL MESSAGES
-- =====================================================

CREATE TABLE public.social_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  social_account_id UUID NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  -- Conversation link
  conversation_id UUID REFERENCES public.conversations(id),
  -- Message details
  direction public.social_message_direction NOT NULL DEFAULT 'inbound',
  message_type public.social_message_type NOT NULL DEFAULT 'direct_message',
  platform_message_id TEXT, -- platform-specific ID
  -- Content
  content TEXT,
  content_html TEXT,
  media_urls TEXT[] DEFAULT '{}'::text[],
  media_types TEXT[] DEFAULT '{}'::text[],
  -- Sender/Recipient
  sender_name TEXT,
  sender_handle TEXT,
  sender_avatar_url TEXT,
  sender_platform_id TEXT,
  recipient_name TEXT,
  recipient_handle TEXT,
  recipient_platform_id TEXT,
  -- Context
  parent_message_id UUID REFERENCES public.social_messages(id), -- for threaded replies
  original_post_id TEXT, -- for comments on a post
  original_post_url TEXT,
  -- Matching
  contact_id UUID REFERENCES public.contacts(id),
  -- Engagement
  likes_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  -- Processing
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_replied BOOLEAN NOT NULL DEFAULT false,
  replied_at TIMESTAMPTZ,
  replied_by UUID REFERENCES public.profiles(id),
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  is_spam BOOLEAN NOT NULL DEFAULT false,
  -- Sentiment
  sentiment public.social_mention_sentiment,
  sentiment_score NUMERIC(4,2),
  -- Timestamps
  platform_created_at TIMESTAMPTZ, -- original time on the platform
  imported_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.social_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_messages_select" ON public.social_messages FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "social_messages_insert" ON public.social_messages FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "social_messages_update" ON public.social_messages FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE INDEX idx_social_messages_org ON public.social_messages(organization_id);
CREATE INDEX idx_social_messages_account ON public.social_messages(social_account_id);
CREATE INDEX idx_social_messages_conversation ON public.social_messages(conversation_id);
CREATE INDEX idx_social_messages_contact ON public.social_messages(contact_id);
CREATE INDEX idx_social_messages_direction ON public.social_messages(direction);
CREATE INDEX idx_social_messages_type ON public.social_messages(message_type);
CREATE INDEX idx_social_messages_created ON public.social_messages(created_at DESC);
CREATE INDEX idx_social_messages_platform_id ON public.social_messages(platform_message_id);
CREATE INDEX idx_social_messages_unread ON public.social_messages(is_read) WHERE is_read = false;

-- =====================================================
-- PART 9: SOCIAL MENTIONS
-- =====================================================

CREATE TABLE public.social_mentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  social_account_id UUID NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  -- Mention details
  platform public.social_platform NOT NULL,
  platform_mention_id TEXT,
  mention_type TEXT NOT NULL DEFAULT 'mention', -- 'mention', 'tag', 'hashtag', 'keyword'
  -- Content
  content TEXT,
  content_url TEXT,
  media_urls TEXT[] DEFAULT '{}'::text[],
  -- Author
  author_name TEXT,
  author_handle TEXT,
  author_avatar_url TEXT,
  author_platform_id TEXT,
  author_followers_count INTEGER DEFAULT 0,
  -- Analysis
  sentiment public.social_mention_sentiment,
  sentiment_score NUMERIC(4,2),
  topics TEXT[] DEFAULT '{}'::text[],
  keywords TEXT[] DEFAULT '{}'::text[],
  -- Engagement
  likes_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  reach_estimate INTEGER DEFAULT 0,
  -- Processing status
  is_reviewed BOOLEAN NOT NULL DEFAULT false,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  action_taken TEXT, -- 'none', 'responded', 'escalated', 'flagged', 'ignored'
  -- Link to conversation if responded
  conversation_id UUID REFERENCES public.conversations(id),
  social_message_id UUID REFERENCES public.social_messages(id),
  -- Contact matching
  contact_id UUID REFERENCES public.contacts(id),
  account_id UUID REFERENCES public.accounts(id),
  -- Timestamps
  platform_created_at TIMESTAMPTZ,
  imported_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.social_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_mentions_select" ON public.social_mentions FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "social_mentions_insert" ON public.social_mentions FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "social_mentions_update" ON public.social_mentions FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE INDEX idx_social_mentions_org ON public.social_mentions(organization_id);
CREATE INDEX idx_social_mentions_account ON public.social_mentions(social_account_id);
CREATE INDEX idx_social_mentions_platform ON public.social_mentions(platform);
CREATE INDEX idx_social_mentions_sentiment ON public.social_mentions(sentiment);
CREATE INDEX idx_social_mentions_unreviewed ON public.social_mentions(is_reviewed) WHERE is_reviewed = false;
CREATE INDEX idx_social_mentions_created ON public.social_mentions(created_at DESC);

-- =====================================================
-- PART 10: TRIGGERS & FUNCTIONS
-- =====================================================

-- Auto-update NPS survey metrics when a response is inserted
CREATE OR REPLACE FUNCTION public.update_nps_survey_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_survey RECORD;
BEGIN
  SELECT 
    COUNT(*) as total,
    AVG(score) as avg_s,
    COUNT(*) FILTER (WHERE score >= 9) as promoters,
    COUNT(*) FILTER (WHERE score >= 7 AND score < 9) as passives,
    COUNT(*) FILTER (WHERE score < 7) as detractors
  INTO v_survey
  FROM public.nps_responses
  WHERE survey_id = NEW.survey_id;
  
  UPDATE public.nps_surveys SET
    total_responses = v_survey.total,
    avg_score = v_survey.avg_s,
    promoters_count = v_survey.promoters,
    passives_count = v_survey.passives,
    detractors_count = v_survey.detractors,
    response_rate = CASE 
      WHEN total_sent > 0 THEN (v_survey.total::NUMERIC / total_sent * 100)
      ELSE 0
    END,
    nps_score = CASE 
      WHEN v_survey.total > 0 THEN 
        ((v_survey.promoters::NUMERIC / v_survey.total) - (v_survey.detractors::NUMERIC / v_survey.total)) * 100
      ELSE 0
    END,
    updated_at = now()
  WHERE id = NEW.survey_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_nps_metrics
AFTER INSERT ON public.nps_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_nps_survey_metrics();

-- Auto-calculate QA review totals when criteria are inserted/updated
CREATE OR REPLACE FUNCTION public.calculate_qa_review_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_score NUMERIC(6,2);
  v_max_score NUMERIC(6,2);
  v_pct NUMERIC(5,2);
  v_rating public.qa_rating;
  v_critical_fail BOOLEAN;
  v_review_id UUID;
BEGIN
  v_review_id := COALESCE(NEW.review_id, OLD.review_id);
  
  -- Check for critical failures
  SELECT EXISTS (
    SELECT 1 FROM public.qa_review_criteria 
    WHERE review_id = v_review_id AND is_critical_fail = true
  ) INTO v_critical_fail;
  
  -- Calculate totals
  SELECT 
    COALESCE(SUM(weighted_score), 0),
    COALESCE(SUM(max_score * weight), 0)
  INTO v_total_score, v_max_score
  FROM public.qa_review_criteria
  WHERE review_id = v_review_id;
  
  -- Calculate percentage
  IF v_max_score > 0 THEN
    v_pct := (v_total_score / v_max_score) * 100;
  ELSE
    v_pct := 0;
  END IF;
  
  -- If critical fail, cap at needs_improvement
  IF v_critical_fail THEN
    v_pct := LEAST(v_pct, 49);
  END IF;
  
  -- Determine rating
  IF v_pct >= 90 THEN v_rating := 'excellent';
  ELSIF v_pct >= 75 THEN v_rating := 'good';
  ELSIF v_pct >= 60 THEN v_rating := 'satisfactory';
  ELSIF v_pct >= 40 THEN v_rating := 'needs_improvement';
  ELSE v_rating := 'unsatisfactory';
  END IF;
  
  -- Update review
  UPDATE public.qa_reviews SET
    total_score = v_total_score,
    max_possible_score = v_max_score,
    percentage_score = v_pct,
    overall_rating = v_rating,
    updated_at = now()
  WHERE id = v_review_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_calculate_qa_score
AFTER INSERT OR UPDATE OR DELETE ON public.qa_review_criteria
FOR EACH ROW
EXECUTE FUNCTION public.calculate_qa_review_score();

-- Updated_at triggers
CREATE TRIGGER update_qa_scorecards_updated_at
BEFORE UPDATE ON public.qa_scorecards
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_qa_reviews_updated_at
BEFORE UPDATE ON public.qa_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nps_surveys_updated_at
BEFORE UPDATE ON public.nps_surveys
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_accounts_updated_at
BEFORE UPDATE ON public.social_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_messages_updated_at
BEFORE UPDATE ON public.social_messages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_mentions_updated_at
BEFORE UPDATE ON public.social_mentions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
