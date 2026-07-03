import type { FastifyInstance, FastifyRequest } from "fastify";

import {
  apiRoutes,
  counterTradeContract,
  createTradeContract,
  disputeTradeContract,
  shipTradeContract,
  updateTradeStatusContract,
} from "@ctn/api-contracts";

import { requireAuthContext, UserProfileRequiredError } from "../../auth/auth-context";
import { createTradeSystemMessage } from "../../db/repositories/conversations.repository";
import {
  completeTradeForUser,
  counterTradeForUser,
  createTrade,
  disputeTradeForUser,
  findTradeByParticipant,
  listTradesForUser,
  receiveTradeForUser,
  shipTradeForUser,
  updateTradeStatusForUser,
} from "../../db/repositories/trades.repository";
import { findUserByClerkId } from "../../db/repositories/users.repository";
import type { AppServices } from "../services";
import { notifyTradeProposed, notifyTradeStatusChanged } from "./trade-notifications";

export async function registerTradeRoutes(app: FastifyInstance, services: AppServices): Promise<void> {
  app.post(apiRoutes.trades, async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const parsed = createTradeContract.body.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        code: "INVALID_TRADE_OFFER",
        message: "Trade offer is invalid.",
      });
    }

    const trade = await createTrade(services.db, {
      proposerId: user.id,
      proposerItemId: parsed.data.proposerItemId,
      counterpartyItemId: parsed.data.counterpartyItemId,
      proposerNotes: parsed.data.proposerNotes,
    });

    if (!trade) {
      return reply.status(400).send({
        code: "TRADE_OFFER_NOT_ALLOWED",
        message: "Trade offer could not be created with those items.",
      });
    }

    await notifyTradeProposed(request.log, trade);

    return reply.status(201).send({ trade });
  });

  app.get(apiRoutes.trades, async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const trades = await listTradesForUser(services.db, user.id);
    const historyStatuses = new Set(["declined", "cancelled", "completed", "disputed"]);

    return reply.status(200).send({
      trades,
      summary: {
        incoming: trades.filter(
          (trade) => trade.counterpartyId === user.id && !historyStatuses.has(trade.status),
        ).length,
        sent: trades.filter(
          (trade) => trade.proposerId === user.id && !historyStatuses.has(trade.status),
        ).length,
        history: trades.filter((trade) => historyStatuses.has(trade.status)).length,
      },
    });
  });

  app.get("/v1/trades/:tradeId", async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const tradeId = (request.params as { tradeId: string }).tradeId;
    const trade = await findTradeByParticipant(services.db, tradeId, user.id);

    if (!trade) {
      return reply.status(404).send({ code: "TRADE_NOT_FOUND", message: "Trade not found." });
    }

    return reply.status(200).send({ trade });
  });

  app.patch("/v1/trades/:tradeId/status", async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const tradeId = (request.params as { tradeId: string }).tradeId;
    const parsed = updateTradeStatusContract.body.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        code: "INVALID_TRADE_STATUS",
        message: "Trade status update is invalid.",
      });
    }

    const trade = await updateTradeStatusForUser(services.db, tradeId, user.id, parsed.data.status);

    if (!trade) {
      return reply.status(403).send({
        code: "TRADE_STATUS_NOT_ALLOWED",
        message: "You cannot apply that trade status change.",
      });
    }

    await notifyTradeStatusChanged(request.log, trade, parsed.data.status);

    return reply.status(200).send({ trade });
  });

  app.post("/v1/trades/:tradeId/counter", async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const tradeId = (request.params as { tradeId: string }).tradeId;
    const parsed = counterTradeContract.body.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        code: "INVALID_COUNTER_TRADE",
        message: "Counter offer is invalid.",
      });
    }

    const trade = await counterTradeForUser(services.db, {
      tradeId,
      userId: user.id,
      proposerItemId: parsed.data.proposerItemId,
      counterpartyItemId: parsed.data.counterpartyItemId,
      counterpartyNotes: parsed.data.counterpartyNotes,
    });

    if (!trade) {
      return reply.status(403).send({
        code: "COUNTER_TRADE_NOT_ALLOWED",
        message: "Counter offer could not be created with those items.",
      });
    }

    await notifyTradeStatusChanged(request.log, trade, "countered");

    return reply.status(200).send({ trade });
  });

  app.patch("/v1/trades/:tradeId/ship", async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const tradeId = (request.params as { tradeId: string }).tradeId;
    const parsed = shipTradeContract.body.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        code: "INVALID_SHIPPING_DETAILS",
        message: "Tracking number and carrier are required.",
      });
    }

    const trade = await shipTradeForUser(services.db, {
      tradeId,
      userId: user.id,
      trackingNumber: parsed.data.trackingNumber,
      carrier: parsed.data.carrier,
    });

    if (!trade) {
      return reply.status(403).send({
        code: "TRADE_SHIP_NOT_ALLOWED",
        message: "You cannot mark that side of the trade as shipped.",
      });
    }

    await createTradeSystemMessage(
      services.db,
      trade.id,
      user.id,
      `${user.displayName} has shipped their item. Tracking: ${parsed.data.trackingNumber}`,
    );

    return reply.status(200).send({ trade });
  });

  app.patch("/v1/trades/:tradeId/receive", async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const tradeId = (request.params as { tradeId: string }).tradeId;
    const trade = await receiveTradeForUser(services.db, tradeId, user.id);

    if (!trade) {
      return reply.status(403).send({
        code: "TRADE_RECEIVE_NOT_ALLOWED",
        message: "You cannot confirm receipt for that trade yet.",
      });
    }

    await createTradeSystemMessage(
      services.db,
      trade.id,
      user.id,
      `${user.displayName} has confirmed receipt.`,
    );

    return reply.status(200).send({ trade });
  });

  app.patch("/v1/trades/:tradeId/complete", async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const tradeId = (request.params as { tradeId: string }).tradeId;
    const trade = await completeTradeForUser(services.db, tradeId, user.id);

    if (!trade) {
      return reply.status(403).send({
        code: "TRADE_COMPLETE_NOT_ALLOWED",
        message: "Both sides must confirm receipt before the trade can be completed.",
      });
    }

    await createTradeSystemMessage(services.db, trade.id, user.id, "Trade completed.");

    return reply.status(200).send({ trade });
  });

  app.post("/v1/trades/:tradeId/dispute", async (request, reply) => {
    const user = await requireCurrentUser(request, services);
    const tradeId = (request.params as { tradeId: string }).tradeId;
    const parsed = disputeTradeContract.body.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        code: "INVALID_DISPUTE",
        message: "A clear dispute reason is required.",
      });
    }

    const trade = await disputeTradeForUser(services.db, {
      tradeId,
      userId: user.id,
      reason: parsed.data.reason,
    });

    if (!trade) {
      return reply.status(403).send({
        code: "TRADE_DISPUTE_NOT_ALLOWED",
        message: "You cannot dispute that trade right now.",
      });
    }

    await createTradeSystemMessage(
      services.db,
      trade.id,
      user.id,
      `${user.displayName} opened a dispute: ${parsed.data.reason}`,
    );

    return reply.status(200).send({ trade });
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
