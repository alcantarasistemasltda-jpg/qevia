# GUIA OPERACIONAL E CHECKLIST DE GO-LIVE — BILLING QEVIA & ASAAS

Este documento consolida os requisitos, configurações de produção, validações de arquitetura e procedimentos de verificação para o Go-Live oficial do módulo de faturamento (Billing) do **QEVIA** integrado ao gateway **ASAAS**.

---

## 1. Visão Geral da Arquitetura de Billing

O QEVIA opera no modelo de assinatura recorrente com catálogo comercial padronizado:
- **FREE**: Gratuito (R$ 0,00) — sem necessidade de checkout ou cobrança.
- **PRO_MONTHLY**: R$ 14,90 / mês (14 dias de Trial inicial).
- **PRO_YEARLY**: R$ 149,90 / ano (14 dias de Trial inicial — desconto correspondente a ~16%).

### Invariantes de Negócio
1. Preços e ciclos resolvidos **exclusivamente no servidor** através de `PLANS_CATALOG`. O cliente envia somente `planCode`.
2. Segregação multi-tenant rigorosa baseada em `auth.uid()`. Nenhuma operação de billing aceita `userId` arbitrário via payload/parâmetro.
3. Chave de API do ASAAS (`ASAAS_API_KEY`) e tokens são estritamente isolados no servidor.
4. **Preservação de Vigência Paga**: em caso de cancelamento agendado (`CANCELLED`), o cliente mantém acesso a todos os recursos PRO até o fim do ciclo pago (`current_period_end`).
5. **Reativação Segura**: assinaturas em estado `CANCELLED` podem ser reativadas sem cobrança imediata duplicada caso `current_period_end > now()`, mantendo o `nextDueDate` para a data de renovação original.
6. **Alteração de Ciclo**: a mudança entre mensal e anual é programada para o próximo vencimento (`updatePendingPayments: false`), sem gerar cobrança duplicada imediata.

---

## 2. Variáveis de Ambiente de Produção

As seguintes variáveis devem ser preenchidas no ambiente de produção (ex.: Vercel / Servidor de Aplicação) sem commit no repositório:

```env
# -------------------------------------------------------------
# Supabase Configuration
# -------------------------------------------------------------
NEXT_PUBLIC_SUPABASE_URL=https://[seu-projeto].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key-publica]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key-privada]

# -------------------------------------------------------------
# ASAAS Gateway Configuration (Produção)
# -------------------------------------------------------------
ASAAS_ENVIRONMENT=production
ASAAS_API_KEY=[sua-chave-de-api-de-producao-asaas]
ASAAS_WEBHOOK_ACCESS_TOKEN=[token-secreto-definido-no-painel-asaas]

# -------------------------------------------------------------
# Billing Core Settings
# -------------------------------------------------------------
BILLING_TRIAL_DAYS=14
```

> **Atenção**: Nunca utilize o endpoint de Sandbox em produção (`ASAAS_ENVIRONMENT=production` aponta automaticamente para `https://api.asaas.com/v3`).

---

## 3. Configuração do Webhook no Painel do ASAAS

No painel de administração da conta de produção do ASAAS, configure o Webhook com os seguintes parâmetros:

1. **URL de Destino**:
   ```text
   https://[dominio-oficial-qevia]/api/webhooks/asaas
   ```
2. **Versão da API**: `v3`
3. **Token de Autenticação**: Informe exatamente a mesma string configurada na variável `ASAAS_WEBHOOK_ACCESS_TOKEN`.
4. **Eventos a serem Habilitados**:
   - `PAYMENT_CONFIRMED`
   - `PAYMENT_RECEIVED`
   - `PAYMENT_OVERDUE`
   - `PAYMENT_REFUNDED`
   - `PAYMENT_CHARGEBACK_REQUESTED`
   - `PAYMENT_CHARGEBACK_DISPUTE`
   - `SUBSCRIPTION_CREATED`
   - `SUBSCRIPTION_UPDATED`
   - `SUBSCRIPTION_DELETED`
   - `SUBSCRIPTION_INACTIVATED`
5. **Fila de Sincronização / Idempotência**: O webhook do QEVIA registra o `event_id` na tabela `public.webhook_events`, respondendo status `200` para eventos já processados e garantindo proteção contra eventos fora de ordem.

---

## 4. Rota de Health Check Operacional

