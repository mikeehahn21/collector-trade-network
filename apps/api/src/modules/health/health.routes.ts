import type { FastifyInstance } from "fastify";

import { APP_NAME } from "@ctn/constants";
import { healthContract } from "@ctn/api-contracts";

export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  app.get(healthContract.path, async () => ({
    status: "ok" as const,
    service: APP_NAME,
    version: "0.0.0",
  }));
}
