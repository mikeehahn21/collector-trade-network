import * as Sentry from "@sentry/node";
import type { FastifyBaseLogger } from "fastify";

import type { Env } from "../../config/env";

type SendPushNotificationInput = {
  contents: string;
  data: Record<string, string>;
  env: Env;
  headings: string;
  logger: FastifyBaseLogger;
  recipientUserId: string;
};

type OneSignalRequestBody = {
  app_id: string;
  contents: { en: string };
  data: Record<string, string>;
  headings: { en: string };
  include_aliases: { external_id: string[] };
  target_channel: "push";
};

export function buildOneSignalRequest(input: {
  appId: string;
  contents: string;
  data: Record<string, string>;
  headings: string;
  recipientUserId: string;
}): OneSignalRequestBody {
  return {
    app_id: input.appId,
    contents: { en: input.contents },
    data: input.data,
    headings: { en: input.headings },
    include_aliases: { external_id: [input.recipientUserId] },
    target_channel: "push",
  };
}

export async function sendPushNotification(input: SendPushNotificationInput): Promise<void> {
  const { ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY } = input.env;

  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    input.logger.info(
      {
        data: input.data,
        recipientUserId: input.recipientUserId,
      },
      "push notification skipped because OneSignal server credentials are not configured",
    );
    return;
  }

  const body = buildOneSignalRequest({
    appId: ONESIGNAL_APP_ID,
    contents: input.contents,
    data: input.data,
    headings: input.headings,
    recipientUserId: input.recipientUserId,
  });

  try {
    const response = await fetch("https://api.onesignal.com/notifications", {
      body: JSON.stringify(body),
      headers: {
        Authorization: `Key ${ONESIGNAL_REST_API_KEY}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      const responseBody = await response.text();
      throw new Error(`OneSignal push failed with ${response.status}: ${responseBody}`);
    }

    input.logger.info(
      { data: input.data, recipientUserId: input.recipientUserId },
      "push notification queued",
    );
  } catch (error) {
    input.logger.error(
      { error, data: input.data, recipientUserId: input.recipientUserId },
      "push notification delivery failed",
    );
    Sentry.captureException(error, {
      extra: {
        data: input.data,
        recipientUserId: input.recipientUserId,
      },
      tags: { feature: "push_notifications" },
    });
  }
}
