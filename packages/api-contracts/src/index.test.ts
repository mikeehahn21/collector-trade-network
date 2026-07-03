import { describe, expect, it } from "vitest";

import { apiRoutes } from "./index";

describe("api contracts", () => {
  it("defines health route", () => {
    expect(apiRoutes.health).toBe("/health");
  });

  it("defines Sprint 1 access routes", () => {
    expect(apiRoutes.accessRequests).toBe("/v1/access-requests");
    expect(apiRoutes.inviteCode).toBe("/v1/access/invite-code");
  });

  it("defines Sprint 2 item routes", () => {
    expect(apiRoutes.items).toBe("/v1/items");
    expect(apiRoutes.itemAiSuggestions).toBe("/v1/items/ai-suggestions");
  });

  it("defines Sprint 3 wishlist routes", () => {
    expect(apiRoutes.wishlistItems).toBe("/v1/wishlist-items");
  });

  it("defines Sprint 6 recommendation routes", () => {
    expect(apiRoutes.recommendations).toBe("/v1/recommendations");
  });
});
