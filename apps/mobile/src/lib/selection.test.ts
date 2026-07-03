import { describe, expect, it } from "vitest";

import { toggleValue } from "./selection";

describe("toggleValue", () => {
  it("adds values that are not selected", () => {
    expect(toggleValue(["m"], "l")).toEqual(["m", "l"]);
  });

  it("removes values that are selected", () => {
    expect(toggleValue(["m", "l"], "m")).toEqual(["l"]);
  });
});
