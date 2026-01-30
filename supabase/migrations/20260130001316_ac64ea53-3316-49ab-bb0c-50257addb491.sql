-- =====================================================
-- FASE 9: FIREWARE COMMERCE - MÓDULO COMPLETO (AJUSTADO)
-- E-commerce B2B/B2C integrado ao CRM
-- =====================================================

-- =====================================================
-- PARTE 1: ENUMS (IF NOT EXISTS)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE public.order_status AS ENUM (
    'pending', 'confirmed', 'processing', 'shipped', 
    'delivered', 'cancelled', 'refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM (
    'pending', 'authorized', 'captured', 'failed', 
    'refunded', 'partially_refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.shipment_status AS ENUM (
    'preparing', 'shipped', 'in_transit', 
    'out_for_delivery', 'delivered', 'returned'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.return_status AS ENUM (
    'requested', 'approved', 'rejected', 'received', 
    'refunded', 'completed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.promotion_type AS ENUM (
    'percentage', 'fixed', 'buy_x_get_y', 'free_shipping'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- PARTE 2: TABELAS (IF NOT EXISTS)
-- =====================================================

-- Carrinhos de Compra
CREATE TABLE IF NOT EXISTS public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  session_id TEXT,
  status TEXT DEFAULT 'active',
  subtotal NUMERIC(15,2) DEFAULT 0,
  discount_total NUMERIC(15,2) DEFAULT 0,
  tax_total NUMERIC(15,2) DEFAULT 0,
  shipping_total NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) DEFAULT 0,
  coupon_code TEXT,
  notes TEXT,
  expires_at TIMESTAMPTZ,
  converted_to_order_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Itens do Carrinho
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  sku TEXT,
  quantity INT DEFAULT 1,
  unit_price NUMERIC(15,2) NOT NULL,
  discount_amount NUMERIC(15,2) DEFAULT 0,
  tax_amount NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pedidos
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  status public.order_status DEFAULT 'pending',
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_total NUMERIC(15,2) DEFAULT 0,
  tax_total NUMERIC(15,2) DEFAULT 0,
  shipping_total NUMERIC(15,2) DEFAULT 0,
  grand_total NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'BRL',
  shipping_address JSONB,
  billing_address JSONB,
  payment_method TEXT,
  payment_status public.payment_status DEFAULT 'pending',
  shipping_method TEXT,
  tracking_number TEXT,
  estimated_delivery TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  customer_notes TEXT,
  internal_notes TEXT,
  source TEXT DEFAULT 'web',
  cart_id UUID REFERENCES public.carts(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  cancellation_reason TEXT,
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Itens do Pedido
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  quantity INT NOT NULL,
  unit_price NUMERIC(15,2) NOT NULL,
  discount NUMERIC(15,2) DEFAULT 0,
  tax NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pagamentos
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_number TEXT,
  amount NUMERIC(15,2) NOT NULL,
  method TEXT NOT NULL,
  status public.payment_status DEFAULT 'pending',
  gateway TEXT,
  transaction_id TEXT,
  gateway_response JSONB,
  authorization_code TEXT,
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  refund_amount NUMERIC(15,2),
  refund_reason TEXT,
  card_last_four TEXT,
  card_brand TEXT,
  boleto_url TEXT,
  boleto_barcode TEXT,
  boleto_due_date DATE,
  pix_qr_code TEXT,
  pix_copy_paste TEXT,
  pix_expiration TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Envios/Entregas
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  shipment_number TEXT,
  carrier TEXT,
  carrier_service TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  status public.shipment_status DEFAULT 'preparing',
  estimated_delivery TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  weight NUMERIC(10,3),
  weight_unit TEXT DEFAULT 'kg',
  dimensions JSONB,
  cost NUMERIC(15,2),
  insurance_value NUMERIC(15,2),
  shipping_address JSONB,
  recipient_name TEXT,
  recipient_document TEXT,
  items JSONB DEFAULT '[]',
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Devoluções/RMA
CREATE TABLE IF NOT EXISTS public.returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  return_number TEXT NOT NULL,
  status public.return_status DEFAULT 'requested',
  type TEXT DEFAULT 'return',
  reason TEXT NOT NULL,
  reason_category TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  refund_amount NUMERIC(15,2),
  refund_method TEXT,
  refunded_at TIMESTAMPTZ,
  return_label_url TEXT,
  return_tracking_number TEXT,
  return_carrier TEXT,
  received_at TIMESTAMPTZ,
  inspected_at TIMESTAMPTZ,
  inspection_notes TEXT,
  exchange_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Promoções e Cupons
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  code TEXT,
  type public.promotion_type NOT NULL,
  value NUMERIC(15,2),
  min_purchase NUMERIC(15,2),
  max_discount NUMERIC(15,2),
  min_items INT,
  buy_quantity INT,
  get_quantity INT,
  get_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  usage_limit INT,
  usage_limit_per_customer INT,
  used_count INT DEFAULT 0,
  applies_to TEXT DEFAULT 'all',
  applies_to_ids UUID[],
  exclude_ids UUID[],
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  is_automatic BOOLEAN DEFAULT false,
  can_combine BOOLEAN DEFAULT false,
  first_purchase_only BOOLEAN DEFAULT false,
  new_customers_only BOOLEAN DEFAULT false,
  specific_accounts UUID[],
  specific_segments UUID[],
  priority INT DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Histórico de uso de promoções
CREATE TABLE IF NOT EXISTS public.promotion_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  discount_amount NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Itens da Tabela de Preço (se price_lists já existe)
CREATE TABLE IF NOT EXISTS public.price_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_list_id UUID NOT NULL REFERENCES public.price_lists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  price NUMERIC(15,2) NOT NULL,
  min_quantity INT DEFAULT 1,
  max_quantity INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Histórico de Status do Pedido
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  old_status public.order_status,
  new_status public.order_status NOT NULL,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- PARTE 3: ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_carts_organization ON public.carts(organization_id);
CREATE INDEX IF NOT EXISTS idx_carts_account ON public.carts(account_id);
CREATE INDEX IF NOT EXISTS idx_carts_status ON public.carts(status);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_orders_organization ON public.orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_orders_account ON public.orders(account_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_organization ON public.payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_organization ON public.shipments(organization_id);
CREATE INDEX IF NOT EXISTS idx_shipments_order ON public.shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_organization ON public.returns(organization_id);
CREATE INDEX IF NOT EXISTS idx_returns_order ON public.returns(order_id);
CREATE INDEX IF NOT EXISTS idx_promotions_organization ON public.promotions(organization_id);
CREATE INDEX IF NOT EXISTS idx_promotions_code ON public.promotions(code);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON public.order_status_history(order_id);

-- =====================================================
-- PARTE 4: ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Carts Policies
DROP POLICY IF EXISTS "Users can view carts from their organization" ON public.carts;
CREATE POLICY "Users can view carts from their organization"
  ON public.carts FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());

DROP POLICY IF EXISTS "Users can create carts in their organization" ON public.carts;
CREATE POLICY "Users can create carts in their organization"
  ON public.carts FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

DROP POLICY IF EXISTS "Users can update carts in their organization" ON public.carts;
CREATE POLICY "Users can update carts in their organization"
  ON public.carts FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_org_id());

DROP POLICY IF EXISTS "Users can delete carts in their organization" ON public.carts;
CREATE POLICY "Users can delete carts in their organization"
  ON public.carts FOR DELETE TO authenticated
  USING (organization_id = public.get_user_org_id());

-- Cart Items Policies
DROP POLICY IF EXISTS "Users can manage cart items" ON public.cart_items;
CREATE POLICY "Users can manage cart items"
  ON public.cart_items FOR ALL TO authenticated
  USING (cart_id IN (SELECT id FROM public.carts WHERE organization_id = public.get_user_org_id()));

-- Orders Policies
DROP POLICY IF EXISTS "Users can view orders from their organization" ON public.orders;
CREATE POLICY "Users can view orders from their organization"
  ON public.orders FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());

