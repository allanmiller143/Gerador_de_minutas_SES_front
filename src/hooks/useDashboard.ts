import { useMemo } from "react";
import { useProcessos } from "./useProcessos";
import { DashboardMetrics } from "../types/sei";

export const useDashboard = () => {
  const { data, isLoading, error } = useProcessos();

  // Calcula as métricas em tempo de execução com base na lista mesclada global
  const metrics = useMemo<DashboardMetrics | null>(() => {
    if (!data) return null;

    return {
      preAnalisadosIA: data.filter((s) => s.status === "Pré-análise").length,
      emRevisaoHumana: data.filter((s) => s.status === "Em revisão").length,
      concluidos: data.filter((s) => s.status === "Concluído").length,
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