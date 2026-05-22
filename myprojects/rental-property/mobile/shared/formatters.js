export const fmtCurrency = (amount, currency = 'TZS') =>
  `${currency} ${Number(amount || 0).toLocaleString()}`;

export const fmtDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-TZ', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

export const fmtAddress = (address) =>
  [address?.area, address?.city].filter(Boolean).join(', ') || address?.city || '—';
