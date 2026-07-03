import { secureStorage } from "@/storage/secure-storage";

const LOCAL_CLERK_USER_ID_KEY = "collector_trade_local_clerk_user_id";

export async function getLocalAuthHeaders() {
  let clerkUserId = await secureStorage.getItem(LOCAL_CLERK_USER_ID_KEY);

  if (!clerkUserId) {
    clerkUserId = `local_clerk_${Date.now()}`;
    await secureStorage.setItem(LOCAL_CLERK_USER_ID_KEY, clerkUserId);
  }

  return { clerkUserId, bearerToken: undefined };
}
