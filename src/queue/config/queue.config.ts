import { JobsOptions } from "bullmq";

export const QUEUES = {
  EMAIL: "email-queue",
  WHATSAPP: "whatsapp-queue",
} as const;

export const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 1000, // 1s → 2s → 4s
  },
  removeOnComplete: 100,
  removeOnFail: 200,
};
