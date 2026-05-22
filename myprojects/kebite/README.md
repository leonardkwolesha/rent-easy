# Kebite

Tanzania's food delivery platform — connects customers, restaurants, and riders in Dar es Salaam. MERN stack with Expo React Native mobile apps.

## Structure

```
KEBITE/
├── client/      React web app (Vite, port 3000)
├── mobile/      Expo React Native — customer, rider, restaurant
│   ├── customer/
│   ├── rider/
│   ├── restaurant/
│   ├── shared/      cross-app api, socket, formatters, theme, storage
│   └── sync-env.js  copies root API_URL into each app's .env
├── server/      Node.js + Express API (port 5000)
├── ai/          AI utilities & prompt assets
└── .env         single source of truth for API_URL
```

## Environment

The root `.env` is the canonical source for the API URL across the monorepo:

```
API_URL=http://localhost:5000
REACT_APP_API_URL=http://localhost:5000
EXPO_PUBLIC_API_URL=http://localhost:5000
```

- `client/.env` reads `VITE_API_URL` (Vite, not CRA — `REACT_APP_*` is **not** read by the client). Keep `client/.env` aligned with the root.
- `mobile/sync-env.js` copies `EXPO_PUBLIC_API_URL` from root `/.env` into each Expo app's local `.env`. It runs automatically as a `pre`-hook before every `dev:mobile:*` script.
- `server/.env` defines its own `MONGODB_URI`, `JWT_SECRET`, etc., and is loaded independently by Express.

## Scripts (run from repo root)

| Command                              | What it does                                    |
| ------------------------------------ | ----------------------------------------------- |
| `npm run dev:server`                 | Start the Express API on port 5000 (nodemon)    |
| `npm run dev:client`                 | Start the React web app (Vite)                  |
| `npm run dev:mobile:customer`        | Start the customer Expo app (web mode)          |
| `npm run dev:mobile:rider`           | Start the rider Expo app (web mode)             |
| `npm run dev:mobile:restaurant`      | Start the restaurant Expo app (web mode)        |
| `npm run dev:all`                    | Run server + client together (concurrently)     |
| `npm run mobile:sync-env`            | Manually re-sync `EXPO_PUBLIC_API_URL`          |

## Quick start

```bash
# 1. Install root tooling (concurrently, etc.)
npm install

# 2. Start API + web together
npm run dev:all

# 3. (Separately) start any mobile app
npm run dev:mobile:customer
```

The mobile apps use platform-aware fallbacks for the API host (Android emulator → `http://10.0.2.2:5000`, iOS / web → `http://localhost:5000`), but `EXPO_PUBLIC_API_URL` overrides them when set.
