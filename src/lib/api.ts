// Cliente HTTP com JWT (access + refresh) e refresh automático em 401.

import { ProcessoSEI, DashboardMetrics } from "../types/sei"; //Importa as interfaces de tipagem.

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://127.0.0.1:5000";

const ACCESS_KEY = "ses_access_token";
const REFRESH_KEY = "ses_refresh_token";

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: (access: string, refresh?: string) => {
    localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;       // anexa access token (default true)
  useRefresh?: boolean; // usa refresh token no Authorization (default false)
  _retry?: boolean;     // interno
}

let refreshPromise: Promise<string | null> | null = null;

async function tryRefresh(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refresh = tokenStore.getRefresh();
      if (!refresh) return null;
      try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { Authorization: `Bearer ${refresh}` },
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (data?.access_token) {
          tokenStore.set(data.access_token);
          return data.access_token as string;
        }
        return null;
      } catch {
        return null;
      } finally {
        // libera o lock no próximo tick
        setTimeout(() => { refreshPromise = null; }, 0);
      }
    })();
  }
  return refreshPromise;
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { body, auth = true, useRefresh = false, _retry = false, headers, ...rest } = opts;

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(headers as Record<string, string> | undefined),
  };

  if (useRefresh) {
    const r = tokenStore.getRefresh();
    if (r) finalHeaders.Authorization = `Bearer ${r}`;
  } else if (auth) {
    const a = tokenStore.getAccess();
    if (a) finalHeaders.Authorization = `Bearer ${a}`;
  }

  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...rest,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth && !useRefresh && !_retry) {
    const newAccess = await tryRefresh();
    if (newAccess) {
      return api<T>(path, { ...opts, _retry: true });
    }
    tokenStore.clear();
    // dispara evento para o AuthContext deslogar
    window.dispatchEvent(new CustomEvent("ses:unauthorized"));
  }

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }

  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && "msg" in (data as Record<string, unknown>) &&
        String((data as Record<string, unknown>).msg)) ||
      (data && typeof data === "object" && "error" in (data as Record<string, unknown>) &&
        String((data as Record<string, unknown>).error)) ||
      `Erro ${res.status}`;
    throw new ApiError(msg, res.status, data);
  }

  return data as T;
}


//Modelagem e requisições do dashboard

export const fetchProcessos = async (): Promise<ProcessoSEI[]> => {
  return api<ProcessoSEI[]>("/api/processos");
};

export const fetchMetrics = async (_processos: ProcessoSEI[]): Promise<DashboardMetrics> => {
  return api<DashboardMetrics>("/api/dashboard/metrics");
};