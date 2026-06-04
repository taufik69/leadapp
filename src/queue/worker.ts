import "dotenv/config";
// import { createEmailWorker } from "./workers/email.worker"; // hold
import { createWhatsAppWorker } from "./workers/whatsapp.worker";
import { createSmsWorker } from "./workers/sms.worker";
import {
  initializeWhatsAppClient,
  waitForWhatsAppReady,
  shutdownWhatsAppClient,
} from "../services/whatsapp/wweb.service";
import type { Worker } from "bullmq";

console.log("Worker process starting...");

let whatsappWorker: Worker | null = null;
let smsWorker: Worker | null = null;

const shutdown = async () => {
  console.log("\nShutting down workers...");
  await Promise.all([whatsappWorker?.close(), smsWorker?.close()]);
  await shutdownWhatsAppClient();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

const start = async (): Promise<void> => {
  // SMS worker starts immediately — stateless HTTP, no auth required
  smsWorker = createSmsWorker();

  // WhatsApp needs Chrome + session before it can process jobs
  initializeWhatsAppClient();
  console.log("[Worker] Waiting for WhatsApp to be ready (scan QR if prompted)...");
  await waitForWhatsAppReady(300_000);
  console.log("[Worker] WhatsApp ready — starting WhatsApp job queue");

  // createEmailWorker(); // hold
  whatsappWorker = createWhatsAppWorker();

  console.log("All workers started");
};

start().catch((err) => {
  console.error("[Worker] Startup failed:", err);
  process.exit(1);
});
