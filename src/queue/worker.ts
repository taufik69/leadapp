import "dotenv/config";
import { getWhatsAppClient } from "../services/whatsapp/wweb.service";
import { createEmailWorker } from "./workers/email.worker";
import { createWhatsAppWorker } from "./workers/whatsapp.worker";

console.log("🚀 Worker process starting...");

// WhatsApp client initialize — QR scan একবার
getWhatsAppClient();

// Workers start
createEmailWorker();
createWhatsAppWorker();

console.log("✅ All workers started");

// Graceful shutdown
const shutdown = async () => {
  console.log("\nShutting down workers...");
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
