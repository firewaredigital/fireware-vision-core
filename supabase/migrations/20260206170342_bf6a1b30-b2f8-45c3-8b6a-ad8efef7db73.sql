
-- =====================================================
-- BLOCO 2: CPQ + Subscriptions/Billing + Conversation Intelligence
-- =====================================================

-- ================= ENUMS =================

-- CPQ Enums
CREATE TYPE public.cpq_rule_type AS ENUM ('compatibility', 'restriction', 'dependency', 'pricing', 'validation');
CREATE TYPE public.cpq_rule_action AS ENUM ('require', 'exclude', 'suggest', 'price_override', 'warn');
CREATE TYPE public.cpq_config_status AS ENUM ('draft', 'valid', 'invalid', 'approved', 'expired');
CREATE TYPE public.cpq_discount_tier AS ENUM ('tier_1', 'tier_2', 'tier_3', 'tier_4', 'tier_5');

-- Subscription & Billing Enums
CREATE TYPE public.subscription_status AS ENUM ('trial', 'active', 'past_due', 'cancelled', 'paused', 'expired', 'pending_activation');
CREATE TYPE public.subscription_interval AS ENUM ('monthly', 'quarterly', 'semi_annual', 'annual', 'custom');
CREATE TYPE public.invoice_status AS ENUM ('draft', 'pending', 'sent', 'paid', 'partial', 'overdue', 'cancelled', 'void', 'refunded');
CREATE TYPE public.dunning_status AS ENUM ('pending', 'sent', 'escalated', 'resolved', 'failed', 'cancelled');
CREATE TYPE public.ledger_entry_type AS ENUM ('charge', 'payment', 'credit', 'debit', 'refund', 'adjustment', 'write_off');

-- Conversation Intelligence Enums
CREATE TYPE public.call_recording_status AS ENUM ('processing', 'ready', 'transcribed', 'analyzed', 'failed', 'archived');
CREATE TYPE public.call_sentiment AS ENUM ('very_positive', 'positive', 'neutral', 'negative', 'very_negative', 'mixed');
CREATE TYPE public.insight_type AS ENUM ('objection', 'competitor_mention', 'pricing_discussion', 'next_step', 'risk_signal', 'buying_signal', 'feature_request', 'pain_point', 'decision_maker', 'timeline');

-- ================= CPQ TABLES =================

-- 1. CPQ Product Configurations
CREATE TABLE public.cpq_product_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status public.cpq_config_status NOT NULL DEFAULT 'draft',
  -- Linked entities
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  -- Configuration data
  base_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  selected_options JSONB NOT NULL DEFAULT '[]'::jsonb,
  configuration_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Pricing
  base_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  adjusted_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  final_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  -- Approval
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  approval_status TEXT DEFAULT 'pending',
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  -- Metadata
  version INTEGER NOT NULL DEFAULT 1,
  valid_until TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. CPQ Rules
CREATE TABLE public.cpq_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rule_type public.cpq_rule_type NOT NULL,
  action public.cpq_rule_action NOT NULL DEFAULT 'require',
  -- Rule conditions
  source_product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  target_product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  source_category TEXT,
  target_category TEXT,
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Rule parameters
  priority INTEGER NOT NULL DEFAULT 100,
  error_message TEXT,
  warning_message TEXT,
  -- Pricing override (for pricing rules)
  price_modifier_type TEXT, -- 'fixed', 'percent', 'formula'
  price_modifier_value NUMERIC(15,2),
  price_formula TEXT,
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  effective_from TIMESTAMPTZ,
  effective_until TIMESTAMPTZ,
  -- Metadata
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. CPQ Bundles
CREATE TABLE public.cpq_bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  -- Pricing
  bundle_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_type TEXT NOT NULL DEFAULT 'percent', -- 'percent', 'fixed', 'tiered'
  discount_value NUMERIC(15,2) NOT NULL DEFAULT 0,
  min_quantity INTEGER DEFAULT 1,
  max_quantity INTEGER,
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  effective_from TIMESTAMPTZ,
  effective_until TIMESTAMPTZ,
  -- Metadata
  tags TEXT[],
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. CPQ Bundle Items
CREATE TABLE public.cpq_bundle_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_id UUID NOT NULL REFERENCES public.cpq_bundles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  is_optional BOOLEAN NOT NULL DEFAULT false,
  is_default_selected BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  -- Per-item pricing override
  unit_price_override NUMERIC(15,2),
  discount_override NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. CPQ Discount Policies
