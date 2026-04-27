import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { UserRole } from "@/data/mock";

export interface AuthUser {
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "ses_auth_user";

export const roleLabel: Record<UserRole, string> = {
  analista: "Analista",
  administrador: "Administrador",
};

export const demoUsers: Record<UserRole, AuthUser> = {
  analista: { name: "Mariana Costa", email: "mariana.costa@ses.sp.gov.br", role: "analista" },
  administrador: { name: "Paula Mendes", email: "paula.mendes@ses.sp.gov.br", role: "administrador" },
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { setUser(JSON.parse(raw)); } catch { /* noop */ }
    }
  }, []);

  const login = (u: AuthUser) => {
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  };
  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
