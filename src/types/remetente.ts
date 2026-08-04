export interface Remetente {
  id: number;
  prefixo: string;
  nome_completo: string;
  sigla: string;
  cor: string;
}

export type RemetenteInput = Omit<Remetente, "id">;
