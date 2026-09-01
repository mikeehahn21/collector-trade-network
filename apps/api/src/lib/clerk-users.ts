import { createClerkClient } from "@clerk/backend";

import type { Env } from "../config/env";

export async function deleteClerkUserIdentity(env: Env, clerkUserId: string): Promise<void> {
  if (!env.CLERK_SECRET_KEY) {
    throw new Error("CLERK_SECRET_KEY is required to delete Clerk user identities.");
  }

  const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
  await clerk.users.deleteUser(clerkUserId);
}
