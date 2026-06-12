import { Redis } from "ioredis";

export const WA_REPLY_CHANNEL = "whatsapp:reply";

export const createRedisPublisher = (): Redis =>
  new Redis({
    host: process.env.REDIS_HOST ?? "localhost",
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD ?? undefined,
  });

export const createRedisSubscriber = (): Redis =>
  new Redis({
    host: process.env.REDIS_HOST ?? "localhost",
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD ?? undefined,
  });
