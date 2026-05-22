# Kebite — Development Prompt History

All prompts recorded in chronological order. Each entry includes the date, feature area, and the full prompt.

---

## Session 1 — 2026-04-24

---

### [001] BottomNav — Persistent bottom navigation bar

**Prompt:**
Add a persistent bottom navigation bar to the Kebite React app. Use inline React style objects only — no CSS modules, no Tailwind, no libraries.

Design system:
- gradient: `linear-gradient(135deg, #ff6b00, #e63946)`
- dark: `#1a1a2e`
- pageBg: `#f8f8f8`

Spec:
- 4 nav items: Home (/), Restaurants (/restaurants), Orders (/orders) with active order badge, Profile (/profile)
- Fixed bottom, full width, white bg, shadow up
- Active item highlighted with gradient color
- Badge on Orders reads `localStorage.getItem('activeOrderCount')`
- Tap animation: `scale(0.88)` via `pressed` state
- Hidden on: `/login`, `/register`, `/forgot-password`

**Files changed:** `client/src/components/BottomNav.jsx` (created)

---

### [002] BottomNav Badge — Wire activeOrderCount to order lifecycle

**Prompt:**
In Kebite, whenever a new order is successfully created (after checkout), add this line before navigating to the tracking page:

```js
const current = parseInt(localStorage.getItem('activeOrderCount') || '0');
localStorage.setItem('activeOrderCount', current + 1);
```

Then in OrderTracking.jsx, when the socket fires status 'delivered' or 'cancelled', decrement the count:

```js
const current = parseInt(localStorage.getItem('activeOrderCount') || '0');
localStorage.setItem('activeOrderCount', Math.max(0, current - 1));
```

**Files changed:** `client/src/pages/Orders.jsx`, `client/src/pages/OrderTracking.jsx`

---

### [003] BottomNav — Active indicator line

**Prompt:**
In BottomNav.jsx, add a 3px indicator line above each active nav item.

Spec:
- Absolutely positioned inside each nav item
- `top: 0`, `left: '20%'`, `right: '20%'`
- Height: `3px`, borderRadius: `0 0 3px 3px`
- Background: `linear-gradient(135deg, #ff6b00, #e63946)`
- Only visible when item is active

**Files changed:** `client/src/components/BottomNav.jsx`

---

### [004] CLAUDE.md — Restructure + create AI assistant prompt

**Prompt:**
I need you to completely restructure my CLAUDE.md file and create a separate AI assistant prompt file for the Kebite app.

CLAUDE.md requirements:
- Pure developer context only (stack, structure, design system, API conventions, gotchas)
- Max ~200 lines
- No chatbot personality or end-user content

New file: `client/src/ai/assistant-prompt.md`
- Runtime system prompt for the chat widget AI
- Sections: Identity, Personality, Capabilities, Resolution Framework, Issue Scripts, Policies, Order Status Messages, Escalation Triggers, Hard Rules, Sample Interactions

ChatWidget.jsx requirements:
- Slide-up panel, `bottom: 80px`, `right: 16px`, `zIndex: 999`
- POST `/api/ai/chat` with `{ message, conversationHistory: last 10, userId, orderId }`
- orderId parsed from URL path `/orders/:id/track`
- Quick reply chips (visible only when messages.length === 1)
- Unread badge on trigger button when panel closed
- ChevronDown minimize button
- Keyframes: `chatSlideUp`, `dotBounce` injected via `<style>` tag

**Files changed:** `CLAUDE.md` (rewrite), `client/src/ai/assistant-prompt.md` (created), `client/src/components/ChatWidget.jsx` (full rebuild), `server/controllers/aiController.js`, `server/routes/ai.js`, `server/index.js`

---

### [005] Home.jsx — Fix hero background gray borders

**Prompt:**
In src/pages/Home.jsx, fix the hero background so it fills the entire page width and height with no gray borders, margins, or gaps showing around it.

