#!/usr/bin/env node
// Sync the root /.env API URL into each Expo app's local .env so all three
// mobile projects see the same EXPO_PUBLIC_API_URL. Runs automatically as a
// pre-hook before `dev:mobile:*` (see root package.json).
//
// Order of preference for the root URL:
//   1. EXPO_PUBLIC_API_URL  (already in the right shape for Expo)
//   2. API_URL              (canonical root key)
//   3. fallback http://localhost:5000
const fs   = require('fs');
const path = require('path');

const ROOT_ENV = path.resolve(__dirname, '..', '.env');
const APPS = ['customer', 'rider', 'restaurant'];
const FALLBACK = 'http://localhost:5000';

function parseEnv(text) {
  const out = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    out[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return out;
}

let apiUrl = FALLBACK;
if (fs.existsSync(ROOT_ENV)) {
  const env = parseEnv(fs.readFileSync(ROOT_ENV, 'utf8'));
  apiUrl = env.EXPO_PUBLIC_API_URL || env.API_URL || FALLBACK;
} else {
  console.warn(`[sync-env] root .env not found at ${ROOT_ENV} — using fallback ${FALLBACK}`);
}

const payload = `EXPO_PUBLIC_API_URL=${apiUrl}\n`;

fs.writeFileSync(path.resolve(__dirname, '.env'), payload);
console.log(`[sync-env] mobile/.env -> ${apiUrl}`);

for (const app of APPS) {
  const target = path.resolve(__dirname, app, '.env');
  fs.writeFileSync(target, payload);
  console.log(`[sync-env] mobile/${app}/.env -> ${apiUrl}`);
}
