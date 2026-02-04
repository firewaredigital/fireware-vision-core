
# Plano Completo de Analise, Teste e Melhoria - Fireware CRM

---

## SUMARIO EXECUTIVO

Este plano documenta uma analise exaustiva de todas as funcionalidades do Fireware CRM, identificando erros atuais, problemas de seguranca, inconsistencias de UI/UX, textos ainda em ingles, e oportunidades de melhoria. O plano esta organizado em 10 fases de implementacao.

---

## PARTE 1: PROBLEMAS IDENTIFICADOS NA ANALISE

### 1.1 Erros de Console Ativos

**Erro Critico: Componente Knowledge.tsx**
```
Warning: Function components cannot be given refs. 
Check the render method of `Knowledge`.
```
- **Causa**: O componente `Select` do Radix UI esta sendo usado dentro de uma `TabsContent` sem usar `React.forwardRef`
- **Localizacao**: `src/pages/Knowledge.tsx` linhas 294-319
- **Solucao**: Envolver o componente `Select` com wrapper ou verificar se o componente pai esta passando refs incorretamente

### 1.2 Problemas de Seguranca (Supabase Linter)

| ID | Nivel | Problema | Solucao |
|----|-------|----------|---------|
| 1 | WARN | Function Search Path Mutable | Adicionar `SET search_path TO 'public'` em funcoes que nao possuem |
| 2 | WARN | RLS Policy Always True | Revisar politicas com `USING (true)` em operacoes UPDATE/DELETE/INSERT |
| 3 | WARN | Leaked Password Protection Disabled | Habilitar protecao de senhas vazadas no Auth |

### 1.3 Textos em Ingles Remanescentes (Traducao Incompleta)

**Arquivos com traducao pendente identificados:**

**Formularios (Forms):**
- `LeadForm.tsx` - Linhas 33-51, 104-139, 223-568 (labels, mensagens, validation)
- `LeadDetail.tsx` - Linhas 107-137, 165-170, 206-230, 251-537 (buttons, titles, tabs)
- `LeadConversionWizard.tsx` - Linhas 87-106, 147, 209-216, 359-372, 401-491 (schema, messages)
- `Cadences.tsx` - Linhas 60-65, 237-248, 441-500 (labels, toasts, headers)
- `Forecast.tsx` - Linhas 265, 296-303, 329-356, 432-458 (headers, labels)
- Todos os arquivos `*Form.tsx` e `*Detail.tsx` restantes

**Dashboard:**
- `Dashboard.tsx` - Linhas 61-68, 148, 205-212 (stageLabels ainda em ingles, formatCurrency em USD)

### 1.4 Inconsistencias de Formato de Moeda

| Arquivo | Linha | Problema | Solucao |
|---------|-------|----------|---------|
| `Dashboard.tsx` | 206-211 | Usa `en-US` e `USD` | Alterar para `pt-BR` e `BRL` |
| `Forecast.tsx` | 296-303 | Usa `en-US` e `USD` | Alterar para `pt-BR` e `BRL` |
| `Cadences.tsx` | N/A | Sem formatacao | Adicionar formatador BRL |

---

## PARTE 2: PLANO DE TESTES POR MODULO

### 2.1 Modulo de Autenticacao

**Cenarios de Teste:**
1. Login com credenciais validas
2. Login com credenciais invalidas
3. Cadastro de novo usuario
4. Cadastro com email duplicado
5. Validacao de formulario (email invalido, senha curta)
6. Redirecionamento pos-login para Dashboard
7. Logout e invalidacao de sessao
8. Persistencia de sessao (refresh de pagina)
9. Protecao de rotas (acesso sem autenticacao)

**Melhorias Necessarias:**
- Adicionar indicador de forca de senha
- Implementar "Esqueci minha senha"
- Adicionar rate limiting para tentativas de login

### 2.2 Modulo de Leads

**Cenarios de Teste:**
1. Listagem de leads com filtros (status, busca)
2. Criacao de novo lead (todos os campos)
3. Edicao de lead existente
4. Exclusao de lead com confirmacao
5. Conversao de lead (wizard completo)
   - Criar nova conta
   - Vincular a conta existente
   - Criar contato
   - Criar oportunidade (opcional)
6. Visualizacao de detalhes
7. Importacao/Exportacao CSV
8. Timeline de atividades

