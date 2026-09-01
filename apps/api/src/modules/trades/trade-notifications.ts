import type { FastifyBaseLogger } from "fastify";
import type { Trade, TradeStatus } from "@ctn/types";

import type { Env } from "../../config/env";
import { sendPushNotification } from "../notifications/one-signal";

export type TradePushType = "trade_proposal" | "trade_completion_needed" | "trade_status";

export function buildTradePushData(
  trade: Pick<Trade, "id">,
  type: TradePushType,
): Record<string, string> {
  return {
    id: trade.id,
    tradeId: trade.id,
    type,
  };
}

export async function notifyTradeProposed(
  logger: FastifyBaseLogger,
  env: Env,
  trade: Trade,
): Promise<void> {
  await sendPushNotification({
    contents: "You have a new trade proposal to review.",
    data: buildTradePushData(trade, "trade_proposal"),
    env,
    headings: "New trade proposal",
    logger,
    recipientUserId: trade.counterpartyId,
  });
}

export async function notifyTradeStatusChanged(
  logger: FastifyBaseLogger,
  env: Env,
  trade: Trade,
  status: TradeStatus,
): Promise<void> {
  const needsCompletion =
    status === "accepted" ||
    (trade.status !== "completed" &&
      Boolean(trade.proposerCompletedConfirmedAt) !==
        Boolean(trade.counterpartyCompletedConfirmedAt));

  await sendPushNotification({
    contents: needsCompletion
      ? "A trade is waiting on completion confirmation."
      : `Trade status changed to ${status}.`,
    data: buildTradePushData(trade, needsCompletion ? "trade_completion_needed" : "trade_status"),
    env,
    headings: needsCompletion ? "Completion needed" : "Trade updated",
    logger,
    recipientUserId: trade.proposerId,
  });
  await sendPushNotification({
    contents: needsCompletion
      ? "A trade is waiting on completion confirmation."
      : `Trade status changed to ${status}.`,
    data: buildTradePushData(trade, needsCompletion ? "trade_completion_needed" : "trade_status"),
    env,
    headings: needsCompletion ? "Completion needed" : "Trade updated",
    logger,
    recipientUserId: trade.counterpartyId,
  });
}
