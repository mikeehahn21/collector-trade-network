import type { FastifyInstance } from "fastify";

import { APP_NAME } from "@ctn/constants";
import { healthContract } from "@ctn/api-contracts";

import type { Pool } from "pg";

export async function registerHealthRoutes(
  app: FastifyInstance,
  options: { db: Pool },
): Promise<void> {
  app.get(healthContract.path, async () => {
    let dbStatus = "unknown";
    try {
      const result = await options.db.query<{ ok: number }>("SELECT 1 as ok");
      dbStatus = result.rows[0]?.ok === 1 ? "connected" : "error";
    } catch {
      dbStatus = "error";
    }

    return {
      status: "ok" as const,
      service: APP_NAME,
      version: "0.0.0",
      database: dbStatus,
    };
  });
}
