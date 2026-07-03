import { describe, expect, it } from "vitest";

import { buildApp } from "../../app";
import { loadEnv } from "../../config/env";

function testEnv() {
  return loadEnv({
    DATABASE_URL: "postgres://collector:collector@localhost:5432/collector_trade",
  });
}

describe("item routes", () => {
  it("requires auth before listing item drafts", async () => {
    const app = await buildApp(testEnv());

    const response = await app.inject({
      method: "GET",
      url: "/v1/items",
    });

    expect(response.statusCode).toBe(401);
    await app.close();
  });

  it("requires auth before publish validation", async () => {
    const app = await buildApp(testEnv());

    const response = await app.inject({
      method: "POST",
      url: "/v1/items/publish",
      payload: { title: "Draft tee", status: "tradeable" },
    });

    expect(response.statusCode).toBe(401);
    await app.close();
  });
});
