import { describe, expect, it } from "vitest";

import type { Trade } from "@ctn/types";

import { canUpdateTradeStatus } from "./trades.repository";

const baseTrade: Trade = {
  id: "trade_1",
  proposerId: "user_proposer",
  proposerDisplayName: "Proposer",
  counterpartyId: "user_counterparty",
  counterpartyDisplayName: "Counterparty",
  proposerItemId: "item_1",
  counterpartyItemId: "item_2",
  proposerItem: {
    id: "item_1",
    ownerId: "user_proposer",
    ownerDisplayName: "Proposer",
    title: "Bulls tee",
    status: "tradeable",
  },
  counterpartyItem: {
    id: "item_2",
    ownerId: "user_counterparty",
    ownerDisplayName: "Counterparty",
    title: "Soundgarden tee",
    status: "tradeable",
  },
  status: "pending",
  viewerRole: "counterparty",
  createdAt: "2026-07-03T00:00:00.000Z",
  updatedAt: "2026-07-03T00:00:00.000Z",
};

describe("canUpdateTradeStatus", () => {
  it("allows only the counterparty to accept pending offers", () => {
    expect(canUpdateTradeStatus(baseTrade, "user_counterparty", "accepted")).toBe(true);
    expect(canUpdateTradeStatus(baseTrade, "user_proposer", "accepted")).toBe(false);
  });

  it("allows only the proposer to cancel pending offers", () => {
    expect(canUpdateTradeStatus(baseTrade, "user_proposer", "cancelled")).toBe(true);
    expect(canUpdateTradeStatus(baseTrade, "user_counterparty", "cancelled")).toBe(false);
  });

  it("allows either participant to complete accepted offers", () => {
    const acceptedTrade = { ...baseTrade, status: "accepted" as const };

    expect(canUpdateTradeStatus(acceptedTrade, "user_proposer", "completed")).toBe(true);
    expect(canUpdateTradeStatus(acceptedTrade, "user_counterparty", "completed")).toBe(true);
  });
});
