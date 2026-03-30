# FinanceFlow — Roteiro de Handoff para Novo LLM

> Documento de transferência completo do projeto. Leia integralmente antes de qualquer ação.

---

## 1. O que é o projeto

**FinanceFlow** é um app de controle financeiro pessoal mobile-first (PWA), criado para substituir uma planilha Excel de controle de gastos mensais. O app é multi-usuário, com cada usuário isolado por RLS no Supabase.

- **Repositório GitHub:** https://github.com/nelsonvieiramartins/financeflow
- **Deploy:** Netlify (CI/CD automático via push no branch `master`)
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **Dev local:** `cd financeflow && npm run dev` → http://localhost:5173

---

## 2. Stack técnica

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | React + TypeScript | 19 / 5.9 |
| Build | Vite | 8 |
| CSS | Tailwind CSS v3 | 3.4 |
| Animações | Framer Motion | 12 |
| Drag & Drop | @dnd-kit/core + sortable | 6/10 |
| Gráficos | Recharts | 3 |
| Ícones | Lucide React | 1.7 |
| Backend/Auth | Supabase JS v2 | 2.100 |
| PWA | vite-plugin-pwa | 1.2 |

---

## 3. Estrutura de arquivos

```
financeflow/
├── src/
│   ├── lib/
│   │   ├── supabase.ts          # Cliente Supabase (usa variáveis de ambiente)
│   │   ├── types.ts             # Todos os tipos TypeScript + constantes de label/cor/ícone
│   │   └── utils.ts             # formatCurrency, getInitials, etc.
│   ├── context/
│   │   ├── AuthContext.tsx      # Auth: user, session, profile, signIn, signUp, signOut
│   │   └── AppContext.tsx       # Dados: expenses, income, receivables, investments + CRUD
│   ├── pages/
│   │   ├── AuthPage.tsx         # Login / Cadastro / Recuperar senha
│   │   ├── DashboardPage.tsx    # Visão geral com cards e gráficos
│   │   ├── LancamentosPage.tsx  # Lista completa de lançamentos por seção
│   │   ├── CategoriasPage.tsx   # Análise por categoria
│   │   └── PerfilPage.tsx       # Perfil do usuário + logout
│   ├── components/
│   │   ├── layout/
│   │   │   ├── BottomNav.tsx    # Navegação inferior (Dashboard/Lançamentos/Categorias/Perfil)
│   │   │   └── MonthNavigator.tsx # Seletor de mês ← → com nome do mês
│   │   ├── ui/
│   │   │   ├── BottomSheet.tsx  # Modal que sobe de baixo com overlay e drag handle
│   │   │   └── FAB.tsx          # Botão flutuante "+" para novo lançamento
│   │   ├── dashboard/
│   │   │   ├── BalanceCard.tsx  # Card principal: Receitas vs Gastos vs Saldo
│   │   │   ├── QuickStats.tsx   # Cards menores: fixos, variáveis, a receber
│   │   │   └── CategoryChart.tsx # PieChart por categoria (Recharts)
│   │   └── expenses/
│   │       ├── ExpenseItem.tsx  # Item da lista com swipe-to-delete e drag handle
│   │       └── AddExpenseModal.tsx # Modal de criação/edição de lançamento
├── supabase/
│   └── schema.sql               # Schema completo do banco (executar no Supabase SQL Editor)
├── .env                         # NÃO commitado — criar manualmente (ver seção 5)
├── .env.example                 # Template do .env
├── .npmrc                       # legacy-peer-deps=true (necessário para Netlify + vite-plugin-pwa)
├── netlify.toml                 # Build: npm run build / publish: dist + redirect SPA
├── tailwind.config.js           # Tema customizado: cores, sombras, fontes
└── vite.config.ts               # Plugins: @vitejs/plugin-react + vite-plugin-pwa
```

---

## 4. Design System (Tailwind)

