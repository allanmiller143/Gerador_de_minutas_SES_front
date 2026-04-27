export type Priority = "Alta" | "Média" | "Baixa";
// Fluxo: todo SEI entra e é PRÉ-ANALISADO pela IA automaticamente.
// O humano apenas revisa e finaliza.
export type SeiStatus =
  | "Pré-analisado (IA)"   // IA terminou, aguarda revisão humana
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

export const seis: Sei[] = [
  {
    id: "1",
    numero: "0001234-56.2024.8.26.0053",
    assunto: "Fornecimento de medicamento oncológico",
    dataRecebimento: "20/05/2024",
    dataPreAnalise: "20/05/2024",
    prioridade: "Alta",
    status: "Pré-analisado (IA)",
    partes: "João da Silva x Estado de SP",
    resumo: "Paciente requer fornecimento de medicamento de alto custo não incorporado ao SUS para tratamento oncológico, com apresentação de laudo médico e relatório de insucesso terapêutico.",
    iaConfidence: 0.92,
    iaSugestao: "Deferimento parcial. Medicamento possui registro ANVISA e há jurisprudência consolidada do STJ (REsp 1.657.156) quanto à imprescindibilidade.",
    jurisprudenciasSugeridas: ["j1", "j2", "j4"],
  },
  {
    id: "2",
    numero: "0002345-67.2024.8.26.0053",
    assunto: "Fornecimento de medicamento",
    dataRecebimento: "19/05/2024",
    dataPreAnalise: "19/05/2024",
    prioridade: "Média",
    status: "Pré-analisado (IA)",
    partes: "Maria Souza x Estado de SP",
    resumo: "Solicitação de medicamento constante na RENAME. Verificar disponibilidade na rede SUS.",
    iaConfidence: 0.88,
    iaSugestao: "Orientar protocolo SUS – medicamento disponível na rede. Improcedência por ausência de recusa administrativa.",
    jurisprudenciasSugeridas: ["j2"],
  },
  {
    id: "3",
    numero: "0003456-78.2024.8.26.0053",
    assunto: "Fornecimento de insumo",
    dataRecebimento: "18/05/2024",
    dataPreAnalise: "18/05/2024",
    prioridade: "Média",
    status: "Pré-analisado (IA)",
    partes: "Carlos Pereira x Estado de SP",
    resumo: "Requer fitas e insumos para controle glicêmico.",
    iaConfidence: 0.81,
    iaSugestao: "Deferimento – insumo incluído em protocolo. Verificar quantitativo mensal.",
    jurisprudenciasSugeridas: ["j3"],
  },
  {
    id: "4",
    numero: "0004567-89.2024.8.26.0053",
    assunto: "Fornecimento de medicamento",
    dataRecebimento: "17/05/2024",
    dataPreAnalise: "17/05/2024",
    prioridade: "Baixa",
    status: "Pré-analisado (IA)",
    partes: "Ana Lima x Estado de SP",
    resumo: "Medicamento com similar padronizado disponível.",
    iaConfidence: 0.76,
    iaSugestao: "Improcedência – existe alternativa terapêutica padronizada.",
    jurisprudenciasSugeridas: ["j5"],
  },
  {
    id: "5",
    numero: "0005678-90.2024.8.26.0053",
    assunto: "Medicamento órfão",
    dataRecebimento: "16/05/2024",
    dataPreAnalise: "16/05/2024",
    prioridade: "Alta",
    status: "Em revisão",
    analista: "Mariana Costa",
    partes: "Pedro Alves x Estado de SP",
    resumo: "Medicamento de alto custo sem alternativa terapêutica.",
    iaConfidence: 0.69,
    iaSugestao: "Caso complexo. Recomenda-se análise humana detalhada.",
    jurisprudenciasSugeridas: ["j1", "j4"],
  },
  {
    id: "6",
    numero: "0006789-01.2024.8.26.0053",
    assunto: "Fornecimento de fórmula nutricional",
    dataRecebimento: "15/05/2024",
    dataPreAnalise: "15/05/2024",
    prioridade: "Média",
    status: "Em revisão",
    analista: "Rafael Souza",
    resumo: "Fórmula prescrita por nutrólogo.",
    iaConfidence: 0.84,
    iaSugestao: "Deferimento – prescrição e laudo adequados.",
    jurisprudenciasSugeridas: ["j2"],
  },
  {
    id: "7",
    numero: "0001111-11.2024.8.26.0053",
    assunto: "Fornecimento de medicamento",
    dataRecebimento: "10/05/2024",
    dataPreAnalise: "10/05/2024",
    dataRevisao: "20/05/2024",
    prioridade: "Média",
    status: "Revisado",
    analista: "Mariana Costa",
    resumo: "Revisado pela analista, pronto para envio.",
    iaConfidence: 0.9,
    iaSugestao: "Deferimento – requisitos atendidos.",
    jurisprudenciasSugeridas: ["j2", "j4"],
  },
  {
    id: "8",
    numero: "0001222-22.2024.8.26.0053",
    assunto: "Medicamento de alto custo",
    dataRecebimento: "08/05/2024",
    dataPreAnalise: "08/05/2024",
    dataRevisao: "18/05/2024",
    prioridade: "Alta",
    status: "Enviado",
    analista: "Rafael Souza",
    resumo: "Resposta oficial já encaminhada.",
    iaConfidence: 0.95,
    iaSugestao: "Deferimento integral – jurisprudência consolidada.",
    jurisprudenciasSugeridas: ["j1", "j2"],
  },
  {
    id: "9",
    numero: "0001333-33.2024.8.26.0053",
    assunto: "Insumo para diabetes",
    dataRecebimento: "05/05/2024",
    dataPreAnalise: "05/05/2024",
    dataRevisao: "16/05/2024",
    prioridade: "Baixa",
    status: "Enviado",
    analista: "Mariana Costa",
    resumo: "Insumo conforme protocolo.",
    iaConfidence: 0.87,
    iaSugestao: "Deferimento padrão.",
    jurisprudenciasSugeridas: ["j3"],
  },
  {
    id: "10",
    numero: "0001444-44.2024.8.26.0053",
    assunto: "Fornecimento de medicamento",
    dataRecebimento: "03/05/2024",
    dataPreAnalise: "03/05/2024",
    dataRevisao: "14/05/2024",
    prioridade: "Média",
    status: "Revisado",
    analista: "Rafael Souza",
    resumo: "Revisado e aguardando envio.",
    iaConfidence: 0.82,
    iaSugestao: "Deferimento parcial.",
    jurisprudenciasSugeridas: ["j2"],
  },
];

