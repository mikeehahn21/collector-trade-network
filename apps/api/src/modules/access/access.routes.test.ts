import { describe, expect, it } from "vitest";

import { buildApp } from "../../app";
import { loadEnv } from "../../config/env";

function testEnv() {
  return loadEnv({
    DATABASE_URL: "postgres://collector:collector@localhost:5432/collector_trade",
  });
}

describe("access routes", () => {
  it("rejects invalid access applications before persistence", async () => {
    const app = await buildApp(testEnv());

    const response = await app.inject({
      method: "POST",
      url: "/v1/access-requests",
      payload: {
        name: "A",
        email: "not-an-email",
        reason: "short",
      },
    });

    expect(response.statusCode).toBe(400);
    await app.close();
  });

  it("rejects malformed invite codes before persistence", async () => {
    const app = await buildApp(testEnv());

    const response = await app.inject({
      method: "POST",
      url: "/v1/access/invite-code",
      payload: { code: "A" },
    });

    expect(response.statusCode).toBe(400);
    await app.close();
  });
});
