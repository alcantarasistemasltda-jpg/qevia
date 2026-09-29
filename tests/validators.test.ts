import { describe, it } from "node:test";
import assert from "node:assert";
import {
  validateCPF,
  formatCPF,
  normalizeCPF,
  validatePhone,
  formatPhone,
  normalizePhone,
} from "../src/utils/validators";

describe("CPF and Phone Validation & Formatting Unit Tests", () => {
  // Test cases for CPF
  const validCPFFormatted = "331.328.801-40";
  const validCPFUnformatted = "33132880140";
  const anotherValidCPF = "10918422728";
  const invalidChecksumCPF = "33132880141";
  const repeatedDigitsCPF = "11111111111";
  const shortCPF = "123456789";

  it("should validate CPF with mask correctly", () => {
    assert.strictEqual(validateCPF(validCPFFormatted), true);
  });

  it("should validate CPF without mask correctly", () => {
    assert.strictEqual(validateCPF(validCPFUnformatted), true);
    assert.strictEqual(validateCPF(anotherValidCPF), true);
  });

  it("should reject CPF with invalid checksum digits", () => {
    assert.strictEqual(validateCPF(invalidChecksumCPF), false);
  });

  it("should reject CPF with repeated digits", () => {
    assert.strictEqual(validateCPF(repeatedDigitsCPF), false);
    assert.strictEqual(validateCPF("00000000000"), false);
    assert.strictEqual(validateCPF("99999999999"), false);
  });

  it("should reject short or empty CPF", () => {
    assert.strictEqual(validateCPF(shortCPF), false);
    assert.strictEqual(validateCPF(""), false);
    assert.strictEqual(validateCPF(null), false);
  });

  it("should normalize CPF to digits only", () => {
    assert.strictEqual(normalizeCPF(validCPFFormatted), validCPFUnformatted);
    assert.strictEqual(normalizeCPF(` ${validCPFFormatted} `), validCPFUnformatted);
    assert.strictEqual(normalizeCPF("abc"), "");
  });

  it("should format CPF with visual mask", () => {
    assert.strictEqual(formatCPF(validCPFUnformatted), validCPFFormatted);
    assert.strictEqual(formatCPF(validCPFUnformatted.slice(0, 6)), validCPFFormatted.slice(0, 7));
    assert.strictEqual(formatCPF(validCPFUnformatted.slice(0, 9)), validCPFFormatted.slice(0, 11));
  });

  it("should validate and format phone numbers", () => {
    assert.strictEqual(validatePhone("(11) 98765-4321"), true);
    assert.strictEqual(validatePhone("11987654321"), true);
    assert.strictEqual(validatePhone("1133334444"), true);
    assert.strictEqual(validatePhone("00987654321"), false); // Invalid DDD 00
    assert.strictEqual(validatePhone("11111111111"), false); // Repeated digits
    assert.strictEqual(formatPhone("11987654321"), "(11) 98765-4321");
    assert.strictEqual(normalizePhone("(11) 98765-4321"), "11987654321");
  });
});

describe("Profile Completion Business Logic Tests", () => {
  // Simulating validation logic executed by updateProfile
  const validateProfileCompletionPayload = (dto: {
    fullName?: string;
    document?: string | null;
    phone?: string | null;
    isProfileComplete?: boolean;
  }) => {
    const normalizedDocument = dto.document !== undefined ? (dto.document ? normalizeCPF(dto.document) : null) : undefined;
    const normalizedPhone = dto.phone !== undefined ? (dto.phone ? normalizePhone(dto.phone) : null) : undefined;

    if (dto.isProfileComplete === true) {
      if (!dto.fullName || dto.fullName.trim().length < 3) {
        return { valid: false, error: "Nome completo é obrigatório para concluir o cadastro." };
      }
      if (!normalizedDocument || !validateCPF(normalizedDocument)) {
        return { valid: false, error: "CPF válido é obrigatório para concluir o cadastro." };
      }
      if (!normalizedPhone || !validatePhone(normalizedPhone)) {
        return { valid: false, error: "Telefone de contato válido (com DDD) é obrigatório para concluir o cadastro." };
      }
    } else if (normalizedDocument && !validateCPF(normalizedDocument)) {
      return { valid: false, error: "O CPF informado é inválido." };
    }

    return { valid: true, error: null, normalizedDocument, normalizedPhone };
  };

  it("should fail when completing profile without CPF", () => {
    const res = validateProfileCompletionPayload({
      fullName: "Fulano de Tal",
      phone: "11987654321",
      isProfileComplete: true,
    });
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.error, "CPF válido é obrigatório para concluir o cadastro.");
  });

  it("should fail when completing profile with invalid CPF", () => {
    const res = validateProfileCompletionPayload({
      fullName: "Fulano de Tal",
      document: "111.111.111-11",
      phone: "11987654321",
      isProfileComplete: true,
    });
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.error, "CPF válido é obrigatório para concluir o cadastro.");
  });

  it("should fail when completing profile without full name", () => {
    const res = validateProfileCompletionPayload({
      fullName: "  ",
      document: "331.328.801-40",
      phone: "11987654321",
      isProfileComplete: true,
    });
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.error, "Nome completo é obrigatório para concluir o cadastro.");
  });

  it("should fail when completing profile with invalid phone", () => {
    const res = validateProfileCompletionPayload({
      fullName: "Fulano de Tal",
      document: "331.328.801-40",
      phone: "12345",
      isProfileComplete: true,
    });
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.error, "Telefone de contato válido (com DDD) é obrigatório para concluir o cadastro.");
  });

  it("should succeed and normalize data when completing profile with all valid fields", () => {
    const res = validateProfileCompletionPayload({
      fullName: "Fulano de Tal",
      document: "331.328.801-40",
      phone: "(11) 98765-4321",
      isProfileComplete: true,
    });
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.normalizedDocument, "33132880140");
    assert.strictEqual(res.normalizedPhone, "11987654321");
  });

  it("should allow partial profile update without completing profile", () => {
    const res = validateProfileCompletionPayload({
      fullName: "Novo Nome",
    });
    assert.strictEqual(res.valid, true);
  });
});
