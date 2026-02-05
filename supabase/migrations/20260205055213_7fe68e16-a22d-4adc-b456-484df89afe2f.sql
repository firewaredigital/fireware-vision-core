-- =====================================================
-- CORREÇÃO: VIEW SECURITY INVOKER
-- =====================================================
-- A VIEW customer_portal_users_safe foi criada como SECURITY DEFINER
-- por padrão no PostgreSQL. Precisamos recriá-la explicitamente
-- como SECURITY INVOKER para que use as permissões do usuário
-- que faz a consulta (herdando RLS da tabela base).
-- =====================================================

-- Recriar VIEW com SECURITY INVOKER explícito
CREATE OR REPLACE VIEW public.customer_portal_users_safe 
WITH (security_invoker = true)
AS
SELECT
  id,
  organization_id,
  contact_id,
  account_id,
  email,
  first_name,
  last_name,
  phone,
  avatar_url,
  status,
  email_verified,
  email_verified_at,
  ticket_visibility,
  can_create_tickets,
  can_view_knowledge_base,
  can_view_contracts,
  can_view_invoices,
  last_login_at,
  login_count,
  notification_preferences,
  language,
  timezone,
  created_at,
  updated_at,
  created_by
FROM public.customer_portal_users;

-- Atualizar comentário
COMMENT ON VIEW public.customer_portal_users_safe IS 
'VIEW segura (SECURITY INVOKER) que expõe dados de usuários do portal sem campos sensíveis. Herda RLS da tabela base para controle de acesso adequado.';