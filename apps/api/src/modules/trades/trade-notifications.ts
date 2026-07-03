import type { FastifyBaseLogger } from "fastify";
import type { Trade, TradeStatus } from "@ctn/types";

export async function notifyTradeProposed(logger: FastifyBaseLogger, trade: Trade): Promise<void> {
  logger.info(
    { tradeId: trade.id, counterpartyId: trade.counterpartyId },
    "trade proposed notification placeholder",
  );
}

export async function notifyTradeStatusChanged(
  logger: FastifyBaseLogger,
  trade: Trade,
  status: TradeStatus,
): Promise<void> {
  logger.info({ tradeId: trade.id, status }, "trade status notification placeholder");
}
