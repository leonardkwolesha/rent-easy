import { BRAND } from './theme';

export function formatMoney(amount) {
  const n = Number(amount) || 0;
  return `${BRAND.currency} ${n.toLocaleString()}`;
}

export function formatPhone(phone) {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('255')) return `+${digits}`;
  if (digits.startsWith('0'))   digits = digits.slice(1);
  return `+255${digits}`;
}

export function formatOrderId(id) {
  if (!id) return '';
  return String(id).slice(-6).toUpperCase();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_RE.test(email.trim());
}

export function isValidTzPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  const local = digits.startsWith('255') ? digits.slice(3)
              : digits.startsWith('0')   ? digits.slice(1)
              : digits;
  return local.length === 9;
}
