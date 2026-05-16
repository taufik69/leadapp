# Lead App — BullMQ Worker System Plan

## Overview

Lead create হলে automatically Email ও WhatsApp পাঠাবে, পাঠানো হলে DB তে status update হবে। সব কাজ background queue এ হবে যাতে API fast থাকে।

---

## Full Workflow

```
POST /api/v1/leads
        │
        ▼
  Lead Service
  (DB তে lead save করো)
        │
        ▼
  Queue Producer
  (BullMQ তে 2টা job add করো)
        │
        ├──────────────────────────────┐
        ▼                              ▼
  email-queue                   whatsapp-queue
  (Redis এ job বসলো)            (Redis এ job বসলো)
        │                              │
        ▼                              ▼
  Email Worker                  WhatsApp Worker
  (Resend API দিয়ে mail পাঠাও)  (wweb.js দিয়ে message পাঠাও)
        │                              │
        ▼                              ▼
  DB update                      DB update
  (lead.emailStatus = SENT)      (lead.whatsappStatus = SENT)
        │                              │
        └──────────────┬───────────────┘
                       ▼
              Failed হলে → auto retry (3 বার)
              তারপরও failed → status = FAILED
```

---

## Prisma Schema Changes

`Lead` model এ এই fields যোগ হবে:

```prisma
model Lead {
  // ... existing fields

  emailStatus      MessageStatus @default(PENDING)
  whatsappStatus   MessageStatus @default(PENDING)
  emailSentAt      DateTime?
  whatsappSentAt   DateTime?
  lastError        String?
}

enum MessageStatus {
  PENDING
  SENT
  FAILED
}
```

---

## Folder Structure

```
src/
├── modules/
│   └── lead/
│       ├── dto/lead.dto.ts
│       ├── repository/lead.repository.ts
│       ├── service/lead.service.ts          ← queue dispatch এখান থেকে
│       ├── controller/lead.controller.ts
│       └── routes/lead.routes.ts
│
├── queue/
│   ├── config/
│   │   ├── redis.config.ts                 ← Redis connection
│   │   └── queue.config.ts                 ← Queue names, default options
│   │
│   ├── producers/
│   │   └── lead.producer.ts                ← Job গুলো queue তে add করে
│   │
│   ├── workers/
│   │   ├── email.worker.ts                 ← Email job process করে
│   │   └── whatsapp.worker.ts              ← WhatsApp job process করে
│   │
│   ├── jobs/
│   │   └── lead.job.types.ts               ← Job data এর TypeScript types
│   │
│   └── worker.ts                           ← Worker entry point (আলাদা process)
│
├── services/
│   ├── email/
│   │   └── resend.service.ts               ← Resend API wrapper
│   └── whatsapp/
│       └── wweb.service.ts                 ← whatsapp-web.js wrapper
```

---

## File Details

### `queue/config/redis.config.ts`
```ts
// Redis connection তৈরি করে
// BullMQ এর সব queue এবং worker এই connection ব্যবহার করবে
const connection = new Redis({ host, port, password })
```

### `queue/config/queue.config.ts`
```ts
// Queue names
export const QUEUES = {
  EMAIL: "email-queue",
  WHATSAPP: "whatsapp-queue",
}

// Default job options — retry logic এখানে
export const defaultJobOptions = {
  attempts: 3,           // ৩ বার try করবে
  backoff: {
    type: "exponential", // 1s → 2s → 4s করে wait করবে
    delay: 1000,
  },
  removeOnComplete: 100, // শেষ ১০০টা completed job রাখবে
  removeOnFail: 200,     // শেষ ২০০টা failed job রাখবে
}
```

### `queue/jobs/lead.job.types.ts`
```ts
// Email job এ কী data থাকবে
export interface EmailJobData {
  leadId: string
  email: string
  shopName: string
  ownerName?: string
}

// WhatsApp job এ কী data থাকবে
export interface WhatsAppJobData {
  leadId: string
  phoneNumber: string
  shopName: string
  ownerName?: string
}
```

### `queue/producers/lead.producer.ts`
```ts
// Lead create হলে এই function call হবে
// EmailQueue এবং WhatsAppQueue তে job add করবে
export const dispatchLeadJobs = async (lead: Lead) => {
  await emailQueue.add("send-email", { leadId, email, shopName })
  await whatsappQueue.add("send-whatsapp", { leadId, phoneNumber, shopName })
}
```

### `queue/workers/email.worker.ts`
```ts
// email-queue থেকে job নিয়ে process করবে
// Resend API দিয়ে email পাঠাবে
// সফল হলে → lead.emailStatus = SENT, emailSentAt = now
// ব্যর্থ হলে → BullMQ auto retry করবে, শেষে FAILED
```

### `queue/workers/whatsapp.worker.ts`
```ts
// whatsapp-queue থেকে job নিয়ে process করবে
// whatsapp-web.js client দিয়ে message পাঠাবে
// সফল হলে → lead.whatsappStatus = SENT, whatsappSentAt = now
// ব্যর্থ হলে → BullMQ auto retry করবে, শেষে FAILED
```

### `services/whatsapp/wweb.service.ts`
```ts
// whatsapp-web.js Client singleton
// প্রথমে QR code দেখাবে → scan করলে session তৈরি হবে
// Session LocalAuth দিয়ে save হবে, পরে auto-login
// sendMessage(phone, text) function expose করবে
```

### `queue/worker.ts` — আলাদা process
```ts
// এটা আলাদা process হিসেবে চলবে
// "npm run worker" দিয়ে start করবে
// email.worker এবং whatsapp.worker দুটোই এখানে initialize হবে
// WhatsApp client এখানেই boot হবে (QR scan একবার)
```

---

## Package Install

```bash
npm install bullmq ioredis resend whatsapp-web.js qrcode-terminal
```

---

## `.env` তে নতুন variables

```env
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Resend
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

# WhatsApp session save location
WWEB_SESSION_PATH=./.wwebjs_auth
```

---

## `package.json` scripts

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "worker": "nodemon --exec ts-node src/queue/worker.ts",
    "start": "node dist/server.js",
    "start:worker": "node dist/queue/worker.js"
  }
}
```

---

## Execution Order (Implementation Steps)

1. **Prisma schema** — `emailStatus`, `whatsappStatus` fields যোগ করো → migrate
2. **Redis config** — connection তৈরি করো
3. **Queue config** — queue names + default options
4. **Job types** — TypeScript interfaces
5. **Resend service** — email send wrapper
6. **WhatsApp service** — wweb.js client singleton
7. **Email worker** — job process + DB update
8. **WhatsApp worker** — job process + DB update
9. **Lead producer** — job dispatch
10. **Lead service** — create হলে producer call করো
11. **Worker entry point** — `worker.ts`
12. **package.json** — `worker` script যোগ করো

---

## Important Notes

- **API process** এবং **Worker process** আলাদা — `npm run dev` এবং `npm run worker` আলাদা terminal এ চলবে
- **WhatsApp QR** একবার scan করলেই হবে — session `.wwebjs_auth` folder এ save থাকবে
- **Redis** locally চালাতে: `docker run -d -p 6379:6379 redis`
- Worker crash করলে BullMQ এর stalled job mechanism আবার retry করবে
