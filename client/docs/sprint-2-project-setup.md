# Sprint 2 — Frontend Project Setup & Layout Shell

**Goal:** Configure Tailwind, set up routing, and build the persistent layout (navbar + page wrapper).

**Duration:** 0.5 day  
**Status:** To Do

---

## Tasks

### 2.1 — Configure Tailwind v4
- Update `vite.config.ts` to use `@tailwindcss/vite` plugin
- Add `@import "tailwindcss"` to `src/index.css`
- Remove default Vite boilerplate from `App.tsx`, `App.css`

### 2.2 — Environment config
- Create `client/.env`: `VITE_API_URL=http://localhost:3000`
- Create `src/api/leads.ts` — Axios instance with `baseURL` from env

### 2.3 — Type definitions
- Create `src/types/lead.ts` — `Lead` interface matching Prisma model

### 2.4 — Layout components
- `src/components/layout/Navbar.tsx` — top nav with links to `/`, `/send`, `/send-list`
- `src/components/layout/Layout.tsx` — wraps `<Navbar>` + `<Outlet>`

### 2.5 — Router setup
- `src/App.tsx` — `<BrowserRouter>` with routes:
  - `/` → `DashboardPage`
  - `/send` → `SendPage`
  - `/send-list` → `SendListPage`
  - Layout wraps all routes

### 2.6 — Shared UI primitives
- `src/components/ui/Badge.tsx` — status badge (SENT=green, FAILED=red, PENDING=yellow)
- `src/components/ui/Spinner.tsx` — loading spinner
- `src/components/ui/Modal.tsx` — confirmation modal
- `src/components/ui/Card.tsx` — stat card wrapper

---

## Acceptance Criteria

- [ ] `npm run dev` in `client/` starts the app without errors
- [ ] Navbar renders with three working links
- [ ] Tailwind utility classes apply correctly
- [ ] Navigating to `/`, `/send`, `/send-list` loads the correct placeholder page
