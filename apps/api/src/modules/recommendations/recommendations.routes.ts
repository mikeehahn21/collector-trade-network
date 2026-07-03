import type { FastifyInstance, FastifyRequest } from "fastify";

import { apiRoutes, recommendationFeedbackContract } from "@ctn/api-contracts";

import { requireAuthContext, UserProfileRequiredError } from "../../auth/auth-context";
import {
  getRecommendationFeedbackMetrics,
  upsertRecommendationFeedback,
} from "../../db/repositories/recommendation-feedback.repository";
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

  app.post("/v1/recommendations/:recommendationId/feedback", async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const recommendationId = (request.params as { recommendationId: string }).recommendationId;
    const parsed = recommendationFeedbackContract.body.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        code: "INVALID_RECOMMENDATION_FEEDBACK",
        message: "Recommendation feedback is invalid.",
      });
    }

    const dataset = await loadTradeGraphDataset(services.db, user);
    const { recommendations } = generateTradeRecommendations(dataset);
    const recommendation = recommendations.find((candidate) => candidate.id === recommendationId);

    if (!recommendation) {
      return reply.status(404).send({
        code: "RECOMMENDATION_NOT_FOUND",
        message: "Recommendation not found.",
      });
    }

    const validTargetItemIds = [
      ...recommendation.yourMatchingItems,
      ...recommendation.theirMatchingItems,
    ].map((item) => item.id);
    const targetItemId = parsed.data.targetItemId ?? validTargetItemIds[0];

    if (targetItemId && !validTargetItemIds.includes(targetItemId)) {
      return reply.status(400).send({
        code: "INVALID_RECOMMENDATION_TARGET",
        message: "Feedback target item must belong to the recommendation.",
      });
    }

    const feedback = await upsertRecommendationFeedback(services.db, {
      userId: user.id,
      recommendationId,
      counterpartyId: recommendation.counterpartyId,
      targetItemId,
      rating: parsed.data.rating,
      reason: parsed.data.reason,
      notes: parsed.data.notes,
    });

    return reply.status(200).send({ feedback });
  });

  app.get(apiRoutes.recommendationFeedbackMetrics, async (request, reply) => {
    const user = await requireCurrentUser(request, services);

    if (!user.roles.includes("admin")) {
      return reply.status(403).send({
        code: "ADMIN_REQUIRED",
        message: "Admin access is required.",
      });
    }

    const metrics = await getRecommendationFeedbackMetrics(services.db);

    return reply.status(200).send({ metrics });
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
