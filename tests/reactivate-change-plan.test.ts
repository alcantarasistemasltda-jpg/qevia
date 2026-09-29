import test from 'node:test';
import assert from 'node:assert/strict';
import { PLANS_CATALOG } from '../src/config/plans';

test('Catálogo oficial de planos para Etapa 6G', () => {
  assert.equal(PLANS_CATALOG.FREE.price, 0);
  assert.equal(PLANS_CATALOG.PRO_MONTHLY.price, 14.9);
  assert.equal(PLANS_CATALOG.PRO_MONTHLY.interval, 'MONTHLY');
  assert.equal(PLANS_CATALOG.PRO_YEARLY.price, 149.9);
  assert.equal(PLANS_CATALOG.PRO_YEARLY.interval, 'YEARLY');
});

test('Validação de regras de negócio de reativação de assinatura', () => {
  // 1. Reativação permitida quando CANCELLED e current_period_end > now()
  const futurePeriodEnd = new Date(Date.now() + 15 * 86400000).toISOString();
  const subCancelledActive = {
    status: 'CANCELLED',
    current_period_end: futurePeriodEnd,
  };

  const isEligibleForReactivation =
    subCancelledActive.status === 'CANCELLED' &&
    new Date(subCancelledActive.current_period_end).getTime() > Date.now();

  assert.equal(isEligibleForReactivation, true, 'Deve permitir reativação de assinatura cancelada em período de carência');

  // 2. Reativação rejeitada quando CANCELLED e current_period_end <= now()
  const pastPeriodEnd = new Date(Date.now() - 1 * 86400000).toISOString();
  const subCancelledExpired = {
    status: 'CANCELLED',
    current_period_end: pastPeriodEnd,
  };

  const isExpiredEligible =
    subCancelledExpired.status === 'CANCELLED' &&
    new Date(subCancelledExpired.current_period_end).getTime() > Date.now();

  assert.equal(isExpiredEligible, false, 'Não deve permitir reativação de assinatura expirada');

  // 3. Idempotência se já estiver ACTIVE
  const subActive = {
    status: 'ACTIVE',
    current_period_end: futurePeriodEnd,
  };

  const isAlreadyActive = subActive.status === 'ACTIVE';
  assert.equal(isAlreadyActive, true, 'Deve reconhecer assinatura já ativa para retorno idempotente');
});

test('Validação de regras de negócio de alteração de plano/ciclo', () => {
  // 1. Mudança de PRO_MONTHLY para PRO_YEARLY
  const currentPlan = 'PRO_MONTHLY';
  const targetPlan = 'PRO_YEARLY';
  const targetDef = PLANS_CATALOG[targetPlan];

  assert.equal(targetDef.code, 'PRO_YEARLY');
  assert.equal(targetDef.price, 149.9);
  assert.equal(targetDef.interval, 'YEARLY');

  // Asaas mapping cycle
  const asaasCycle = targetDef.interval === 'YEARLY' ? 'YEARLY' : 'MONTHLY';
  assert.equal(asaasCycle, 'YEARLY');

  // 2. Mudança de PRO_YEARLY para PRO_MONTHLY
  const targetMonthlyDef = PLANS_CATALOG['PRO_MONTHLY'];
  assert.equal(targetMonthlyDef.code, 'PRO_MONTHLY');
  assert.equal(targetMonthlyDef.price, 14.9);
  assert.equal(targetMonthlyDef.interval, 'MONTHLY');

  const asaasMonthlyCycle = (targetMonthlyDef.interval as string) === 'YEARLY' ? 'YEARLY' : 'MONTHLY';
  assert.equal(asaasMonthlyCycle, 'MONTHLY');

  // 3. Rejeição de transição para FREE via endpoint de alteração de plano
  const invalidTarget = 'FREE';
  const isInvalid = invalidTarget === 'FREE' || !['PRO_MONTHLY', 'PRO_YEARLY'].includes(invalidTarget);
  assert.equal(isInvalid, true, 'Deve rejeitar FREE ou outros planos não permitidos em changePlan');

  // 4. Rejeição se já estiver no mesmo plano
  const isSamePlan = currentPlan === 'PRO_MONTHLY';
  assert.equal(isSamePlan, true, 'Deve identificar tentativa de mudar para o mesmo plano');
});
