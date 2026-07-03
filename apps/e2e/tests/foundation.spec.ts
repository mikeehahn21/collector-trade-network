import { expect, test } from "@playwright/test";

test("e2e foundation is configured", async () => {
  expect(process.env.E2E_BASE_URL ?? "http://localhost:3001").toContain("http");
});
