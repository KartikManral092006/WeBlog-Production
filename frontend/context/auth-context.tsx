"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { authAPI, userAPI } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (payload: {
    name?: string;
    avatar?: string | null;
    bio?: string | null;
    socials?: {
      twitter?: string;
      github?: string;
      linkedin?: string;
      website?: string;
      instagram?: string;
    };
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authAPI.me();
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string, rememberMe = false) => {
    const res = await authAPI.login(email, password, rememberMe);
    setUser(res.user!);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await authAPI.register(name, email, password);
    setUser(res.user!);
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } finally {
      // Always clear local auth state, even if the server session is already invalid.
      setUser(null);
    }
  };

  const updateProfile = async (payload: {
    name?: string;
    avatar?: string | null;
    bio?: string | null;
    socials?: {
      twitter?: string;
      github?: string;
      linkedin?: string;
      website?: string;
      instagram?: string;
    };
  }) => {
    const res = await userAPI.updateMe(payload);
    setUser(res.data);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
