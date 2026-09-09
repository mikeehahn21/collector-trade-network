import { describe, expect, it } from "vitest";

import { buildMessagePushData } from "./conversation-notifications";

describe("buildMessagePushData", () => {
  it("builds conversation deep-link payloads", () => {
    expect(buildMessagePushData({ id: "conv_123" }, { id: "msg_123" })).toEqual({
      conversationId: "conv_123",
      id: "conv_123",
      messageId: "msg_123",
      type: "message",
    });
  });
});