Fixes:
1. Add CSS reset to `index.html`: `* { margin: 0; padding: 0; box-sizing: border-box; }` + `html, body, #root { margin: 0; padding: 0; width: 100%; min-height: 100vh; overflow-x: hidden; }`
2. `s.root`: add `width: '100%'`, `margin: 0`, `padding: 0`
3. `s.hero`: add `width: '100%'`, `margin: 0`, `boxSizing: 'border-box'`
4. App.jsx outer div: add `margin: 0`, `padding: 0`, `width: '100%'`
5. App.jsx inner div: add `margin: 0`

**Files changed:** `client/index.html`, `client/src/pages/Home.jsx`, `client/src/App.jsx`

---

### [006] OrderTracking.jsx — Full UI/UX rebuild

**Prompt:**
Rebuild OrderTracking.jsx from scratch with full UI/UX. Keep ALL existing logic (useParams, api, socket, STATUS_LABELS, socket.disconnect() cleanup, localStorage decrement on delivered/cancelled).

New state: order, loading, error, animatingStep, rating, rated, hover, comment, confetti

Features to add:
- Shimmer skeleton loading state
- Error + retry card
- Gradient header with order ID and restaurant name
- ETA banner with delivery estimate (overlapping with `-1.25rem` margin-top)
- Delivered celebration: confetti (20 particles, 4s auto-remove)
- Rating card with 5 stars, textarea for comment, submit button
- Timeline: 6 steps (placed→confirmed→preparing→ready→on_the_way→delivered), pulse-ring animation on active step
- For cancelled: replace delivered step with `{ key:'cancelled', icon:'❌', label:'Cancelled' }`
- Map placeholder (Leaflet map placeholder div)
- Order summary: list of items with prices
- Support row: WhatsApp link + Call Rider button

STEPS order status lifecycle must match CLAUDE.md exactly.

**Files changed:** `client/src/pages/OrderTracking.jsx` (full rebuild)

---

### [007] Profile.jsx — Full UI/UX rebuild

**Prompt:**
Rebuild Profile.jsx from scratch with full UI/UX. Keep ALL existing logic (useAuth, user, logout).

Helpers (defined outside component): `getInitials`, `memberSince`, `Toggle`, `PencilIcon`, `ChevronRight`, `Sheet`

State: orderCount, editing, editValue, editLoading, editError, showLogoutModal, showTopUp, topUpPhone, topUpAmount, topUpLoading, topUpSuccess, topUpError, prefs

7 layout sections:
1. Profile header — initials avatar, name, phone, edit button
2. Stats row — total orders, wallet balance, member since
3. Wallet card — balance, top-up button, top-up bottom sheet
4. Personal info — name/email/phone with inline pencil-edit
5. Notifications — push/email/SMS toggles
6. Quick links — Order History, Saved Addresses, Help & Support, Privacy Policy
7. Sign out — gradient button, confirmation modal

API calls:
- `PATCH /users/profile` for inline edits
- `PATCH /users/preferences` for notification toggles
- `POST /payments/wallet/topup` for wallet top-up
- Never use `alert()` — use inline error state

**Files changed:** `client/src/pages/Profile.jsx` (full rebuild)

---

### [008] KebiteLogo — Create reusable logo component + replace all text logos

**Prompt:**
Create a reusable KebiteLogo component and replace the current text-based logo across the entire app with it.

`client/src/components/KebiteLogo.jsx`:
- Props: `variant` ('primary'|'white'|'dark'|'icon'), `size` ('sm'|'md'|'lg'), `style`
- Sizes: sm(icon:28, tag:8px, r:7), md(icon:40, tag:10px, r:10), lg(icon:56, tag:12px, r:14)
- Icon: rounded square div, gradient bg, SVG fork+knife in white
- Wordmark: SVG `<text>` with `fill="url(#kebiteGradText)"` internal gradient
- Tagline: "Food Delivery · 🇹🇿"
- `variant="icon"`: show icon only, no wordmark

