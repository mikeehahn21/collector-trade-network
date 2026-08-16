import { useContext } from "react";

import { AuthSessionContext } from "@/auth/clerk-provider";

export function useAuthSession() {
  const session = useContext(AuthSessionContext);

  if (!session) {
    throw new Error("useAuthSession must be used within MobileAuthProvider");
  }

  return session;
}
