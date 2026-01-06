import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as authApi from "@/lib/auth";

type User = {
  id: string;
  email: string;
  createdAt: string | Date;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  register: (email: string, password: string) => Promise<User>;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<User | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const me = await authApi.getCurrentUser();
      setUser(me);
      return me;
    } catch {
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const me = await authApi.getCurrentUser();
        if (mounted) setUser(me);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      refresh,
      register: async (email, password) => {
        setLoading(true);
        try {
          const u = await authApi.register(email, password);
          setUser(u);
          return u;
        } finally {
          setLoading(false);
        }
      },
      login: async (email, password) => {
        setLoading(true);
        try {
          const u = await authApi.login(email, password);
          setUser(u);
          return u;
        } finally {
          setLoading(false);
        }
      },
      logout: async () => {
        setLoading(true);
        try {
          await authApi.logout();
          setUser(null);
        } finally {
          setLoading(false);
        }
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
