
# Plano de Traducao Completo: Fireware CRM para Portugues (PT-BR)

## Sumario Executivo

Este plano aborda uma analise exaustiva de todos os arquivos do projeto Fireware CRM, identificando textos em ingles que precisam ser traduzidos para Portugues do Brasil (PT-BR), mantendo apenas os termos tecnicos universalmente aceitos em ingles (Dashboard, CRM, SLA, Lead, etc.).

---

## PARTE 1: ANALISE COMPLETA POR MODULO

### 1.1 Componentes de Layout e Navegacao

**Arquivo: `src/components/layout/AppTopbar.tsx`**
| Linha | Texto em Ingles | Traducao PT-BR |
|-------|-----------------|----------------|
| 38 | `Create` | `Criar` |
| 42 | `Quick Create` | `Criar Rapido` |
| 45 | `New Lead` | `Novo Lead` |
| 48 | `New Account` | `Nova Conta` |
| 51 | `New Contact` | `Novo Contato` |
| 54 | `New Opportunity` | `Nova Oportunidade` |
| 57 | `New Quote` | `Nova Proposta` |

**Arquivo: `src/pages/NotFound.tsx`**
| Linha | Texto em Ingles | Traducao PT-BR |
|-------|-----------------|----------------|
| 15 | `Oops! Page not found` | `Ops! Pagina nao encontrada` |
| 17 | `Return to Home` | `Voltar para Inicio` |

### 1.2 Modulo de Autenticacao

**Arquivo: `src/pages/Auth.tsx`**
| Linha | Texto em Ingles | Traducao PT-BR |
|-------|-----------------|----------------|
| 16 | `Please enter a valid email` | `Por favor, insira um email valido` |
| 17 | `Password must be at least 6 characters` | `A senha deve ter pelo menos 6 caracteres` |
| 21 | `First name is required` | `Nome e obrigatorio` |
| 22 | `Last name is required` | `Sobrenome e obrigatorio` |
| 23 | `Please enter a valid email` | `Por favor, insira um email valido` |
| 24 | `Password must be at least 6 characters` | `A senha deve ter pelo menos 6 caracteres` |
| 27 | `Passwords don't match` | `As senhas nao correspondem` |
| 66 | `Login failed` | `Falha no login` |
| 68 | `Invalid email or password. Please try again.` | `Email ou senha invalidos. Tente novamente.` |
| 72-73 | `Welcome back!` / `You have successfully logged in.` | `Bem-vindo de volta!` / `Login realizado com sucesso.` |
| 88-89 | `This email is already registered. Please login instead.` | `Este email ja esta registrado. Faca login.` |
| 91-92 | `Signup failed` | `Falha no cadastro` |
| 96-98 | `Account created!` / `Welcome to Fireware CRM.` | `Conta criada!` / `Bem-vindo ao Fireware CRM.` |
| 120-123 | `The complete B2B sales platform...` | `A plataforma completa de vendas B2B...` |
| 135-136 | `Welcome to Fireware` / `Sign in to your account or create a new one` | `Bem-vindo ao Fireware` / `Entre na sua conta ou crie uma nova` |
| 143-144 | `Login` / `Sign Up` | `Entrar` / `Cadastrar` |
| 155 | `Email` | `Email` (manter) |
| 171 | `Password` | `Senha` |
| 187 | `Sign In` | `Entrar` |
| 201-220 | `First Name` / `Last Name` / `Confirm Password` | `Nome` / `Sobrenome` / `Confirmar Senha` |
| 276 | `Create Account` | `Criar Conta` |

### 1.3 Modulo de Leads

