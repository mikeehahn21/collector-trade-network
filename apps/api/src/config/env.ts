import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  APP_ENV: z.enum(["local", "development", "staging", "production"]).default("local"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  API_HOST: z.string().min(1).default("0.0.0.0"),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  CLERK_SECRET_KEY: z.string().optional(),
  CLERK_ISSUER: z.string().url().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  AI_REVIEW_WEBHOOK_SECRET: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return envSchema.parse(source);
}
