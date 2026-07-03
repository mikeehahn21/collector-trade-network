import type { FastifyInstance } from "fastify";

import { accessRequestContract, inviteCodeContract } from "@ctn/api-contracts";

import { createAccessApplication, findInviteCode } from "../../db/repositories/access.repository";
import type { AppServices } from "../services";

export async function registerAccessRoutes(
  app: FastifyInstance,
  services: AppServices,
): Promise<void> {
  app.post(accessRequestContract.path, async (request, reply) => {
    const parsed = accessRequestContract.body.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        code: "INVALID_ACCESS_REQUEST",
        message: "Access request is missing required information.",
      });
    }

    const application = await createAccessApplication(services.db, parsed.data);

    return reply.status(202).send({
      status: "received",
      applicationId: application.id,
      message: "Application received for manual review.",
    });
  });

  app.post(inviteCodeContract.path, async (request, reply) => {
    const parsed = inviteCodeContract.body.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        code: "INVALID_INVITE_CODE",
        message: "Invite code is invalid.",
      });
    }

    const invite = await findInviteCode(services.db, parsed.data.code);

    if (!invite || invite.status !== "active") {
      return reply.status(404).send({
        code: "INVITE_CODE_NOT_FOUND",
        message: "Invite code is not active.",
      });
    }

    return reply.status(200).send({
      status: "accepted",
      accessStatus: "invited",
    });
  });
}
