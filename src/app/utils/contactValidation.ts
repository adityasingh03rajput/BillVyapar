// ─── Existing validators (unchanged) ────────────────────────────────────────

export type ContactFieldErrors = {
  gstin?: string;
  phone?: string;
  email?: string;
  pan?: string;
  ifscCode?: string;
  accountNumber?: string;
  upiId?: string;
  postalCode?: string;
};

export function normalizeGstin(value: string) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
}

export function isValidGstin(value: string) {
  const v = normalizeGstin(value);
  if (!v) return true;
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/.test(v);
}

export function validateGstin(value: string): string | undefined {
  const v = normalizeGstin(value);
  if (!v) return undefined;
  if (!isValidGstin(v)) return 'Invalid GSTIN (e.g. 22AAAAA0000A1Z5)';
  return undefined;
}

export function normalizeEmail(value: string) {
  return String(value || '').trim().toLowerCase();
}

export function isValidEmail(value: string) {
  const v = normalizeEmail(value);
  if (!v) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function validateEmail(value: string): string | undefined {
  const v = normalizeEmail(value);
  if (!v) return undefined;
  if (!isValidEmail(v)) return 'Invalid email address';
  return undefined;
}

export function normalizePhone(value: string) {
  const raw = String(value || '').trim();
  const hasPlus = raw.startsWith('+');
  const digits = raw.replace(/\D+/g, '');
  return hasPlus ? `+${digits}` : digits;
}

export function isValidPhone(value: string) {
  const v = normalizePhone(value);
  if (!v) return true;
  const digits = v.startsWith('+') ? v.slice(1) : v;
  if (/^\d{10}$/.test(digits)) return true;
  if (/^91\d{10}$/.test(digits)) return true;
  // Allow international: 7–15 digits with country code
  if (v.startsWith('+') && /^\d{7,15}$/.test(digits)) return true;
  return false;
}

export function validatePhone(value: string): string | undefined {
  const v = normalizePhone(value);
  if (!v) return undefined;
  if (!isValidPhone(v)) return 'Invalid phone number';
  return undefined;
}

// ─── New validators ──────────────────────────────────────────────────────────

export function normalizePan(value: string) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
}

export function isValidPan(value: string) {
  const v = normalizePan(value);
  if (!v) return true;
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v);
}

export function validatePan(value: string): string | undefined {
  const v = normalizePan(value);
  if (!v) return undefined;
  if (!isValidPan(v)) return 'Invalid PAN (e.g. ABCDE1234F)';
  return undefined;
}

export function normalizeIfsc(value: string) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
}

export function isValidIfsc(value: string) {
  const v = normalizeIfsc(value);
  if (!v) return true;
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v);
}

export function validateIfsc(value: string): string | undefined {
  const v = normalizeIfsc(value);
  if (!v) return undefined;
  if (!isValidIfsc(v)) return 'Invalid IFSC (e.g. SBIN0001234)';
  return undefined;
}

export function normalizeAccountNumber(value: string) {
  return String(value || '').trim().replace(/\s+/g, '');
}

export function isValidAccountNumber(value: string) {
  const v = normalizeAccountNumber(value);
  if (!v) return true;
  return /^\d{9,18}$/.test(v);
}

export function validateAccountNumber(value: string): string | undefined {
  const v = normalizeAccountNumber(value);
  if (!v) return undefined;
  if (!isValidAccountNumber(v)) return 'Account number must be 9–18 digits';
  return undefined;
}

export function normalizeUpiId(value: string) {
  return String(value || '').trim().toLowerCase();
}

export function isValidUpiId(value: string) {
  const v = normalizeUpiId(value);
  if (!v) return true;
  return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(v);
}

export function validateUpiId(value: string): string | undefined {
  const v = normalizeUpiId(value);
  if (!v) return undefined;
  if (!isValidUpiId(v)) return 'Invalid UPI ID (e.g. name@upi)';
  return undefined;
}

export function normalizePostalCode(value: string) {
  return String(value || '').trim().replace(/\D+/g, '');
}

export function isValidPostalCode(value: string) {
  const v = normalizePostalCode(value);
  if (!v) return true;
  return /^\d{6}$/.test(v);
}

export function validatePostalCode(value: string): string | undefined {
  const v = normalizePostalCode(value);
  if (!v) return undefined;
  if (!isValidPostalCode(v)) return 'Postal code must be 6 digits';
  return undefined;
}

// ─── Batch helpers ───────────────────────────────────────────────────────────

export function validateContactFields(fields: {
  gstin?: string;
  phone?: string;
  email?: string;
  pan?: string;
  ifscCode?: string;
  accountNumber?: string;
  upiId?: string;
  postalCode?: string;
}): ContactFieldErrors {
  return {
    gstin: validateGstin(fields.gstin || ''),
    phone: validatePhone(fields.phone || ''),
    email: validateEmail(fields.email || ''),
    pan: validatePan(fields.pan || ''),
    ifscCode: validateIfsc(fields.ifscCode || ''),
    accountNumber: validateAccountNumber(fields.accountNumber || ''),
    upiId: validateUpiId(fields.upiId || ''),
    postalCode: validatePostalCode(fields.postalCode || ''),
  };
}

export function hasContactErrors(errors: ContactFieldErrors) {
  return Object.values(errors).some(Boolean);
}
