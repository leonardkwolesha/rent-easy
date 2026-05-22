const BASE_URL = process.env.CLICKPESA_BASE_URL || 'https://api.clickpesa.com/third-parties';

let cachedToken = null;
let tokenExpiresAt = 0;

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) return cachedToken;

  const clientId = process.env.CLICKPESA_CLIENT_ID;
  const apiKey = process.env.CLICKPESA_API_KEY;
  if (!clientId || !apiKey) {
    throw new Error('ClickPesa credentials missing — set CLICKPESA_CLIENT_ID and CLICKPESA_API_KEY in server/.env');
  }

  const res = await fetch(`${BASE_URL}/generate-token`, {
    method: 'POST',
    headers: { 'client-id': clientId, 'api-key': apiKey },
  });
  const body = await res.json().catch(() => ({}));

  if (!res.ok || !body.token) {
    throw new Error(`ClickPesa token request failed: ${res.status} ${body.message || 'unknown'}`);
  }

  cachedToken = body.token.startsWith('Bearer ') ? body.token : `Bearer ${body.token}`;
  tokenExpiresAt = Date.now() + 60 * 60 * 1000;
  return cachedToken;
}

function normalizePhoneTZ(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.startsWith('255')) return digits;
  if (digits.startsWith('0')) return '255' + digits.slice(1);
  if (digits.length === 9) return '255' + digits;
  return digits;
}

async function callAuthed(path, body) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`[clickpesa] ${path} → ${res.status}`, JSON.stringify(data));
    const err = new Error(data.message || `ClickPesa ${path} failed (${res.status})`);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

exports.initiateUssdPush = ({ amount, orderReference, phoneNumber }) =>
  callAuthed('/payments/initiate-ussd-push-request', {
    amount: String(amount),
    currency: 'TZS',
    orderReference,
    phoneNumber: normalizePhoneTZ(phoneNumber),
  });

exports.previewUssdPush = ({ amount, orderReference, phoneNumber }) =>
  callAuthed('/payments/preview-ussd-push-request', {
    amount: String(amount),
    currency: 'TZS',
    orderReference,
    ...(phoneNumber ? { phoneNumber: normalizePhoneTZ(phoneNumber) } : {}),
  });

exports.queryPayment = async (orderReference) => {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/payments/${encodeURIComponent(orderReference)}`, {
    headers: { Authorization: token },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `ClickPesa query failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
};

exports.normalizePhoneTZ = normalizePhoneTZ;
