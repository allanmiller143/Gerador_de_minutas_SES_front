export type ProcessingStatusValue = "pending" | "processing" | "failed" | "completed" | "idle";

interface ProcessingStatusLike {
  status_processamento?: string | null;
  processing_error?: string | null;
  status?: string | null;
}

const normalizeValue = (value?: string | null) => (value ? String(value).trim().toLowerCase() : "");

export const normalizeProcessingStatus = (value?: string | null): ProcessingStatusValue => {
  const normalized = normalizeValue(value);

  if (!normalized) return "idle";

  if (["pendente", "pending", "aguardando", "aguardando processamento", "aguardando análise", "queued"].includes(normalized)) {
    return "pending";
  }

  if (["processando", "em análise", "em_analise", "analisando", "análise em andamento", "running"].includes(normalized)) {
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

export const isPendingStatus = (value?: string | null) => normalizeProcessingStatus(value) === "pending";

export const isProcessingStatus = (value?: string | null) => normalizeProcessingStatus(value) === "processing";

export const isFailedStatus = (value?: string | null) => normalizeProcessingStatus(value) === "failed";

export const isCompletedStatus = (value?: string | null) => normalizeProcessingStatus(value) === "completed";

export const isProcessoReadyForView = (processo?: ProcessingStatusLike | null): boolean => {
  if (!processo) return false;
  const status = normalizeProcessingStatus(processo.status_processamento);
  if (status === "pending" || status === "processing" || status === "failed") {
    return false;
  }
  if (processo.status === "Falha na análise") {
    return false;
  }
  return true;
};

export const getProcessosPollingInterval = (processos?: ProcessingStatusLike[] | null) => {
  const hasPendingOrProcessing = processos?.some((processo) => {
    const s = normalizeProcessingStatus(processo.status_processamento);
    return s === "processing" || s === "pending";
  });
  return hasPendingOrProcessing ? 5000 : false;
};
