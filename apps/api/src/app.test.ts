import { describe, expect, it } from "vitest";

import { buildApp } from "./app";
import { loadEnv } from "./config/env";

describe("API app", () => {
  it("serves health endpoint", async () => {
    const app = await buildApp(
      loadEnv({
        DATABASE_URL: "postgres://collector:collector@localhost:5432/collector_trade",
      }),
    );

    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: "ok" });

    await app.close();
  });
});
