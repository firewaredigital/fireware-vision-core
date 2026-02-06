

# Redesign Radical do Sistema Fireware CRM

## Analise das Imagens de Referencia

As 4 imagens de referencia compartilham um padrao de design muito claro e consistente:

1. **Sidebar escura** (quase preta, #212427) com icones e labels em branco, com secoes colapsaveis e indicador vermelho no item ativo
2. **Topbar branca/clara** com busca central proeminente, notificacoes e avatar do usuario a direita
3. **Area de conteudo** com fundo cinza claro (#f5f5f5) e cards brancos (#ffffff) com bordas suaves
4. **Vermelho vivo (#FF0000)** usado pontualmente em: item ativo da sidebar, badges de alerta, botoes CTA primarios, indicadores de status
5. **Tipografia limpa** com hierarquia clara, titulos bold e subtitulos em cinza suave
6. **Cards com bordas arredondadas** sem sombras pesadas, apenas bordas sutis
7. **Layout de detalhes** (imagens 7-8): painel lateral esquerdo com metadados + area principal de conteudo

---

## Paleta de Cores Definitiva

| Token | Valor | Uso |
|-------|-------|-----|
| Vermelho vivo | #FF0000 | Acentos pontuais, item ativo, CTA primario |
| Escuro | #212427 | Sidebar, textos primarios |
| Cinza claro | #F5F5F5 | Background da area de conteudo |
| Branco | #FFFFFF | Cards, topbar, superficies |

---

## Arquivos Impactados e Alteracoes

### 1. `src/index.css` - Design Tokens (CSS Variables)

Reescrever completamente as variaveis CSS para refletir a nova paleta:

**Modo Claro (:root):**
- `--background`: Cinza claro #F5F5F5 (0 0% 96%)
- `--foreground`: Escuro #212427 (216 5% 14%)
- `--card` / `--popover`: Branco #FFFFFF (0 0% 100%)
- `--card-foreground` / `--popover-foreground`: #212427
- `--primary`: Vermelho #FF0000 (0 100% 50%)
- `--primary-foreground`: Branco #FFFFFF
- `--secondary`: Cinza neutro suave (220 14% 96%)
- `--muted`: Cinza de fundo suave (220 14% 96%)
- `--muted-foreground`: Cinza medio para textos secundarios
- `--accent`: Cinza suave para hovers
- `--border`: Cinza claro para bordas (220 13% 90%)
- `--input`: Cinza claro para bordas de inputs
- `--ring`: Vermelho #FF0000 para focus rings
- `--sidebar-background`: #212427 (216 5% 14%)
- `--sidebar-foreground`: Branco #FAFAFA
- `--sidebar-primary`: #FF0000
- `--sidebar-accent`: Tom levemente mais claro que #212427
- `--sidebar-border`: Tom sutil de divisao no sidebar

**Modo Escuro (.dark):**
- `--background`: #1a1a1a (quase preto)
- `--foreground`: #fafafa
- `--card`: #212427
- `--primary`: #FF0000 (mantido)
- `--sidebar-background`: #151618
- Todos os outros tokens ajustados proporcionalmente

**Adicoes de utilidades CSS:**
- Classe `.glass-card` para efeito de vidro sutil
- Remover sombras pesadas, usar bordas finas

### 2. `src/components/layout/AppSidebar.tsx` - Sidebar Redesenhada

Redesenho completo seguindo o padrao das imagens de referencia:

- **Header**: Logo Fireware com icone Flame em fundo vermelho, nome "Fireware" em branco e subtitulo "CRM Enterprise" em cinza claro
- **Navegacao por secoes com icones**: Cada secao ("Vendas", "Atendimento", etc.) exibida como grupo com label em UPPERCASE em cinza claro semi-transparente, e itens com icone + texto
- **Item ativo**: Fundo levemente mais claro (#2d3035) com borda lateral esquerda em vermelho #FF0000 (3px) e texto em branco brilhante
- **Hover**: Background sutil mais claro que o fundo do sidebar
- **Footer**: Avatar do usuario com nome e role, botao de logout
- **Collapsible groups**: Setas de expansao sutis, animacao suave
- **Espacamento**: Padding mais generoso, itens com 40px de altura
- **Tipografia dos labels de secao**: 10px, uppercase, letter-spacing 0.05em, cor semi-transparente

### 3. `src/components/layout/AppTopbar.tsx` - Topbar Redesenhada

Seguindo o padrao das imagens (especialmente imagem 5 e 6):

- **Background**: Branco puro (#FFFFFF) com borda inferior cinza claro
- **Layout**: Grid de 3 colunas - SidebarTrigger a esquerda, busca central expansiva, acoes a direita
- **Busca**: Campo centralizado com fundo #F5F5F5, icone de lupa, bordas arredondadas maiores, placeholder "Buscar em todo o sistema..."
- **Acoes a direita**: Botao "Criar" com fundo vermelho, icone de sino para notificacoes (badge vermelho), seletor de tema, avatar do usuario com nome e role visivel
- **Altura**: 64px (aumentada de 56px) para mais presenca visual
- **Sem sombra**: Apenas borda inferior fina

### 4. `src/components/layout/AppLayout.tsx` - Layout Principal

- **Area de conteudo**: Background #F5F5F5, padding ajustado
- **Transicao suave**: Ao expandir/colapsar sidebar

### 5. `src/components/ui/card.tsx` - Cards Redesenhados

- **Background**: Branco puro #FFFFFF
- **Borda**: 1px solid com cor cinza claro sutil
- **Sombra**: Removida ou extremamente sutil (0 1px 3px rgba(0,0,0,0.04))
- **Border-radius**: 12px (aumentado de 8px)
- **Padding**: Generoso (24px)

### 6. `src/components/ui/button.tsx` - Botoes Atualizados

- **Variante default (Primary)**: Background vermelho #FF0000, hover vermelho escurecido, texto branco, border-radius 8px
- **Variante secondary**: Background cinza claro #F5F5F5, texto #212427
- **Variante ghost**: Sem background, hover cinza muito suave
- **Variante outline**: Borda cinza, hover cinza suave
- **Transicoes**: Mais suaves (200ms)

### 7. `src/components/ui/badge.tsx` - Badges Atualizados

- Estilos mais refinados com cores suaves
- Badge vermelho para status criticos
- Badge neutro com fundo cinza claro

### 8. `src/components/ui/input.tsx` - Inputs Atualizados

- **Background**: Branco ou #F5F5F5
- **Borda**: Cinza claro, focus com ring vermelho sutil
- **Border-radius**: 8px
- **Altura**: 42px

### 9. `src/components/ui/table.tsx` - Tabelas Atualizadas

- **Header**: Background #F5F5F5, texto em cinza medio, uppercase 11px
- **Rows**: Hover suave, bordas horizontais finas
- **Spacing**: Cells com padding generoso

### 10. `src/components/ui/tabs.tsx` - Tabs Atualizados

- Estilo mais limpo, sem fundo no container
- Tab ativa com borda inferior vermelha (#FF0000) em vez de fundo
- Texto ativo em #212427, inativo em cinza medio

### 11. `src/pages/Auth.tsx` - Tela de Login Redesenhada

- **Lado esquerdo**: Background #212427 com logo Fireware grande, textos em branco
- **Lado direito**: Branco com formulario limpo
- **Botoes**: Vermelho primario

### 12. `src/pages/Dashboard.tsx` - Dashboard Redesenhado

- **KPI Cards**: Layout seguindo imagem 5 - cards brancos com icone colorido, titulo em cinza pequeno, valor grande em bold #212427, indicadores de variacao
- **Graficos**: Estilizacao consistente com cores da paleta
- **Background**: #F5F5F5 com cards brancos

### 13. `tailwind.config.ts` - Configuracao Tailwind

- `--radius`: Aumentado para 0.75rem (12px)
- Cores mapeadas mantidas, valores alterados via CSS variables

### 14. `src/App.css` - Limpeza

- Remover estilos antigos/residuais do template Vite

### 15. `src/components/GlobalSearch.tsx` - Busca Global

- Estilizacao alinhada com o novo topbar
- Campo de busca mais proeminente
- Dropdown de resultados com fundo branco e bordas arredondadas

### 16. Portal e Partner Layouts

- `src/pages/portal/PortalLayout.tsx`: Ajustar para paleta consistente
- `src/pages/partner/PartnerLayout.tsx`: Ajustar para paleta consistente

### 17. Componentes UI Adicionais

- `src/components/ui/dialog.tsx`: Bordas arredondadas maiores
- `src/components/ui/select.tsx`: Estilo de input consistente
- `src/components/ui/dropdown-menu.tsx`: Estilo mais limpo
- `src/components/ui/popover.tsx`: Bordas arredondadas

---

## Detalhes Tecnicos da Implementacao

### Mudancas nos CSS Variables (index.css)

A alteracao central e nas variaveis CSS. Todos os componentes que ja usam `hsl(var(--variavel))` serao automaticamente atualizados. As mudancas principais:

```text
:root
  --background:      210 20% 96%    (era 0 0% 99%) --> #F5F5F5
  --foreground:      216 5% 14%     (era 220 13% 13%) --> #212427
  --card:            0 0% 100%      (mantido) --> #FFFFFF
  --primary:         0 100% 50%     (mantido) --> #FF0000
  --sidebar-background: 216 5% 14%  (era 220 13% 13%) --> #212427
  --radius:          0.75rem        (era 0.5rem) --> 12px
```

### Mudancas Estruturais na Sidebar (AppSidebar.tsx)

- Adicionar borda esquerda vermelha no item ativo (3px solid)
- Aumentar altura dos itens de menu para 40px
- Labels de secao em uppercase com letter-spacing
- Animacao suave de hover com transicao de 150ms
- Separadores sutis entre secoes

### Mudancas Estruturais no Topbar (AppTopbar.tsx)

- Altura aumentada para 64px
- Busca centralizada com largura maxima de 600px
- Avatar com nome do usuario visivel no desktop
- Background branco puro com borda inferior

### Ordem de Execucao

1. `src/index.css` - Design tokens (base para tudo)
2. `tailwind.config.ts` - Radius e ajustes de config
3. `src/App.css` - Limpeza
4. `src/components/ui/card.tsx` - Cards
5. `src/components/ui/button.tsx` - Botoes
6. `src/components/ui/badge.tsx` - Badges
7. `src/components/ui/input.tsx` - Inputs
8. `src/components/ui/table.tsx` - Tabelas
9. `src/components/ui/tabs.tsx` - Tabs
10. `src/components/layout/AppSidebar.tsx` - Sidebar
11. `src/components/layout/AppTopbar.tsx` - Topbar
12. `src/components/layout/AppLayout.tsx` - Layout
13. `src/components/GlobalSearch.tsx` - Busca
14. `src/pages/Auth.tsx` - Login
15. `src/pages/Dashboard.tsx` - Dashboard
16. `src/pages/portal/PortalLayout.tsx` - Portal
17. `src/pages/partner/PartnerLayout.tsx` - Partner

### Principio Fundamental

Todas as mudancas de cor fluem das CSS variables. Componentes que ja usam `bg-card`, `bg-background`, `text-foreground`, `bg-primary`, `bg-sidebar`, etc. serao atualizados automaticamente ao mudar as variaveis em `index.css`. As mudancas nos componentes `.tsx` sao focadas em **estrutura** (spacing, border-radius, layout) e **comportamento visual** (borda ativa vermelha na sidebar, tabs com underline).

