/**
 * Document and contact validation and formatting utilities (CPF, Phone).
 */

/**
 * Strips all non-digit characters from a string.
 */
export function normalizeDigits(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/\D/g, "");
}

/**
 * Normalizes a CPF by removing formatting and ensuring clean digits.
 */
export function normalizeCPF(cpf: string | null | undefined): string {
  return normalizeDigits(cpf);
}

/**
 * Normalizes a phone number to digits only.
 */
export function normalizePhone(phone: string | null | undefined): string {
  return normalizeDigits(phone);
}

/**
 * Formats an 11-digit CPF string into 000.000.000-00 mask.
 * Supports partial input for live input masking.
 */
export function formatCPF(value: string | null | undefined): string {
  const digits = normalizeDigits(value).slice(0, 11);
  if (!digits) return "";

  if (digits.length <= 3) {
    return digits;
  }
  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Formats a phone string into (00) 00000-0000 or (00) 0000-0000 mask.
 */
export function formatPhone(value: string | null | undefined): string {
  const digits = normalizeDigits(value).slice(0, 11);
  if (!digits) return "";

  if (digits.length <= 2) {
    return `(${digits}`;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Validates a Brazilian CPF mathematically using modulus 11 checksum verification.
 * Accepts formatted or unformatted CPF strings.
 */
export function validateCPF(cpf: string | null | undefined): boolean {
  const cleanCPF = normalizeDigits(cpf);

  // Must have exactly 11 digits
  if (cleanCPF.length !== 11) {
    return false;
  }

  // Reject known invalid sequences (e.g. 00000000000, 11111111111, ..., 99999999999)
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return false;
  }

  // Calculate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i), 10) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  const digit1 = remainder >= 10 ? 0 : remainder;
  if (digit1 !== parseInt(cleanCPF.charAt(9), 10)) {
    return false;
  }

  // Calculate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i), 10) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  const digit2 = remainder >= 10 ? 0 : remainder;
  if (digit2 !== parseInt(cleanCPF.charAt(10), 10)) {
    return false;
  }

  return true;
}

/**
 * Validates a Brazilian phone number (landline or mobile with DDD).
 * Requires 10 or 11 digits.
 */
export function validatePhone(phone: string | null | undefined): boolean {
  const cleanPhone = normalizeDigits(phone);
  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    return false;
  }
  // Reject repeated patterns
  if (/^(\d)\1+$/.test(cleanPhone)) {
    return false;
  }
  // Valid Brazilian area codes (DDD) range from 11 to 99
  const ddd = parseInt(cleanPhone.slice(0, 2), 10);
  if (ddd < 11 || ddd > 99) {
    return false;
  }
  return true;
}
