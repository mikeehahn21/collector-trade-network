import pg from "pg";

import type { Env } from "../config/env";

export function createDatabasePool(env: Pick<Env, "DATABASE_URL">): pg.Pool {
  return new pg.Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
}
