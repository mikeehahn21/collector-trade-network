import { useEffect } from "react";
import { usePathname, useRouter } from "expo-router";

import { useAuthSession } from "@/auth/use-auth-session";

const protectedPrefixes = ["/home", "/inventory", "/wishlist"] as const;

export function ProtectedRouteGuard() {
  const auth = useAuthSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!auth.clerkEnabled || !auth.isLoaded) {
      return;
    }

    const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

    if (isProtected && !auth.isSignedIn) {
      router.replace("/welcome");
    }
  }, [auth.clerkEnabled, auth.isLoaded, auth.isSignedIn, pathname, router]);

  return null;
}
