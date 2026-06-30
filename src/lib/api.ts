// Cliente HTTP com JWT (access + refresh) e refresh automático em 401.

import { ProcessoSEI, DashboardMetrics } from "../types/sei"; //Importa as interfaces de tipagem.
import { seis, computeMetrics } from "../data/mock"; //Importa os dados estáticos e a função de cálculo do arquivo mock.

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

  const isFormData = body instanceof FormData;

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(!isFormData && body !== undefined ? { "Content-Type": "application/json" } : {}),
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
    body: isFormData ? (body as FormData) : (body !== undefined ? JSON.stringify(body) : undefined),
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

//Busca os processos SEI na API REST, com fallback para mock caso o backend não esteja rodando
export const fetchProcessos = async (): Promise<ProcessoSEI[]> => {
  try {
    const response = await api<{ processos: ProcessoSEI[] } | ProcessoSEI[]>("/processos/");
    console.log(response);
    return Array.isArray(response) ? response : (response?.processos || []);
  } catch (error) {
    console.warn("REST API indisponível, usando dados mockados como fallback.", error);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(seis as unknown as ProcessoSEI[]);
      }, 800);
    });
  }
};

//Busca as métricas atuais do painel principal
export const fetchMetrics = async (processos: ProcessoSEI[]): Promise<DashboardMetrics> => {
  return computeMetrics(processos as any);
};

// Faz o upload de um novo processo (PDF + dados do formulário)
export const uploadProcessoPDF = async (file: File, numero: string, assunto: string, prioridade: string): Promise<ProcessoSEI> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("numero", numero);
  formData.append("assunto", assunto);
  formData.append("prioridade", prioridade);

  const response = await api<{ processo: ProcessoSEI }>("/processos/upload", {
    method: "POST",
    body: formData,
  });

  return response.processo;
};

// Solicita que o backend analise o processo utilizando a API do Gemini
export const analisarProcessoIA = async (id: number): Promise<ProcessoSEI> => {
  const response = await api<{ processo: ProcessoSEI }>(`/processos/${id}/analisar`, {
    method: "POST",
  });
  return response.processo;
};

// Realiza o download do arquivo PDF do processo SEI diretamente do backend Flask
export const downloadProcessoPDF = async (id: number, originalFilename: string): Promise<void> => {
  const token = tokenStore.getAccess();
  const headers: Record<string, string> = {
    Accept: "application/pdf",
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}/processos/${id}/download`;
  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    let errorMsg = "Falha ao realizar o download do arquivo.";
    try {
      const text = await response.text();
      const errorJson = JSON.parse(text);
      if (errorJson?.error) errorMsg = errorJson.error;
    } catch {
      // Ignora erro de parse de JSON e mantém o padrão
    }
    throw new Error(errorMsg);
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = blobUrl;
  a.download = originalFilename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(blobUrl);
  document.body.removeChild(a);
};


// Realiza o download de um arquivo específico da base de conhecimento
export const downloadKnowledgeBaseFile = async (filePath: string): Promise<void> => {
  const token = tokenStore.getAccess();
  const headers: Record<string, string> = {
    Accept: "application/pdf",
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const encodedPath = encodeURIComponent(filePath);
  const url = `${API_BASE_URL}/processos/knowledge-base/download?file=${encodedPath}`;
  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    let errorMsg = "Falha ao realizar o download do arquivo da base de conhecimento.";
    try {
      const text = await response.text();
      const errorJson = JSON.parse(text);
      if (errorJson?.error) errorMsg = errorJson.error;
    } catch {
      // Ignora erro
    }
    throw new Error(errorMsg);
  }

  // Extrair o nome base do arquivo do path
  const parts = filePath.split("/");
  const originalFilename = parts[parts.length - 1] || "documento.pdf";

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = blobUrl;
  a.download = originalFilename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(blobUrl);
  document.body.removeChild(a);
};