**Problemas Identificados:**
- `LeadForm.tsx`: Labels em ingles (linhas 33-51, 223-568)
- `LeadDetail.tsx`: Textos em ingles (linhas 165-170, 206-230)
- `LeadConversionWizard.tsx`: Schema validation messages em ingles (linhas 87-106)

### 2.3 Modulo de Contas (Accounts)

**Cenarios de Teste:**
1. CRUD completo de contas
2. Busca e filtros
3. Visualizacao de Customer 360
4. Historico de atividades
5. Relacionamento com contatos
6. Relacionamento com oportunidades

**Melhorias Necessarias:**
- Health Score automatico
- Alertas de atividade parada

### 2.4 Modulo de Contatos

**Cenarios de Teste:**
1. CRUD completo
2. Vinculacao com conta
3. Vinculacao com oportunidades
4. Historico de comunicacao

### 2.5 Modulo de Oportunidades

**Cenarios de Teste:**
1. Criacao de oportunidade
2. Movimentacao entre estagios (Kanban drag-and-drop)
3. Atualizacao de valores e probabilidade
4. Historico de mudancas de estagio
5. Alertas de deals parados (StaleDealAlerts)
6. Vinculacao com contatos

**Problemas Identificados:**
- `Opportunities.tsx`: stageLabels ainda em ingles no codigo (mapeamento necessario na UI)

### 2.6 Modulo de Propostas (Quotes)

**Cenarios de Teste:**
1. Criacao de proposta com itens
2. Calculo automatico de totais
3. Aplicacao de descontos
4. Transicoes de status (Draft -> Sent -> Accepted)
5. Duplicacao de proposta
6. Exportacao PDF (a implementar)

### 2.7 Modulo de Produtos

**Cenarios de Teste:**
1. CRUD de produtos
2. Gestao de categorias
3. Ativacao/Desativacao
4. Calculo de margem
5. Importacao/Exportacao

### 2.8 Modulo de Contratos

**Cenarios de Teste:**
1. Criacao de contrato
2. Fluxo de aprovacao
3. Alertas de expiracao
4. Renovacao automatica

### 2.9 Modulo de Service (Tickets)

**Cenarios de Teste:**
1. Criacao de ticket
2. Atribuicao de agente
3. Troca de status com validacao de transicoes
4. Calculo de SLA (first response, resolution)
5. Envio de mensagens (resposta publica e nota interna)
6. Uso de respostas rapidas (canned responses)
7. Escalonamento
8. Portal do cliente (login, criacao de ticket, visualizacao)

**Problemas Identificados:**
- Componente Knowledge.tsx com erro de ref (ver erro de console)

### 2.10 Modulo de Marketing

**Cenarios de Teste:**
1. Criacao de campanha
2. Segmentacao de audiencia
3. Journey Builder (fluxo visual)
4. Metricas de campanha
5. Templates de email

### 2.11 Modulo de Comercio (Commerce)

**Cenarios de Teste:**
1. Criacao de pedido
2. Fluxo de status do pedido
3. Gestao de devolucoes
4. Promocoes e cupons

### 2.12 Modulo IT/ITSM

**Cenarios de Teste:**
1. Gestao de incidentes
2. Gestao de mudancas
3. CMDB (itens de configuracao)
4. Assets (ativos de TI)
5. Prioridade automatica (impact x urgency)

### 2.13 Modulo de Dados Avancados

**Cenarios de Teste:**
1. Deteccao de duplicatas
2. Merge wizard
3. Full Funnel Dashboard
4. Attribution Dashboard

### 2.14 Modulo de Configuracoes

**Cenarios de Teste:**
1. Estagios do pipeline (drag-and-drop)
2. Motivos de ganho/perda
3. Fontes de lead
4. Gestao de equipe

**Problemas Identificados:**
- Textos em ingles remanescentes

### 2.15 Modulo de Relatorios

**Cenarios de Teste:**
1. Selecao de periodo
2. Exportacao de dados
3. Visualizacao de graficos

---

## PARTE 3: FASES DE IMPLEMENTACAO

### Fase 1: Correcao de Erros Criticos (Prioridade Alta)

**1.1 Corrigir erro de ref no Knowledge.tsx**
- Investigar uso de `Select` dentro de `TabsContent`
- Adicionar wrapper ou corrigir estrutura de componentes

**1.2 Corrigir problemas de seguranca do Supabase**
- Revisar funcoes sem `search_path` definido
- Auditar politicas RLS com `USING (true)`
- Habilitar leaked password protection

### Fase 2: Traducao Completa - Forms e Details (Prioridade Alta)

