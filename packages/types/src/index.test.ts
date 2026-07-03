import { describe, expect, it } from "vitest";

import type { ConversationContextType } from "./index";

describe("shared types", () => {
  it("allows contextual conversation types only", () => {
    const context: ConversationContextType = "item";

    expect(context).toBe("item");
  });
});
