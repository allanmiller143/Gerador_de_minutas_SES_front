import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Jurisprudencia, Sei } from "@/data/mock";
import { toast } from "sonner";

interface SeisResponse {
  seis: Sei[];
}

interface JurisprudenciasResponse {
  jurisprudencias: Jurisprudencia[];
}

export interface ResumoTecnico {
  resumo_processo: {
    tipo_demanda?: string;
    medicamento_solicitado?: string;
    cid_informado?: string;
    diagnostico_informado?: string;
    objetivo_da_solicitacao?: string;
  };
  evidencias_clinicas_do_processo: string[];
  confronto_documentacao_suporte: {
    cid_validado?: boolean;
    medicamento_contemplado_para_o_cid?: string;
    observacoes?: string[];
  };
  insumo_parecer: {
    conclusao_tecnica_sugerida?: string;
    fundamentos?: string[];
    alternativas_orientaveis?: string[];
    pendencias_documentais?: string[];
    necessita_revisao_humana?: boolean;
    nivel_confianca?: string;
  };
  fontes_consultadas: string[];
}

interface SeiDetailResponse {
  sei: Sei;
  jurisprudencias: Jurisprudencia[];
  minuta: string;
}

interface SeiResumoTecnicoResponse {
  sei: Sei;
  resumoTecnico: ResumoTecnico;
  minuta: string;
  id?: number;
  version?: number;
  generated_at?: string;
  generated_by?: string;
  is_active?: boolean;
}

export interface ResumoVersion extends SeiResumoTecnicoResponse {
  id: number;
  sei_id: string;
  version: number;
  source: string;
  generated_at: string;
  generated_by: string;
  is_active: boolean;
  batch_run_id?: number | null;
}

export interface ResumoBatchSchedule {
  id: number;
  enabled: boolean;
  time: string;
  updated_at?: string;
  updated_by?: string;
  last_run_date?: string | null;
}

export interface ResumoBatchLog {
  timestamp: string;
  level: "info" | "success" | "error" | "warning" | string;
  message: string;
}

export interface ResumoBatchRun {
  id: number;
  status: string;
  trigger_type: string;
  triggered_by: string;
  started_at: string;
  finished_at?: string;
  duration_seconds: number;
  total_seis: number;
  generated_count: number;
  failed_count: number;
  sei_ids: string[];
  error_message?: string | null;
  logs: ResumoBatchLog[];
}

export interface SeiPdfResponse {
  filename: string;
  mime_type: "application/pdf";
  size: number;
  pdf_bytes: number[];
}

export const domainDataQueryKeys = {
  seis: ["domain", "seis"] as const,
  jurisprudencias: ["domain", "jurisprudencias"] as const,
  seiDetail: (id?: string) => ["domain", "seis", id] as const,
  seiPdf: (id?: string) => ["domain", "seis", id, "pdf"] as const,
  resumoVersions: (id?: string) => ["domain", "seis", id, "resumos"] as const,
  resumoBatchConfig: ["domain", "resumo-batch", "config"] as const,
  resumoBatchRuns: ["domain", "resumo-batch", "runs"] as const,
};

export function useSeis() {
  return useQuery({
    queryKey: domainDataQueryKeys.seis,
    queryFn: async () => {
      const data = await api<SeisResponse>("/api/seis");
      return data.seis;
    },
  });
}

export function useJurisprudencias() {
  return useQuery({
    queryKey: domainDataQueryKeys.jurisprudencias,
    queryFn: async () => {
      const data = await api<JurisprudenciasResponse>("/api/jurisprudencias");
      return data.jurisprudencias;
    },
  });
}

export function useSeiDetail(id?: string) {
  return useQuery({
    queryKey: domainDataQueryKeys.seiDetail(id),
    enabled: !!id,
    queryFn: async () => api<SeiDetailResponse>(`/api/seis/${id}`),
  });
}

export function useSeiResumoTecnico(id?: string) {
  return useQuery({
    queryKey: [...domainDataQueryKeys.seiDetail(id), "resumo-tecnico"] as const,
    enabled: !!id,
    queryFn: async () => api<SeiResumoTecnicoResponse>(`/api/seis/${id}/resumo-tecnico`),
  });
}

export function useResumoVersions(id?: string) {
  return useQuery({
    queryKey: domainDataQueryKeys.resumoVersions(id),
    enabled: !!id,
    queryFn: async () => {
      const data = await api<{ resumos: ResumoVersion[] }>(`/api/seis/${id}/resumos`);
      return data.resumos;
    },
  });
}

export function useGenerateResumo(id?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (triggered_by?: string) =>
      api<ResumoVersion>(`/api/seis/${id}/resumos/generate`, { method: "POST", body: { triggered_by } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: domainDataQueryKeys.resumoVersions(id) });
      queryClient.invalidateQueries({ queryKey: [...domainDataQueryKeys.seiDetail(id), "resumo-tecnico"] });
    },
  });
}

export function useRestoreResumo(id?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (resumoId: number) =>
      api<ResumoVersion>(`/api/seis/${id}/resumos/${resumoId}/restore`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: domainDataQueryKeys.resumoVersions(id) });
      queryClient.invalidateQueries({ queryKey: [...domainDataQueryKeys.seiDetail(id), "resumo-tecnico"] });
    },
  });
}

export function useResumoBatchConfig() {
  return useQuery({
    queryKey: domainDataQueryKeys.resumoBatchConfig,
    queryFn: async () => api<ResumoBatchSchedule>("/api/resumo-batch/config"),
  });
}

export function useResumoBatchRuns() {
  return useQuery({
    queryKey: domainDataQueryKeys.resumoBatchRuns,
    refetchInterval: (query) => {
      const runs = query.state.data as ResumoBatchRun[] | undefined;
      return runs?.some((run) => run.status === "running" || run.status === "cancel_requested") ? 1000 : false;
    },
    queryFn: async () => {
      const data = await api<{ runs: ResumoBatchRun[] }>("/api/resumo-batch/runs");
      return data.runs;
    },
  });
}

export function useUpdateResumoBatchConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { enabled: boolean; time?: string; updated_by?: string }) =>
      api<ResumoBatchSchedule>("/api/resumo-batch/config", { method: "PUT", body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: domainDataQueryKeys.resumoBatchConfig }),
  });
}

export function useRunResumoBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (triggered_by?: string) =>
      api<ResumoBatchRun>("/api/resumo-batch/run", { method: "POST", body: { triggered_by } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: domainDataQueryKeys.resumoBatchRuns });
      queryClient.invalidateQueries({ queryKey: domainDataQueryKeys.seis });
    },
  });
}

export function useCancelResumoBatchRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ runId, triggered_by }: { runId: number; triggered_by?: string }) =>
      api<ResumoBatchRun>(`/api/resumo-batch/runs/${runId}/cancel`, { method: "POST", body: { triggered_by } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: domainDataQueryKeys.resumoBatchRuns }),
  });
}

export async function fetchSeiPdf(id: string) {
  return api<SeiPdfResponse>(`/api/seis/${id}/pdf`);
}

export function usePromptConfig(key: string) {
  return useQuery({
    queryKey: ["prompts", key],
    queryFn: async () => api<{
      key: string;
      editable_prompt: string;
      fixed_schema: string;
      updated_at: string;
      updated_by: string;
    }>(`/api/prompts/${key}`),
  });
}

export function useUpdatePromptConfig(key: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { editable_prompt: string; updated_by?: string }) =>
      api(`/api/prompts/${key}`, { method: "PUT", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts", key] });
      toast.success("Prompt atualizado com sucesso.");
    },
  });
}