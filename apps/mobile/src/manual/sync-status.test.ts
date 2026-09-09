import { describe, expect, it } from "vitest";

import { getRecordSyncDescription, getRecordSyncState, isLocalRecordId } from "./sync-status";

describe("direct beta record sync status", () => {
  it.each(["item_123", "wish_456", "local_trade_789"])(
    "recognizes %s as a local-only beta record",
    (id) => {
      expect(isLocalRecordId(id)).toBe(true);
      expect(getRecordSyncState(id)).toBe("local");
      expect(getRecordSyncDescription(id)).toBe("LOCAL • saved on this iPhone");
    },
  );

  it("recognizes server identifiers as live Konnesor records", () => {
    const id = "d7a2f91a-2c91-4ad2-a6c4-12a1b7c33015";

    expect(isLocalRecordId(id)).toBe(false);
    expect(getRecordSyncState(id)).toBe("live");
    expect(getRecordSyncDescription(id)).toBe("LIVE • saved to Konnesor");
  });
});