CREATE TABLE public.cpq_discount_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  -- Tiers
  tier public.cpq_discount_tier NOT NULL,
  max_discount_percent NUMERIC(5,2) NOT NULL,
  max_discount_amount NUMERIC(15,2),
  -- Approval chain
  requires_approval BOOLEAN NOT NULL DEFAULT true,
  approver_role TEXT, -- role needed to approve this tier
  approval_chain JSONB DEFAULT '[]'::jsonb, -- ordered list of approver profiles
  -- Conditions
  min_deal_value NUMERIC(15,2),
  max_deal_value NUMERIC(15,2),
  applicable_products JSONB DEFAULT '[]'::jsonb, -- product IDs or categories
  applicable_territories UUID[],
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 100,
  -- Metadata
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. CPQ Price Calculations (Audit Log)
CREATE TABLE public.cpq_price_calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  configuration_id UUID NOT NULL REFERENCES public.cpq_product_configurations(id) ON DELETE CASCADE,
  -- Calculation details
  calculation_type TEXT NOT NULL, -- 'initial', 'recalculation', 'approval_override'
  input_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Price breakdown
  list_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  rules_applied JSONB NOT NULL DEFAULT '[]'::jsonb,
  discounts_applied JSONB NOT NULL DEFAULT '[]'::jsonb,
  adjustments JSONB NOT NULL DEFAULT '[]'::jsonb,
  calculated_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  margin_percent NUMERIC(5,2),
  margin_amount NUMERIC(15,2),
  -- Context
  calculated_by UUID REFERENCES public.profiles(id),
  calculation_duration_ms INTEGER,
  warnings JSONB DEFAULT '[]'::jsonb,
  errors JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ================= SUBSCRIPTION & BILLING TABLES =================

