import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import type { UserRole } from "@/data/mock";
import { api, tokenStore, ApiError } from "@/lib/api";

export interface AuthUser {
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_KEY = "ses_auth_user";

export const roleLabel: Record<UserRole, string> = {
  analista: "Analista",
  administrador: "Administrador",
};

// Mapeamento de roles backend <-> frontend
const mapBackendRole = (roles: string[] | undefined): UserRole => {
  if (!roles) return "analista";
  if (roles.includes("admin") || roles.includes("administrador")) return "administrador";
  return "analista";
};

// Compat com código antigo que importava demoUsers
export const demoUsers: Record<UserRole, AuthUser> = {
  analista: { name: "Analista", email: "", role: "analista" },
  administrador: { name: "Administrador", email: "", role: "administrador" },
};

interface ProtectedResponse {
  logged_in_as: string;
  roles: string[];
  email?: string;
  name?: string;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const persistUser = (u: AuthUser | null) => {
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_KEY);
  };

  const fetchMe = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const data = await api<ProtectedResponse>("/auth/protected");
      const u: AuthUser = {
        name: data.name || data.logged_in_as,
        email: data.email || "",
        role: mapBackendRole(data.roles),
      };
      setUser(u);
      persistUser(u);
      return u;
    } catch {
      return null;
    }
  }, []);

  // Bootstrap: se há token, valida; senão usa cache
  useEffect(() => {
    (async () => {
      const access = tokenStore.getAccess();
      const cached = localStorage.getItem(USER_KEY);
      if (cached) {
        try { setUser(JSON.parse(cached)); } catch { /* noop */ }
      }
      if (access) await fetchMe();
      setLoading(false);
    })();
  }, [fetchMe]);

  // Listener para 401 disparado pelo cliente HTTP
  useEffect(() => {
    const onUnauth = () => {
      setUser(null);
      persistUser(null);
    };
    window.addEventListener("ses:unauthorized", onUnauth);
    return () => window.removeEventListener("ses:unauthorized", onUnauth);
  }, []);


  const login = async (email: string, password: string) => {
    const data = await api<{ access_token: string; refresh_token: string }>(
      "/auth/login",
      { method: "POST", body: { email, password }, auth: false }
    );
    if (!data?.access_token) {
      throw new ApiError("Resposta inválida do servidor", 500, data);
    }
    tokenStore.set(data.access_token, data.refresh_token);
    const me = await fetchMe();
    if (!me) throw new ApiError("Não foi possível carregar perfil do usuário", 500, null);
  };
  

  const logout = () => {
    tokenStore.clear();
    setUser(null);
    persistUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
