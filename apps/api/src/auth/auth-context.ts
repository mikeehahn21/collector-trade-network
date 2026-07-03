import type { FastifyRequest } from "fastify";
import { verifyToken } from "@clerk/backend";

import type { Env } from "../config/env";

export type AuthContext = {
  clerkUserId: string;
  email?: string | undefined;
};

export async function getAuthContext(
  request: FastifyRequest,
  env: Pick<Env, "APP_ENV" | "CLERK_ISSUER" | "CLERK_SECRET_KEY">,
): Promise<AuthContext | undefined> {
  const bearerToken = readBearerToken(request);

  if (bearerToken) {
    if (!env.CLERK_SECRET_KEY) {
      throw new AuthConfigurationError("CLERK_SECRET_KEY is required for bearer token auth.");
    }

    const payload = await verifyToken(bearerToken, {
      secretKey: env.CLERK_SECRET_KEY,
    });

    return {
      clerkUserId: payload.sub,
      email: readHeader(request, "x-user-email"),
    };
  }

  if (env.APP_ENV === "local" || env.APP_ENV === "development") {
    const clerkUserId = readHeader(request, "x-clerk-user-id");
    const email = readHeader(request, "x-user-email");

    if (clerkUserId) {
      return { clerkUserId, email };
    }
  }

  return undefined;
}

export async function requireAuthContext(
  request: FastifyRequest,
  env: Pick<Env, "APP_ENV" | "CLERK_ISSUER" | "CLERK_SECRET_KEY">,
): Promise<AuthContext> {
  const auth = await getAuthContext(request, env);

  if (!auth) {
    throw new AuthRequiredError();
  }

  return auth;
}

export class AuthRequiredError extends Error {
  public constructor() {
    super("Authentication required.");
    this.name = "AuthRequiredError";
  }
}

export class AuthConfigurationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "AuthConfigurationError";
  }
}

export class UserProfileRequiredError extends Error {
  public constructor() {
    super("Authenticated user profile not found.");
    this.name = "UserProfileRequiredError";
  }
}

function readBearerToken(request: FastifyRequest): string | undefined {
  const authorization = readHeader(request, "authorization");

  if (!authorization?.toLowerCase().startsWith("bearer ")) {
    return undefined;
  }

  return authorization.slice("bearer ".length).trim();
}

function readHeader(request: FastifyRequest, key: string): string | undefined {
  const value = request.headers[key];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}