**Arquivo: `src/pages/Leads.tsx`**
| Linha | Texto em Ingles | Traducao PT-BR |
|-------|-----------------|----------------|
| 99-101 | `Error` / `Failed to load leads` | `Erro` / `Falha ao carregar leads` |
| 114-116 | `Error` / `Failed to delete lead` | `Erro` / `Falha ao excluir lead` |
| 119-121 | `Lead deleted` / `The lead has been successfully deleted.` | `Lead excluido` / `O lead foi excluido com sucesso.` |
| 150-151 | `Leads` / `Manage and track your sales leads` | `Leads` / `Gerencie e acompanhe seus leads de vendas` |
| 156-157 | `Import` | `Importar` |
| 160 | `Export` | `Exportar` |
| 165 | `New Lead` | `Novo Lead` |
| 175 | `Search leads...` | `Buscar leads...` |
| 183 | `Filter by status` | `Filtrar por status` |
| 186-191 | `All Statuses` / `New` / `Contacted` / `Qualified` / `Unqualified` / `Converted` | `Todos os Status` / `Novo` / `Contatado` / `Qualificado` / `Desqualificado` / `Convertido` |
| 203 | `Name` | `Nome` |
| 207 | `Company` | `Empresa` |
| 208 | `Email` | `Email` |
| 209 | `Status` | `Status` |
| 210 | `Score` | `Pontuacao` |
| 211 | `Source` | `Origem` |
| 212 | `Created` | `Criado em` |
| 220 | `Loading leads...` | `Carregando leads...` |
| 227 | `No leads found` | `Nenhum lead encontrado` |
| 230 | `Create your first lead` | `Crie seu primeiro lead` |
| 277-278 | `View` | `Visualizar` |
| 281 | `Edit` | `Editar` |
| 289 | `Delete` | `Excluir` |
| 306 | `Showing {x} of {y} leads` | `Exibindo {x} de {y} leads` |

### 1.4 Modulo de Contas (Accounts)

**Arquivo: `src/pages/Accounts.tsx`**
| Linha | Texto em Ingles | Traducao PT-BR |
|-------|-----------------|----------------|
| 49 | `Error` / `Failed to load accounts` | `Erro` / `Falha ao carregar contas` |
| 59 | `Error` / `Failed to delete account` | `Erro` / `Falha ao excluir conta` |
| 61 | `Account deleted` | `Conta excluida` |
| 80 | `Accounts` | `Contas` |
| 81 | `Manage your customer accounts` | `Gerencie suas contas de clientes` |
| 84 | `New Account` | `Nova Conta` |
| 90 | `Search accounts...` | `Buscar contas...` |
| 97 | `Name` | `Nome` |
| 98 | `Industry` | `Industria` |
| 99 | `Phone` | `Telefone` |
| 100 | `Revenue` | `Receita` |
| 101 | `Employees` | `Funcionarios` |
| 102 | `Created` | `Criado em` |
| 108 | `Loading...` | `Carregando...` |
| 114 | `No accounts found` | `Nenhuma conta encontrada` |
| 115 | `Create Account` | `Criar Conta` |
| 132 | `View` | `Visualizar` |
| 133 | `Edit` | `Editar` |
| 135 | `Delete` | `Excluir` |

### 1.5 Modulo de Contatos

**Arquivo: `src/pages/Contacts.tsx`**
| Linha | Texto em Ingles | Traducao PT-BR |
|-------|-----------------|----------------|
| 43 | `Error` / `Failed to load contacts` | `Erro` / `Falha ao carregar contatos` |
| 61 | `Contacts` | `Contatos` |
| 62 | `Manage your contact relationships` | `Gerencie seus relacionamentos de contato` |
| 64 | `New Contact` | `Novo Contato` |
| 69 | `Search contacts...` | `Buscar contatos...` |
| 76 | `Name` | `Nome` |
| 77 | `Email` | `Email` |
| 78 | `Phone` | `Telefone` |
| 79 | `Title` | `Cargo` |
| 80 | `Created` | `Criado em` |
| 86 | `Loading...` | `Carregando...` |
| 93 | `No contacts found` | `Nenhum contato encontrado` |
| 108 | `View` | `Visualizar` |
| 109 | `Edit` | `Editar` |

### 1.6 Modulo de Oportunidades

**Arquivo: `src/pages/Opportunities.tsx`**
| Linha | Texto em Ingles | Traducao PT-BR |
|-------|-----------------|----------------|
| 30-35 | Stage labels: `Prospecting` / `Qualification` / `Proposal` / `Negotiation` / `Closed Won` / `Closed Lost` | `Prospeccao` / `Qualificacao` / `Proposta` / `Negociacao` / `Ganho` / `Perdido` |
| 65 | `Error loading opportunities` | `Erro ao carregar oportunidades` |
| 96 | `Stage updated` / `Opportunity moved to...` | `Estagio atualizado` / `Oportunidade movida para...` |
| 116 | `Opportunities` | `Oportunidades` |
| 117 | `Manage your sales pipeline` | `Gerencie seu pipeline de vendas` |
| 127 | `New Opportunity` | `Nova Oportunidade` |
| 148 | (Stage count text) | (usar labels traduzidos) |
| 220 | `All Opportunities` | `Todas as Oportunidades` |
| 224 | `Loading...` | `Carregando...` |
| 227 | `No opportunities yet. Create your first deal!` | `Nenhuma oportunidade ainda. Crie seu primeiro negocio!` |

