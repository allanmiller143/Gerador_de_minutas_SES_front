export type Priority = "Alta" | "Média" | "Baixa";
export type SeiStatus = "Pendente" | "Em elaboração" | "Em revisão" | "Aprovada" | "Enviado";

export interface Sei {
  id: string;
  numero: string;
  assunto: string;
  dataRecebimento: string;
  dataAnalise?: string;
  prioridade: Priority;
  status: SeiStatus;
  analista?: string;
  partes?: string;
  resumo?: string;
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
  { id: "1", numero: "0001234-56.2024.8.26.0053", assunto: "Fornecimento de medicamento oncológico", dataRecebimento: "20/05/2024", prioridade: "Alta", status: "Pendente", partes: "João da Silva x Estado de SP", resumo: "Paciente requer fornecimento de medicamento de alto custo não incorporado ao SUS para tratamento oncológico, com apresentação de laudo médico e relatório de insucesso terapêutico." },
  { id: "2", numero: "0002345-67.2024.8.26.0053", assunto: "Fornecimento de medicamento", dataRecebimento: "19/05/2024", prioridade: "Média", status: "Pendente", partes: "Maria Souza x Estado de SP" },
  { id: "3", numero: "0003456-78.2024.8.26.0053", assunto: "Fornecimento de insumo", dataRecebimento: "18/05/2024", prioridade: "Média", status: "Pendente", partes: "Carlos Pereira x Estado de SP" },
  { id: "4", numero: "0004567-89.2024.8.26.0053", assunto: "Fornecimento de medicamento", dataRecebimento: "17/05/2024", prioridade: "Baixa", status: "Pendente", partes: "Ana Lima x Estado de SP" },
  { id: "5", numero: "0005678-90.2024.8.26.0053", assunto: "Medicamento órfão", dataRecebimento: "16/05/2024", prioridade: "Alta", status: "Em elaboração", analista: "Mariana Costa", partes: "Pedro Alves x Estado de SP" },
  { id: "6", numero: "0006789-01.2024.8.26.0053", assunto: "Fornecimento de fórmula nutricional", dataRecebimento: "15/05/2024", prioridade: "Média", status: "Em elaboração", analista: "Rafael Souza" },
  { id: "7", numero: "0001111-11.2024.8.26.0053", assunto: "Fornecimento de medicamento", dataRecebimento: "10/05/2024", dataAnalise: "20/05/2024", prioridade: "Média", status: "Aprovada", analista: "Mariana Costa" },
  { id: "8", numero: "0001222-22.2024.8.26.0053", assunto: "Medicamento de alto custo", dataRecebimento: "08/05/2024", dataAnalise: "18/05/2024", prioridade: "Alta", status: "Enviado", analista: "Rafael Souza" },
  { id: "9", numero: "0001333-33.2024.8.26.0053", assunto: "Insumo para diabetes", dataRecebimento: "05/05/2024", dataAnalise: "16/05/2024", prioridade: "Baixa", status: "Enviado", analista: "Mariana Costa" },
  { id: "10", numero: "0001444-44.2024.8.26.0053", assunto: "Fornecimento de medicamento", dataRecebimento: "03/05/2024", dataAnalise: "14/05/2024", prioridade: "Média", status: "Em revisão", analista: "Rafael Souza" },
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

export const metrics = {
  analisados30d: 128,
  pendentes: 47,
  emElaboracao: 12,
  total30d: 187,
};
