import { describe, expect, it } from "vitest";

import { CONVERSATION_CONTEXTS } from "./index";

describe("constants", () => {
  it("does not include generic direct messages as a conversation context", () => {
    expect(CONVERSATION_CONTEXTS).toEqual(["item", "trade", "system"]);
  });
});
