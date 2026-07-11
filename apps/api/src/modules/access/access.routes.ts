import type { FastifyInstance } from "fastify";

import {
  accessRequestContract,
  inviteCodeContract,
  waitlistStatusContract,
  systemConfigContract,
} from "@ctn/api-contracts";

import {
  createAccessApplication,
  findInviteCode,
  getWaitlistStatus,
  getSystemConfig,
} from "../../db/repositories/access.repository";
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

  app.get(waitlistStatusContract.path, async (request, reply) => {
    const email = (request.query as { email?: string }).email ?? "unknown";

    const status = await getWaitlistStatus(services.db, email);

    return reply.status(200).send({
      position: status.position,
      totalWaitlisted: status.totalWaitlisted,
      estimatedWaitDays: Math.ceil(status.position / 50),
    });
  });

  app.get(systemConfigContract.path, async (request, reply) => {
    const config = await getSystemConfig(services.db);

    return reply.status(200).send({
      config,
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
