import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyInstance } from "fastify";
import * as Sentry from "@sentry/node";

import type { Env } from "./config/env";
import { createDatabasePool } from "./db/pool";
import { createLogger } from "./lib/logger";
import {
  AuthConfigurationError,
  AuthRequiredError,
  UserProfileRequiredError,
} from "./auth/auth-context";
import { registerAccessRoutes } from "./modules/access/access.routes";
import { registerHealthRoutes } from "./modules/health/health.routes";
import { registerConversationRoutes } from "./modules/conversations/conversations.routes";
import { registerItemRoutes } from "./modules/items/items.routes";
import { registerRecommendationRoutes } from "./modules/recommendations/recommendations.routes";
import { registerReputationRoutes } from "./modules/reputation/reputation.routes";
import { registerTradeRoutes } from "./modules/trades/trades.routes";
import { registerUserRoutes } from "./modules/users/users.routes";
import { registerWishlistRoutes } from "./modules/wishlist/wishlist.routes";

export async function buildApp(env: Env) {
  if (env.SENTRY_DSN) {
    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.APP_ENV,
      tracesSampleRate: env.APP_ENV === "production" ? 0.2 : 1.0,
    });
  }

  const db = createDatabasePool(env);
  const app = Fastify({
    loggerInstance: createLogger(env),
  });

  app.addHook("onClose", async () => {
    await db.end();
  });

  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:"],
      },
    },
  });

  await app.register(cors, {
    origin: env.APP_ENV === "production" ? false : true,
  });

  await app.register(rateLimit, {
    max: env.APP_ENV === "production" ? 100 : 1000,
    timeWindow: "1 minute",
    errorResponseBuilder: () => ({
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests, please try again later.",
    }),
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AuthRequiredError) {
      return reply.status(401).send({ code: "AUTH_REQUIRED", message: "Authentication required." });
    }

    if (error instanceof UserProfileRequiredError) {
      return reply.status(403).send({
        code: "USER_PROFILE_REQUIRED",
        message: "Create or sync your user profile before continuing.",
      });
    }

    if (error instanceof AuthConfigurationError) {
      app.log.error(error);
      if (env.SENTRY_DSN) {
        Sentry.captureException(error);
      }
      return reply.status(500).send({
        code: "AUTH_CONFIGURATION_ERROR",
        message: "Authentication is not configured correctly.",
      });
    }

    app.log.error(error);
    if (env.SENTRY_DSN) {
      Sentry.captureException(error);
    }
    return reply
      .status(500)
      .send({ code: "INTERNAL_SERVER_ERROR", message: "Unexpected server error." });
  });

  const appInstance = app as unknown as FastifyInstance;
  await registerHealthRoutes(appInstance, { db });
  await registerUserRoutes(appInstance, { db, env });
  await registerAccessRoutes(appInstance, { db, env });
  await registerItemRoutes(appInstance, { db, env });
  await registerWishlistRoutes(appInstance, { db, env });
  await registerRecommendationRoutes(appInstance, { db, env });
  await registerReputationRoutes(appInstance, { db, env });
  await registerTradeRoutes(appInstance, { db, env });
  await registerConversationRoutes(appInstance, { db, env });

  return app;
}
