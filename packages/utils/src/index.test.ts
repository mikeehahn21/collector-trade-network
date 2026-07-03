import { describe, expect, it } from "vitest";

import { nonEmptyString } from "./index";

describe("utils", () => {
  it("normalizes blank strings", () => {
    expect(nonEmptyString("  ")).toBeUndefined();
    expect(nonEmptyString(" vintage ")).toBe("vintage");
  });
});