export const jurisprudencias: Jurisprudencia[] = [
  {
    id: "j1",
    tribunal: "TJSP",
    numero: "Apelação Cível 100XXXX-XX.2023.8.26.0053",
    tema: "Medicamento de alto custo – imprescindibilidade",
    resumo: "É dever do Estado o fornecimento de medicamento quando comprovada a imprescindibilidade e a ausência de alternativa terapêutica fornecida pelo SUS.",
    link: "#",
    tags: ["alto custo", "imprescindibilidade", "SUS"],
    preferencial: true,
  },
  {
    id: "j2",
    tribunal: "STJ",
    numero: "REsp 1.657.156 / SP",
    tema: "Fornecimento obrigatório – requisitos",
    resumo: "O Estado não pode se eximir do dever de fornecer medicamento de alto custo quando presentes os requisitos da necessidade e da incapacidade financeira.",
    link: "#",
    tags: ["STJ", "repetitivo", "alto custo"],
    preferencial: true,
  },
  {
    id: "j3",
    tribunal: "STJ",
    numero: "AgInt no AREsp 1.234.567 / SP",
    tema: "Solidariedade entre entes federativos",
    resumo: "A responsabilidade pelo fornecimento de medicamento é solidária entre os entes federativos, cabendo ao autor eleger o polo passivo.",
    link: "#",
    tags: ["solidariedade", "entes federativos"],
  },
  {
    id: "j4",
    tribunal: "STF",
    numero: "RE 855.178 / SE",
    tema: "Tema 793 – responsabilidade solidária",
    resumo: "Tratando-se de ações que visem o fornecimento de medicamentos, a responsabilidade dos entes da Federação é solidária.",
    link: "#",
    tags: ["STF", "tema 793"],
    preferencial: true,
  },
  {
    id: "j5",
    tribunal: "TJSP",
    numero: "AI 2XXXXXX-XX.2024.8.26.0000",
    tema: "Medicamento sem registro ANVISA",
    resumo: "O fornecimento de medicamento sem registro na ANVISA é excepcional e exige prova robusta da imprescindibilidade.",
    link: "#",
    tags: ["ANVISA", "registro", "excepcional"],
  },
];

// Métricas derivadas
export const metrics = {
  preAnalisadosIA: seis.filter((s) => s.status === "Pré-analisado (IA)").length,
  emRevisaoHumana: seis.filter((s) => s.status === "Em revisão").length,
  revisados: seis.filter((s) => s.status === "Revisado").length,
  enviados: seis.filter((s) => s.status === "Enviado").length,
  total: seis.length,
};
