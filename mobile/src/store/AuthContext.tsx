import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ApiError,
  getMe,
  login as apiLogin,
  register as apiRegister,
  setOnUnauthorizedHandler,
} from "../services/api";
import {
  clearAuthStorage,
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
} from "../services/storage";
import type { User } from "../types/karny";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isInitializing: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  const signOut = useCallback(async () => {
    await clearAuthStorage();
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setOnUnauthorizedHandler(() => {
      void signOut();
    });

    return () => {
      setOnUnauthorizedHandler(null);
    };
  }, [signOut]);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const [storedToken, storedUser] = await Promise.all([
          getStoredToken(),
          getStoredUser(),
        ]);

        if (!storedToken) {
          if (isMounted) {
            setToken(null);
            setUser(null);
          }
          return;
        }

        if (storedUser && isMounted) {
          setToken(storedToken);
          setUser(storedUser);
        }

        try {
          const meResult = await getMe(storedToken);
          if (meResult?.user && isMounted) {
            setToken(storedToken);
            setUser(meResult.user);
            await setStoredUser(meResult.user);
          }
        } catch (error) {
          if (
            error instanceof ApiError &&
            (error.status === 401 || error.status === 404)
          ) {
            await clearAuthStorage();
            if (isMounted) {
              setToken(null);
              setUser(null);
            }
          } else if (!storedUser && isMounted) {
            setToken(null);
            setUser(null);
          }
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    }

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await apiLogin(email.trim(), password);

    if (!result.token || !result.user) {
      throw new Error("The server response is incomplete.");
    }

    await Promise.all([
      setStoredToken(result.token),
      setStoredUser(result.user),
    ]);

    setToken(result.token);
    setUser(result.user);
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const result = await apiRegister(name.trim(), email.trim(), password);

      if (!result.token || !result.user) {
        throw new Error("The server response is incomplete.");
      }

      await Promise.all([
        setStoredToken(result.token),
        setStoredUser(result.user),
      ]);

      setToken(result.token);
      setUser(result.user);
    },
    []
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isInitializing,
      isAuthenticated: Boolean(token && user),
      signIn,
      signUp,
      signOut,
    }),
    [user, token, isInitializing, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