### 1.7 Modulo de Propostas (Quotes)

**Arquivo: `src/pages/Quotes.tsx`**
| Linha | Texto em Ingles | Traducao PT-BR |
|-------|-----------------|----------------|
| 92-117 | Status config labels: `Draft` / `Sent` / `Accepted` / `Rejected` / `Expired` | `Rascunho` / `Enviado` / `Aceito` / `Rejeitado` / `Expirado` |
| 165-166 | `Error` / `Failed to load quotes` | `Erro` / `Falha ao carregar propostas` |
| 186-187 | `Failed to delete quote` | `Falha ao excluir proposta` |
| 189-190 | `Quote deleted` / `The quote has been successfully deleted.` | `Proposta excluida` / `A proposta foi excluida com sucesso.` |
| 212-213 | `Quote updated` / `Quote status changed to...` | `Proposta atualizada` / `Status da proposta alterado para...` |
| 272-275 | `Quote duplicated` / `A copy of the quote has been created.` | `Proposta duplicada` / `Uma copia da proposta foi criada.` |
| 328-330 | `Quotes` / `Create and manage proposals for your customers` | `Propostas` / `Crie e gerencie propostas para seus clientes` |
| 336 | `Export` | `Exportar` |
| 340 | `New Quote` | `Nova Proposta` |
| 354-358 | Stats cards: `Total Quotes` / `Drafts` / `Sent` / `Total Value` | `Total de Propostas` / `Rascunhos` / `Enviadas` / `Valor Total` |
| 406 | `Search quotes...` | `Buscar propostas...` |
| 414 | `Filter by status` | `Filtrar por status` |
| 417-423 | Status filter items | (usar labels traduzidos) |
| 433-443 | Table headers: `Number` / `Name` / `Account` / `Status` / `Total` / `Valid Until` / `Created` | `Numero` / `Nome` / `Conta` / `Status` / `Total` / `Valido Ate` / `Criado em` |
| 452 | `Loading quotes...` | `Carregando propostas...` |
| 462 | `No quotes found` | `Nenhuma proposta encontrada` |
| 465 | `Create your first quote` | `Crie sua primeira proposta` |

### 1.8 Modulo de Produtos

**Arquivo: `src/pages/Products.tsx`**
| Linha | Texto em Ingles | Traducao PT-BR |
|-------|-----------------|----------------|
| 113-114 | `Error` / `Failed to load products` | `Erro` / `Falha ao carregar produtos` |
| 134-135 | `Failed to delete product. It may be used in quotes.` | `Falha ao excluir produto. Pode estar em uso em propostas.` |
| 137-138 | `Product deleted` / `The product has been successfully deleted.` | `Produto excluido` / `O produto foi excluido com sucesso.` |
| 158-159 | `Product updated` / `Product activated/deactivated successfully.` | `Produto atualizado` / `Produto ativado/desativado com sucesso.` |
| 233-235 | `Products` / `Manage your product catalog for quotes and orders` | `Produtos` / `Gerencie seu catalogo de produtos para propostas e pedidos` |
| 241 | `Import` | `Importar` |
| 245 | `Export` | `Exportar` |
| 249 | `New Product` | `Novo Produto` |
| 263-303 | Stats cards: `Total Products` / `Active Products` / `Categories` / `Avg Price` | `Total de Produtos` / `Produtos Ativos` / `Categorias` / `Preco Medio` |
| 316 | `Search products...` | `Buscar produtos...` |
| 326 | `All Categories` | `Todas as Categorias` |
| 337-340 | `All Status` / `Active` / `Inactive` | `Todos os Status` / `Ativo` / `Inativo` |
| 355-374 | Table headers: `Product` / `SKU` / `Category` / `Price` / `Cost` / `Margin` / `Status` | `Produto` / `SKU` / `Categoria` / `Preco` / `Custo` / `Margem` / `Status` |
| 383 | `Loading products...` | `Carregando produtos...` |
| 392 | `No products found` | `Nenhum produto encontrado` |
| 395 | `Create your first product` | `Crie seu primeiro produto` |
| 447 | `Active` / `Inactive` | `Ativo` / `Inativo` |
| 459 | `View` | `Visualizar` |
| 462 | `Edit` | `Editar` |
| 471-476 | `Deactivate` / `Activate` | `Desativar` / `Ativar` |
| 487 | `Delete` | `Excluir` |

