import {
  apiRoutes,
  type ReputationMetricsResponse,
  type ReputationRecalculateResponse,
} from "@ctn/api-contracts";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { requireAuthContext, UserProfileRequiredError } from "../../auth/auth-context";
import { findUserByClerkId } from "../../db/repositories/users.repository";
import {
  getReputationMetrics,
  recalculateAllScores,
} from "../../db/repositories/reputation.repository";
import type { AppServices } from "../services";

async function requireAdminUser(request: FastifyRequest, services: AppServices) {
  const auth = await requireAuthContext(request, services.env);
  const user = await findUserByClerkId(services.db, auth.clerkUserId);
  if (!user) {
    throw new UserProfileRequiredError();
  }
  return user;
}

export async function registerReputationRoutes(
  app: FastifyInstance,
  services: AppServices,
): Promise<void> {
  app.get(apiRoutes.reputationMetrics, async (request, reply) => {
    const user = await requireAdminUser(request, services);
    if (!user.roles.includes("admin")) {
      return reply
        .status(403)
        .send({ code: "ADMIN_REQUIRED", message: "Admin access is required." });
    }

    const metrics = await getReputationMetrics(services.db);
    return reply.status(200).send({ metrics } satisfies ReputationMetricsResponse);
  });

  app.post(apiRoutes.reputationRecalculate, async (request, reply) => {
    const user = await requireAdminUser(request, services);
    if (!user.roles.includes("admin")) {
      return reply
        .status(403)
        .send({ code: "ADMIN_REQUIRED", message: "Admin access is required." });
    }

    // Run recalculation in the background (fire-and-forget)
    void recalculateAllScores(services.db);

    return reply.status(200).send({ status: "queued" } satisfies ReputationRecalculateResponse);
  });
}
