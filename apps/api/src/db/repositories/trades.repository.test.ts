import { describe, expect, it } from "vitest";

import type { Trade } from "@ctn/types";

import { canCompleteTrade, canReceiveTrade, canShipTrade, canUpdateTradeStatus } from "./trades.repository";

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
  proposerShipping: {
    status: "pending",
  },
  counterpartyShipping: {
    status: "pending",
  },
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

  it("allows each participant to ship only their own pending side", () => {
    const acceptedTrade = { ...baseTrade, status: "accepted" as const };

    expect(canShipTrade(acceptedTrade, "user_proposer")).toBe(true);
    expect(canShipTrade(acceptedTrade, "user_counterparty")).toBe(true);
    expect(
      canShipTrade(
        { ...acceptedTrade, proposerShipping: { status: "shipped" as const } },
        "user_proposer",
      ),
    ).toBe(false);
  });

  it("allows a participant to receive only the shipped counterparty side", () => {
    const acceptedTrade = {
      ...baseTrade,
      status: "accepted" as const,
      proposerShipping: { status: "shipped" as const, trackingNumber: "1Z", carrier: "ups" as const },
    };

    expect(canReceiveTrade(acceptedTrade, "user_counterparty")).toBe(true);
    expect(canReceiveTrade(acceptedTrade, "user_proposer")).toBe(false);
  });

  it("allows completion only after both sides are delivered", () => {
    const deliveredTrade = {
      ...baseTrade,
      status: "accepted" as const,
      proposerShipping: { status: "delivered" as const },
      counterpartyShipping: { status: "delivered" as const },
    };

    expect(canCompleteTrade(deliveredTrade)).toBe(true);
    expect(canCompleteTrade({ ...deliveredTrade, counterpartyShipping: { status: "shipped" as const } })).toBe(false);
  });
});
