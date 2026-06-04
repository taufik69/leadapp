# Sprint 1 — Backend Changes for Custom Messages

**Goal:** Extend the backend so custom WhatsApp and SMS messages can be passed per-batch, and add a bulk create endpoint.

**Duration:** 1 day  
**Status:** To Do

---

## Tasks

### 1.1 — Prisma: add `smsMessage` field
- File: `prisma/schema.prisma`
- Add `smsMessage String @default("")` to the `Lead` model (mirrors existing `whatsappMessage`)
- Run `npm run prisma:migrate`
- Run `npm run prisma:generate`

### 1.2 — Extend job type interfaces
- File: `src/queue/jobs/lead.job.types.ts`
- Add optional `message?: string` to `WhatsAppJobData` and `SmsJobData`

### 1.3 — Update WhatsApp worker
- File: `src/queue/workers/whatsapp.worker.ts`
- Use `job.data.message` if present; else fall back to `buildWhatsAppMessage(shopName, ownerName)`
- Also save `whatsappMessage` to DB on `SENT`

### 1.4 — Update SMS worker
- File: `src/queue/workers/sms.worker.ts`
- Same pattern: use `job.data.message` if present; else fall back to `buildSmsMessage(shopName, ownerName)`
- Save `smsMessage` to DB on `SENT`

### 1.5 — Update CreateLeadDto
- File: `src/modules/lead/dto/lead.dto.ts`
- Add optional `whatsappMessage?: string` and `smsMessage?: string`

### 1.6 — Update lead service & producer
- File: `src/modules/lead/service/lead.service.ts`
- Forward `whatsappMessage` and `smsMessage` from request body into `dispatchLeadJobs()`
- File: `src/queue/producers/lead.producer.ts`
- Add `message` field to `WhatsAppJobData` and `SmsJobData` payloads

### 1.7 — New bulk endpoint
- New file: `src/modules/lead/routes/lead.routes.ts` — add `POST /leads/bulk`
- New controller method: `leadController.bulkCreate`
- New service method: `leadService.bulkCreateLeads(leads[], whatsappMessage, smsMessage)`
  - Iterate array, create each lead, skip duplicates (catch unique constraint errors)
  - Dispatch jobs for each created lead with the shared custom message
  - Return `{ created, skipped, leads }`
- DTO: `BulkCreateLeadDto = z.object({ leads: z.array(CreateLeadDto), whatsappMessage: z.string().optional(), smsMessage: z.string().optional() })`

---

## Acceptance Criteria

- [ ] `POST /api/v1/leads/bulk` accepts array + messages, returns created/skipped count
- [ ] Custom message flows through to WhatsApp and SMS workers
- [ ] If no custom message provided, workers fall back to auto-generated message
- [ ] DB stores the actual sent message in `whatsappMessage` / `smsMessage` fields
