import type { FastifyInstance, FastifyRequest } from "fastify";

import { apiRoutes, wishlistItemDraftContract, wishlistItemPublishContract } from "@ctn/api-contracts";
import { MAX_GRAILS } from "@ctn/constants";
import { wishlistItemDraftSchema } from "@ctn/validation";

import { requireAuthContext, UserProfileRequiredError } from "../../auth/auth-context";
import {
  countActiveGrails,
  createWishlistItemForOwner,
  deleteWishlistItemForOwner,
  findWishlistItemByOwner,
  listWishlistByOwner,
  updateWishlistItemForOwner,
  type PersistWishlistInput,
} from "../../db/repositories/wishlist.repository";
import { findUserByClerkId } from "../../db/repositories/users.repository";
import type { AppServices } from "../services";

export async function registerWishlistRoutes(
  app: FastifyInstance,
  services: AppServices,
): Promise<void> {
  app.get(apiRoutes.wishlistItems, async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const wishlistItems = await listWishlistByOwner(services.db, user.id);

    return reply.status(200).send({ wishlistItems });
  });

  app.post(wishlistItemDraftContract.path, async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const parsed = wishlistItemDraftContract.body.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        code: "INVALID_WISHLIST_DRAFT",
        message: "Wishlist draft is invalid.",
      });
    }

    const wishlistItem = await createWishlistItemForOwner(services.db, user.id, parsed.data);

    return reply.status(201).send({ wishlistItem });
  });

  app.post(wishlistItemPublishContract.path, async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const parsed = wishlistItemPublishContract.body.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        code: "INVALID_WISHLIST_ITEM",
        message: "Complete the required fields before saving this want.",
      });
    }

    if (parsed.data.isGrail && (await countActiveGrails(services.db, user.id)) >= MAX_GRAILS) {
      return reply.status(409).send({
        code: "GRAIL_LIMIT_REACHED",
        message: `You can mark up to ${MAX_GRAILS} grails.`,
      });
    }

    const wishlistItem = await createWishlistItemForOwner(services.db, user.id, parsed.data);

    return reply.status(201).send({ wishlistItem });
  });

  app.get("/v1/wishlist-items/:wishlistItemId", async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const wishlistItemId = (request.params as { wishlistItemId: string }).wishlistItemId;
    const wishlistItem = await findWishlistItemByOwner(services.db, user.id, wishlistItemId);

    if (!wishlistItem) {
      return reply.status(404).send({
        code: "WISHLIST_ITEM_NOT_FOUND",
        message: "Wishlist item not found.",
      });
    }

    return reply.status(200).send({ wishlistItem });
  });

  app.put("/v1/wishlist-items/:wishlistItemId", async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const wishlistItemId = (request.params as { wishlistItemId: string }).wishlistItemId;
    const parsed = wishlistItemDraftSchema.partial().safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        code: "INVALID_WISHLIST_UPDATE",
        message: "Wishlist update is invalid.",
      });
    }

    const existing = await findWishlistItemByOwner(services.db, user.id, wishlistItemId);
    const isBecomingGrail = parsed.data.isGrail === true && existing?.isGrail !== true;

    if (isBecomingGrail && (await countActiveGrails(services.db, user.id)) >= MAX_GRAILS) {
      return reply.status(409).send({
        code: "GRAIL_LIMIT_REACHED",
        message: `You can mark up to ${MAX_GRAILS} grails.`,
      });
    }

    const wishlistItem = await updateWishlistItemForOwner(
      services.db,
      user.id,
      wishlistItemId,
      parsed.data as PersistWishlistInput,
    );

    if (!wishlistItem) {
      return reply.status(404).send({
        code: "WISHLIST_ITEM_NOT_FOUND",
        message: "Wishlist item not found.",
      });
    }

    return reply.status(200).send({ wishlistItem });
  });

  app.delete("/v1/wishlist-items/:wishlistItemId", async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const wishlistItemId = (request.params as { wishlistItemId: string }).wishlistItemId;
    const deleted = await deleteWishlistItemForOwner(services.db, user.id, wishlistItemId);

    if (!deleted) {
      return reply.status(404).send({
        code: "WISHLIST_ITEM_NOT_FOUND",
        message: "Wishlist item not found.",
      });
    }

    return reply.status(204).send();
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
