import { useState, useEffect } from "react";
import { useDrafts } from "../context/DraftsContext";
import { fetchProcessos, fetchMetrics } from "../lib/api";
import { ProcessoSEI, DashboardMetrics } from "../types/sei";
import { getEffectiveList } from "../data/mock";

export const useDashboard = () => {
  const { drafts, priorities } = useDrafts();
  
  const [data, setData] = useState<ProcessoSEI[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        //Busca a lista original vinda da API
        const processosAPI = await fetchProcessos();
        
        //Aplica os rascunhos locais por cima da lista
        const effective = getEffectiveList(processosAPI, drafts, priorities);
        
        //Injeta o indicador laranja se baseando na flag do rascunho.
        const effectiveComIndicador = effective.map(proc => {
          //Busca o draft original do processo para poder comparar a prioridade.
          const original = processosAPI.find(p => p.id === proc.id);
          const prioridadeOriginal = original ? original.prioridade : proc.prioridade;

          const rascunhoLocal = drafts ? drafts[proc.id] : undefined;
          const prioridadeLocal = priorities ? priorities[proc.id] : undefined;

          //Verifica se o rascunho existe e que o texto foi alterado.
          const temRascunhoDiferente = rascunhoLocal !== undefined && 
                                       rascunhoLocal.foiAlterado === true;

          //Verifica a prioridade.
          const temPrioridadeDiferente = prioridadeLocal !== undefined && 
                                         prioridadeLocal.priority !== prioridadeOriginal;

          return {
            ...proc,
            isEditadoLocalmente: Boolean(temRascunhoDiferente || temPrioridadeDiferente)
          };
        });

        const metricasCalculadas = await fetchMetrics(effectiveComIndicador);
        
        setData(effectiveComIndicador);
        setMetrics(metricasCalculadas);
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [drafts, priorities]);

  return { data, metrics, isLoading };
};