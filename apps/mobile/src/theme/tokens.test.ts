import { describe, expect, it } from "vitest";

import { themeTokens } from "./tokens";

describe("theme tokens", () => {
  it("defines premium dark foundation colors", () => {
    expect(themeTokens.colors.background).toBe("#0F1115");
  });
});
