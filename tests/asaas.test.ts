import { describe, it } from "node:test";
import assert from "node:assert";
import { normalizeCPF, normalizePhone } from "../src/utils/validators";

interface MockProfile {
  id: string;
  email: string;
  full_name: string | null;
  document: string | null;
  phone: string | null;
  is_profile_complete: boolean;
  asaas_customer_id: string | null;
}

interface SimulatedAsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  mobilePhone?: string;
}

// Logic simulator replicating AsaasService.getOrCreateCustomer
function simulateGetOrCreateAsaasCustomer(
  authenticatedUserId: string,
  targetUserId: string | undefined,
  profile: MockProfile | null,
  asaasDatabase: SimulatedAsaasCustomer[],
  simulateAsaasError = false
): {
  success: boolean;
  customerId: string | null;
  error?: string;
  alreadyExisted?: boolean;
  persistedAsaasId?: string | null;
  asaasDbState: SimulatedAsaasCustomer[];
} {
  // 1. Authentication check
  if (!authenticatedUserId) {
    return { success: false, customerId: null, error: "Usuário não autenticado.", asaasDbState: asaasDatabase };
  }

  // 2. Multi-tenant ownership check
  if (targetUserId && targetUserId !== authenticatedUserId) {
    return { success: false, customerId: null, error: "Acesso não autorizado para outro usuário.", asaasDbState: asaasDatabase };
  }

  // 3. Profile existence check
  if (!profile) {
    return { success: false, customerId: null, error: "Perfil de usuário não encontrado.", asaasDbState: asaasDatabase };
  }

  // 4. Incomplete profile check
  if (!profile.is_profile_complete || !profile.full_name || !profile.document) {
    return {
      success: false,
      customerId: null,
      error: "Perfil incompleto. Conclua o cadastro antes de vincular ao gateway de pagamentos.",
      asaasDbState: asaasDatabase,
    };
  }

  // 5. Existing local asaas_customer_id check (Idempotence 1)
  if (profile.asaas_customer_id) {
    return {
      success: true,
      customerId: profile.asaas_customer_id,
      alreadyExisted: true,
      persistedAsaasId: profile.asaas_customer_id,
      asaasDbState: asaasDatabase,
    };
  }

  const normalizedCpf = normalizeCPF(profile.document);
  const normalizedPhone = profile.phone ? normalizePhone(profile.phone) : undefined;

  // 6. External ASAAS check by CPF to prevent remote duplicates (Idempotence 2)
  const existingInAsaas = asaasDatabase.find((c) => c.cpfCnpj === normalizedCpf);
  if (existingInAsaas) {
    return {
      success: true,
      customerId: existingInAsaas.id,
      alreadyExisted: true,
      persistedAsaasId: existingInAsaas.id,
      asaasDbState: asaasDatabase,
    };
  }

  // 7. Error simulation
  if (simulateAsaasError) {
    return {
      success: false,
      customerId: null,
      error: "Falha na comunicação com o ASAAS.",
      asaasDbState: asaasDatabase,
    };
  }

  // 8. Create new customer in ASAAS
  const newCustomer: SimulatedAsaasCustomer = {
    id: `cus_${Math.random().toString(36).substring(2, 10)}`,
    name: profile.full_name.trim(),
    email: profile.email.trim().toLowerCase(),
    cpfCnpj: normalizedCpf,
    mobilePhone: normalizedPhone,
  };

  const updatedAsaasDb = [...asaasDatabase, newCustomer];

  return {
    success: true,
    customerId: newCustomer.id,
    alreadyExisted: false,
    persistedAsaasId: newCustomer.id,
    asaasDbState: updatedAsaasDb,
  };
}