Replacements:
- `Home.jsx` navbar: `<span style={s.logo}>Kebite 🍽️</span>` → `<KebiteLogo variant="white" size="md" />`
- `Login.jsx` left panel: text logo → `<KebiteLogo variant="white" size="lg" />`
- `Login.jsx` mobile bar: text logo → `<KebiteLogo variant="white" size="md" />`
- `Register.jsx` left panel: text logo → `<KebiteLogo variant="white" size="lg" />`
- `Register.jsx` mobile bar: text logo → `<KebiteLogo variant="white" size="md" />`
- `ChatWidget.jsx` panel header: emoji + text → `<KebiteLogo variant="white" size="sm" />`
- `index.html`: update title + add SVG favicon data URI

Verification: `grep -r "Kebite 🍽️" src/` → 0 results; `npm run build` → zero errors

**Files changed:** `client/src/components/KebiteLogo.jsx` (created), `client/src/pages/Home.jsx`, `client/src/pages/Login.jsx`, `client/src/pages/Register.jsx`, `client/src/components/ChatWidget.jsx`, `client/index.html`

---

### [009] PROMPT_HISTORY.md — Create development prompt history file

**Prompt:**
Create a file history which acts as a memory to store all prompts during development.

**Files changed:** `PROMPT_HISTORY.md` (created)

---

## Session 2 — 2026-04-24 (continued)

---

### [010] Framer Motion — Full animation upgrade (all pages + components)

**Prompt:**
Full Framer Motion upgrade spec (13-step execution order):
- STEP 0: Install framer-motion, @radix-ui/react-toast, @radix-ui/react-dialog, @radix-ui/react-tooltip
- STEP 1: Create `src/animations/variants.js` — export fadeUp, fadeIn, slideInLeft, slideInRight, scaleIn, stagger, staggerFast, popIn, cardHover, pageTransition
- STEP 2: Create `src/components/PageWrapper.jsx` — motion.div with pageTransition variants
- STEP 3: Update `App.jsx` — AnimatePresence + Routes with location key, Radix Toast.Provider + Viewport
- STEP 4: Upgrade `BottomNav.jsx` — motion.button with layoutId indicator, AnimatePresence badge with popIn
- STEP 5: Create `src/pages/NotFound.jsx` — floating food emojis, 404 spring text, back button
- STEP 6: Upgrade `Home.jsx` — floating bubbles, staggered H1, useInView scroll reveals for stats/categories
- STEP 7: Upgrade `Restaurants.jsx` — filter pill scaleIn stagger, RestaurantCard cardHover variants, AnimatePresence popLayout grid
- STEP 8: Upgrade `Orders.jsx` — filter stagger, OrderCard cardHover layout, active badge pulse, AnimatePresence popLayout list
- STEP 9: Upgrade `Login.jsx` — card entry spring, AnimatePresence mode="wait" for login/forgot/sent views, error shake
- STEP 10: Upgrade `Register.jsx` — same card entry, AnimatePresence step1 (x:-30) / step2 (x:30) transitions
- STEP 11: Upgrade `OrderTracking.jsx` — Framer Motion confetti, timeline stagger slideInLeft, active pulse ring, rating star spring, socket flash
- STEP 12: Upgrade `Profile.jsx` — page entry stagger, wallet AnimatedWalletBalance (useMotionValue+useSpring), Sheet spring modal, AnimatePresence top-up form, Toggle motion.div knob, edit field height:0→auto
- STEP 13: Upgrade `ChatWidget.jsx` — FAB idle pulse boxShadow animation, panel panelVariants spring, bubbles AnimatePresence, typing dots y:[0,-6,0] bounce, icon rotate AnimatePresence
- STEP 14: Create `src/components/Toast.jsx` — ToastProvider context + useToast hook + fixed AnimatePresence container with success/error/info/warning styles; replace Orders.jsx inline toast

Critical rules: Do NOT install Tailwind or shadcn/ui. Do NOT convert inline styles to Tailwind. All styles remain inline.

**Files changed:**
- `client/src/animations/variants.js` (created)
- `client/src/components/PageWrapper.jsx` (created)
- `client/src/components/Toast.jsx` (created)
- `client/src/components/BottomNav.jsx` (rewritten)
- `client/src/components/ChatWidget.jsx` (rewritten)
- `client/src/pages/NotFound.jsx` (created)
- `client/src/pages/Home.jsx` (rewritten)
- `client/src/pages/Restaurants.jsx` (rewritten)
- `client/src/pages/Orders.jsx` (rewritten)
- `client/src/pages/Login.jsx` (rewritten)
- `client/src/pages/Register.jsx` (rewritten)
- `client/src/pages/OrderTracking.jsx` (rewritten)
- `client/src/pages/Profile.jsx` (rewritten)
- `client/src/App.jsx` (updated)

