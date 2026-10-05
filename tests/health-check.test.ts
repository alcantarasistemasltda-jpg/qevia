import test from 'node:test';
import assert from 'node:assert/strict';
import { BillingService } from '../src/services/billing.service';

test('BillingService.validateConfig: validação de variáveis de ambiente', () => {
  const originalEnv = { ...process.env };

  // 1. Cenário: Todas as variáveis configuradas corretamente para produção
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-test-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-key';
  process.env.ASAAS_ENVIRONMENT = 'production';
  process.env.ASAAS_API_KEY = 'asaas-prod-key';
  process.env.ASAAS_WEBHOOK_ACCESS_TOKEN = 'webhook-access-token';
  process.env.BILLING_TRIAL_DAYS = '14';

  const validResult = BillingService.validateConfig();
  assert.equal(validResult.isValid, true);
  assert.equal(validResult.environment, 'production');
  assert.equal(validResult.variables.every((v) => v.configured), true);

  // 2. Cenário: Variável ausente ou vazia
  delete process.env.ASAAS_API_KEY;
  const invalidResult = BillingService.validateConfig();
  assert.equal(invalidResult.isValid, false);
  const asaasVar = invalidResult.variables.find((v) => v.name === 'ASAAS_API_KEY');
  assert.equal(asaasVar?.configured, false);

  // 3. Cenário: Ambiente incorreto
  process.env.ASAAS_API_KEY = 'asaas-prod-key';
  process.env.ASAAS_ENVIRONMENT = 'sandbox';
  const sandboxResult = BillingService.validateConfig();
  assert.equal(sandboxResult.isValid, false, 'Deve ser inválido para produção se ASAAS_ENVIRONMENT for sandbox');

  // Restaurar variáveis originais
  process.env = originalEnv;
});

test('BillingService.getHealthStatus: estrutura do retorno do health check', async () => {
  const originalKey = process.env.ASAAS_API_KEY;
  const originalWebhook = process.env.ASAAS_WEBHOOK_ACCESS_TOKEN;
  const originalEnv = process.env.ASAAS_ENVIRONMENT;

  process.env.ASAAS_API_KEY = 'prod_api_key_test';
  process.env.ASAAS_WEBHOOK_ACCESS_TOKEN = 'webhook_token_test';
  process.env.ASAAS_ENVIRONMENT = 'production';

  const health = await BillingService.getHealthStatus();

  assert.equal(health.application, 'ok');
  assert.equal(health.asaas, 'configured');
  assert.equal(health.asaasEnvironment, 'production');
  assert.equal(health.webhook, 'configured');
  assert.ok(health.timestamp);

  // Restaurar
  process.env.ASAAS_API_KEY = originalKey;
  process.env.ASAAS_WEBHOOK_ACCESS_TOKEN = originalWebhook;
  process.env.ASAAS_ENVIRONMENT = originalEnv;
});
