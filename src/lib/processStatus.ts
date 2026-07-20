export type ProcessingStatusValue = "processing" | "failed" | "completed" | "idle";

interface ProcessingStatusLike {
  status_processamento?: string | null;
  processing_error?: string | null;
}

const normalizeValue = (value?: string | null) => (value ? String(value).trim().toLowerCase() : "");

export const normalizeProcessingStatus = (value?: string | null): ProcessingStatusValue => {
  const normalized = normalizeValue(value);

  if (!normalized) return "idle";

  if (["processando", "em análise", "em_analise", "analisando", "análise em andamento", "running", "pending", "queued"].includes(normalized)) {
    return "processing";
  }

  if (["falhou", "failed", "error", "erro", "cancelado", "canceled", "cancelled"].includes(normalized)) {
    return "failed";
  }

  if (["concluído", "concluido", "completed", "done", "success", "sucesso"].includes(normalized)) {
    return "completed";
  }

  return "idle";
};

export const getProcessosPollingInterval = (processos?: ProcessingStatusLike[] | null) => {
  const hasProcessing = processos?.some((processo) => normalizeProcessingStatus(processo.status_processamento) === "processing");
  return hasProcessing ? 5000 : false;
};

export const isProcessingStatus = (value?: string | null) => normalizeProcessingStatus(value) === "processing";

export const isFailedStatus = (value?: string | null) => normalizeProcessingStatus(value) === "failed";

export const isCompletedStatus = (value?: string | null) => normalizeProcessingStatus(value) === "completed";