DROP POLICY IF EXISTS "Users can create orders in their organization" ON public.orders;
CREATE POLICY "Users can create orders in their organization"
  ON public.orders FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

DROP POLICY IF EXISTS "Users can update orders in their organization" ON public.orders;
CREATE POLICY "Users can update orders in their organization"
  ON public.orders FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_org_id());

DROP POLICY IF EXISTS "Users can delete orders in their organization" ON public.orders;
CREATE POLICY "Users can delete orders in their organization"
  ON public.orders FOR DELETE TO authenticated
  USING (organization_id = public.get_user_org_id());

-- Order Items Policies
DROP POLICY IF EXISTS "Users can manage order items" ON public.order_items;
CREATE POLICY "Users can manage order items"
  ON public.order_items FOR ALL TO authenticated
  USING (order_id IN (SELECT id FROM public.orders WHERE organization_id = public.get_user_org_id()));

-- Payments Policies
DROP POLICY IF EXISTS "Users can view payments from their organization" ON public.payments;
CREATE POLICY "Users can view payments from their organization"
  ON public.payments FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());

DROP POLICY IF EXISTS "Users can create payments in their organization" ON public.payments;
CREATE POLICY "Users can create payments in their organization"
  ON public.payments FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

DROP POLICY IF EXISTS "Users can update payments in their organization" ON public.payments;
CREATE POLICY "Users can update payments in their organization"
  ON public.payments FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_org_id());

