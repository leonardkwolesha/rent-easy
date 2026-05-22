const fs = require('fs');
const path = require('path');

const rootEnv = path.join(__dirname, '..', '.env');
if (!fs.existsSync(rootEnv)) {
  console.log('No root .env found — skipping sync');
  process.exit(0);
}

const lines = fs.readFileSync(rootEnv, 'utf-8').split('\n');
const apiUrl = lines.find(l => l.startsWith('EXPO_PUBLIC_API_URL='))?.split('=')[1]?.trim();
if (!apiUrl) { console.log('EXPO_PUBLIC_API_URL not set in root .env'); process.exit(0); }

const apps = ['tenant', 'landlord'];
apps.forEach(app => {
  const envPath = path.join(__dirname, app, '.env');
  const content = `EXPO_PUBLIC_API_URL=${apiUrl}\n`;
  fs.writeFileSync(envPath, content);
  console.log(`Synced ${apiUrl} → mobile/${app}/.env`);
});