-- 7. Subscriptions
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  subscription_number TEXT NOT NULL,
  -- Customer
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id),
  -- Plan details
  plan_name TEXT NOT NULL,
  plan_description TEXT,
  billing_interval public.subscription_interval NOT NULL DEFAULT 'monthly',
  billing_day INTEGER DEFAULT 1, -- day of month for billing
  -- Pricing
  base_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_recurring NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  -- Status & Dates
  status public.subscription_status NOT NULL DEFAULT 'pending_activation',
  trial_starts_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  cancellation_feedback TEXT,
  paused_at TIMESTAMPTZ,
  resume_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  -- Renewal
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  renewal_count INTEGER NOT NULL DEFAULT 0,
  last_renewed_at TIMESTAMPTZ,
  -- Contract linkage
  contract_id UUID REFERENCES public.contracts(id),
  opportunity_id UUID REFERENCES public.opportunities(id),
  quote_id UUID REFERENCES public.quotes(id),
  -- Ownership
  owner_id UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),
  -- Metadata
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Subscription Items
CREATE TABLE public.subscription_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  total NUMERIC(15,2) NOT NULL DEFAULT 0,
  -- Usage-based billing
  is_metered BOOLEAN NOT NULL DEFAULT false,
  usage_metric TEXT,
  included_units INTEGER,
  overage_price NUMERIC(15,4),
  current_usage INTEGER DEFAULT 0,
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Invoices
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  -- Customer
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id),
  -- Source
  subscription_id UUID REFERENCES public.subscriptions(id),
  order_id UUID REFERENCES public.orders(id),
  contract_id UUID REFERENCES public.contracts(id),
  -- Dates
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,
  -- Amounts
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  shipping_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  total NUMERIC(15,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(15,2) NOT NULL DEFAULT 0,
  amount_due NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  -- Status
  status public.invoice_status NOT NULL DEFAULT 'draft',
  -- Payment
  payment_method TEXT,
  payment_reference TEXT,
  -- Billing address
  billing_name TEXT,
  billing_email TEXT,
  billing_address_street TEXT,
  billing_address_city TEXT,
  billing_address_state TEXT,
  billing_address_postal_code TEXT,
  billing_address_country TEXT,
  -- Metadata
  notes TEXT,
  internal_notes TEXT,
  terms TEXT,
  footer_text TEXT,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  -- Ownership
  created_by UUID REFERENCES public.profiles(id),
  voided_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Invoice Items
CREATE TABLE public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  -- Item details
  product_id UUID REFERENCES public.products(id),
  subscription_item_id UUID REFERENCES public.subscription_items(id),
  description TEXT NOT NULL,
  quantity NUMERIC(15,4) NOT NULL DEFAULT 1,
  unit_price NUMERIC(15,4) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  total NUMERIC(15,2) NOT NULL DEFAULT 0,
  -- Period (for subscriptions)
  period_start DATE,
  period_end DATE,
  -- Sort
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Payment Ledger
CREATE TABLE public.payment_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  -- References
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id),
  subscription_id UUID REFERENCES public.subscriptions(id),
  order_id UUID REFERENCES public.orders(id),
  -- Entry details
  entry_type public.ledger_entry_type NOT NULL,
  reference_number TEXT,
  description TEXT NOT NULL,
  -- Amounts
  amount NUMERIC(15,2) NOT NULL,
  running_balance NUMERIC(15,2),
  currency TEXT NOT NULL DEFAULT 'BRL',
  -- Payment method
  payment_method TEXT,
  payment_gateway TEXT,
  gateway_transaction_id TEXT,
  -- Status
  status TEXT NOT NULL DEFAULT 'completed', -- completed, pending, failed, reversed
  -- Dates
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Dunning Attempts
CREATE TABLE public.dunning_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  -- References
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  -- Attempt details
  attempt_number INTEGER NOT NULL DEFAULT 1,
  status public.dunning_status NOT NULL DEFAULT 'pending',
  -- Communication
  channel TEXT NOT NULL DEFAULT 'email', -- email, sms, whatsapp, phone
  message_template TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  -- Escalation
  escalated_to UUID REFERENCES public.profiles(id),
  escalation_reason TEXT,
  -- Resolution
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id),
  resolution_notes TEXT,
  payment_received BOOLEAN NOT NULL DEFAULT false,
  payment_amount NUMERIC(15,2),
  -- Next action
  next_attempt_at TIMESTAMPTZ,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  -- Metadata
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ================= CONVERSATION INTELLIGENCE TABLES =================

