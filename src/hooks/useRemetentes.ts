import { useQuery } from "@tanstack/react-query";
import { getRemetentes } from "@/services/remetenteService";
import { Remetente } from "@/types/remetente";

export const useRemetentes = () => {
  const { data, isLoading, error, refetch } = useQuery<Remetente[]>({
    queryKey: ["remetentes"],
    queryFn: async () => {
      try {
        return await getRemetentes();
      } catch (err) {
        console.warn("Não foi possível carregar os remetentes do backend:", err);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  return {
    remetentes: data || [],
    isLoading,
    error,
    refetch,
  };
};
