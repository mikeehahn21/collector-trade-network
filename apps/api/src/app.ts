import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import Fastify from "fastify";

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
import { registerItemRoutes } from "./modules/items/items.routes";
import { registerRecommendationRoutes } from "./modules/recommendations/recommendations.routes";
import { registerUserRoutes } from "./modules/users/users.routes";
import { registerWishlistRoutes } from "./modules/wishlist/wishlist.routes";

export async function buildApp(env: Env) {
  const db = createDatabasePool(env);
  const app = Fastify({
    loggerInstance: createLogger(env),
  });

  app.addHook("onClose", async () => {
    await db.end();
  });

  await app.register(helmet);
  await app.register(cors, {
    origin: env.APP_ENV === "production" ? false : true,
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
      return reply.status(500).send({
        code: "AUTH_CONFIGURATION_ERROR",
        message: "Authentication is not configured correctly.",
      });
    }

    app.log.error(error);
    return reply.status(500).send({ code: "INTERNAL_SERVER_ERROR", message: "Unexpected server error." });
  });

  await registerHealthRoutes(app);
  await registerUserRoutes(app, { db, env });
  await registerAccessRoutes(app, { db, env });
  await registerItemRoutes(app, { db, env });
  await registerWishlistRoutes(app, { db, env });
  await registerRecommendationRoutes(app, { db, env });

  return app;
}
