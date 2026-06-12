import "dotenv/config";
import app from "./app";
import prisma from "./config/prisma";
import { createRedisSubscriber, WA_REPLY_CHANNEL } from "./services/whatsapp/redis-pubsub";
import { broadcastSseEvent, sendHeartbeat } from "./services/sse/sse.service";

const PORT = process.env.PORT ?? 3000;

const bootstrap = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");

    // Subscribe to incoming WhatsApp replies from the worker and push via SSE
    const redisSub = createRedisSubscriber();
    await redisSub.subscribe(WA_REPLY_CHANNEL);
    redisSub.on("message", (_channel, data) => {
      try {
        const parsed = JSON.parse(data);
        console.log(`[SSE] Received from Redis — leadId=${parsed.leadId}, broadcasting to SSE clients`);
        broadcastSseEvent(parsed);
      } catch {
        console.error("[SSE] Malformed Redis message:", data);
      }
    });
    console.log("[SSE] Redis subscriber ready on channel:", WA_REPLY_CHANNEL);

    const cleanup = async () => {
      await redisSub.quit();
      await prisma.$disconnect();
    };

    process.on("SIGTERM", async () => {
      console.log("SIGTERM received. Shutting down gracefully...");
      await cleanup();
      process.exit(0);
    });

    process.on("SIGINT", async () => {
      console.log("SIGINT received. Shutting down gracefully...");
      await cleanup();
      process.exit(0);
    });

    // Keep SSE connections alive — browsers drop idle connections after ~60s
    setInterval(() => sendHeartbeat(), 30_000);

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV ?? "development"}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

bootstrap();
