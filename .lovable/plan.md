
# Plano de Correção: Fluxo de Ativação de Módulos

## Diagnostico Completo da Cadeia de Falhas

A analise revelou **4 problemas encadeados** que impedem o funcionamento da tela de Modulos:

### Causa Raiz 1: Onboarding Incompleto
O trigger `on_auth_user_created` (disparado ao criar usuario) apenas insere `id` e `email` na tabela `profiles`. Ele **NAO**:
- Cria uma organizacao na tabela `organizations`
- Associa o usuario a essa organizacao (`profiles.organization_id` fica `NULL`)
- Atribui a role `admin` ao primeiro usuario

### Causa Raiz 2: Role Insuficiente
O usuario de teste possui `role: 'user'` tanto em `profiles` quanto em `user_roles`. As politicas RLS da tabela `org_modules` exigem explicitamente `user_has_role(auth.uid(), 'admin')` para INSERT, UPDATE e DELETE.

### Causa Raiz 3: Violacao de RLS
A funcao `is_member_of_org(organization_id)` verifica se o `profiles.organization_id` do usuario corresponde ao parametro. Como o `organization_id` e `NULL`, a verificacao sempre falha, bloqueando qualquer operacao.

### Causa Raiz 4: organization_id NULL no INSERT
O componente `PlatformModules.tsx` envia `organization_id: null` (obtido de `profile?.organization_id`) na operacao de INSERT na tabela `org_modules`, que possui constraint `NOT NULL` nessa coluna.

```text
Fluxo do Erro:
Usuario clica "Ativar Modulo"
    |
    v
PlatformModules envia INSERT com organization_id: null
    |
    v
RLS Policy: is_member_of_org(null) => FALSE
    |
    v
RLS Policy: user_has_role(uid, 'admin') => FALSE
    |
    v
Erro 42501: "new row violates row-level security policy"
```

---

## Plano de Implementacao

### Etapa 1: Migrar Trigger de Onboarding Automatico (SQL)

Refatorar o trigger `handle_new_user` para:
1. Detectar o dominio do email do novo usuario
2. Buscar se ja existe uma organizacao com esse dominio
3. Se existir: associar o usuario a ela com role `user`
4. Se NAO existir: criar nova organizacao, associar o usuario como `admin`, e provisionar todos os 15 modulos com `enabled: true` e `plan_tier: 'free'`
5. Inserir a role correspondente na tabela `user_roles`

Essa logica garante que **todo novo usuario** tenha uma organizacao e uma role adequada desde o momento do cadastro.

### Etapa 2: Corrigir Dados do Usuario Existente (SQL)

Para o usuario de teste (`teste@fireware.com`) que ja existe sem organizacao:
1. Criar organizacao "Fireware" com dominio `fireware.com`
2. Atualizar `profiles.organization_id` para apontar para essa organizacao
3. Atualizar `profiles.role` para `admin`
4. Atualizar `user_roles.role` para `admin`

### Etapa 3: Refatorar PlatformModules.tsx (Frontend)

Melhorias no componente:
1. Adicionar verificacao de `organization_id` antes de permitir operacoes
2. Exibir mensagem orientativa caso o usuario nao tenha organizacao associada
3. Adicionar tratamento de erro mais detalhado com mensagens contextuais (ex: diferenciar RLS error de validation error)
4. Corrigir os warnings de `forwardRef` no componente e no Badge

### Etapa 4: Proteção da Pagina Admin (Frontend)

1. Adicionar verificacao de role `admin` na pagina de modulos
2. Exibir mensagem de acesso negado para usuarios nao-admin
3. Verificar se `organization_id` esta disponivel antes de habilitar controles

---

## Detalhes Tecnicos

### SQL Migration 1 - Trigger `handle_new_user` refatorado

A nova funcao `handle_new_user()` implementara:
- Declaracao de variaveis para `_org_id`, `_email_domain`, `_existing_org_id`, `_user_role`
- Extracao do dominio do email com `split_part(NEW.email, '@', 2)`
- SELECT para verificar organizacao existente pelo dominio
- Logica condicional com IF/ELSE para criar ou reutilizar organizacao
- INSERT na `profiles` com `organization_id`, `first_name`, `last_name`
- INSERT na `user_roles` com a role apropriada
- Loop INSERT nos `org_modules` com os 15 module_keys quando criar nova org

### SQL Migration 2 - Correcao de dados existentes

Script para:
- Criar organizacao para o usuario atual
- Vincular usuario a organizacao
- Promover usuario a admin
- Provisionar modulos iniciais

### Frontend - PlatformModules.tsx

Alteracoes:
- Importar `useAuth` e verificar `profile.role` e `profile.organization_id`
- Estado de "sem organizacao" com UI informativa
- Mensagens de erro contextuais no `onError` da mutation
- Desabilitar controles quando `organizationId` for null

### Arquivos Impactados

| Arquivo | Tipo de Alteracao |
|---------|-------------------|
| SQL Migration (trigger) | Refatorar `handle_new_user()` |
| SQL Migration (dados) | Corrigir usuario existente |
| `src/pages/admin/PlatformModules.tsx` | Validacoes e UX melhorada |
