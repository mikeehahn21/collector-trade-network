import { describe, expect, it } from "vitest";

import { getHealth } from "./api-client";

describe("admin api client", () => {
  it("exports health client", () => {
    expect(typeof getHealth).toBe("function");
  });
});