Verification: `npm run build` → zero errors, zero warnings

---

---

## Session 2 — 2026-04-29

---

### [011] Contact page + Home responsiveness

**Prompt:**
contact page is missing details and home styles are not proper responsiveness. fix it

**Files changed:**
- `client/src/pages/Contact.jsx` (created) — full contact page: 6 contact-method cards (general, support, partners, riders, press, legal), call/WhatsApp/sales phone block, head-office card with OpenStreetMap link, support hours table, social grid, and a validated mailto contact form with topic select
- `client/src/App.jsx` — registered `/contact` route
- `client/src/pages/Home.jsx` — footer "Contact" link now points to `/contact` (was `mailto:`); style object converted to `clamp()`-based fluid spacing (hero/nav padding, navBtn sizing, section padding, stats gap, category grid, features/steps grids, CTA padding); nav now wraps on mobile with `flexWrap: 'wrap'`; "Get the App" and outer footer paddings also clamped

Verification: `cd client && npm run build` → zero errors. Pre-existing >500 kB chunk-size advisory unchanged.

---

### [012] System audit — close out missing features (reset password, live tracking map)

**Prompt:**
do research on how the food delivery system works, then go through my kebite system and test it if it is completed for use, but if not fix the missing features correctly. work for it

**Audit summary:** Backend was already comprehensive (13 routes/controllers, 9 models, full M-Pesa/Airtel/Tigo/Cash/Card payment flow, JWT + Google auth, support tickets, promos, reviews). Three real frontend gaps closed; two left explicitly out of scope.

**Closed:**
1. **`/reset-password` page** — Login already triggers `POST /api/auth/forgot-password`, server already issues a hashed token, but the email link had nowhere to land. Built the page (reads `?token=`, validates new password with strength meter, posts to `/api/auth/reset-password`, success screen + redirect to `/login`).
2. **Live tracking map** — replaced the "Rider location updates coming soon" placeholder in `OrderTracking.jsx` with a real Leaflet/OpenStreetMap component. Subscribes to the existing `rider:locationUpdate` socket event, filters by the order's `riderId`, animates marker recenter. Shown for `ready | preparing | on_the_way` once a rider is assigned.
3. **`BottomNav` HIDDEN list** — added `/reset-password` and `/onboarding`.

**Out of scope:**
- `/onboarding` — referenced in `FULL_PAGE_ROUTES` but no spec, no backend dependency. Constant kept; route omitted.
- "Coming soon" promo codes section in `Profile.jsx` — backend supports `/api/promotions`, but the UI is its own feature with its own design.

**Files changed:**
- `client/src/pages/ResetPassword.jsx` (created)
- `client/src/components/LiveMap.jsx` (created)
- `client/src/App.jsx` — `/reset-password` route registered
- `client/src/components/BottomNav.jsx` — `HIDDEN_ON` extended
- `client/src/pages/OrderTracking.jsx` — placeholder replaced with `<LiveMap>`
- `client/index.html` — Leaflet CSS link added (per CLAUDE.md gotcha #1)
- `client/package.json` / `package-lock.json` — added `leaflet@1.9.4` + `react-leaflet@4.2.1` (React 18-compatible; installed with `--legacy-peer-deps`)

Verification: `npm run build` → zero errors. Pre-existing >500 kB chunk-size advisory present (unchanged).

---

## How to Use This File

- **Add a new entry** for every significant prompt during a dev session
- **Format:** `### [NNN] Feature — Short title` → Prompt → Files changed
- **Purpose:** Reproducing past decisions, onboarding new devs, debugging "why was this built this way?"
- Keep entries factual — copy the actual prompt, not a paraphrase
- Increment the entry number sequentially across all sessions