Após o deploy e antes do primeiro teste de cobrança real, execute uma chamada autenticada:

```http
GET /api/billing/health
```

**Resposta Esperada**:
```json
{
  "success": true,
  "health": {
    "status": "ok",
    "application": "ok",
    "database": "ok",
    "billing": "ok",
    "asaas": "configured",
    "asaasEnvironment": "production",
    "webhook": "configured",
    "timestamp": "2026-10-05T..."
  },
  "config": {
    "isValid": true,
    "environment": "production",
    "variables": [
      { "name": "NEXT_PUBLIC_SUPABASE_URL", "configured": true },
      { "name": "NEXT_PUBLIC_SUPABASE_ANON_KEY", "configured": true },
      { "name": "SUPABASE_SERVICE_ROLE_KEY", "configured": true },
      { "name": "ASAAS_ENVIRONMENT", "configured": true },
      { "name": "ASAAS_API_KEY", "configured": true },
      { "name": "ASAAS_WEBHOOK_ACCESS_TOKEN", "configured": true },
      { "name": "BILLING_TRIAL_DAYS", "configured": true }
    ]
  }
}
```

---

## 5. Checklist de Verificação Passo a Passo (Go-Live)

| Etapa | Ação | Critério de Sucesso | Status |
| :--- | :--- | :--- | :--- |
| **1. Migrations** | Aplicar migrations `20260929000001` a `20260929000004` no Supabase de produção. | Tabelas `profiles` (novas colunas), `subscriptions` e `webhook_events` com RLS ativo. | [ ] |
| **2. Variáveis** | Cadastrar variáveis de ambiente no painel de hospedagem. | Nenhuma secret nula; `ASAAS_ENVIRONMENT=production`. | [ ] |
| **3. Health Check** | Chamar `GET /api/billing/health` com usuário autenticado. | `"status": "ok"`, `"billing": "ok"`, `"isValid": true`. | [ ] |
| **4. Webhook** | Configurar URL e token secreto no painel ASAAS. | Teste de ping do webhook retorna HTTP 200. | [ ] |
| **5. Teste Piloto** | Criar conta teste interna, completar cadastro com CPF real e efetuar checkout de R$ 14,90. | Cliente criado no ASAAS, assinatura criada e link de pagamento retornado. | [ ] |
| **6. Confirmação** | Pagar fatura piloto via PIX/Cartão e aguardar webhook. | Assinatura atualizada para `ACTIVE` e acesso PRO liberado na interface. | [ ] |
| **7. Cancelamento** | Agendar cancelamento pelo `/app/assinatura`. | Status `CANCELLED`, porém acesso permanece liberado até o fim do mês pago. | [ ] |
| **8. Reativação** | Clicar em "Reativar Assinatura". | Status retorna para `ACTIVE` no Supabase e ASAAS sem cobrança duplicada. | [ ] |
| **9. Mudança de Ciclo** | Mudar para Anual. | Ciclo atualizado no ASAAS com cobrança programada para o próximo vencimento. | [ ] |

---

## 6. Procedimento de Rollback Operacional

Caso ocorra indisponibilidade no gateway de pagamento ou erro sistêmico imprevisto:

1. **Desativação Temporária de Checkout**:
   - Os usuários no plano `TRIAL` continuam utilizando a aplicação normalmente pelos 14 dias previstos.
   - Assinaturas `ACTIVE` continuam com vigência liberada através da regra `getAccessInfo()`.
2. **Reversão de Assinaturas Inconsistentes**:
   - A tabela `webhook_events` armazena o histórico e payload bruto de todas as tentativas, permitindo reprocessamento idempotente seguro.
3. **Contato de Suporte do ASAAS**:
   - Canal de suporte oficial ASAAS para verificação de status de conta e liberação de recebíveis.

---

## 7. Critérios Finais de Aprovação para Produção

- [x] Zero secrets expostas no frontend ou logs.
- [x] Prevenção de timeouts com reconciliação de checkout por `externalReference`.
- [x] Proteção contra eventos fora de ordem e duplicados no webhook.
- [x] 100% de aprovação na suite de testes automatizados (`npm test`).
- [x] Compilação TypeScript estrita (`npx tsc --noEmit`) sem erros.
- [x] Linter (`npm run lint`) limpo sem erros ou advertências.
- [x] Build de produção Next.js (`npm run build`) validado.
