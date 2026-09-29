# Inventário e Auditoria de Migrations do QEVIA

Este documento apresenta a auditoria técnica de todos os scripts SQL contidos no diretório `supabase/migrations`, especificando as tabelas, colunas, funções, políticas de segurança (RLS), dependências e a ordem exata de execução no **Supabase SQL Editor**.

---

## 1. Visão Geral das Migrations

| Ordem | Arquivo | Natureza | Descrição Sumária |
| :---: | :--- | :---: | :--- |
| **1º** | `20260928000001_create_financial_core.sql` | **Fundacional** | Criação das extensões, triggers globais, profiles, contas, categorias, cartões de crédito, recorrências, parcelamentos, transferências, transações, compromissos financeiros, orçamentos, alertas e 100% das políticas de RLS fundamentais. |
| **2º** | `20260928000002_audit_and_hardening.sql` | **Incremental / Endurecimento** | Criação da entidade `credit_card_invoices` (faturas), suporte a `INVOICE_PAYMENT`, proteção contra ciclos em categorias, verificação de propriedade multi-tenant em transações, funções utilitárias em PL/pgSQL para saldo/patrimônio e RLS de faturas. |

---

## 2. Detalhamento Técnico das Migrations

### 📄 Migration 1 (Fundacional)
* **Nome completo:** `20260928000001_create_financial_core.sql`
* **Tipo:** Fundacional (Base do Banco de Dados)
* **Extensões & Funções Globais:**
  * `uuid-ossp`, `pgcrypto`
  * Função `handle_updated_at()` (gatilho de timestamps automáticos)
  * Função `handle_new_user()` e Trigger `on_auth_user_created` em `auth.users` (Provisionamento automático de perfil)
* **Tabelas Criadas (11 tabelas):**
  1. `public.profiles` (Extensão de `auth.users`, moeda padrão BRL)
  2. `public.accounts` (Contas bancárias, carteiras, investimentos)
  3. `public.categories` (Hierarquia de categorias de receitas/despesas)
  4. `public.credit_cards` (Cartões de crédito, limites, datas de corte e vencimento)
  5. `public.recurrences` (Assinaturas e despesas/receitas recorrentes)
  6. `public.installments` (Operações parceladas agregadas)
  7. `public.installment_items` (Parcelas individuais)
  8. `public.transfers` (Transferências entre contas)
  9. `public.transactions` (Lançamentos e extrato de transações)
  10. `public.financial_commitments` (Contas a pagar e a receber com previsão futura)
  11. `public.budgets` (Metas e tetos orçamentários por categoria)
  12. `public.alerts` (Notificações do motor de alertas)
* **Políticas de Segurança (RLS):**
  * Habilitado em todas as 12 tabelas com isolamento multi-tenant estrito (`auth.uid() = user_id` / `auth.uid() = id`) cobrindo `SELECT`, `INSERT`, `UPDATE` e `DELETE`.
* **Índices de Performance:**
  * Índices compostos por `user_id`, datas, status, tipos e chaves estrangeiras.

---

### 📄 Migration 2 (Incremental / Endurecimento)
* **Nome completo:** `20260928000002_audit_and_hardening.sql`
* **Tipo:** Incremental (Requer que a Migration 1 tenha sido executada previamente)
* **Dependência:** Total da `20260928000001_create_financial_core.sql` (referencia `auth.users`, `credit_cards`, `transactions`, `installment_items`, `accounts`, `categories`).
* **Tabelas Criadas:**
  1. `public.credit_card_invoices` (Faturas de cartão de crédito: ciclo, fechamento, vencimento, valor total, valor pago e status)
* **Alterações de Colunas e Constraints:**
  * `transactions`: adição da coluna `invoice_id` (FK para `credit_card_invoices`)
  * `transactions`: expansão da constraint `type` para aceitar `'INVOICE_PAYMENT'`
  * `credit_card_invoices`: adição de FK `payment_transaction_id` apontando para `transactions(id)`
  * `installment_items`: adição da coluna `invoice_id` (FK para `credit_card_invoices`)
* **Funções e Triggers de Segurança/Integridade:**
  * `check_category_hierarchy_cycle()` + trigger `trg_prevent_category_cycle`: Impede loops infinitos em categorias multi-nível (A -> B -> C -> A) até 20 níveis.
  * `verify_transaction_ownership()` + trigger `trg_verify_transaction_ownership`: Impede violação multi-tenant (garante que conta, cartão e categoria pertençam ao mesmo `user_id` da transação).
* **Funções SQL PL/pgSQL Otimizadas:**
  * `get_account_realized_balance(p_account_id UUID)`: Cálculo exato do saldo realizado da conta (Saldo Inicial + Receitas - Despesas - Pagamentos de Fatura + Transferências In - Transferências Out).
  * `get_user_net_worth(p_user_id UUID)`: Cálculo do patrimônio líquido consolidado.
  * `get_credit_card_used_limit(p_card_id UUID)`: Cálculo do limite comprometido no cartão de crédito.
* **Políticas de Segurança (RLS):**
  * Políticas de isolamento multi-tenant para `credit_card_invoices` (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).

---

## 3. Mapeamento por Módulo Funcional do QEVIA

| Módulo da Aplicação | Tabelas e Entidades Responsáveis | Migration de Origem |
| :--- | :--- | :---: |
| **Contas** (`/app/contas`) | `accounts`, `transfers`, `get_account_realized_balance` | 000001 + 000002 |
| **Transações** (`/app/transacoes`) | `transactions`, `transfers`, `verify_transaction_ownership` | 000001 + 000002 |
| **Categorias** (Planejamento) | `categories`, `check_category_hierarchy_cycle` | 000001 + 000002 |
| **Cartões de Crédito** (`/app/cartoes`) | `credit_cards`, `get_credit_card_used_limit` | 000001 + 000002 |
| **Faturas** (`/app/cartoes/[id]/faturas`) | `credit_card_invoices`, `transactions.invoice_id` | 000002 |
| **Compromissos** (`/app/compromissos`) | `financial_commitments` | 000001 |
| **Recorrências** (Assinaturas) | `recurrences` | 000001 |
| **Parcelamentos** | `installments`, `installment_items` | 000001 + 000002 |
| **Orçamentos** (`/app/planejamento`) | `budgets` | 000001 |
| **Alertas** (`/app/alertas`) | `alerts` | 000001 |
| **Relatórios / Dashboard** | `transactions`, `categories`, `accounts`, `get_user_net_worth` | 000001 + 000002 |

---

## 4. Diagnóstico de Integridade

- **Duplicidades:** Nenhuma.
- **Conflitos:** Nenhum conflito identificado.
- **Obsoletas:** Nenhuma migration descartável ou redundante.
- **Completude:** O conjunto cobre 100% dos requisitos de banco do QEVIA (Auth, Multi-tenancy RLS, Triggers, Ciclos, Faturas e Integridade Referencial).

---

## 5. Ordem Exata de Execução Recomendada (Supabase SQL Editor)

Caso vá configurar um novo ambiente Supabase ou rodar manualmente no **SQL Editor**, execute os scripts nesta ordem rigorosa:

```text
Passo 1: supabase/migrations/20260928000001_create_financial_core.sql
Passo 2: supabase/migrations/20260928000002_audit_and_hardening.sql
```
