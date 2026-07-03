import pino from "pino";

import type { Env } from "../config/env";

export function createLogger(env: Pick<Env, "LOG_LEVEL" | "APP_ENV">): pino.Logger {
  return pino({
    level: env.LOG_LEVEL,
    base: {
      service: "api",
      environment: env.APP_ENV,
    },
  });
}