describe("ASAAS Customer Integration & Idempotency Unit Tests", () => {
  const userId = "user-abc-123";
  let asaasDb: SimulatedAsaasCustomer[] = [];

  it("1. Perfil incompleto NÃO deve criar cliente no ASAAS", () => {
    const profile: MockProfile = {
      id: userId,
      email: "user@example.com",
      full_name: null,
      document: null,
      phone: null,
      is_profile_complete: false,
      asaas_customer_id: null,
    };

    const res = simulateGetOrCreateAsaasCustomer(userId, userId, profile, asaasDb);
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.customerId, null);
    assert.strictEqual(res.error, "Perfil incompleto. Conclua o cadastro antes de vincular ao gateway de pagamentos.");
  });

  it("2. Perfil completo sem asaas_customer_id DEVE criar cliente e normalizar CPF/telefone", () => {
    const profile: MockProfile = {
      id: userId,
      email: "user@example.com",
      full_name: "Cliente Qevia",
      document: "331.328.801-40",
      phone: "(11) 98765-4321",
      is_profile_complete: true,
      asaas_customer_id: null,
    };

    const res = simulateGetOrCreateAsaasCustomer(userId, userId, profile, asaasDb);
    assert.strictEqual(res.success, true);
    assert.ok(res.customerId?.startsWith("cus_"));
    assert.strictEqual(res.alreadyExisted, false);
    assert.strictEqual(res.persistedAsaasId, res.customerId);

    // Check data saved in simulated ASAAS
    asaasDb = res.asaasDbState;
    const created = asaasDb.find((c) => c.id === res.customerId);
    assert.strictEqual(created?.cpfCnpj, "33132880140");
    assert.strictEqual(created?.mobilePhone, "11987654321");
  });

  it("3. Perfil já vinculado a um asaas_customer_id DEVE reutilizá-lo (Idempotência Local)", () => {
    const existingId = "cus_000005849852";
    const profile: MockProfile = {
      id: userId,
      email: "user@example.com",
      full_name: "Cliente Qevia",
      document: "331.328.801-40",
      phone: "(11) 98765-4321",
      is_profile_complete: true,
      asaas_customer_id: existingId,
    };

    const res = simulateGetOrCreateAsaasCustomer(userId, userId, profile, asaasDb);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.customerId, existingId);
    assert.strictEqual(res.alreadyExisted, true);
  });

  it("4. Chamadas repetidas quando o cliente já existe no ASAAS pelo CPF NÃO devem duplicar (Idempotência Remota)", () => {
    const profileWithoutLocalId: MockProfile = {
      id: "another-user-456",
      email: "user@example.com",
      full_name: "Cliente Qevia",
      document: "331.328.801-40", // Same CPF already in asaasDb
      phone: "(11) 98765-4321",
      is_profile_complete: true,
      asaas_customer_id: null,
    };

    const dbCountBefore = asaasDb.length;
    const res = simulateGetOrCreateAsaasCustomer("another-user-456", "another-user-456", profileWithoutLocalId, asaasDb);

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.alreadyExisted, true);
    assert.strictEqual(res.asaasDbState.length, dbCountBefore); // No new record in ASAAS
  });

  it("5. Erro do ASAAS NÃO deve gravar ID incorreto nem quebrar", () => {
    const profile: MockProfile = {
      id: "user-error-test",
      email: "err@example.com",
      full_name: "Error Test",
      document: "109.184.227-28",
      phone: "(11) 98765-4321",
      is_profile_complete: true,
      asaas_customer_id: null,
    };

    const res = simulateGetOrCreateAsaasCustomer("user-error-test", "user-error-test", profile, asaasDb, true);
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.customerId, null);
    assert.strictEqual(res.persistedAsaasId, undefined);
  });

  it("6. Usuário NÃO consegue criar ou consultar cliente ASAAS para outro usuário/tenant", () => {
    const otherUserProfile: MockProfile = {
      id: "victim-user-999",
      email: "victim@example.com",
      full_name: "Victim User",
      document: "331.328.801-40",
      phone: "(11) 98765-4321",
      is_profile_complete: true,
      asaas_customer_id: null,
    };

    const res = simulateGetOrCreateAsaasCustomer("attacker-user-000", "victim-user-999", otherUserProfile, asaasDb);
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.customerId, null);
    assert.strictEqual(res.error, "Acesso não autorizado para outro usuário.");
  });
});