-- 13. Sales Call Recordings
CREATE TABLE public.sales_call_recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  -- Call metadata
  call_id UUID REFERENCES public.voice_calls(id),
  title TEXT NOT NULL,
  -- Participants
  caller_id UUID REFERENCES public.profiles(id),
  contact_id UUID REFERENCES public.contacts(id),
  account_id UUID REFERENCES public.accounts(id),
  opportunity_id UUID REFERENCES public.opportunities(id),
  lead_id UUID REFERENCES public.leads(id),
  -- Recording details
  recording_url TEXT,
  recording_duration_seconds INTEGER,
  file_size_bytes BIGINT,
  file_format TEXT DEFAULT 'mp3',
  -- Transcription
  transcription TEXT,
  transcription_segments JSONB DEFAULT '[]'::jsonb, -- [{start_ms, end_ms, speaker, text}]
  transcription_language TEXT DEFAULT 'pt-BR',
  transcription_confidence NUMERIC(5,4),
  -- Analysis
  status public.call_recording_status NOT NULL DEFAULT 'processing',
  overall_sentiment public.call_sentiment,
  sentiment_timeline JSONB DEFAULT '[]'::jsonb, -- [{timestamp_ms, sentiment, score}]
  talk_ratio JSONB DEFAULT '{}'::jsonb, -- {seller_percent, buyer_percent}
  talk_speed JSONB DEFAULT '{}'::jsonb, -- {seller_wpm, buyer_wpm}
  longest_monologue_seconds INTEGER,
  question_count INTEGER DEFAULT 0,
  filler_word_count INTEGER DEFAULT 0,
  -- Key moments
  key_moments JSONB DEFAULT '[]'::jsonb, -- [{timestamp_ms, type, description}]
  action_items JSONB DEFAULT '[]'::jsonb, -- [{description, assignee, due_date}]
  -- Scoring
  call_score INTEGER, -- 0-100
  engagement_score INTEGER, -- 0-100
  -- Metadata
  tags TEXT[],
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  analyzed_at TIMESTAMPTZ,
  analyzed_by TEXT, -- 'ai_model_v1', 'manual'
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. Call Insights
CREATE TABLE public.call_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  recording_id UUID NOT NULL REFERENCES public.sales_call_recordings(id) ON DELETE CASCADE,
  -- Insight details
  insight_type public.insight_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  -- Context
  timestamp_ms INTEGER, -- position in recording
  duration_ms INTEGER, -- duration of the segment
  transcript_excerpt TEXT,
  speaker TEXT, -- 'seller', 'buyer', 'unknown'
  -- Severity / Impact
  severity TEXT DEFAULT 'medium', -- low, medium, high, critical
  confidence NUMERIC(5,4) NOT NULL DEFAULT 0.8,
  -- Linked entities
  competitor_name TEXT,
  product_mentioned TEXT,
  feature_requested TEXT,
  objection_category TEXT,
  -- Resolution
  is_addressed BOOLEAN NOT NULL DEFAULT false,
  addressed_at TIMESTAMPTZ,
  addressed_by UUID REFERENCES public.profiles(id),
  follow_up_action TEXT,
  -- Metadata
  tags TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. Coaching Notes
CREATE TABLE public.coaching_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  recording_id UUID NOT NULL REFERENCES public.sales_call_recordings(id) ON DELETE CASCADE,
  -- Coaching content
  coach_id UUID NOT NULL REFERENCES public.profiles(id),
  rep_id UUID NOT NULL REFERENCES public.profiles(id),
  -- Content
  timestamp_ms INTEGER, -- position in recording
  content TEXT NOT NULL,
  category TEXT, -- 'technique', 'product_knowledge', 'objection_handling', 'closing', 'rapport', 'discovery'
  rating TEXT, -- 'excellent', 'good', 'needs_improvement', 'critical'
  -- Improvement tracking
  improvement_area TEXT,
  suggested_action TEXT,
  is_acknowledged BOOLEAN NOT NULL DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  -- Metadata
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ================= INDEXES =================

-- CPQ indexes
CREATE INDEX idx_cpq_configs_org ON public.cpq_product_configurations(organization_id);
CREATE INDEX idx_cpq_configs_status ON public.cpq_product_configurations(organization_id, status);
CREATE INDEX idx_cpq_configs_opportunity ON public.cpq_product_configurations(opportunity_id);
CREATE INDEX idx_cpq_configs_quote ON public.cpq_product_configurations(quote_id);
CREATE INDEX idx_cpq_rules_org ON public.cpq_rules(organization_id);
CREATE INDEX idx_cpq_rules_source ON public.cpq_rules(source_product_id);
CREATE INDEX idx_cpq_rules_target ON public.cpq_rules(target_product_id);
CREATE INDEX idx_cpq_bundles_org ON public.cpq_bundles(organization_id);
CREATE INDEX idx_cpq_bundle_items_bundle ON public.cpq_bundle_items(bundle_id);
CREATE INDEX idx_cpq_discount_org ON public.cpq_discount_policies(organization_id);
CREATE INDEX idx_cpq_calc_config ON public.cpq_price_calculations(configuration_id);