**2.1 LeadForm.tsx**
- Traduzir schema de validacao (linhas 33-51)
- Traduzir labels dos campos (linhas 223-568)
- Traduzir mensagens de toast (linhas 104-139)

**2.2 LeadDetail.tsx**
- Traduzir botoes e dialogos (linhas 206-230)
- Traduzir tabs e titles (linhas 242-246, 251-537)

**2.3 LeadConversionWizard.tsx**
- Traduzir schema de validacao
- Traduzir labels de formulario
- Traduzir mensagens de sucesso/erro

**2.4 Demais formularios e detalhes**
- AccountForm.tsx / AccountDetail.tsx
- ContactForm.tsx / ContactDetail.tsx
- OpportunityForm.tsx / OpportunityDetail.tsx
- QuoteForm.tsx / QuoteDetail.tsx
- ProductForm.tsx / ProductDetail.tsx
- ContractForm.tsx / ContractDetail.tsx
- TicketForm.tsx
- ArticleForm.tsx / ArticleDetail.tsx
- CampaignForm.tsx
- SegmentForm.tsx
- OrderForm.tsx / OrderDetail.tsx
- PromotionForm.tsx
- ITIncidentForm.tsx / ITIncidentDetail.tsx
- ITChangeForm.tsx
- LGPDRequestForm.tsx

### Fase 3: Traducao de Modulos Especializados (Prioridade Media)

**3.1 Cadences.tsx**
- Traduzir stepTypeConfig (linha 60-65)
- Traduzir mensagens de mutacao (linhas 237-248)
- Traduzir headers e labels

**3.2 Forecast.tsx**
- Traduzir headers e labels
- Corrigir formatCurrency para BRL

**3.3 Demais modulos**
- AuditLogs.tsx
- Automations.tsx
- WorkflowBuilder.tsx
- JourneyBuilder.tsx
- CustomerSuccess.tsx
- Governance.tsx
- Duplicates.tsx
- MergeWizard.tsx
- FullFunnel.tsx
- AttributionDashboard.tsx
- Customer360.tsx

### Fase 4: Correcao de Formato de Moeda (Prioridade Media)

**4.1 Dashboard.tsx**
- Alterar formatCurrency de USD para BRL

**4.2 Forecast.tsx**
- Alterar formatCurrency de USD para BRL

**4.3 Todos os demais locais**
- Padronizar para `pt-BR` e `BRL` em toda aplicacao

### Fase 5: Componentes Compartilhados (Prioridade Media)

**5.1 Widgets**
- NotesWidget.tsx
- AttachmentsWidget.tsx
- ActivitiesWidget.tsx
- ApprovalRequestDialog.tsx
- CSVImportDialog.tsx
- StaleDealAlerts.tsx
- LeadRoutingRules.tsx

### Fase 6: Portal do Cliente (Prioridade Media)

**6.1 Revisao completa do portal**
- PortalLogin.tsx
- PortalTickets.tsx
- PortalTicketDetail.tsx
- PortalNewTicket.tsx
- PortalKnowledge.tsx

### Fase 7: Melhorias de Seguranca (Prioridade Alta)

**7.1 Revisar RLS Policies**
- Auditar todas as tabelas com RLS
- Corrigir politicas permissivas
- Adicionar politicas faltantes

**7.2 Funcoes SQL**
- Adicionar `SET search_path TO 'public'` onde faltante
- Revisar funcoes com `SECURITY DEFINER`

### Fase 8: Melhorias de UX (Prioridade Baixa)

**8.1 Indicadores de carregamento**
- Padronizar skeleton loaders
- Adicionar feedback visual em todas as acoes

**8.2 Tratamento de erros**
- Padronizar mensagens de erro
- Adicionar try-catch onde faltante

**8.3 Estados vazios**
- Padronizar empty states
- Adicionar ilustracoes e CTAs

### Fase 9: Testes Automatizados (Prioridade Media)

**9.1 Testes unitarios**
- Hooks (useAuth, useDebounce, etc.)
- Funcoes utilitarias

**9.2 Testes de integracao**
- Fluxos de autenticacao
- CRUD de entidades principais

### Fase 10: Documentacao e Finalizacao (Prioridade Baixa)

**10.1 Revisao final**
- Verificar consistencia de traducoes
- Verificar formatacao de datas e numeros
- Verificar acessibilidade

**10.2 Documentacao**
- Atualizar README
- Documentar APIs e fluxos

---

