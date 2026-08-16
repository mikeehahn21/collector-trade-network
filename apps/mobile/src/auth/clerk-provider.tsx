import { createContext, createElement, useCallback } from "react";
import type { PropsWithChildren } from "react";
import { ClerkProvider, useAuth, useSignIn, useSignUp, useUser } from "@clerk/clerk-expo";
import type { ClerkProviderProps } from "@clerk/clerk-expo";

import { getMobileEnv } from "@/config/env";
import { secureStorage } from "@/storage/secure-storage";

const LOCAL_SESSION_KEY = "collector_trade_local_session";

export type AuthResult = {
  ok: boolean;
  message?: string | undefined;
};

export type AuthSession = {
  clerkEnabled: boolean;
  isLoaded: boolean;
  isSignedIn: boolean;
  userEmail?: string | undefined;
  createAccount: (email: string, password: string) => Promise<AuthResult>;
  getApiAuth: () => Promise<{ bearerToken?: string; clerkUserId?: string; email?: string }>;
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  verifyEmail: (code: string) => Promise<AuthResult>;
};

export const AuthSessionContext = createContext<AuthSession | undefined>(undefined);

const tokenCache = {
  getToken: (key: string) => secureStorage.getItem(key),
  saveToken: (key: string, token: string) => secureStorage.setItem(key, token),
};

export function MobileAuthProvider({ children }: PropsWithChildren) {
  const { clerkPublishableKey } = getMobileEnv();

  if (!clerkPublishableKey) {
    return <LocalAuthProvider>{children}</LocalAuthProvider>;
  }

  // Use createElement to avoid TS2322: @types/react 18.3 removed implicit children from FC props
  const props: ClerkProviderProps & { children: typeof children } = {
    publishableKey: clerkPublishableKey,
    tokenCache,
    children: <ClerkAuthBridge>{children}</ClerkAuthBridge>,
  };
  return createElement(ClerkProvider, props);
}

function LocalAuthProvider({ children }: PropsWithChildren) {
  const login = useCallback(async (email: string): Promise<AuthResult> => {
    await secureStorage.setItem(LOCAL_SESSION_KEY, email);
    return { ok: true };
  }, []);

  const createAccount = useCallback(async (email: string): Promise<AuthResult> => {
    await secureStorage.setItem(LOCAL_SESSION_KEY, email);
    return { ok: true };
  }, []);

  const verifyEmail = useCallback(async (code: string): Promise<AuthResult> => {
    return { ok: /^\d{6}$/.test(code) };
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await secureStorage.removeItem(LOCAL_SESSION_KEY);
  }, []);

  const getApiAuth = useCallback(async () => {
    const email = await secureStorage.getItem(LOCAL_SESSION_KEY);
    const result: { clerkUserId?: string; email?: string } = {};
    if (email) {
      result.clerkUserId = `local_clerk_${email}`;
      result.email = email;
    }
    return result;
  }, []);

  return (
    <AuthSessionContext.Provider
      value={{
        clerkEnabled: false,
        isLoaded: true,
        isSignedIn: true,
        createAccount,
        getApiAuth,
        login,
        logout,
        verifyEmail,
      }}
    >
      {children}
    </AuthSessionContext.Provider>
  );
}

function ClerkAuthBridge({ children }: PropsWithChildren) {
  const auth = useAuth();
  const signIn = useSignIn();
  const signUp = useSignUp();
  const user = useUser();

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
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
    },
    [signIn],
  );

  const createAccount = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      try {
        await signUp.signUp?.create({ emailAddress: email, password });
        await signUp.signUp?.prepareEmailAddressVerification({ strategy: "email_code" });
        return { ok: true };
      } catch {
        return { ok: false, message: "Unable to create that account." };
      }
    },
    [signUp],
  );

  const verifyEmail = useCallback(
    async (code: string): Promise<AuthResult> => {
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
    },
    [signUp],
  );

  const logout = useCallback(async (): Promise<void> => {
    await auth.signOut();
  }, [auth]);

  const getApiAuth = useCallback(async () => {
    const token = await auth.getToken();
    const result: { bearerToken?: string; clerkUserId?: string; email?: string } = {};
    if (token) result.bearerToken = token;
    if (auth.userId) result.clerkUserId = auth.userId;
    const emailAddr = user.user?.primaryEmailAddress?.emailAddress;
    if (emailAddr) result.email = emailAddr;
    return result;
  }, [auth, user.user?.primaryEmailAddress?.emailAddress]);

  return (
    <AuthSessionContext.Provider
      value={{
        clerkEnabled: true,
        isLoaded: auth.isLoaded,
        isSignedIn: Boolean(auth.isSignedIn),
        userEmail: user.user?.primaryEmailAddress?.emailAddress,
        createAccount,
        getApiAuth,
        login,
        logout,
        verifyEmail,
      }}
    >
      {children}
    </AuthSessionContext.Provider>
  );
}