### Cores principais
```
bg-base:     #0F0F14  (fundo principal)
bg-surface:  #1A1A24  (cards)
bg-overlay:  #2E2E42  (inputs, itens)
bg-elevated: #252535  (itens dentro de cards)
primary:     #6C63FF  (roxo principal)
primary-light: #8B84FF
```

### Classes customizadas importantes
```
bg-gradient-primary   → gradiente roxo linear (botões principais)
shadow-glow-primary   → sombra roxa no botão principal
shadow-glow-sm        → sombra roxa menor (tabs ativas)
scrollbar-hide        → esconde scrollbar
safe-top              → padding-top para notch iOS
pb-navbar             → padding-bottom para navbar
```

---

## 5. Variáveis de ambiente

Criar arquivo `financeflow/.env`:
```env
VITE_SUPABASE_URL=https://wfoakpdgycgschxiyhuk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**IMPORTANTE:** A key deve ser a **JWT anon key** (começa com `eyJhbGci`), obtida em:
Supabase Dashboard → Settings → API → "anon public"

Não usar a `sb_publishable_...` — ela não funciona com Auth.

No Netlify, as mesmas variáveis devem estar em:
Site Settings → Environment Variables → `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`

---

## 6. Banco de dados (Supabase)

### Schema já executado em produção
O arquivo `financeflow/supabase/schema.sql` já foi executado no Supabase. As tabelas existem.

### Tabelas
```sql
profiles       -- Perfil do usuário (criado automaticamente via trigger no signup)
expenses       -- Gastos (fixos e variáveis, pix/boleto e cartão)
income         -- Receitas
receivables    -- Valores a receber de outras pessoas
investments    -- Investimentos / poupança
```

### Campos chave da tabela `expenses`
```sql
payment_type  ENUM: 'pix_boleto' | 'cartao_fixo' | 'variavel'
is_recurring  BOOLEAN  -- true = fixo (todo mês), false = variável (eventual)
month         INTEGER  -- 1-12
year          INTEGER  -- ex: 2026
sort_order    INTEGER  -- para drag-and-drop
```

### Como as seções são derivadas (lógica de filtro)
```typescript
fixosPix    = expenses.filter(e => e.payment_type === 'pix_boleto'  && e.is_recurring)
fixosCartao = expenses.filter(e => e.payment_type === 'cartao_fixo' && e.is_recurring)
varPix      = expenses.filter(e => e.payment_type === 'pix_boleto'  && !e.is_recurring)
varCartao   = expenses.filter(e => e.payment_type === 'cartao_fixo' && !e.is_recurring)
legado      = expenses.filter(e => e.payment_type === 'variavel')   // entradas antigas
```

### RLS (Row Level Security)
Todas as tabelas têm RLS ativado com política `auth.uid() = user_id`. Cada usuário só vê e modifica seus próprios dados.

---

## 7. Autenticação

**Arquivo:** `src/context/AuthContext.tsx`

- Login / Cadastro / Logout via Supabase Auth (email + senha)
- Perfil criado automaticamente via trigger SQL no signup
- `signOut` limpa estado local ANTES de chamar Supabase para evitar flash de dados do usuário anterior
- `App.tsx` usa `<AppProvider key={user.id}>` — força remount completo ao trocar de usuário

**AuthPage.tsx** tem 3 modos:
- `login` — email + senha
- `register` — email + senha + confirmação de senha (com indicador verde/vermelho em tempo real)
- `forgot` — envio de email de recuperação via `supabase.auth.resetPasswordForEmail`

---

## 8. Fluxo de dados (AppContext)

**Arquivo:** `src/context/AppContext.tsx`

- Carrega dados do mês/ano atual ao montar
- Recarrega quando `currentMonth` ou `currentYear` mudam
- Tem subscriptions Realtime do Supabase para atualização em tempo real
- Todas as funções CRUD verificam o erro retornado pelo Supabase e lançam exceção se houver problema
- O modal `AddExpenseModal` tem bloco `catch` que captura o erro e exibe mensagem ao usuário

---

## 9. Telas implementadas

### Dashboard (`DashboardPage.tsx`)
- Saudação personalizada (Bom dia/tarde/noite + primeiro nome)
- MonthNavigator para navegar entre meses
- BalanceCard: total receitas vs gastos vs saldo
- QuickStats: gastos fixos, variáveis, a receber pendente
- CategoryChart: PieChart com distribuição por categoria
- Card de investimentos (aparece só se houver dados)
- Empty state quando não há dados no mês

### Lançamentos (`LancamentosPage.tsx`)
- 6 seções colapsáveis com total por seção:
  1. Gastos Fixos · Pix/Boleto (vermelho)
  2. Gastos Fixos · Cartão (roxo)
  3. Gastos Variáveis · Pix/Boleto (laranja)
  4. Gastos Variáveis · Cartão (azul)
  5. Receitas (verde)
  6. A Receber (amarelo)
  7. Investimentos (verde escuro)
- Drag & drop para reordenar dentro de cada seção (@dnd-kit)
- Botão "+ Adicionar" dentro de cada seção de despesas

### Modal de Novo Lançamento (`AddExpenseModal.tsx`)
- Tabs: Gasto / Receita / A Receber / Investimento
- Campo valor em formato BR (R$ 0,00) com input numérico
- Para Gasto: seleção de categoria (grid 5 colunas), tipo (Fixo/Variável), método (Pix/Cartão), data limite (opcional)
- Para Receita: seleção de fonte (Salário/Benefício/Freelance/Investimento/Outros)
- Para A Receber: campo "De quem"
- Observações (textarea, opcional)
- Suporte a edição (recebe `editExpense` prop)

### Categorias (`CategoriasPage.tsx`)
- Análise dos gastos por categoria do mês atual

### Perfil (`PerfilPage.tsx`)
- Dados do usuário
- Botão de logout

---

## 10. Problemas já resolvidos (não repetir)

| Problema | Solução |
|---|---|
| TypeScript `verbatimModuleSyntax` | Usar `import type` para todos os tipos |
| `react-is` não encontrado (recharts) | `npm install react-is --legacy-peer-deps` |
| Netlify ERESOLVE (vite-plugin-pwa vs Vite 8) | `.npmrc` com `legacy-peer-deps=true` |
| Supabase: chave `sb_publishable_` não funciona com Auth | Usar JWT anon key (`eyJhbGci...`) |
| Email de confirmação bloqueando cadastro | Desativar "Confirm email" em Supabase Auth → Providers → Email |
| Dados do usuário anterior visíveis após troca | `signOut` limpa state sincronamente + `key={user.id}` no AppProvider |
| `seed.js` erro ES module | Renomear para `seed.cjs` |
| `handleSubmit` travado em "Salvando..." | AppContext verifica `error` do Supabase e lança; modal tem bloco `catch` |

---

## 11. Comandos úteis

```bash
# Instalar dependências
cd financeflow && npm install --legacy-peer-deps

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Deploy: basta fazer push para o GitHub — Netlify faz o deploy automaticamente
git add . && git commit -m "mensagem" && git push
```

---

## 12. Possíveis próximos passos (não solicitados ainda)

- Marcar "A Receber" como recebido (toggle `received`)
- Editar Receitas, A Receber e Investimentos (só Gastos têm edição hoje)
- Exportar dados do mês para PDF ou planilha
- Copiar lançamentos fixos do mês anterior para o mês atual
- Notificações de gastos próximos ao vencimento (`due_date`)
- Gráfico de evolução mensal (múltiplos meses comparados)
- Limite de orçamento por categoria
- Tema claro

---

## 13. Credenciais e acessos

- **Supabase projeto:** `wfoakpdgycgschxiyhuk.supabase.co`
- **GitHub repo:** https://github.com/nelsonvieiramartins/financeflow
- **Netlify:** conectado ao GitHub, deploy automático no push para `master`
- **Usuário de teste:** criado pelo próprio usuário via tela de cadastro do app

---

*Gerado em 2026-03-29 — commit mais recente: `dd35962` (Fix: exibir erro Supabase em vez de travar no Salvando)*
