import type { MessageRoute, Tab, TradeRoute } from "./beta-app.shared";

export type KonnesorPushData =
  | { conversationId: string; id?: string; messageId?: string; type: "message" }
  | {
      id?: string;
      tradeId: string;
      type: "trade_completion_needed" | "trade_proposal" | "trade_status";
    };

export function parseKonnesorPushData(data: unknown): KonnesorPushData | undefined {
  if (!data || typeof data !== "object") {
    return undefined;
  }

  const payload = data as Record<string, unknown>;
  const type = typeof payload.type === "string" ? payload.type : undefined;

  if (type === "message" && typeof payload.conversationId === "string") {
    const result: KonnesorPushData = {
      conversationId: payload.conversationId,
      type,
    };
    if (typeof payload.id === "string") {
      result.id = payload.id;
    }
    if (typeof payload.messageId === "string") {
      result.messageId = payload.messageId;
    }
    return result;
  }

  if (
    (type === "trade_proposal" || type === "trade_completion_needed" || type === "trade_status") &&
    typeof payload.tradeId === "string"
  ) {
    const result: KonnesorPushData = {
      tradeId: payload.tradeId,
      type,
    };
    if (typeof payload.id === "string") {
      result.id = payload.id;
    }
    return result;
  }

  return undefined;
}

export function routeForPushData(
  data: KonnesorPushData,
):
  | { messageRoute: MessageRoute; tab: Extract<Tab, "messages"> }
  | { tab: Extract<Tab, "trades">; tradeRoute: TradeRoute } {
  if (data.type === "message") {
    return {
      messageRoute: { conversationId: data.conversationId, mode: "detail" },
      tab: "messages",
    };
  }

  return {
    tab: "trades",
    tradeRoute: { mode: "detail", tradeId: data.tradeId },
  };
}
