import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Jurisprudencia, Sei } from "@/data/mock";

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
  resumoTecnico?: ResumoTecnico;
  minuta: string;
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

export async function fetchSeiPdf(id: string) {
  return api<SeiPdfResponse>(`/api/seis/${id}/pdf`);
}
