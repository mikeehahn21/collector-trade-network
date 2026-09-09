import { describe, expect, it } from "vitest";

import { buildOneSignalRequest } from "./one-signal";

describe("buildOneSignalRequest", () => {
  it("targets the recipient by external user id and preserves deep-link data", () => {
    const request = buildOneSignalRequest({
      appId: "app_123",
      contents: "A collector sent you a message.",
      data: { conversationId: "conv_123", messageId: "msg_123", type: "message" },
      headings: "New message",
      recipientUserId: "user_123",
    });

    expect(request).toEqual({
      app_id: "app_123",
      contents: { en: "A collector sent you a message." },
      data: { conversationId: "conv_123", messageId: "msg_123", type: "message" },
      headings: { en: "New message" },
      include_aliases: { external_id: ["user_123"] },
      target_channel: "push",
    });
  });
});
