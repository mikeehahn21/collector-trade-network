import {
  apiRoutes,
  blockUserContract,
  reportUserContract,
  type BlockUserResponse,
  type BlockedUsersResponse,
  type ReportUserResponse,
} from "@ctn/api-contracts";
import type { FastifyInstance, FastifyRequest } from "fastify";

import { requireAuthContext, UserProfileRequiredError } from "../../auth/auth-context";
import {
  blockUser,
  createUserReport,
  listBlockedUsers,
  unblockUser,
} from "../../db/repositories/reports.repository";
import { findUserByClerkId } from "../../db/repositories/users.repository";
import type { AppServices } from "../services";

export async function registerReportRoutes(
  app: FastifyInstance,
  services: AppServices,
): Promise<void> {
  app.post(apiRoutes.reports, async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const parsed = reportUserContract.body.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        code: "INVALID_REPORT",
        message: "Report reason or note is invalid.",
      });
    }

    const report = await createUserReport(services.db, {
      reporterId: user.id,
      reportedUserId: parsed.data.reportedUserId,
      reason: parsed.data.reason,
      note: parsed.data.note,
    });

    if (!report) {
      return reply.status(400).send({
        code: "REPORT_NOT_ALLOWED",
        message: "You cannot report that user.",
      });
    }

    return reply.status(201).send({ report } satisfies ReportUserResponse);
  });

  app.get(apiRoutes.blockedUsers, async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const blockedUsers = await listBlockedUsers(services.db, user.id);

    return reply.status(200).send({ blockedUsers } satisfies BlockedUsersResponse);
  });

  app.post(apiRoutes.blockedUsers, async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const parsed = blockUserContract.body.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        code: "INVALID_BLOCK",
        message: "Blocked user is invalid.",
      });
    }

    const blockedUser = await blockUser(services.db, user.id, parsed.data.blockedUserId);

    if (!blockedUser) {
      return reply.status(400).send({
        code: "BLOCK_NOT_ALLOWED",
        message: "You cannot block that user.",
      });
    }

    return reply.status(200).send({ blockedUser } satisfies BlockUserResponse);
  });

  app.delete("/v1/blocked-users/:blockedUserId", async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const blockedUserId = (request.params as { blockedUserId: string }).blockedUserId;
    await unblockUser(services.db, user.id, blockedUserId);

    return reply.status(204).send();
  });
}

async function requireCurrentUser(request: FastifyRequest, services: AppServices) {
  const auth = await requireAuthContext(request, services.env);
  const user = await findUserByClerkId(services.db, auth.clerkUserId);

  if (!user || user.accessStatus !== "active") {
    throw new UserProfileRequiredError();
  }

  return user;
}
