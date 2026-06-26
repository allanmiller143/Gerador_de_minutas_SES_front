export type Priority = "Alta" | "Média" | "Baixa";
// Fluxo: todo SEI entra e é PRÉ-ANALISADO pela IA automaticamente.
// O humano apenas revisa e finaliza.
export type SeiStatus =
  | "Pré-análise"   // IA terminou, aguarda revisão humana
  | "Em revisão"            // humano começou a revisar (rascunho salvo)
  | "Concluído";            // humano finalizou a análise

export type UserRole = "analista" | "administrador";

export interface Sei {
  id: string;
  numero: string;
  assunto: string;
  dataRecebimento: string;
  dataPreAnalise: string;        // quando a IA terminou a pré-análise
  dataRevisao?: string;          // quando o humano revisou
  prioridade: Priority;
  status: SeiStatus;
  analista?: string;             // humano responsável pela revisão
  partes?: string;
  resumo?: string;
  iaConfidence: number;          // 0..1 – confiança da IA
  iaSugestao: string;            // minuta sugerida pela IA (resumo)
  jurisprudenciasSugeridas: string[]; // ids
  documentoPdf?: {
    filename: string;
    mime_type: string;
    url: string;
  };
}

export interface Jurisprudencia {
  id: string;
  tribunal: string;
  numero: string;
  tema: string;
  resumo: string;
  link: string;
  tags: string[];
  preferencial?: boolean;
}

/**
 * Fonte de verdade para o status "vivo" de um SEI: se houver um rascunho no
 * DraftsContext, ele sobrescreve o status/analista/data vindo do backend. Isso
 * garante que as telas reflitam as edições salvas localmente até a persistência
 * definitiva de rascunhos no backend.
 */
export interface DraftLike {
  seiId: string;
  ownerName: string;
  ownerEmail: string;
  status: "Em revisão" | "Concluído";
  updatedAt: string;
}

export interface PriorityLike {
  seiId: string;
  priority: Priority;
  updatedAt: string;
}

export function getEffectiveSei(
  sei: Sei,
  drafts: Record<string, DraftLike>,
  priorities: Record<string, PriorityLike> = {},
): Sei {
  const d = drafts[sei.id];
  const p = priorities[sei.id];
  let out = sei;
  if (d) {
    out = {
      ...out,
      status: d.status,
      analista: d.ownerName,
      dataRevisao: d.status === "Concluído"
        ? new Date(d.updatedAt).toLocaleDateString("pt-BR")
        : sei.dataRevisao,
    };
  }
  if (p) {
    out = { ...out, prioridade: p.priority };
  }
  return out;
}

export function getEffectiveList(
  list: Sei[],
  drafts: Record<string, DraftLike>,
  priorities: Record<string, PriorityLike> = {},
): Sei[] {
  return list.map((s) => getEffectiveSei(s, drafts, priorities));
}

export function computeMetrics(list: Sei[]) {
  return {
    preAnalisadosIA: list.filter((s) => s.status === "Pré-análise").length,
    emRevisaoHumana: list.filter((s) => s.status === "Em revisão").length,
    concluidos: list.filter((s) => s.status === "Concluído").length,
    total: list.length,
  };
}
