import { Queue } from "bullmq";

import type { Env } from "../config/env";
import type { BackgroundJob, JobQueue } from "./queue";

export function createBullMqQueue(env: Pick<Env, "REDIS_URL">): JobQueue {
  if (!env.REDIS_URL) {
    throw new Error("REDIS_URL is not defined but is required for BullMQ.");
  }
  const redisUrl = new URL(env.REDIS_URL);
  const queue = new Queue("collector-trade-background", {
    connection: {
      host: redisUrl.hostname,
      port: Number(redisUrl.port || 6379),
      username: redisUrl.username || undefined,
      password: redisUrl.password || undefined,
    },
  });

  return {
    async enqueue<TPayload extends Record<string, unknown>>(
      job: BackgroundJob<TPayload>,
    ): Promise<void> {
      await queue.add(job.name, job.payload, {
        attempts: 3,
        backoff: { type: "exponential", delay: 1_000 },
        removeOnComplete: 1_000,
        removeOnFail: 5_000,
      });
    },
  };
}