-- Subscription indexes
CREATE INDEX idx_subscriptions_org ON public.subscriptions(organization_id);
CREATE INDEX idx_subscriptions_account ON public.subscriptions(account_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(organization_id, status);
CREATE INDEX idx_subscriptions_next_billing ON public.subscriptions(next_billing_date) WHERE status = 'active';
CREATE INDEX idx_subscription_items_sub ON public.subscription_items(subscription_id);

-- Invoice indexes
CREATE INDEX idx_invoices_org ON public.invoices(organization_id);
CREATE INDEX idx_invoices_account ON public.invoices(account_id);
CREATE INDEX idx_invoices_subscription ON public.invoices(subscription_id);
CREATE INDEX idx_invoices_status ON public.invoices(organization_id, status);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date) WHERE status IN ('pending', 'sent', 'overdue');
CREATE INDEX idx_invoice_items_invoice ON public.invoice_items(invoice_id);

-- Payment ledger indexes
CREATE INDEX idx_payment_ledger_org ON public.payment_ledger(organization_id);
CREATE INDEX idx_payment_ledger_account ON public.payment_ledger(account_id);
CREATE INDEX idx_payment_ledger_invoice ON public.payment_ledger(invoice_id);
CREATE INDEX idx_payment_ledger_date ON public.payment_ledger(transaction_date);

-- Dunning indexes
CREATE INDEX idx_dunning_org ON public.dunning_attempts(organization_id);
CREATE INDEX idx_dunning_invoice ON public.dunning_attempts(invoice_id);
CREATE INDEX idx_dunning_status ON public.dunning_attempts(organization_id, status);
CREATE INDEX idx_dunning_next ON public.dunning_attempts(next_attempt_at) WHERE status IN ('pending', 'sent');

-- Conversation Intelligence indexes
CREATE INDEX idx_call_recordings_org ON public.sales_call_recordings(organization_id);
CREATE INDEX idx_call_recordings_caller ON public.sales_call_recordings(caller_id);
CREATE INDEX idx_call_recordings_opportunity ON public.sales_call_recordings(opportunity_id);
CREATE INDEX idx_call_recordings_status ON public.sales_call_recordings(organization_id, status);
CREATE INDEX idx_call_recordings_date ON public.sales_call_recordings(recorded_at);
CREATE INDEX idx_call_insights_recording ON public.call_insights(recording_id);
CREATE INDEX idx_call_insights_type ON public.call_insights(organization_id, insight_type);
CREATE INDEX idx_coaching_notes_recording ON public.coaching_notes(recording_id);
CREATE INDEX idx_coaching_notes_rep ON public.coaching_notes(rep_id);
CREATE INDEX idx_coaching_notes_coach ON public.coaching_notes(coach_id);

-- ================= RLS =================

ALTER TABLE public.cpq_product_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cpq_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cpq_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cpq_bundle_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cpq_discount_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cpq_price_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dunning_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_call_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_notes ENABLE ROW LEVEL SECURITY;

-- CPQ Policies
CREATE POLICY "CPQ configs: org members can view" ON public.cpq_product_configurations
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "CPQ configs: org members can insert" ON public.cpq_product_configurations
  FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "CPQ configs: org members can update" ON public.cpq_product_configurations
  FOR UPDATE USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "CPQ configs: org members can delete" ON public.cpq_product_configurations
  FOR DELETE USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "CPQ rules: org members can view" ON public.cpq_rules
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "CPQ rules: org members can insert" ON public.cpq_rules
  FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "CPQ rules: org members can update" ON public.cpq_rules
  FOR UPDATE USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "CPQ rules: org members can delete" ON public.cpq_rules
  FOR DELETE USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "CPQ bundles: org members can view" ON public.cpq_bundles
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "CPQ bundles: org members can insert" ON public.cpq_bundles
  FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "CPQ bundles: org members can update" ON public.cpq_bundles
  FOR UPDATE USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "CPQ bundles: org members can delete" ON public.cpq_bundles
  FOR DELETE USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "CPQ bundle items: via bundle org" ON public.cpq_bundle_items
  FOR SELECT USING (bundle_id IN (SELECT id FROM public.cpq_bundles WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));
