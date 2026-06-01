//Gerencia as regras de negócio e estados do Dashboard.

import { useState, useEffect } from "react";
import { useDrafts } from "../context/DraftsContext"; //Edições temporárias salvas no navegador.
import { fetchProcessos, fetchMetrics } from "../lib/api"; //Funções de busca de dados.
import { ProcessoSEI, DashboardMetrics } from "../types/sei"; //Interfaces de tipagem oficiais.
import { getEffectiveList } from "../data/mock"; //Função que mescla os dados reais com as edições locais.

export const useDashboard = () => {
  //Pega os rascunhos e prioridades alterados localmente pelo usuário.
  const { drafts, priorities } = useDrafts();
  
  //Armazena os processos, as métricas do painel e o status de carregamento.
  const [data, setData] = useState<ProcessoSEI[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  //Executa a busca de dados sempre que houver mudanças nos rascunhos ou prioridades.
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        //Busca a lista bruta de processos.
        const processosAPI = await fetchProcessos();
        
        //Aplica os rascunhos locais por cima da lista que veio do servidor.
        const effective = getEffectiveList(processosAPI, drafts, priorities);
        
        //Calcula as métricas com base nessa lista atualizada.
        const metricasCalculadas = await fetchMetrics(effective);
        
        //Guarda os resultados nos estados do React.
        setData(effective);
        setMetrics(metricasCalculadas);
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard", error);
      } finally {
        setIsLoading(false);
      }
    };

    //Dispara a função de carregamento.
    loadData();
  }, [drafts, priorities]);

  //Entrega os dados e o estado de loading para o Dashboard.tsx.
  return { data, metrics, isLoading };
};