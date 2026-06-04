# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (run in separate terminals)
npm run dev          # API server with hot-reload
npm run worker       # BullMQ worker process (email + WhatsApp)

# Build & production
npm run build        # tsc → dist/
npm start            # node dist/server.js
npm run start:worker # node dist/queue/worker.js

# Database
npm run prisma:migrate   # apply migrations (dev)
npm run prisma:generate  # regenerate Prisma client after schema changes
npm run prisma:studio    # Prisma GUI
```

## Architecture

Two separate Node processes must run simultaneously:

1. **API server** (`src/server.ts`) — Express HTTP server, handles requests, writes leads to DB, then fires-and-forgets job dispatch
2. **Worker** (`src/queue/worker.ts`) — BullMQ consumer, processes email and WhatsApp jobs in the background

### Request → Queue → Notification flow

```
POST /api/v1/leads
  → leadService.createLead()        # saves to DB, returns immediately
  → dispatchLeadJobs() [non-blocking]
       ├── emailQueue.add()          # Resend API (currently commented out in worker.ts)
       └── whatsappQueue.add()       # whatsapp-web.js
            ↓
         Workers update lead.emailStatus / lead.whatsappStatus → SENT | FAILED
```

Job retry: 3 attempts, exponential backoff (1s → 2s → 4s). After all retries: `lastError` saved to DB.

### Module structure

Each module (`lead`, `user`) follows: `routes → controller → service → repository → dto`

- **DTOs** use Zod schemas. All validation goes through `validate.middleware.ts`, which auto-converts snake_case keys to camelCase and normalizes `""` / `"N/A"` / `"n/a"` → `null` before parsing.
- **Repositories** are plain objects wrapping Prisma calls — no class instances.
- **Services** throw typed errors from `src/shared/errors/app-error.ts` (`NotFoundError`, `ValidationError`, etc.); the global error handler in `error-handler.middleware.ts` maps these to HTTP responses.

### Key design details

- **Prisma client** is generated to `src/generated/prisma/` (non-standard). Always import from there or via `src/config/prisma.ts`. Uses `@prisma/adapter-pg` (PostgreSQL driver adapter).
- **WhatsApp client** (`wweb.service.ts`) is a singleton initialized on worker startup. First run shows a QR code in the terminal — scan once to authenticate. Session is persisted in `.wwebjs_auth/`. Requires Google Chrome at `/usr/bin/google-chrome`.
- **Phone normalization**: BD numbers validated as `01XXXXXXXXX` (11 digits). WhatsApp service prepends `880` and appends `@c.us` for the chat ID.
- **Email worker** is currently disabled — `createEmailWorker()` is commented out in `worker.ts`. Only the WhatsApp worker runs.

## Environment variables

```env
DATABASE_URL=postgresql://...
PORT=3000
NODE_ENV=development

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

WWEB_SESSION_PATH=./.wwebjs_auth
```

Redis can be started locally with: `docker run -d -p 6379:6379 redis`
