
-- =====================================================
-- MIGRAÇÃO DE SEGURANÇA: CORREÇÃO DE VULNERABILIDADES
-- =====================================================
-- Esta migração corrige os seguintes problemas de segurança:
-- 1. Função calculate_it_priority sem search_path definido
-- 2. Política RLS article_feedback com WITH CHECK (true) permissivo
-- =====================================================

-- =====================================================
-- CORREÇÃO 1: FUNÇÃO calculate_it_priority
-- =====================================================
-- Problema: Função não possui SET search_path, vulnerável a SQL injection via search path
-- Solução: Recriar função com SET search_path TO 'public'
-- =====================================================

CREATE OR REPLACE FUNCTION public.calculate_it_priority(p_impact it_impact, p_urgency it_urgency)
 RETURNS it_priority
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Priority Matrix (ITIL-compliant):
  -- =========================================
  -- Impact/Urgency | Critical | High | Medium | Low
  -- =========================================
  -- Critical       | Critical | Critical | High   | Medium
  -- High           | Critical | High     | High   | Medium
  -- Medium         | High     | Medium   | Medium | Low
  -- Low            | Medium   | Medium   | Low    | Low
  -- =========================================
  
  IF p_impact = 'critical' AND p_urgency = 'critical' THEN RETURN 'critical';
  ELSIF p_impact = 'critical' AND p_urgency = 'high' THEN RETURN 'critical';
  ELSIF p_impact = 'critical' AND p_urgency = 'medium' THEN RETURN 'high';
  ELSIF p_impact = 'critical' AND p_urgency = 'low' THEN RETURN 'medium';
  ELSIF p_impact = 'high' AND p_urgency = 'critical' THEN RETURN 'critical';
  ELSIF p_impact = 'high' AND p_urgency = 'high' THEN RETURN 'high';
  ELSIF p_impact = 'high' AND p_urgency = 'medium' THEN RETURN 'high';
  ELSIF p_impact = 'high' AND p_urgency = 'low' THEN RETURN 'medium';
  ELSIF p_impact = 'medium' AND p_urgency = 'critical' THEN RETURN 'high';
  ELSIF p_impact = 'medium' AND p_urgency = 'high' THEN RETURN 'medium';
  ELSIF p_impact = 'medium' AND p_urgency = 'medium' THEN RETURN 'medium';
  ELSIF p_impact = 'medium' AND p_urgency = 'low' THEN RETURN 'low';
  ELSIF p_impact = 'low' AND p_urgency = 'critical' THEN RETURN 'medium';
  ELSIF p_impact = 'low' AND p_urgency = 'high' THEN RETURN 'medium';
  ELSIF p_impact = 'low' AND p_urgency = 'medium' THEN RETURN 'low';
  ELSE RETURN 'low';
  END IF;
END;
$function$;

-- =====================================================
-- CORREÇÃO 2: POLÍTICA RLS article_feedback
-- =====================================================
-- Problema: Política "Anyone can submit feedback" usa WITH CHECK (true)
--           Isso permite que qualquer pessoa insira feedback em qualquer artigo,
--           incluindo artigos de outras organizações ou artigos não publicados
-- Solução: Restringir para apenas artigos públicos publicados
-- =====================================================

-- Primeiro, remover a política permissiva existente
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.article_feedback;

-- Criar política restritiva para feedback público (visitantes não autenticados)
-- Permite feedback apenas em artigos:
-- 1. Que estejam publicados (status = 'published')
-- 2. Que sejam visíveis publicamente (is_public = true)
CREATE POLICY "Public users can submit feedback on public published articles"
ON public.article_feedback
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.knowledge_articles a 
    WHERE a.id = article_feedback.article_id 
      AND a.status = 'published'
      AND a.is_public = true
  )
);

-- Criar política adicional para usuários autenticados da organização
-- Permite que membros da organização enviem feedback em artigos internos também
CREATE POLICY "Org members can submit feedback on org articles"
ON public.article_feedback
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.knowledge_articles a 
    WHERE a.id = article_feedback.article_id 
      AND a.status = 'published'
      AND public.is_member_of_org(a.organization_id)
  )
);

-- =====================================================
-- DOCUMENTAÇÃO
-- =====================================================

COMMENT ON FUNCTION public.calculate_it_priority IS 'Calcula prioridade IT baseado na matriz ITIL (Impact x Urgency). Função segura com search_path definido.';
