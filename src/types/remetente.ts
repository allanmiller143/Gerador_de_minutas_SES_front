export interface Remetente {
  id: number;
  prefixo: string;
  nome_completo: string;
  sigla: string;
  cor: string;
  prioridade: "Máxima" | "Alta" | "Média" | "Baixa";
}

export type RemetenteInput = Omit<Remetente, "id">;
