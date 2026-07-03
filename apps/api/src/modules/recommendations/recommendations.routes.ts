import type { FastifyInstance, FastifyRequest } from "fastify";

import { apiRoutes } from "@ctn/api-contracts";

import { requireAuthContext, UserProfileRequiredError } from "../../auth/auth-context";
import { loadTradeGraphDataset } from "../../db/repositories/trade-graph.repository";
import { findUserByClerkId } from "../../db/repositories/users.repository";
import type { AppServices } from "../services";
import { generateTradeRecommendations } from "./recommendation-engine";

export async function registerRecommendationRoutes(
  app: FastifyInstance,
  services: AppServices,
): Promise<void> {
  app.get(apiRoutes.recommendations, async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const dataset = await loadTradeGraphDataset(services.db, user);
    const result = generateTradeRecommendations(dataset);

    return reply.status(200).send(result);
  });

  app.get("/v1/recommendations/:recommendationId", async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const recommendationId = (request.params as { recommendationId: string }).recommendationId;
    const dataset = await loadTradeGraphDataset(services.db, user);
    const { recommendations } = generateTradeRecommendations(dataset);
    const recommendation = recommendations.find((candidate) => candidate.id === recommendationId);

    if (!recommendation) {
      return reply.status(404).send({
        code: "RECOMMENDATION_NOT_FOUND",
        message: "Recommendation not found.",
      });
    }

    return reply.status(200).send({ recommendation });
  });
}

async function requireCurrentUser(request: FastifyRequest, services: AppServices) {
  const auth = await requireAuthContext(request, services.env);
  const user = await findUserByClerkId(services.db, auth.clerkUserId);

  if (!user) {
    throw new UserProfileRequiredError();
  }

  return user;
}
