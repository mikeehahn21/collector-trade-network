import { useCallback } from "react";
import { useAuth, useSignIn, useSignUp, useUser } from "@clerk/clerk-expo";

import { getMobileEnv } from "@/config/env";
import { secureStorage } from "@/storage/secure-storage";

const LOCAL_SESSION_KEY = "collector_trade_local_session";

type AuthResult = {
  ok: boolean;
  message?: string | undefined;
};

export function useAuthSession() {
  const { clerkPublishableKey } = getMobileEnv();
  const clerkEnabled = Boolean(clerkPublishableKey);
  const auth = useAuth();
  const signIn = useSignIn();
  const signUp = useSignUp();
  const user = useUser();

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!clerkEnabled) {
      await secureStorage.setItem(LOCAL_SESSION_KEY, email);
      return { ok: true };
    }

    try {
      const result = await signIn.signIn?.create({ identifier: email, password });

      if (result?.status === "complete") {
        await signIn.setActive?.({ session: result.createdSessionId });
        return { ok: true };
      }

      return { ok: false, message: "Additional verification is required." };
    } catch {
      return { ok: false, message: "Unable to log in with those credentials." };
    }
  }, [clerkEnabled, signIn]);

  const createAccount = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!clerkEnabled) {
      await secureStorage.setItem(LOCAL_SESSION_KEY, email);
      return { ok: true };
    }

    try {
      await signUp.signUp?.create({ emailAddress: email, password });
      await signUp.signUp?.prepareEmailAddressVerification({ strategy: "email_code" });
      return { ok: true };
    } catch {
      return { ok: false, message: "Unable to create that account." };
    }
  }, [clerkEnabled, signUp]);

  const verifyEmail = useCallback(async (code: string): Promise<AuthResult> => {
    if (!clerkEnabled) {
      return { ok: /^\d{6}$/.test(code) };
    }

    try {
      const result = await signUp.signUp?.attemptEmailAddressVerification({ code });

      if (result?.status === "complete") {
        await signUp.setActive?.({ session: result.createdSessionId });
        return { ok: true };
      }

      return { ok: false, message: "Additional verification is required." };
    } catch {
      return { ok: false, message: "Invalid verification code." };
    }
  }, [clerkEnabled, signUp]);

  const logout = useCallback(async (): Promise<void> => {
    if (clerkEnabled) {
      await auth.signOut();
      return;
    }

    await secureStorage.removeItem(LOCAL_SESSION_KEY);
  }, [auth, clerkEnabled]);

  const getApiAuth = useCallback(async () => {
    if (clerkEnabled) {
      const token = await auth.getToken();
      return {
        bearerToken: token ?? undefined,
        clerkUserId: auth.userId ?? undefined,
        email: user.user?.primaryEmailAddress?.emailAddress,
      };
    }

    const email = await secureStorage.getItem(LOCAL_SESSION_KEY);
    return {
      clerkUserId: email ? `local_clerk_${email}` : undefined,
      email: email ?? undefined,
    };
  }, [auth, clerkEnabled, user.user?.primaryEmailAddress?.emailAddress]);

  return {
    clerkEnabled,
    isLoaded: clerkEnabled ? auth.isLoaded : true,
    isSignedIn: clerkEnabled ? Boolean(auth.isSignedIn) : true,
    userEmail: clerkEnabled ? user.user?.primaryEmailAddress?.emailAddress : undefined,
    createAccount,
    getApiAuth,
    login,
    logout,
    verifyEmail,
  };
}
