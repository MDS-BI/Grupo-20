export const FORMAT_NAMES = ['cl-rut', 'phone', 'email', 'nonEmpty'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?\d{7,15}$/;
const FORMATTED_RUT_RE = /^\d{1,3}(?:\.\d{3}){1,2}-[\dkK]$/;
const RAW_RUT_RE = /^\d{7,8}-?[\dkK]$/;

export function hasFormat(format) {
  return FORMAT_NAMES.includes(format);
}

export function rutDigit(body) {
  const digits = String(body).replace(/\D/g, '').split('').reverse();
  let sum = 0;
  let factor = 2;
  for (const digit of digits) {
    sum += Number(digit) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const result = 11 - (sum % 11);
  if (result === 11) return '0';
  if (result === 10) return 'K';
  return String(result);
}

export function normalizeClRut(value) {
  return String(value ?? '')
    .replace(/[.\-\s]/g, '')
    .toUpperCase();
}

export function formatRut(body) {
  const clean = String(body).replace(/\D/g, '');
  const formatted = clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted}-${rutDigit(clean)}`;
}

export function isValidRut(value) {
  const raw = String(value ?? '').trim();
  if (!FORMATTED_RUT_RE.test(raw) && !RAW_RUT_RE.test(raw)) return false;
  const normalized = normalizeClRut(raw);
  const body = normalized.slice(0, -1);
  const verifier = normalized.slice(-1);
  if (!body || !verifier) return false;
  const cleanBody = body.replace(/\D/g, '');
  if (cleanBody.length < 7 || cleanBody.length > 8) return false;
  return rutDigit(cleanBody) === verifier;
}

export function isValidPhone(value) {
  const clean = String(value ?? '').replace(/[\s()\-]/g, '');
  return PHONE_RE.test(clean);
}

export function isValidEmail(value) {
  return EMAIL_RE.test(String(value ?? '').trim());
}

export function isNonEmpty(value) {
  return value !== undefined && value !== null && String(value).trim().length > 0;
}

export function normalizeFieldValue(value, normalize) {
  const text = value === undefined || value === null ? '' : String(value);
  if (normalize === 'cl-rut') return normalizeClRut(text);
  if (normalize === 'lower') return text.trim().toLowerCase();
  return text.trim();
}

export function isValidFormat(format, value) {
  switch (format) {
    case 'cl-rut':
      return isValidRut(value);
    case 'phone':
      return isValidPhone(value);
    case 'email':
      return isValidEmail(value);
    case 'nonEmpty':
      return isNonEmpty(value);
    default:
      return false;
  }
}
