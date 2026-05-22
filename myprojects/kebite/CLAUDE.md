# Kebite — Claude Code Developer Guide

Tanzania's food delivery web platform. MERN stack.
Connects customers → restaurants → riders in Dar es Salaam.

## Stack

- Frontend : React 18 + React Router v6 (client/src/)
- Backend  : Node.js + Express.js (server/)
- Database : MongoDB + Mongoose (server/models/)
- Realtime : Socket.io
- Auth     : JWT stored in localStorage (key: kebite_token)
- Payments : M-Pesa, Airtel Money, Mixx by Yas, Cash on Delivery
- Maps     : Leaflet.js (NOT Google Maps — no billing)
- Package manager: npm

## Project Structure

client/src/
  pages/          One file per route — Home, Restaurants,
                  RestaurantDetail, Checkout, Orders,
                  OrderTracking, Profile, Login, Register,
                  Onboarding, NotFound
  components/     Shared: BottomNav, ChatWidget, Navbar,
                  Toast, ConfirmModal, StarRating, PageHeader,
                  SearchBar, LoadingSpinner, ProtectedRoute
  context/        AuthContext.jsx, CartContext.jsx
  services/       api.js (axios instance), socket.js
  ai/             assistant-prompt.md (runtime AI chat prompt)

server/
  routes/         auth, restaurants, orders, payments,
                  users, reviews, support, promos, ai
  models/         User, Restaurant, Order, Rider,
                  Payment, Promo, Review, SupportTicket
  middleware/     auth.js (JWT verify), errorHandler.js
  controllers/    One file per domain
  index.js        Entry point, port 5000

## Commands

```bash
# Start dev (run both together)
cd client && npm run dev      # Frontend — port 3000
cd server && npm start        # Backend  — port 5000

# Build
cd client && npm run build    # Production build
```

## Design System — MUST follow in every component

All styles are INLINE (style={{}}) — never create .css files,
never use Tailwind, never use CSS modules. No exceptions.

BRAND constants (copy these exactly, do not invent new values):
```
gradientPrimary : 'linear-gradient(135deg, #ff6b00, #e63946)'
orange          : '#ff6b00'
red             : '#e63946'
dark            : '#1a1a2e'
pageBg          : '#f8f8f8'
cardRadius      : '18px'
cardShadow      : '0 2px 16px rgba(0,0,0,0.07)'
cardShadowHover : '0 12px 32px rgba(0,0,0,0.13)'
font            : "'Segoe UI', system-ui, sans-serif"
```

Card hover pattern — always use this, never just background change:
```
onMouseEnter: transform translateY(-4px) + cardShadowHover
onMouseLeave: transform none + cardShadow
```

Money format — always: `'TSh ' + amount.toLocaleString()`
Phone format — always: +255 prefix locked, digits only

## API Conventions

Base URL stored in `client/src/services/api.js` (axios instance).
Dev: `http://localhost:5000/api`  |  Prod: `https://api.kebite.co.tz/api`

Every API call MUST have three states: loading / error / success.
No silent failures. No bare `.then()` without `.catch()`.

Pattern to follow:
```js
const [loading, setLoading] = useState(false)
const [error, setError]     = useState(null)
async function fetchX() {
  setLoading(true); setError(null)
  try { const res = await api.get('/x'); setData(res.data) }
  catch (err) { setError(err.response?.data?.message || 'Something went wrong.') }
  finally { setLoading(false) }
}
```

Order status lifecycle (never invent other statuses):
`placed → confirmed → preparing → ready → on_the_way → delivered | cancelled`

Socket events: `order:statusUpdate → { orderId, status }` · `rider:locationUpdate → { orderId, lat, lng }`
Always disconnect in useEffect cleanup: `return () => socket.disconnect()`

localStorage keys (always use these exact names):
`kebite_token` · `kebite_cart` · `kebite_recent_searches` · `activeOrderCount`

## Code Conventions

- Components: PascalCase files, default exports only
- Hooks: camelCase, prefix with `use` (useCart, useToast)
- No `console.log()` in production — use `// TODO: remove logs`
- Images: always include `onError` fallback to emoji placeholder
- All forms: validate client-side before API call, show inline
  errors (never browser `alert()`)
- Accessibility: icon-only buttons need `aria-label`,
  inputs need `htmlFor` label association
- Protected routes: wrap with `<ProtectedRoute>` — redirects to
  `/login` with `{ state: { from: location } }` if not authenticated
- After login: `navigate(state.from ?? '/')`

## Tanzania-Specific Rules

- Currency: TSh (Tanzanian Shilling) — never use $, €, or KES
- Primary payment: M-Pesa first, then Airtel Money, Mixx by Yas
- Support Swahili in UI strings where marked with `// SW: label`
- Dar es Salaam is the primary delivery city
- Do NOT use Google Maps API — use Leaflet.js (free, no billing)
- Delivery status delays are common — build graceful wait states

## Common Gotchas — Read Before Coding

1. **Leaflet CSS** must be imported in `client/index.html`, NOT in a component:
   ```html
   <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css"/>
   ```
   Importing in a component breaks map tiles in production.

2. **Socket.io** must connect AFTER auth is confirmed.
   Never call `socket.connect()` on page load unconditionally.

3. **Cart belongs to ONE restaurant** at a time. If user adds item
   from a different restaurant, show ConfirmModal before clearing.
   CartContext handles this — always use `useCart()`, never local state.

4. **M-Pesa phone numbers**: strip leading 0, add +255 prefix before
   sending to `/api/payments` — backend expects E.164 format.

5. **Menu items** may have no category field — default to `'Main'`.
   Never crash on missing category: `item.category ?? 'Main'`

6. **Order ID display**: always show last 6 chars uppercased:
   `orderId.slice(-6).toUpperCase()` — never show the full MongoDB _id

7. **Shimmer skeleton animation** (use this, not opacity pulse):
   ```
   background: linear-gradient(90deg,#efefef 25%,#f5f5f5 50%,#efefef 75%)
   backgroundSize: 200% 100%
   animation: shimmer 1.4s infinite
   @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
   ```

8. **BottomNav** must NOT appear on:
   `/login` `/register` `/forgot-password` `/reset-password` `/onboarding`
   Check with: `const HIDDEN = [...]; if (HIDDEN.includes(location.pathname)) return null`

9. **AI chat prompt** lives in `client/src/ai/assistant-prompt.md`.
   The server reads it at runtime — do NOT hardcode it in the controller.

10. When compacting context, always preserve:
    - The full list of modified files
    - Current error states or failing tests
    - The active feature being built

## What NOT to Do

- Never create a `.css` or `.module.css` file — all styles are inline
- Never install a UI component library (MUI, Chakra, Ant, etc.)
- Never use Google Maps — Leaflet only
- Never use `alert()` or `confirm()` — use ConfirmModal component
- Never store raw JWT in httpOnly cookie — use localStorage with the
  api.js interceptor that attaches it as Bearer token
- Never modify `node_modules` or `package-lock.json` manually
- Never put chatbot personality or end-user scripts in CLAUDE.md
  — those belong in `client/src/ai/assistant-prompt.md`

## Verification Steps After Each Change

After editing any page or component, verify:
1. `cd client && npm run build` → zero errors, zero warnings
2. All 3 states exist: loading skeleton, error card, data rendered
3. Mobile layout not broken (check at 375px viewport)
4. No hardcoded colors outside the BRAND constants above
5. No `.css` files created