### 1.9 Modulo de Contratos

**Arquivo: `src/pages/Contracts.tsx`**
| Linha | Texto em Ingles | Traducao PT-BR |
|-------|-----------------|----------------|
| 93-138 | Status config labels | (traduzir todos os labels de status) |
| 264-266 | `Contracts` / `Manage customer contracts and track renewals` | `Contratos` / `Gerencie contratos de clientes e acompanhe renovacoes` |
| 272 | `Export` | `Exportar` |
| 276 | `New Contract` | `Novo Contrato` |
| 290-331 | Stats cards: `Total Contracts` / `Active` / `Expiring Soon` / `Total Value` | `Total de Contratos` / `Ativos` / `Expirando em Breve` / `Valor Total` |
| 343 | `Search contracts...` | `Buscar contratos...` |
| 350 | `Filter by status` | `Filtrar por status` |
| 353-364 | Status filter items | (usar labels traduzidos) |
| 372-379 | Table headers: `Number` / `Name` / `Account` / `Status` / `Value` / `End Date` / `Auto Renewal` | `Numero` / `Nome` / `Conta` / `Status` / `Valor` / `Data Final` / `Renovacao Automatica` |
| 388 | `Loading contracts...` | `Carregando contratos...` |
| 397 | `No contracts found` | `Nenhum contrato encontrado` |
| 400 | `Create your first contract` | `Crie seu primeiro contrato` |
| 474 | `View Details` | `Ver Detalhes` |
| 478 | `Edit` | `Editar` |

### 1.10 Modulo de Configuracoes

**Arquivo: `src/pages/Settings.tsx`**
| Linha | Texto em Ingles | Traducao PT-BR |
|-------|-----------------|----------------|
| 221-223 | `Stage saved` | `Estagio salvo` |
| 233 | `Stage deleted` | `Estagio excluido` |
| 264 | `Reason saved` | `Motivo salvo` |
| 296 | `Source saved` | `Fonte salva` |
| 328 | `Team saved` | `Equipe salva` |
| 339 | `Member updated` | `Membro atualizado` |
| 384 | `Settings` | `Configuracoes` |
| 385 | `Configure your CRM` | `Configure seu CRM` |
| 390-393 | Tab labels: `Pipeline Stages` / `Win/Loss Reasons` / `Lead Sources` / `Team Management` | `Estagios do Pipeline` / `Motivos de Ganho/Perda` / `Fontes de Lead` / `Gestao de Equipe` |
| 401 | `Opportunity Pipeline Stages` | `Estagios do Pipeline de Oportunidades` |
| 402 | `Drag to reorder stages. Set probability for each stage.` | `Arraste para reordenar estagios. Defina a probabilidade para cada um.` |
| 410-411 | `Add Stage` | `Adicionar Estagio` |
| 415 | `Edit Stage` / `Add Stage` | `Editar Estagio` / `Adicionar Estagio` |
| 419 | `Stage Name *` | `Nome do Estagio *` |
| 423 | `Win Probability (%)` | `Probabilidade de Ganho (%)` |
| 428-432 | `Closed Stage` / `Won Stage` | `Estagio Fechado` / `Estagio Ganho` |
| 438 | `Cancel` | `Cancelar` |
| 440 | `Update` / `Create` | `Atualizar` / `Criar` |
| 448 | `Loading...` | `Carregando...` |
| 452 | `No stages defined` | `Nenhum estagio definido` |

### 1.11 Modulo de Relatorios

