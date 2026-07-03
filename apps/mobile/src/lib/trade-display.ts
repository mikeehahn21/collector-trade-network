import type { TradeStatus } from "@ctn/types";

export const tradeStatusLabels: Record<TradeStatus, string> = {
  accepted: "Accepted",
  cancelled: "Cancelled",
  completed: "Completed",
  countered: "Countered",
  declined: "Declined",
  disputed: "Disputed",
  pending: "Pending",
};

export function isTradeHistorical(status: TradeStatus): boolean {
  return ["cancelled", "completed", "declined", "disputed"].includes(status);
}
