const AUTH_URL = process.env.AZAMPAY_AUTH_URL || 'https://authenticator-sandbox.azampay.co.tz/AppRegistration/GenerateToken';
const BASE_URL = process.env.AZAMPAY_BASE_URL || 'https://sandbox.azampay.co.tz';

const PROVIDER_MAP = {
  mpesa:  'Mpesa',
  airtel: 'Airtel',
  mixx:   'Tigopesa',
  halotel:'Halopesa',
};

let _tokenCache = { token: null, expiresAt: 0 };

async function getToken() {
  if (_tokenCache.token && _tokenCache.expiresAt > Date.now()) {
    return _tokenCache.token;
  }
  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      appName:      process.env.AZAMPAY_APP_NAME,
      clientId:     process.env.AZAMPAY_CLIENT_ID,
      clientSecret: process.env.AZAMPAY_CLIENT_SECRET,
    }),
  });
  if (!res.ok) throw new Error(`AzamPay auth HTTP ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'AzamPay auth failed');

  _tokenCache.token = data.data.accessToken;
  // Cache until 5 minutes before expiry
  _tokenCache.expiresAt = new Date(data.data.expire).getTime() - 5 * 60 * 1000;
  return _tokenCache.token;
}

async function mnoCheckout({ phone, amount, currency = 'TZS', externalId, provider }) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/azampay/mno/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      accountNumber: phone,
      amount:        String(amount),
      currency,
      externalId,
      provider: PROVIDER_MAP[provider] || provider,
    }),
  });
  if (!res.ok) throw new Error(`AzamPay checkout HTTP ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'AzamPay checkout failed');
  return data;
}

function hasCredentials() {
  return !!(process.env.AZAMPAY_APP_NAME && process.env.AZAMPAY_CLIENT_ID && process.env.AZAMPAY_CLIENT_SECRET);
}

module.exports = { getToken, mnoCheckout, hasCredentials, PROVIDER_MAP };
