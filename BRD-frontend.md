# Business Requirements Document
## LeadApp — React Frontend Dashboard

**Version:** 1.0  
**Date:** 2026-06-04  
**Author:** Taufik Islam  
**Status:** Draft

---

## 1. Overview

Build a React JS single-page dashboard that sits in front of the existing LeadApp backend. The dashboard lets an operator:

1. Paste or upload a raw JSON array of leads
2. Write a custom WhatsApp message and a custom SMS message
3. Submit the batch — backend saves each lead and dispatches WhatsApp + SMS jobs
4. Monitor the send status of every number in real time (success / failed / pending)

---

## 2. Current Backend Summary

| Layer | Detail |
|---|---|
| API | Express on `http://localhost:3000` |
| Prefix | `/api/v1` |
| Lead endpoints | `POST /leads`, `GET /leads`, `GET /leads/:id`, `PATCH /leads/:id`, `DELETE /leads/:id` |
| Queue | BullMQ → Redis; WhatsApp worker + SMS worker run as a separate process |
| Lead statuses | `whatsappStatus`, `smsStatus` — each: `PENDING \| SENT \| FAILED` |
| Message building | Currently hardcoded in `buildWhatsAppMessage()` / `buildSmsMessage()` in worker files |
| WhatsApp number | BD phone `01XXXXXXXXX` → `880XXXXXXXXX@c.us` |
| SMS provider | bulksmsbd.net HTTP API |

### Required Backend Changes (to support custom messages)

The following changes are needed before the frontend can pass custom messages:

1. **Add `smsMessage` column** to the `Lead` model in Prisma schema (mirrors `whatsappMessage` which already exists).
2. **Pass custom messages through job data** — extend `WhatsAppJobData` and `SmsJobData` to include an optional `message` string.
3. **Update workers** — if `job.data.message` is provided, use it; otherwise fall back to the existing `buildXxxMessage()` helper.
4. **Update `CreateLeadDto`** — add optional `whatsappMessage` and `smsMessage` fields.
5. **Update lead service / producer** — forward the message fields into job payloads.
6. **New endpoint: `POST /api/v1/leads/bulk`** — accepts an array of lead objects plus top-level `whatsappMessage` and `smsMessage` strings; creates all leads and dispatches jobs in one request.

---

## 3. Frontend Requirements

### 3.1 Tech Stack

| Item | Choice |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS |
| HTTP client | Axios |
| State | React hooks (useState / useEffect) — no Redux |
| Routing | React Router v6 |
| Table | TanStack Table v8 |
| Toast | react-hot-toast |
| Icons | lucide-react |

Frontend lives at `/home/desktop/Desktop/leadApp/frontend/` as a separate Vite project.

---

### 3.2 Pages & Navigation

```
/              → Dashboard (stats cards)
/send          → Send Tab (JSON input + custom messages + submit)
/send-list     → Send List Tab (status table)
```

Top navigation bar with three links: **Dashboard**, **Send**, **Send List**.

---

### 3.3 Page Specifications

#### 3.3.1 Dashboard Page (`/`)

**Purpose:** Overview of all leads and their delivery health.

**Components:**

| Card | Data source |
|---|---|
| Total Leads | `GET /api/v1/leads` → count |
| WhatsApp Sent | leads where `whatsappStatus === "SENT"` |
| WhatsApp Failed | leads where `whatsappStatus === "FAILED"` |
| SMS Sent | leads where `smsStatus === "SENT"` |
| SMS Failed | leads where `smsStatus === "FAILED"` |
| Pending | leads where either status is `"PENDING"` |

Below cards: a summary bar chart (WhatsApp Sent vs Failed, SMS Sent vs Failed) using plain CSS bars — no chart library needed.

---

#### 3.3.2 Send Page (`/send`)

**Purpose:** Input raw JSON leads + compose messages + submit batch.

**Layout (top to bottom):**

1. **JSON Input Panel**
   - Large `<textarea>` (≥ 300px height) labeled "Paste Lead JSON Array"
   - Placeholder shows the expected JSON shape:
     ```json
     [
       {
         "shopName": "Example Shop",
         "ownerName": "Rahim",
         "phoneNumber": "01712345678",
         "whatsappNumber": "01712345678",
         "city": "Dhaka"
       }
     ]
     ```
   - "Upload JSON File" button — opens file picker, reads `.json` file, populates textarea
   - "Validate JSON" button — parses textarea, shows inline error or green tick + record count
   - Parsed preview table (first 5 rows, columns: shopName, ownerName, phoneNumber, whatsappNumber, city)

2. **Message Composition Panel** (two side-by-side cards on desktop, stacked on mobile)
   - **WhatsApp Message** card
     - `<textarea>` (≥ 120px), labeled "Custom WhatsApp Message"
     - Character counter
     - Placeholder: default message template
     - Toggle: "Use default message" — clears textarea and sends empty (backend falls back to auto-generated)
   - **SMS Message** card
     - Same structure as WhatsApp card
     - SMS character counter shows number of SMS parts (160 chars = 1 part)

3. **Send Controls**
   - "Send to All" primary button — disabled until JSON is valid
   - Shows a count: "X leads will receive WhatsApp, Y leads will receive SMS"
   - Confirmation modal before submit:  
     > "You are about to send WhatsApp to X numbers and SMS to Y numbers. Proceed?"
   - After submit: redirects to `/send-list` and shows a success toast

