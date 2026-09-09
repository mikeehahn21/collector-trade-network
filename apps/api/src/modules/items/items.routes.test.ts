import { afterEach, describe, expect, it, vi } from "vitest";

import { buildApp } from "../../app";
import { loadEnv } from "../../config/env";

function testEnv() {
  return loadEnv({
    DATABASE_URL: "postgres://collector:collector@localhost:5432/collector_trade",
  });
}

describe("item routes", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

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

  it("sends base64 local-photo input to the vision model", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        output_text: JSON.stringify({
          category: "sports",
          condition: "very_good",
          confidence: "high",
          era: "1990s",
          tag: "Nutmeg",
          title: "Chicago Bulls graphic tee",
        }),
      }),
      ok: true,
    });
    vi.stubGlobal("fetch", fetchMock);

    const app = await buildApp(
      loadEnv({
        DATABASE_URL: "postgres://collector:collector@localhost:5432/collector_trade",
        OPENAI_API_KEY: "test-openai-key",
      }),
    );

    const response = await app.inject({
      method: "POST",
      payload: {
        aiImage: {
          data: "a".repeat(128),
          mediaType: "image/jpeg",
        },
        photos: [],
        title: "",
      },
      url: "/v1/items/ai-suggestions",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      category: "sports",
      confidence: "high",
      tag: "Nutmeg",
      title: "Chicago Bulls graphic tee",
    });

    const fetchOptions = fetchMock.mock.calls[0]?.[1] as { body: string } | undefined;
    expect(fetchOptions).toBeDefined();
    const requestBody = JSON.parse(fetchOptions?.body ?? "{}") as {
      input: Array<{ content: Array<{ image_url?: string; type: string }> }>;
    };
    expect(requestBody.input[0]?.content).toContainEqual({
      image_url: `data:image/jpeg;base64,${"a".repeat(128)}`,
      type: "input_image",
    });

    await app.close();
  });
});