-- Shipments Policies
DROP POLICY IF EXISTS "Users can view shipments from their organization" ON public.shipments;
CREATE POLICY "Users can view shipments from their organization"
  ON public.shipments FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());

DROP POLICY IF EXISTS "Users can create shipments in their organization" ON public.shipments;
CREATE POLICY "Users can create shipments in their organization"
  ON public.shipments FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

DROP POLICY IF EXISTS "Users can update shipments in their organization" ON public.shipments;
CREATE POLICY "Users can update shipments in their organization"
  ON public.shipments FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_org_id());

-- Returns Policies
DROP POLICY IF EXISTS "Users can view returns from their organization" ON public.returns;
CREATE POLICY "Users can view returns from their organization"
  ON public.returns FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());

DROP POLICY IF EXISTS "Users can create returns in their organization" ON public.returns;
CREATE POLICY "Users can create returns in their organization"
  ON public.returns FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

DROP POLICY IF EXISTS "Users can update returns in their organization" ON public.returns;
CREATE POLICY "Users can update returns in their organization"
  ON public.returns FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_org_id());

-- Promotions Policies
DROP POLICY IF EXISTS "Users can view promotions from their organization" ON public.promotions;
CREATE POLICY "Users can view promotions from their organization"
  ON public.promotions FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());

DROP POLICY IF EXISTS "Users can create promotions in their organization" ON public.promotions;
CREATE POLICY "Users can create promotions in their organization"
  ON public.promotions FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

DROP POLICY IF EXISTS "Users can update promotions in their organization" ON public.promotions;
CREATE POLICY "Users can update promotions in their organization"
  ON public.promotions FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_org_id());

DROP POLICY IF EXISTS "Users can delete promotions in their organization" ON public.promotions;
CREATE POLICY "Users can delete promotions in their organization"
  ON public.promotions FOR DELETE TO authenticated
  USING (organization_id = public.get_user_org_id());

-- Promotion Usage Policies
DROP POLICY IF EXISTS "Users can view promotion usage" ON public.promotion_usage;
CREATE POLICY "Users can view promotion usage"
  ON public.promotion_usage FOR SELECT TO authenticated
  USING (promotion_id IN (SELECT id FROM public.promotions WHERE organization_id = public.get_user_org_id()));

DROP POLICY IF EXISTS "Users can create promotion usage" ON public.promotion_usage;
CREATE POLICY "Users can create promotion usage"
  ON public.promotion_usage FOR INSERT TO authenticated
  WITH CHECK (promotion_id IN (SELECT id FROM public.promotions WHERE organization_id = public.get_user_org_id()));

-- Price List Items Policies
DROP POLICY IF EXISTS "Users can manage price list items" ON public.price_list_items;
CREATE POLICY "Users can manage price list items"
  ON public.price_list_items FOR ALL TO authenticated
  USING (price_list_id IN (SELECT id FROM public.price_lists WHERE organization_id = public.get_user_org_id()));

-- Order Status History Policies
DROP POLICY IF EXISTS "Users can view order status history" ON public.order_status_history;
CREATE POLICY "Users can view order status history"
  ON public.order_status_history FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM public.orders WHERE organization_id = public.get_user_org_id()));

DROP POLICY IF EXISTS "Users can create order status history" ON public.order_status_history;
CREATE POLICY "Users can create order status history"
  ON public.order_status_history FOR INSERT TO authenticated
  WITH CHECK (order_id IN (SELECT id FROM public.orders WHERE organization_id = public.get_user_org_id()));

-- =====================================================
-- PARTE 5: FUNÇÕES SQL
-- =====================================================

-- Gerar número do pedido
CREATE OR REPLACE FUNCTION public.generate_order_number(org_id UUID)
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
  FROM public.orders
  WHERE organization_id = org_id AND created_at >= date_trunc('year', now());
  RETURN 'ORD-' || v_year || '-' || lpad(v_count::text, 6, '0');
END;
$$;

