import { useMemo } from "react";
import { useProcessos } from "./useProcessos";
import { DashboardMetrics } from "../types/sei";
import { isFailedStatus, isProcessoReadyForView } from "@/lib/processStatus";

export const useDashboard = () => {
  const { data, isLoading, error } = useProcessos();

  // Calcula as métricas em tempo de execução com base na lista mesclada global
  const metrics = useMemo<DashboardMetrics | null>(() => {
    if (!data) return null;

    const falhas = data.filter((s) => s.status === "Falha na análise" || isFailedStatus(s.status_processamento)).length;

    return {
      preAnalisadosIA: data.filter((s) => s.status === "Pré-análise" && isProcessoReadyForView(s)).length,
      emRevisaoHumana: data.filter((s) => s.status === "Em revisão").length,
      concluidos: data.filter((s) => s.status === "Concluído").length,
      falhasAnalise: falhas,
      total: data.length,
    };
  }, [data]);

  return {
    data: data || [],
    metrics,
    isLoading,
    error,
  };
};