**Arquivo: `src/pages/Reports.tsx`**
| Linha | Texto em Ingles | Traducao PT-BR |
|-------|-----------------|----------------|
| 124-130 | Date range labels: `This Month` / `Last Month` / `This Quarter` / `Last Quarter` / `Last 30 Days` / `Last 90 Days` / `Custom Range` | `Este Mes` / `Mes Passado` / `Este Trimestre` / `Trimestre Passado` / `Ultimos 30 Dias` / `Ultimos 90 Dias` / `Periodo Personalizado` |
| 405-406 | `Error` / `Failed to load report data` | `Erro` / `Falha ao carregar dados do relatorio` |
| 451-454 | `Reports & Analytics` / `Comprehensive insights into your sales performance` | `Relatorios & Analises` / `Insights completos sobre seu desempenho de vendas` |
| 475-476 | `From` | `De` |
| 493 | `To` | `Ate` |

### 1.12 Modulo de Territorios

**Arquivo: `src/pages/Territories.tsx`**
| Linha | Texto em Ingles | Traducao PT-BR |
|-------|-----------------|----------------|
| 202-203 | `Territory updated` / `Territory created` / `Changes saved successfully.` | `Territorio atualizado` / `Territorio criado` / `Alteracoes salvas com sucesso.` |
| 207-208 | `Error` | `Erro` |
| 226-227 | `Territory deleted` / `Territory has been removed.` | `Territorio excluido` / `Territorio foi removido.` |
| 388-389 | `Territories` / `Manage sales territories and assignments` | `Territorios` / `Gerencie territorios de vendas e atribuicoes` |
| 400 | `Add Territory` | `Adicionar Territorio` |
| 406 | `Edit Territory` / `Create Territory` | `Editar Territorio` / `Criar Territorio` |
| 410 | `Name *` | `Nome *` |
| 420 | `Region` | `Regiao` |
| 429 | `Description` | `Descricao` |
| 440 | `Parent Territory` | `Territorio Pai` |
| 450 | `Select parent (optional)` | `Selecione pai (opcional)` |
| 451 | `No parent` | `Sem pai` |
| 462 | `Territory Owner` | `Proprietario do Territorio` |
| 470 | `Assign owner` | `Atribuir proprietario` |
| 471 | `Unassigned` | `Nao atribuido` |
| 481 | `Cancel` | `Cancelar` |
| 488 | `Saving...` / `Update` / `Create` | `Salvando...` / `Atualizar` / `Criar` |
| 500 | `Total Territories` | `Total de Territorios` |

### 1.13 Busca Global

**Arquivo: `src/components/GlobalSearch.tsx`**
| Linha | Texto em Ingles | Traducao PT-BR |
|-------|-----------------|----------------|
| 18-22 | Type config labels: `Lead` / `Account` / `Contact` / `Opportunity` / `Quote` | `Lead` / `Conta` / `Contato` / `Oportunidade` / `Proposta` |
| 213 | `Search leads, accounts, contacts...` | `Buscar leads, contas, contatos...` |
| 238 | `Searching...` | `Buscando...` |
| 242 | `No results found` / `Type at least 2 characters` | `Nenhum resultado encontrado` / `Digite pelo menos 2 caracteres` |

### 1.14 Wizard de Conversao de Lead

**Arquivo: `src/components/LeadConversionWizard.tsx`**
| Linha | Texto em Ingles | Traducao PT-BR |
|-------|-----------------|----------------|
| 87-106 | Schema field names | (traduzir labels dos campos) |
| 209-211 | `Error` / `You must be part of an organization to convert leads.` | `Erro` / `Voce deve fazer parte de uma organizacao para converter leads.` |
| 359-362 | `Lead converted successfully!` / `Created Account, Contact, and Opportunity.` | `Lead convertido com sucesso!` / `Conta, Contato e Oportunidade criados.` |
| 370-372 | `Conversion failed` / `Failed to convert lead. Please try again.` | `Falha na conversao` / `Falha ao converter lead. Tente novamente.` |
| 387-393 | Lead info display | (manter dinamico) |
| 401 | `Account` | `Conta` |
| 415 | `Link to existing account` | `Vincular a conta existente` |
| 429 | `Select Account` | `Selecionar Conta` |
| 435 | `Search and select account...` | `Buscar e selecionar conta...` |
| 458 | `Account Name *` | `Nome da Conta *` |
| 469 | `Industry` | `Industria` |
| 479 | `Website` | `Website` (manter) |

