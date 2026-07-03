import { describe, expect, it } from "vitest";

import { loadEnv } from "./env";

describe("loadEnv", () => {
  it("loads required API environment", () => {
    const env = loadEnv({
      DATABASE_URL: "postgres://collector:collector@localhost:5432/collector_trade",
    });

    expect(env.API_PORT).toBe(4000);
    expect(env.APP_ENV).toBe("local");
  });
});
