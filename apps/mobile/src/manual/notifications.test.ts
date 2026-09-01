import { describe, expect, it } from "vitest";

import { parseKonnesorPushData, routeForPushData } from "./notification-routing";

describe("manual push notification routing", () => {
  it("routes new message payloads into the message detail screen", () => {
    const data = parseKonnesorPushData({
      conversationId: "conv_123",
      messageId: "msg_123",
      type: "message",
    });

    expect(data).toEqual({
      conversationId: "conv_123",
      messageId: "msg_123",
      type: "message",
    });
    expect(data ? routeForPushData(data) : undefined).toEqual({
      messageRoute: { conversationId: "conv_123", mode: "detail" },
      tab: "messages",
    });
  });

  it("routes trade proposal payloads into the trade detail screen", () => {
    const data = parseKonnesorPushData({ tradeId: "trade_123", type: "trade_proposal" });

    expect(data ? routeForPushData(data) : undefined).toEqual({
      tab: "trades",
      tradeRoute: { mode: "detail", tradeId: "trade_123" },
    });
  });

  it("routes completion-needed payloads into the trade detail screen", () => {
    const data = parseKonnesorPushData({
      id: "trade_456",
      tradeId: "trade_456",
      type: "trade_completion_needed",
    });

    expect(data ? routeForPushData(data) : undefined).toEqual({
      tab: "trades",
      tradeRoute: { mode: "detail", tradeId: "trade_456" },
    });
  });
});