### 1.15 Dashboard Principal

**Arquivo: `src/pages/Dashboard.tsx`**
| Linha | Texto em Ingles | Traducao PT-BR |
|-------|-----------------|----------------|
| 61-67 | Stage labels (manter em ingles no codigo, mas traduzir na UI) | (usar mapeamento) |
| 327 | `Create your first opportunity` | `Crie sua primeira oportunidade` |
| 339 | (Tooltip `Valor`) | (ja esta ok) |
| 428-429 | `Ver Todos` | (ja esta traduzido) |
| 440 | `Nenhuma oportunidade aberta` | (ja esta traduzido) |

---

## PARTE 2: ARQUIVOS ADICIONAIS A TRADUZIR

### 2.1 Formularios de Edicao/Criacao (Forms)

Os seguintes arquivos contem textos em ingles que precisam ser traduzidos:

- `src/pages/LeadForm.tsx`
- `src/pages/AccountForm.tsx`
- `src/pages/ContactForm.tsx`
- `src/pages/OpportunityForm.tsx`
- `src/pages/QuoteForm.tsx`
- `src/pages/ProductForm.tsx`
- `src/pages/ContractForm.tsx`
- `src/pages/TicketForm.tsx`
- `src/pages/ArticleForm.tsx`
- `src/pages/CampaignForm.tsx`
- `src/pages/SegmentForm.tsx`
- `src/pages/OrderForm.tsx`
- `src/pages/PromotionForm.tsx`
- `src/pages/ITIncidentForm.tsx`
- `src/pages/ITChangeForm.tsx`
- `src/pages/LGPDRequestForm.tsx`

### 2.2 Paginas de Detalhe

- `src/pages/LeadDetail.tsx`
- `src/pages/AccountDetail.tsx`
- `src/pages/ContactDetail.tsx`
- `src/pages/OpportunityDetail.tsx`
- `src/pages/QuoteDetail.tsx`
- `src/pages/ProductDetail.tsx`
- `src/pages/ContractDetail.tsx`
- `src/pages/TicketDetail.tsx`
- `src/pages/ArticleDetail.tsx`
- `src/pages/OrderDetail.tsx`
- `src/pages/ITIncidentDetail.tsx`

### 2.3 Outros Modulos

- `src/pages/Cadences.tsx` - Multiplos textos em ingles
- `src/pages/Forecast.tsx` - Headers e labels
- `src/pages/AuditLogs.tsx` - Headers e mensagens
- `src/pages/Automations.tsx` - Labels de interface
- `src/pages/WorkflowBuilder.tsx` - Textos do builder
- `src/pages/Marketing.tsx` - Headers e stats
- `src/pages/JourneyBuilder.tsx` - Textos do builder
- `src/pages/Orders.tsx` - Headers e status
- `src/pages/Returns.tsx` - Headers e status
- `src/pages/Promotions.tsx` - Headers e tipos
- `src/pages/ITDashboard.tsx` - KPIs e headers
- `src/pages/ITIncidents.tsx` - Status e labels
- `src/pages/ITChanges.tsx` - Status e labels
- `src/pages/CMDB.tsx` - Headers e tipos
- `src/pages/ITAssets.tsx` - Headers e status
- `src/pages/Duplicates.tsx` - Headers e acoes
- `src/pages/MergeWizard.tsx` - Steps e instrucoes
- `src/pages/FullFunnel.tsx` - Headers e metricas
- `src/pages/AttributionDashboard.tsx` - Headers e canais
- `src/pages/Customer360.tsx` - Tabs e headers
- `src/pages/Governance.tsx` - Tabs e acoes
- `src/pages/CustomerSuccess.tsx` - KPIs e playbooks

### 2.4 Componentes Compartilhados

- `src/components/Timeline.tsx`
- `src/components/NotesWidget.tsx`
- `src/components/AttachmentsWidget.tsx`
- `src/components/ActivitiesWidget.tsx`
- `src/components/ApprovalRequestDialog.tsx`
- `src/components/CSVImportDialog.tsx`
- `src/components/StaleDealAlerts.tsx`
- `src/components/LeadRoutingRules.tsx`

