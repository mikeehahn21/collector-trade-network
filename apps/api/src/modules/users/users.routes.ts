import type { FastifyInstance } from "fastify";

import { apiRoutes } from "@ctn/api-contracts";
import { userProfileUpsertSchema } from "@ctn/validation";

import { requireAuthContext } from "../../auth/auth-context";
import { findUserByClerkId, upsertUserProfile } from "../../db/repositories/users.repository";
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
}
