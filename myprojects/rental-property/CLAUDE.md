# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Root (from project root)
npm run dev:all               # start server + web client concurrently
npm run dev:server            # server only (nodemon, port 5000)
npm run dev:client            # React Vite client only (port 3000)
npm run dev:mobile:tenant     # Expo tenant app (syncs .env first)
npm run dev:mobile:landlord   # Expo landlord app (syncs .env first)
npm install && cd server && npm install && cd ../client && npm install

# Server
cd server && npm run seed     # seed DB with test data

# Client
cd client && npm run lint     # ESLint
cd client && npm run build    # production build
```

## Architecture

**Monorepo** with three deployable units: `server/` (Express API), `client/` (React Vite web), `mobile/` (two Expo apps).

### Server — Express + MongoDB (port 5000)

All API responses share the shape `{ success: bool, data: ... }` or `{ success: false, message: "..." }`.

**Route → Controller map:**

| Mount | Controller | Key operations |
|-------|-----------|----------------|
| `/api/auth` | authController | register, login, getMe |
| `/api/properties` | propertyController | CRUD + image upload + paginated public browse |
| `/api/applications` | applicationController | apply, received, approve (creates Lease), reject |
| `/api/leases` | leaseController | getMyLease (tenant), getLandlordLeases, terminate |
| `/api/payments` | paymentController | getMyPayments, getLandlordPayments, recordPayment, generateMonthlyPayments |
| `/api/maintenance` | maintenanceController | CRUD, status updates |
| `/api/users` | userController | profile get/update |
| `/api/admin` | adminController | stats, user list, agent approval |

**Middleware:** `auth.js` (JWT → `req.user`) → `requireRole(...roles)` — always applied in this order on protected routes.

**Critical flow — approving an application** (`applicationController.approveApplication`):
1. Sets application status to `approved`
2. Creates a `Lease` document
3. Sets property status to `occupied`
4. Bulk-rejects all other pending applications for the same property

**Payment generation:** `POST /api/payments/generate` with `{ leaseId }` creates one `Payment` document per month between `lease.startDate` and `lease.endDate`. It is idempotent (skips existing periods).

### Data Models

Six Mongoose models. Key relationships:
- `Lease` links Property + Tenant + Landlord + Application
- `Payment` links Lease + Tenant + Landlord + Property (denormalized for fast queries)
- `MaintenanceRequest` links Lease + Property + Tenant + Landlord

**Status enums to know:**
- Property: `available | occupied | unavailable`
- Application: `pending | approved | rejected`
- Lease: `active | expired | terminated`
- Payment: `pending | paid | overdue | waived`
- Maintenance: `open | in_progress | resolved | closed`

### Client — React 18 + Vite (port 3000)

**Auth:** JWT stored as `rp_token` in `localStorage`. `AuthContext` exposes `{ user, login, register, logout }`. `ProtectedRoute` checks role.

**Route structure:**
- `/` and `/properties` — public
- `/landlord/*` — roles: `landlord | agent | admin`
- `/tenant/*` — role: `tenant`
- `/admin` — role: `admin`
- `/dashboard` — redirects to the correct section based on `user.role`

**Design system** (`src/theme.js`): `BRAND` object with `primary: #2563EB`, `secondary: #10B981`. `STATUS_COLORS` maps every status string to `{ bg, text }` for inline badge styling. All components use inline styles only — no CSS files.

**API service** (`src/services/api.js`): Axios instance, auto-attaches `Bearer` token, redirects to `/login` on 401.

### Mobile — Expo 54 + React Native

Two separate apps: `mobile/tenant/` and `mobile/landlord/`. Both import from `mobile/shared/` for `api.js`, `storage.js`, `theme.js`, and `formatters.js`.

**Auth gating:** `AppNavigator` checks `AsyncStorage` for `rp_token` on mount; shows `AuthNavigator` (Stack) if absent or `MainTabs` (BottomTab) if present. After login the navigator is replaced, not pushed.

**Tenant app** role guard: login rejects non-`tenant` roles. **Landlord app** rejects non-`landlord | agent | admin`.

**`mobile/sync-env.js`** — runs before each `dev:mobile:*` script; copies `EXPO_PUBLIC_API_URL` from root `.env` to `mobile/{tenant,landlord}/.env`.

## Environment Variables

Set `EXPO_PUBLIC_API_URL` in the root `.env` — it is the single source of truth synced to both mobile apps.

```
# Root .env
API_URL=http://192.168.x.x:5000
EXPO_PUBLIC_API_URL=http://192.168.x.x:5000

# server/.env
PORT=5000
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# client/.env
VITE_API_URL=http://localhost:5000/api
```

## Key Conventions

- **Roles:** `tenant | landlord | agent | admin`. Agents have same access as landlords but need `isApproved: true` (set by admin).
- **Currency:** `TZS` default; stored as plain numbers. `formatters.js` (mobile) and inline `toLocaleString()` (web) for display.
- **Image uploads:** Cloudinary via `multer-storage-cloudinary`. Use `upload.array('images', 10)` for properties, `upload.single('avatar')` for users.
- **No Socket.io** in this project — all data is fetched on focus (`useFocusEffect`) or on page mount.
- **Error shape** from server is always `{ success: false, message: string }` — read `err.response.data.message` in catch blocks.