## PARTE 4: DETALHAMENTO TECNICO

### 4.1 Arquivos a Modificar por Fase

**Fase 1 - Erros Criticos:**
```text
src/pages/Knowledge.tsx
supabase/migrations/ (nova migration para RLS)
```

**Fase 2 - Forms e Details:**
```text
src/pages/LeadForm.tsx
src/pages/LeadDetail.tsx
src/components/LeadConversionWizard.tsx
src/pages/AccountForm.tsx
src/pages/AccountDetail.tsx
src/pages/ContactForm.tsx
src/pages/ContactDetail.tsx
src/pages/OpportunityForm.tsx
src/pages/OpportunityDetail.tsx
src/pages/QuoteForm.tsx
src/pages/QuoteDetail.tsx
src/pages/ProductForm.tsx
src/pages/ProductDetail.tsx
src/pages/ContractForm.tsx
src/pages/ContractDetail.tsx
src/pages/TicketForm.tsx
src/pages/ArticleForm.tsx
src/pages/ArticleDetail.tsx
src/pages/CampaignForm.tsx
src/pages/SegmentForm.tsx
src/pages/OrderForm.tsx
src/pages/OrderDetail.tsx
src/pages/PromotionForm.tsx
src/pages/ITIncidentForm.tsx
src/pages/ITIncidentDetail.tsx
src/pages/ITChangeForm.tsx
src/pages/LGPDRequestForm.tsx
```

**Fase 3 - Modulos Especializados:**
```text
src/pages/Cadences.tsx
src/pages/Forecast.tsx
src/pages/AuditLogs.tsx
src/pages/Automations.tsx
src/pages/WorkflowBuilder.tsx
src/pages/JourneyBuilder.tsx
src/pages/CustomerSuccess.tsx
src/pages/Governance.tsx
src/pages/Duplicates.tsx
src/pages/MergeWizard.tsx
src/pages/FullFunnel.tsx
src/pages/AttributionDashboard.tsx
src/pages/Customer360.tsx
```

**Fase 4 - Moeda:**
```text
src/pages/Dashboard.tsx
src/pages/Forecast.tsx
+ outros arquivos com formatCurrency
```

### 4.2 Padroes de Traducao a Seguir

```typescript
// Mensagens de Sucesso
toast({ 
  title: 'Sucesso!', 
  description: 'Operacao realizada com sucesso.' 
});

// Mensagens de Erro
toast({ 
  variant: 'destructive', 
  title: 'Erro', 
  description: 'Falha ao executar acao.' 
});

// Labels de Botoes
'Salvar' | 'Cancelar' | 'Criar' | 'Atualizar' | 'Excluir' | 'Editar' | 'Visualizar'

// Estados de Carregamento
'Carregando...' | 'Salvando...' | 'Processando...'

// Formatacao de Moeda
new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
}).format(value);
```

### 4.3 Termos a Manter em Ingles

- Lead
- Dashboard
- CRM
- SLA
- Pipeline
- Kanban
- SKU
- CMDB
- ITSM
- Email
- Website
- Workflow
- Widget

---

## PARTE 5: ESTIMATIVA DE ESFORCO

| Fase | Arquivos | Complexidade | Tempo Estimado |
|------|----------|--------------|----------------|
| 1 | ~5 | Alta | 30 minutos |
| 2 | ~20 | Media | 2-3 horas |
| 3 | ~15 | Media | 1.5-2 horas |
| 4 | ~5 | Baixa | 30 minutos |
| 5 | ~7 | Media | 1 hora |
| 6 | ~5 | Media | 1 hora |
| 7 | ~3 | Alta | 1 hora |
| 8 | ~30 | Baixa | 2 horas |
| 9 | ~10 | Alta | 3-4 horas |
| 10 | ~5 | Baixa | 1 hora |

**Total Estimado: 14-17 horas de implementacao**

---

## PARTE 6: ORDEM DE EXECUCAO RECOMENDADA

1. **Fase 1**: Corrigir erros criticos (console + seguranca)
2. **Fase 7**: Melhorias de seguranca (RLS)
3. **Fase 4**: Formato de moeda (rapido e impactante)
4. **Fase 2**: Traducao de forms e details
5. **Fase 3**: Traducao de modulos especializados
6. **Fase 5**: Componentes compartilhados
7. **Fase 6**: Portal do cliente
8. **Fase 8**: Melhorias de UX
9. **Fase 9**: Testes automatizados
10. **Fase 10**: Documentacao e finalizacao
