-- =====================================================
-- CORREÇÃO DE SEGURANÇA: ACESSO A DADOS LGPD
-- =====================================================
-- Problema: A tabela lgpd_requests contém dados sensíveis 
-- (CPF, emails, solicitações de privacidade) que deveriam
-- ser acessíveis apenas por admins e managers.
-- =====================================================

-- Remover política SELECT permissiva
DROP POLICY IF EXISTS "Users can view LGPD requests in their org" ON public.lgpd_requests;

-- Criar política restritiva para apenas admins e managers
CREATE POLICY "Only admins and managers can view LGPD requests"
ON public.lgpd_requests
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT p.organization_id 
    FROM public.profiles p 
    WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager')
  )
);

-- Criar política para INSERT restrita
DROP POLICY IF EXISTS "Users can create LGPD requests in their org" ON public.lgpd_requests;

CREATE POLICY "Only admins and managers can create LGPD requests"
ON public.lgpd_requests
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT p.organization_id 
    FROM public.profiles p 
    WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager')
  )
);

-- Criar política para UPDATE restrita
DROP POLICY IF EXISTS "Users can update LGPD requests in their org" ON public.lgpd_requests;

CREATE POLICY "Only admins and managers can update LGPD requests"
ON public.lgpd_requests
FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT p.organization_id 
    FROM public.profiles p 
    WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'manager')
  )
);

COMMENT ON TABLE public.lgpd_requests IS 
'Solicitações de direitos de titulares (LGPD). ACESSO RESTRITO: Apenas admins e managers podem visualizar e gerenciar estas solicitações sensíveis.';