-- Gerar número da devolução
CREATE OR REPLACE FUNCTION public.generate_return_number(org_id UUID)
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
  FROM public.returns
  WHERE organization_id = org_id AND created_at >= date_trunc('year', now());
  RETURN 'RMA-' || v_year || '-' || lpad(v_count::text, 5, '0');
END;
$$;

-- Calcular totais do carrinho
CREATE OR REPLACE FUNCTION public.calculate_cart_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subtotal NUMERIC(15,2);
  v_discount NUMERIC(15,2);
  v_tax NUMERIC(15,2);
  v_cart_id UUID;
BEGIN
  v_cart_id := COALESCE(NEW.cart_id, OLD.cart_id);
  
  SELECT 
    COALESCE(SUM(unit_price * quantity), 0),
    COALESCE(SUM(discount_amount), 0),
    COALESCE(SUM(tax_amount), 0)
  INTO v_subtotal, v_discount, v_tax
  FROM public.cart_items WHERE cart_id = v_cart_id;
  
  UPDATE public.carts SET
    subtotal = v_subtotal,
    discount_total = v_discount,
    tax_total = v_tax,
    total = v_subtotal - v_discount + v_tax + COALESCE(shipping_total, 0),
    updated_at = now()
  WHERE id = v_cart_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_calculate_cart_totals ON public.cart_items;
CREATE TRIGGER trigger_calculate_cart_totals
AFTER INSERT OR UPDATE OR DELETE ON public.cart_items
FOR EACH ROW EXECUTE FUNCTION public.calculate_cart_totals();

-- Calcular totais do pedido
CREATE OR REPLACE FUNCTION public.calculate_order_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subtotal NUMERIC(15,2);
  v_discount NUMERIC(15,2);
  v_tax NUMERIC(15,2);
  v_shipping NUMERIC(15,2);
  v_order_id UUID;
BEGIN
  v_order_id := COALESCE(NEW.order_id, OLD.order_id);
  
  SELECT 
    COALESCE(SUM(unit_price * quantity), 0),
    COALESCE(SUM(discount), 0),
    COALESCE(SUM(tax), 0)
  INTO v_subtotal, v_discount, v_tax
  FROM public.order_items WHERE order_id = v_order_id;
  
  SELECT COALESCE(shipping_total, 0) INTO v_shipping
  FROM public.orders WHERE id = v_order_id;
  
  UPDATE public.orders SET
    subtotal = v_subtotal,
    discount_total = v_discount,
    tax_total = v_tax,
    grand_total = v_subtotal - v_discount + v_tax + v_shipping,
    updated_at = now()
  WHERE id = v_order_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_calculate_order_totals ON public.order_items;
CREATE TRIGGER trigger_calculate_order_totals
AFTER INSERT OR UPDATE OR DELETE ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.calculate_order_totals();

-- Rastrear mudança de status do pedido
CREATE OR REPLACE FUNCTION public.track_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_history (order_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
    
    IF NEW.status = 'shipped' AND OLD.status != 'shipped' THEN
      NEW.shipped_at := now();
    END IF;
    IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
      NEW.delivered_at := now();
    END IF;
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
      NEW.cancelled_at := now();
      NEW.cancelled_by := auth.uid();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_track_order_status ON public.orders;
CREATE TRIGGER trigger_track_order_status
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.track_order_status_change();

-- Atualizar contador de uso de promoção
CREATE OR REPLACE FUNCTION public.update_promotion_usage_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.promotions SET used_count = used_count + 1 WHERE id = NEW.promotion_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_promotion_usage ON public.promotion_usage;
CREATE TRIGGER trigger_update_promotion_usage
AFTER INSERT ON public.promotion_usage
FOR EACH ROW EXECUTE FUNCTION public.update_promotion_usage_count();

-- Triggers de updated_at
DROP TRIGGER IF EXISTS set_updated_at_carts ON public.carts;
CREATE TRIGGER set_updated_at_carts BEFORE UPDATE ON public.carts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_orders ON public.orders;
CREATE TRIGGER set_updated_at_orders BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_payments ON public.payments;
CREATE TRIGGER set_updated_at_payments BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_shipments ON public.shipments;
CREATE TRIGGER set_updated_at_shipments BEFORE UPDATE ON public.shipments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_returns ON public.returns;
CREATE TRIGGER set_updated_at_returns BEFORE UPDATE ON public.returns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_promotions ON public.promotions;
CREATE TRIGGER set_updated_at_promotions BEFORE UPDATE ON public.promotions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_price_list_items ON public.price_list_items;
CREATE TRIGGER set_updated_at_price_list_items BEFORE UPDATE ON public.price_list_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();