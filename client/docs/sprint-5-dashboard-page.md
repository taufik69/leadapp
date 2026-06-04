# Sprint 5 — Dashboard Page

**Goal:** Build the `/` dashboard with stats cards and a visual summary of delivery health.

**Duration:** 0.5 day  
**Status:** To Do

---

## Tasks

### 5.1 — Stats cards
- File: `src/pages/DashboardPage.tsx`
- Uses shared `Card` component from Sprint 2
- Six cards in a responsive grid (3 col desktop, 2 col tablet, 1 col mobile):
  | Card | Color | Value |
  |---|---|---|
  | Total Leads | Blue | `leads.length` |
  | WhatsApp Sent | Green | `leads.filter(l => l.whatsappStatus === "SENT").length` |
  | WhatsApp Failed | Red | `leads.filter(l => l.whatsappStatus === "FAILED").length` |
  | SMS Sent | Green | `leads.filter(l => l.smsStatus === "SENT").length` |
  | SMS Failed | Red | `leads.filter(l => l.smsStatus === "FAILED").length` |
  | Pending | Yellow | `leads.filter(l => l.whatsappStatus === "PENDING" \|\| l.smsStatus === "PENDING").length` |

### 5.2 — Delivery summary bar chart
- Pure CSS horizontal bars — no chart library
- Two rows: WhatsApp (Sent vs Failed vs Pending), SMS (Sent vs Failed vs Pending)
- Each segment is a colored `<div>` with `width` set as percentage of total
- Legend: Sent (green), Failed (red), Pending (yellow)

### 5.3 — Recent failures list
- Last 5 leads with `whatsappStatus === "FAILED"` or `smsStatus === "FAILED"`
- Shows: shop name, phone, error message
- "View All" link → `/send-list`

### 5.4 — Page data loading
- `GET /api/v1/leads` on mount
- Spinner while loading
- Manual refresh button (re-fetches)

---

## Acceptance Criteria

- [ ] All 6 stat cards show correct counts from API data
- [ ] Bar chart visually represents proportions correctly
- [ ] Recent failures list shows up to 5 failed leads
- [ ] Refresh button re-fetches data
- [ ] Loading spinner shows during fetch
- [ ] Empty state message when no leads exist
