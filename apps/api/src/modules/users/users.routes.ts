import type { FastifyInstance } from "fastify";
import * as Sentry from "@sentry/node";

import { apiRoutes } from "@ctn/api-contracts";
import { userProfileUpsertSchema } from "@ctn/validation";

import { requireAuthContext } from "../../auth/auth-context";
import {
  deleteUserAccountData,
  findUserByClerkId,
  upsertUserProfile,
} from "../../db/repositories/users.repository";
import { deleteClerkUserIdentity } from "../../lib/clerk-users";
import type { AppServices } from "../services";

export async function registerUserRoutes(
  app: FastifyInstance,
  services: AppServices,
): Promise<void> {
  app.get(apiRoutes.me, async (request, reply) => {
    const auth = await requireAuthContext(request, services.env);
    const user = await findUserByClerkId(services.db, auth.clerkUserId);

    if (!user) {
      return reply.status(404).send({
        code: "USER_NOT_FOUND",
        message: "User profile has not been created.",
      });
    }

    return reply.status(200).send({ user });
  });

  app.put(apiRoutes.me, async (request, reply) => {
    const auth = await requireAuthContext(request, services.env);
    const parsed = userProfileUpsertSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        code: "INVALID_USER_PROFILE",
        message: "User profile is invalid.",
      });
    }

    const user = await upsertUserProfile(services.db, {
      clerkUserId: auth.clerkUserId,
      ...parsed.data,
    });

    return reply.status(200).send({ user });
  });

  app.delete(apiRoutes.deleteMe, async (request, reply) => {
    const auth = await requireAuthContext(request, services.env);
    const user = await findUserByClerkId(services.db, auth.clerkUserId);

    if (!user) {
      return reply.status(404).send({
        code: "USER_NOT_FOUND",
        message: "User profile has not been created.",
      });
    }

    const clerkUserId = auth.clerkUserId;
    await deleteUserAccountData(services.db, user.id);

    try {
      await deleteClerkUserIdentity(services.env, clerkUserId);
    } catch (error) {
      const clerkDeletionError =
        error instanceof Error ? error : new Error("Unknown Clerk user deletion failure.");
      const logContext = {
        appUserId: user.id,
        clerkUserId,
        errorName: clerkDeletionError.name,
        errorMessage: clerkDeletionError.message,
      };

      app.log.error(
        { err: clerkDeletionError, ...logContext },
        "Clerk identity deletion failed after app account data was anonymized.",
      );

      if (services.env.SENTRY_DSN) {
        Sentry.captureException(clerkDeletionError, {
          tags: {
            area: "account_deletion",
            downstream: "clerk",
          },
          extra: logContext,
        });
      }
    }

    return reply.status(200).send({ status: "deleted" });
  });
}
