# Sprint 3 — Send Page

**Goal:** Build the `/send` page where an operator pastes JSON leads, writes custom messages, and submits the batch.

**Duration:** 1 day  
**Status:** To Do

---

## Tasks

### 3.1 — `JsonInputPanel` component
- File: `src/components/leads/JsonInputPanel.tsx`
- Large `<textarea>` for pasting raw JSON
- "Upload JSON File" button — file input triggers JSON read and populates textarea
- "Validate JSON" button — parse, show error or ✓ + record count
- Preview table of first 5 rows (shopName, ownerName, phoneNumber, whatsappNumber, city)
- Expose: `parsedLeads`, `isValid`, `validationError` to parent

### 3.2 — `MessagePanel` component
- File: `src/components/leads/MessagePanel.tsx`
- Two cards side-by-side (stacked on mobile):
  - **WhatsApp Message** — textarea, char counter (max 1000), "Use default" toggle
  - **SMS Message** — textarea, char counter + SMS parts calc (160 chars = 1 part, max 320), "Use default" toggle
- Expose: `whatsappMessage`, `smsMessage` to parent

### 3.3 — `SendControls` component
- File: `src/components/leads/SendControls.tsx`
- Summary line: "X leads will receive WhatsApp, Y leads will receive SMS"
- "Send to All" button — disabled if JSON not valid
- On click: open confirmation modal
- Modal text: "You are about to send WhatsApp to X numbers and SMS to Y numbers. Proceed?"
- On confirm: call `POST /api/v1/leads/bulk`, show loading spinner
- On success: toast "Batch submitted! X leads queued." → redirect to `/send-list`
- On error: toast with error message

### 3.4 — Validation utility
- File: `src/utils/validateLeadJson.ts`
- Parse JSON string → validate is array → each item has `shopName: string`
- `phoneNumber` / `whatsappNumber` match `^01\d{9}$` if present
- Return `{ valid: boolean, errors: string[], leads: LeadInput[] }`

### 3.5 — API call
- File: `src/api/leads.ts`
- Add `bulkCreateLeads(payload: BulkLeadPayload): Promise<BulkCreateResponse>`

### 3.6 — Assemble `SendPage`
- File: `src/pages/SendPage.tsx`
- Compose `JsonInputPanel` + `MessagePanel` + `SendControls`
- Manage shared state between panels

---

## Acceptance Criteria

- [ ] Pasting valid JSON shows record count and 5-row preview
- [ ] Pasting invalid JSON shows error message
- [ ] Uploading a `.json` file populates the textarea
- [ ] "Use default" toggle clears the message textarea
- [ ] Character counter updates live
- [ ] SMS parts counter updates live
- [ ] "Send to All" disabled when JSON is invalid
- [ ] Confirmation modal shows correct counts
- [ ] Successful submit redirects to `/send-list` with success toast
- [ ] API error shows error toast
