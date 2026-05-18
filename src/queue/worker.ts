import "dotenv/config";
// import { createEmailWorker } from "./workers/email.worker"; // hold
import { createWhatsAppWorker } from "./workers/whatsapp.worker";

console.log("🚀 Worker process starting...");

// Workers start
// createEmailWorker(); // hold
createWhatsAppWorker();

console.log("✅ All workers started");

const shutdown = async () => {
  console.log("\nShutting down workers...");
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
