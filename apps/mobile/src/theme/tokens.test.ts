import { describe, expect, it } from "vitest";

import { themeTokens } from "./tokens";

describe("theme tokens", () => {
  it("defines premium dark foundation colors", () => {
    expect(themeTokens.colors.background).toBe("#050505");
    expect(themeTokens.colors.accent).toBe("#FF7A1A");
  });
});
