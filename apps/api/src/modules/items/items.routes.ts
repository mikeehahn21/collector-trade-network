import type { FastifyInstance, FastifyRequest } from "fastify";

import {
  apiRoutes,
  aiReviewWebhookContract,
  itemAiSuggestionContract,
  itemDraftContract,
  itemPublishContract,
  itemVerificationVideoContract,
} from "@ctn/api-contracts";
import { tradeableItemDraftSchema } from "@ctn/validation";

import { requireAuthContext, UserProfileRequiredError } from "../../auth/auth-context";
import {
  applyAiReviewResult,
  createItemForOwner,
  deleteItemForOwner,
  findItemByOwner,
  findVerificationStatusByOwner,
  findVisiblePublicItem,
  listItemsByOwner,
  updateVerificationVideoForOwner,
  updateItemForOwner,
  type PersistItemInput,
} from "../../db/repositories/items.repository";
import { findUserByClerkId } from "../../db/repositories/users.repository";
import type { AppServices } from "../services";

export async function registerItemRoutes(
  app: FastifyInstance,
  services: AppServices,
): Promise<void> {
  app.get(apiRoutes.items, async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const items = await listItemsByOwner(services.db, user.id);

    return reply.status(200).send({ items });
  });

  app.post(itemDraftContract.path, async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const parsed = itemDraftContract.body.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        code: "INVALID_ITEM_DRAFT",
        message: "Item draft is invalid.",
      });
    }

    const item = await createItemForOwner(services.db, user.id, parsed.data);

    return reply.status(201).send({ item });
  });

  app.post(itemPublishContract.path, async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const parsed = itemPublishContract.body.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        code: "INVALID_TRADEABLE_ITEM",
        message: "Complete the required fields before publishing.",
      });
    }

    const item = await createItemForOwner(services.db, user.id, parsed.data);

    return reply.status(201).send({ item });
  });

  app.get("/v1/items/:itemId", async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const itemId = (request.params as { itemId: string }).itemId;
    const item = await findItemByOwner(services.db, user.id, itemId);

    if (!item) {
      return reply.status(404).send({ code: "ITEM_NOT_FOUND", message: "Item not found." });
    }

    return reply.status(200).send({ item });
  });

  app.get("/v1/public/items/:itemId", async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const itemId = (request.params as { itemId: string }).itemId;
    const item = await findVisiblePublicItem(services.db, itemId, {
      id: user.id,
      roles: user.roles,
    });

    if (!item) {
      return reply.status(404).send({ code: "PUBLIC_ITEM_NOT_FOUND", message: "Item not found." });
    }

    return reply.status(200).send({ item });
  });

  app.put("/v1/items/:itemId", async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const itemId = (request.params as { itemId: string }).itemId;
    const parsed = tradeableItemDraftSchema.partial().safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        code: "INVALID_ITEM_UPDATE",
        message: "Item update is invalid.",
      });
    }

    const item = await updateItemForOwner(services.db, user.id, itemId, parsed.data as PersistItemInput);

    if (!item) {
      return reply.status(404).send({ code: "ITEM_NOT_FOUND", message: "Item not found." });
    }

    return reply.status(200).send({ item });
  });

  app.delete("/v1/items/:itemId", async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const itemId = (request.params as { itemId: string }).itemId;
    const deleted = await deleteItemForOwner(services.db, user.id, itemId);

    if (!deleted) {
      return reply.status(404).send({ code: "ITEM_NOT_FOUND", message: "Item not found." });
    }

    return reply.status(204).send();
  });

  app.post(itemAiSuggestionContract.path, async (request, reply) => {
    const parsed = itemAiSuggestionContract.body.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        code: "INVALID_AI_LISTING_INPUT",
        message: "AI listing input is invalid.",
      });
    }

    return reply.status(200).send({
      title: parsed.data.title || "Vintage graphic tee",
      category: parsed.data.category || "band",
      size: parsed.data.size || "xl",
      era: "90s",
      condition: "very_good",
      tag: "Single stitch tag",
      estimatedValue: { min: 120, max: 220, currency: "USD" },
      confidence: parsed.data.photos.length > 1 ? "medium" : "low",
      generatedAt: new Date().toISOString(),
    });
  });

  app.post("/v1/items/:itemId/verification-video", async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const itemId = (request.params as { itemId: string }).itemId;
    const parsed = itemVerificationVideoContract.body.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        code: "INVALID_VERIFICATION_VIDEO",
        message: "Verification video must be between 5 and 30 seconds and include a 4-digit code.",
      });
    }

    const item = await updateVerificationVideoForOwner(services.db, user.id, itemId, {
      videoUrl: parsed.data.videoUrl,
      verificationCode: parsed.data.verificationCode,
    });

    if (!item) {
      return reply.status(404).send({ code: "ITEM_NOT_FOUND", message: "Item not found." });
    }

    request.log.info(
      { itemId, verificationCode: parsed.data.verificationCode },
      "Queued placeholder AI verification review.",
    );

    return reply.status(202).send({ item });
  });

  app.get("/v1/items/:itemId/verification-status", async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const itemId = (request.params as { itemId: string }).itemId;
    const item = await findVerificationStatusByOwner(services.db, user.id, itemId);

    if (!item) {
      return reply.status(404).send({ code: "ITEM_NOT_FOUND", message: "Item not found." });
    }

    return reply.status(200).send({ item });
  });

  app.post(apiRoutes.aiReviewWebhook, async (request, reply) => {
    const configuredSecret = services.env.AI_REVIEW_WEBHOOK_SECRET;
    const providedSecret = request.headers["x-ai-review-secret"];

    if (configuredSecret && providedSecret !== configuredSecret) {
      return reply.status(401).send({
        code: "AI_REVIEW_WEBHOOK_UNAUTHORIZED",
        message: "Webhook secret is invalid.",
      });
    }

    const parsed = aiReviewWebhookContract.body.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        code: "INVALID_AI_REVIEW_RESULT",
        message: "AI review result is invalid.",
      });
    }

    const item = await applyAiReviewResult(services.db, parsed.data);

    if (!item) {
      return reply.status(404).send({ code: "ITEM_NOT_FOUND", message: "Item not found." });
    }

    return reply.status(200).send({ item });
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
