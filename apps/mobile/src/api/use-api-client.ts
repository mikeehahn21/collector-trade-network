import { useMemo } from "react";

import { createApiClient } from "@/api/api-client";
import { useAuthSession } from "@/auth/use-auth-session";

export function useApiClient() {
  const authSession = useAuthSession();

  return useMemo(() => createApiClient(authSession.getApiAuth), [authSession.getApiAuth]);
}
