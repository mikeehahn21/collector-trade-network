import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/config/env", () => ({
  getMobileEnv: () => ({
    apiBaseUrl: "https://api.example.test",
  }),
}));

import { ApiRequestError, createApiClient } from "./api-client";

describe("mobile API client diagnostics", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("includes route, status, code, and response body when a request fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: vi.fn(),
      ok: false,
      status: 404,
      text: vi.fn(async () =>
        JSON.stringify({ code: "TRADE_NOT_FOUND", message: "Trade not found." }),
      ),
    });
    vi.stubGlobal("fetch", fetchMock);

    const api = createApiClient(async () => ({
      bearerToken: "test-token",
      clerkUserId: "user_123",
      email: "collector@example.com",
    }));

    await expect(api.getTrade("missing_trade")).rejects.toMatchObject({
      code: "TRADE_NOT_FOUND",
      method: "GET",
      path: "/v1/trades/missing_trade",
      responseBody: '{"code":"TRADE_NOT_FOUND","message":"Trade not found."}',
      status: 404,
    });
    await expect(api.getTrade("missing_trade")).rejects.toThrow(ApiRequestError);
  });

  it("redacts query strings from diagnostic paths and urls", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: vi.fn(),
      ok: false,
      status: 403,
      text: vi.fn(async () => JSON.stringify({ message: "Access denied." })),
    });
    vi.stubGlobal("fetch", fetchMock);

    const api = createApiClient(async () => undefined);

    let thrownError: unknown;
    try {
      await api.getWaitlistStatus("collector@example.com");
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeInstanceOf(ApiRequestError);
    const apiError = thrownError as ApiRequestError;
    expect(apiError.method).toBe("GET");
    expect(apiError.path).toBe("/v1/access/waitlist?[redacted]");
    expect(apiError.status).toBe(403);
    expect(apiError.url).toContain("/v1/access/waitlist?[redacted]");
    expect(apiError.message).not.toContain("collector@example.com");
  });
});