CREATE POLICY "CPQ bundle items: insert via bundle org" ON public.cpq_bundle_items
  FOR INSERT WITH CHECK (bundle_id IN (SELECT id FROM public.cpq_bundles WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));
CREATE POLICY "CPQ bundle items: update via bundle org" ON public.cpq_bundle_items
  FOR UPDATE USING (bundle_id IN (SELECT id FROM public.cpq_bundles WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));
CREATE POLICY "CPQ bundle items: delete via bundle org" ON public.cpq_bundle_items
  FOR DELETE USING (bundle_id IN (SELECT id FROM public.cpq_bundles WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));

CREATE POLICY "CPQ discount policies: org members can view" ON public.cpq_discount_policies
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "CPQ discount policies: org members can insert" ON public.cpq_discount_policies
  FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "CPQ discount policies: org members can update" ON public.cpq_discount_policies
  FOR UPDATE USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "CPQ discount policies: org members can delete" ON public.cpq_discount_policies
  FOR DELETE USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "CPQ price calcs: org members can view" ON public.cpq_price_calculations
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "CPQ price calcs: org members can insert" ON public.cpq_price_calculations
  FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Subscription Policies
CREATE POLICY "Subscriptions: org members can view" ON public.subscriptions
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Subscriptions: org members can insert" ON public.subscriptions
  FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Subscriptions: org members can update" ON public.subscriptions
  FOR UPDATE USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Subscriptions: org members can delete" ON public.subscriptions
  FOR DELETE USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Subscription items: via sub org" ON public.subscription_items
  FOR SELECT USING (subscription_id IN (SELECT id FROM public.subscriptions WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));
CREATE POLICY "Subscription items: insert via sub org" ON public.subscription_items
  FOR INSERT WITH CHECK (subscription_id IN (SELECT id FROM public.subscriptions WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));
CREATE POLICY "Subscription items: update via sub org" ON public.subscription_items
  FOR UPDATE USING (subscription_id IN (SELECT id FROM public.subscriptions WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));
CREATE POLICY "Subscription items: delete via sub org" ON public.subscription_items
  FOR DELETE USING (subscription_id IN (SELECT id FROM public.subscriptions WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));

-- Invoice Policies
CREATE POLICY "Invoices: org members can view" ON public.invoices
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Invoices: org members can insert" ON public.invoices
  FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Invoices: org members can update" ON public.invoices
  FOR UPDATE USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Invoices: org members can delete" ON public.invoices
  FOR DELETE USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Invoice items: via invoice org" ON public.invoice_items
  FOR SELECT USING (invoice_id IN (SELECT id FROM public.invoices WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));
CREATE POLICY "Invoice items: insert via invoice org" ON public.invoice_items
  FOR INSERT WITH CHECK (invoice_id IN (SELECT id FROM public.invoices WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));
CREATE POLICY "Invoice items: update via invoice org" ON public.invoice_items
  FOR UPDATE USING (invoice_id IN (SELECT id FROM public.invoices WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));
CREATE POLICY "Invoice items: delete via invoice org" ON public.invoice_items
  FOR DELETE USING (invoice_id IN (SELECT id FROM public.invoices WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())));

-- Payment Ledger Policies
CREATE POLICY "Payment ledger: org members can view" ON public.payment_ledger
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Payment ledger: org members can insert" ON public.payment_ledger
  FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Dunning Policies
CREATE POLICY "Dunning: org members can view" ON public.dunning_attempts
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Dunning: org members can insert" ON public.dunning_attempts
  FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Dunning: org members can update" ON public.dunning_attempts
  FOR UPDATE USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Conversation Intelligence Policies
