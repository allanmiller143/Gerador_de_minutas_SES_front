export type ProcessingStatusValue = "processing" | "failed" | "completed" | "idle";

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

export const isProcessingStatus = (value?: string | null) => normalizeProcessingStatus(value) === "processing";

export const isFailedStatus = (value?: string | null) => normalizeProcessingStatus(value) === "failed";

export const isCompletedStatus = (value?: string | null) => normalizeProcessingStatus(value) === "completed";