4. **Validation Rules (frontend)**
   - JSON must be a non-empty array
   - Each object must have at least `shopName` (string)
   - `phoneNumber` / `whatsappNumber` must match `01\d{9}` if present
   - WhatsApp message max 1000 chars
   - SMS message max 320 chars (2 SMS parts)

---

#### 3.3.3 Send List Page (`/send-list`)

**Purpose:** Track delivery status for every lead.

**Features:**

1. **Search bar** — filter by shop name, owner name, or phone number (client-side)
2. **Filter tabs** — All | WhatsApp Sent | WhatsApp Failed | SMS Sent | SMS Failed | Pending
3. **Status table** columns:

| # | Column | Source |
|---|---|---|
| 1 | Shop Name | `lead.shopName` |
| 2 | Owner | `lead.ownerName` |
| 3 | Phone | `lead.phoneNumber` |
| 4 | WhatsApp Number | `lead.whatsappNumber` |
| 5 | WhatsApp Status | `lead.whatsappStatus` badge |
| 6 | WhatsApp Sent At | `lead.whatsappSentAt` formatted |
| 7 | SMS Status | `lead.smsStatus` badge |
| 8 | SMS Sent At | `lead.smsSentAt` formatted |
| 9 | Error | `lead.lastError` (truncated, hover tooltip) |

4. **Status badge colors:**
   - `SENT` → green
   - `FAILED` → red
   - `PENDING` → yellow/orange

5. **Auto-refresh** toggle — polls `GET /api/v1/leads` every 5 seconds when enabled (useful while worker is processing)

6. **Export CSV** button — downloads current filtered list as CSV

7. **Pagination** — 20 rows per page, client-side

---

## 4. API Contract

### 4.1 Existing Endpoint (unchanged)

```
GET  /api/v1/leads          → { data: Lead[] }
POST /api/v1/leads          → { data: Lead }
```

### 4.2 New Endpoint (to be built)

```
POST /api/v1/leads/bulk
```

**Request body:**
```json
{
  "leads": [
    {
      "shopName": "Example Shop",
      "ownerName": "Rahim",
      "phoneNumber": "01712345678",
      "whatsappNumber": "01712345678",
      "city": "Dhaka"
    }
  ],
  "whatsappMessage": "Custom WA message here...",
  "smsMessage": "Custom SMS message here..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "created": 5,
    "skipped": 1,
    "leads": [ /* created Lead objects */ ]
  },
  "message": "5 leads created and queued, 1 skipped (duplicate email)"
}
```

---

## 5. User Stories

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| US-01 | Operator | Paste a JSON array of leads | I don't have to enter them one by one |
| US-02 | Operator | Write one WhatsApp message for the whole batch | All recipients get the same customized message |
| US-03 | Operator | Write one SMS message for the whole batch | Same as above for SMS |
| US-04 | Operator | See which numbers received messages successfully | I know who was reached |
| US-05 | Operator | See which numbers failed and why | I can retry or fix the data |
| US-06 | Operator | Filter the send list by status | I can focus on failures quickly |
| US-07 | Operator | Auto-refresh the send list | I see updates without manual refresh |
| US-08 | Operator | Export the send list to CSV | I can share results offline |
| US-09 | Operator | See dashboard stats | I get a quick health overview |

---

## 6. Non-Functional Requirements

| Requirement | Target |
|---|---|
| API base URL | Configurable via `.env` (`VITE_API_URL=http://localhost:3000`) |
| Responsive | Desktop-first; usable on tablet (≥ 768px) |
| Error handling | All API errors show a toast with the error message |
| Loading states | Skeleton loaders or spinner on every async operation |
| Accessibility | Semantic HTML, labels on all inputs, keyboard navigation |
| Browser support | Chrome/Firefox latest two versions |

---

## 7. Out of Scope (v1)

- User authentication / login screen
- Email sending (email worker is disabled)
- Editing individual leads from the frontend
- Real-time WebSocket updates (polling is sufficient for v1)
- Dark mode

---

## 8. Implementation Order

| Phase | Task |
|---|---|
| 1 | Backend: add `smsMessage` to schema + migrate; extend job types; update workers to accept custom message |
| 2 | Backend: build `POST /api/v1/leads/bulk` endpoint |
| 3 | Frontend: scaffold Vite + React + Tailwind project |
| 4 | Frontend: layout shell (navbar, routing) |
| 5 | Frontend: Send page (JSON input, message composition, submit) |
| 6 | Frontend: Send List page (table, filters, auto-refresh, CSV export) |
| 7 | Frontend: Dashboard page (stats cards + bar summary) |
| 8 | Integration testing end-to-end |

---

## 9. File Structure (Frontend)

```
frontend/
├── public/
├── src/
│   ├── api/
│   │   └── leads.ts          # Axios calls
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── Layout.tsx
│   │   ├── ui/
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Spinner.tsx
│   │   └── leads/
│   │       ├── JsonInputPanel.tsx
│   │       ├── MessagePanel.tsx
│   │       ├── SendControls.tsx
│   │       └── SendListTable.tsx
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── SendPage.tsx
│   │   └── SendListPage.tsx
│   ├── types/
│   │   └── lead.ts
│   ├── utils/
│   │   ├── validateLeadJson.ts
│   │   └── exportCsv.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```
