
-- ============================================================
-- ETAPA 1: Refatorar trigger handle_new_user para onboarding completo
-- ============================================================

-- Substituir a função handle_new_user por versão completa
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _org_id uuid;
  _email_domain text;
  _existing_org_id uuid;
  _user_role public.user_role;
  _first_name text;
  _last_name text;
  _module_keys public.module_key[] := ARRAY[
    'sales', 'service', 'contact_center', 'marketing', 'commerce',
    'billing', 'cpq', 'itsm', 'data_hub', 'automations',
    'integrations', 'ai_agents', 'analytics', 'portals', 'governance'
  ]::public.module_key[];
  _mk public.module_key;
BEGIN
  -- Extrair domínio do email
  _email_domain := split_part(NEW.email, '@', 2);
  
  -- Extrair nome do metadata do signup (se disponível)
  _first_name := COALESCE(
    NEW.raw_user_meta_data->>'first_name',
    split_part(split_part(NEW.email, '@', 1), '.', 1)
  );
  _last_name := COALESCE(
    NEW.raw_user_meta_data->>'last_name',
    NULL
  );

  -- Verificar se já existe organização com este domínio
  SELECT id INTO _existing_org_id
  FROM public.organizations
  WHERE domain = _email_domain
  LIMIT 1;

  IF _existing_org_id IS NOT NULL THEN
    -- Organização já existe: associar usuário como 'user'
    _org_id := _existing_org_id;
    _user_role := 'user';
  ELSE
    -- Criar nova organização para este domínio
    INSERT INTO public.organizations (name, domain)
    VALUES (
      initcap(split_part(_email_domain, '.', 1)),
      _email_domain
    )
    RETURNING id INTO _org_id;
    
    -- Primeiro usuário da org é admin
    _user_role := 'admin';

    -- Provisionar todos os 15 módulos com enabled=true e plan_tier='free'
    FOREACH _mk IN ARRAY _module_keys LOOP
      INSERT INTO public.org_modules (
        organization_id, module_key, enabled, plan_tier, 
        limits_json, usage_json, created_by, updated_by
      ) VALUES (
        _org_id, _mk, true, 'free',
        '{}'::jsonb, '{}'::jsonb, NEW.id, NEW.id
      );
    END LOOP;
  END IF;

  -- Inserir perfil com organização vinculada
  INSERT INTO public.profiles (id, email, organization_id, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    _org_id,
    _first_name,
    _last_name,
    _user_role
  );

  -- Inserir role na tabela dedicada user_roles
  INSERT INTO public.user_roles (user_id, role, granted_by)
  VALUES (NEW.id, _user_role, NEW.id);

  RETURN NEW;
END;
$$;
