import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProcessos, uploadProcessoPDF, analisarProcessoIA } from "@/lib/api";
import { useDrafts } from "@/context/DraftsContext";
import { getEffectiveList } from "@/data/mock";
import { ProcessoSEI } from "@/types/sei";

export const useProcessos = () => {
  const { drafts, priorities } = useDrafts();

  const query = useQuery({
    queryKey: ["processos"],
    queryFn: fetchProcessos,
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });

  // Mescla os rascunhos locais e prioridades em tempo de execução
  const effectiveData = query.data
    ? (getEffectiveList(query.data as any, drafts, priorities) as unknown as ProcessoSEI[])
    : undefined;

  return {
    ...query,
    data: effectiveData,
  };
};

export const useUploadProcesso = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, numero, assunto, prioridade }: { file: File; numero: string; assunto: string; prioridade: string }) => 
      uploadProcessoPDF(file, numero, assunto, prioridade),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processos"] });
    },
  });
};

export const useAnalisarProcesso = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => analisarProcessoIA(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processos"] });
    },
  });
};