CREATE POLICY "Call recordings: org members can view" ON public.sales_call_recordings
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Call recordings: org members can insert" ON public.sales_call_recordings
  FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Call recordings: org members can update" ON public.sales_call_recordings
  FOR UPDATE USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Call recordings: org members can delete" ON public.sales_call_recordings
  FOR DELETE USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Call insights: org members can view" ON public.call_insights
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Call insights: org members can insert" ON public.call_insights
  FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Call insights: org members can update" ON public.call_insights
  FOR UPDATE USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Coaching notes: org members can view" ON public.coaching_notes
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Coaching notes: org members can insert" ON public.coaching_notes
  FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Coaching notes: org members can update" ON public.coaching_notes
  FOR UPDATE USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Coaching notes: org members can delete" ON public.coaching_notes
  FOR DELETE USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- ================= RPCs =================

-- Generate subscription number
CREATE OR REPLACE FUNCTION public.generate_subscription_number(org_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
  v_year TEXT;
BEGIN
  v_year := to_char(now(), 'YYYY');
  SELECT COUNT(*) + 1 INTO v_count
  FROM public.subscriptions
  WHERE organization_id = org_id AND created_at >= date_trunc('year', now());
  RETURN 'SUB-' || v_year || '-' || lpad(v_count::text, 6, '0');
END;
$$;

-- Generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number(org_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
  v_year TEXT;
BEGIN
  v_year := to_char(now(), 'YYYY');
  SELECT COUNT(*) + 1 INTO v_count
  FROM public.invoices
  WHERE organization_id = org_id AND created_at >= date_trunc('year', now());
  RETURN 'INV-' || v_year || '-' || lpad(v_count::text, 6, '0');
END;
$$;

-- Calculate invoice totals trigger
CREATE OR REPLACE FUNCTION public.calculate_invoice_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_subtotal NUMERIC(15,2);
  v_discount NUMERIC(15,2);
  v_tax NUMERIC(15,2);
  v_invoice_id UUID;
BEGIN
  v_invoice_id := COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  SELECT 
    COALESCE(SUM(quantity * unit_price), 0),
    COALESCE(SUM(discount_amount), 0),
    COALESCE(SUM(tax_amount), 0)
  INTO v_subtotal, v_discount, v_tax
  FROM public.invoice_items WHERE invoice_id = v_invoice_id;
  
  UPDATE public.invoices SET
    subtotal = v_subtotal,
    discount_amount = v_discount,
    tax_amount = v_tax,
    total = v_subtotal - v_discount + v_tax + COALESCE(shipping_amount, 0),
    amount_due = (v_subtotal - v_discount + v_tax + COALESCE(shipping_amount, 0)) - amount_paid,
    updated_at = now()
  WHERE id = v_invoice_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_calculate_invoice_totals
  AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items
  FOR EACH ROW EXECUTE FUNCTION public.calculate_invoice_totals();

-- Track invoice status for overdue detection
CREATE OR REPLACE FUNCTION public.track_invoice_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
      NEW.paid_at := now();
    END IF;
    IF NEW.status = 'void' AND OLD.status != 'void' THEN
      NEW.voided_at := now();
      NEW.voided_by := auth.uid();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_track_invoice_status
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.track_invoice_status_change();

-- Track subscription status changes
CREATE OR REPLACE FUNCTION public.track_subscription_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
      NEW.cancelled_at := COALESCE(NEW.cancelled_at, now());
    END IF;
    IF NEW.status = 'paused' AND OLD.status != 'paused' THEN
      NEW.paused_at := now();
    END IF;
    IF NEW.status = 'active' AND OLD.status = 'paused' THEN
      NEW.paused_at := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_track_subscription_status
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.track_subscription_status_change();

-- Updated at triggers
CREATE TRIGGER trg_cpq_configs_updated_at BEFORE UPDATE ON public.cpq_product_configurations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_cpq_rules_updated_at BEFORE UPDATE ON public.cpq_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_cpq_bundles_updated_at BEFORE UPDATE ON public.cpq_bundles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_subscription_items_updated_at BEFORE UPDATE ON public.subscription_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_dunning_updated_at BEFORE UPDATE ON public.dunning_attempts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_call_recordings_updated_at BEFORE UPDATE ON public.sales_call_recordings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_coaching_notes_updated_at BEFORE UPDATE ON public.coaching_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
