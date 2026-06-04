# Sprint 4 — Send List Page

**Goal:** Build the `/send-list` page showing per-lead WhatsApp and SMS delivery status with filtering, auto-refresh, and CSV export.

**Duration:** 1 day  
**Status:** To Do

---

## Tasks

### 4.1 — `SendListTable` component
- File: `src/components/leads/SendListTable.tsx`
- Built with TanStack Table v8
- Columns: Shop Name, Owner, Phone, WhatsApp Number, WA Status (badge), WA Sent At, SMS Status (badge), SMS Sent At, Error (truncated + hover tooltip)
- Client-side pagination — 20 rows per page, prev/next controls
- Sortable columns: Shop Name, WA Status, SMS Status

### 4.2 — Search bar
- Text input at top of page
- Filters rows by shop name, owner name, or phone number (case-insensitive, client-side)

### 4.3 — Filter tabs
- Tabs: All | WA Sent | WA Failed | SMS Sent | SMS Failed | Pending
- Each tab shows count badge
- "Pending" = any lead with `whatsappStatus === "PENDING"` OR `smsStatus === "PENDING"`

### 4.4 — Auto-refresh toggle
- Toggle switch labeled "Auto-refresh (5s)"
- When ON: `setInterval` polls `GET /api/v1/leads` every 5 seconds
- Shows last-updated timestamp
- Clears interval on component unmount

### 4.5 — Export CSV
- Button: "Export CSV"
- File: `src/utils/exportCsv.ts`
- Exports current filtered+searched list (all pages) as CSV
- Columns match table columns
- Filename: `send-list-{YYYY-MM-DD}.csv`

### 4.6 — API call
- File: `src/api/leads.ts`
- Add `getAllLeads(): Promise<Lead[]>`

### 4.7 — Assemble `SendListPage`
- File: `src/pages/SendListPage.tsx`
- Initial load shows spinner
- Compose search + filter tabs + table + auto-refresh toggle + export button

---

## Acceptance Criteria

- [ ] Table shows all leads with correct status badges
- [ ] SENT = green badge, FAILED = red badge, PENDING = yellow badge
- [ ] Search filters rows in real time
- [ ] Filter tabs correctly subset the data, each shows count
- [ ] Auto-refresh polls every 5s when toggled on, stops when toggled off
- [ ] CSV export downloads current filtered view
- [ ] Pagination works; 20 rows per page
- [ ] Error column truncates long text; full text on hover
