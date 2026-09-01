import { describe, expect, it } from "vitest";

import { buildTradePushData } from "./trade-notifications";

describe("buildTradePushData", () => {
  it("builds trade proposal deep-link payloads", () => {
    expect(buildTradePushData({ id: "trade_123" }, "trade_proposal")).toEqual({
      id: "trade_123",
      tradeId: "trade_123",
      type: "trade_proposal",
    });
  });

  it("builds completion-needed deep-link payloads", () => {
    expect(buildTradePushData({ id: "trade_456" }, "trade_completion_needed")).toEqual({
      id: "trade_456",
      tradeId: "trade_456",
      type: "trade_completion_needed",
    });
  });
});