---

## PARTE 3: ESTRATEGIA DE IMPLEMENTACAO

### 3.1 Abordagem Recomendada

Dado o volume de traducoes necessarias, a implementacao sera dividida em fases:

**Fase 1: Layout e Navegacao (Prioridade Alta)**
- AppTopbar.tsx
- NotFound.tsx

**Fase 2: Autenticacao (Prioridade Alta)**
- Auth.tsx (todas as mensagens e labels)

**Fase 3: Modulos Core de CRM (Prioridade Alta)**
- Leads.tsx
- Accounts.tsx
- Contacts.tsx
- Opportunities.tsx

**Fase 4: Modulos de Vendas (Prioridade Media)**
- Quotes.tsx
- Products.tsx
- Contracts.tsx

**Fase 5: Configuracoes e Gestao (Prioridade Media)**
- Settings.tsx
- Territories.tsx
- Reports.tsx
- Cadences.tsx

**Fase 6: Componentes Compartilhados (Prioridade Media)**
- GlobalSearch.tsx
- LeadConversionWizard.tsx
- Todos os widgets

**Fase 7: Modulos Especializados (Prioridade Baixa)**
- Commerce (Orders, Returns, Promotions)
- IT/ITSM (Incidents, Changes, CMDB, Assets)
- Data (Duplicates, MergeWizard, Attribution, Customer360)
- Marketing (Campaigns, Segments, Journeys)
- Governance

**Fase 8: Formularios e Detalhes (Prioridade Baixa)**
- Todos os arquivos *Form.tsx
- Todos os arquivos *Detail.tsx

### 3.2 Termos que Devem Permanecer em Ingles

Os seguintes termos sao considerados "termos coringas" e devem permanecer em ingles por serem universalmente utilizados no contexto de CRM/TI:

- **Lead** (nao traduzir para "Prospecto" ou "Cliente Potencial")
- **Dashboard**
- **CRM**
- **SLA** (Service Level Agreement)
- **Pipeline**
- **Kanban**
- **SKU** (Stock Keeping Unit)
- **CMDB** (Configuration Management Database)
- **ITSM** (IT Service Management)
- **Email** (nao traduzir para "Correio Eletronico")
- **Website**
- **Workflow**
- **Widget**

### 3.3 Estimativa de Esforco

| Fase | Arquivos | Estimativa |
|------|----------|------------|
| 1 | 2 | 5 minutos |
| 2 | 1 | 15 minutos |
| 3 | 4 | 30 minutos |
| 4 | 3 | 25 minutos |
| 5 | 4 | 35 minutos |
| 6 | ~10 | 45 minutos |
| 7 | ~15 | 60 minutos |
| 8 | ~25 | 90 minutos |

**Total Estimado: 4-5 horas de implementacao**

---

## PARTE 4: DETALHES TECNICOS

### 4.1 Padroes de Traducao

Para manter consistencia, seguir os padroes:

```typescript
// Mensagens de sucesso
toast({ title: 'Sucesso!', description: 'Operacao realizada com sucesso.' });

// Mensagens de erro
toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao executar acao.' });

// Confirmacoes
'Tem certeza que deseja excluir?'

// Labels de botoes
'Salvar' | 'Cancelar' | 'Criar' | 'Atualizar' | 'Excluir' | 'Editar' | 'Visualizar'

// Status
'Carregando...' | 'Salvando...' | 'Processando...'

// Placeholders de busca
'Buscar por nome, email...'

// Empty states
'Nenhum registro encontrado' | 'Nenhum dado disponivel'
```

### 4.2 Arquivos que Nao Precisam de Traducao

- Arquivos de configuracao (*.config.ts, *.config.js)
- Arquivos de tipos (types.ts)
- Arquivos de utilidades (utils.ts)
- Arquivos de cliente (client.ts)
- Migrations SQL (comentarios podem ser em ingles)
- Constantes de enum no banco de dados

---

## PARTE 5: PROXIMOS PASSOS

1. **Aprovar este plano** para iniciar a implementacao
2. **Implementar Fase 1-3** (componentes criticos primeiro)
3. **Testar interface** para garantir que nao ha quebras
4. **Implementar Fases 4-8** em sequencia
5. **Revisao final** para verificar consistencia
