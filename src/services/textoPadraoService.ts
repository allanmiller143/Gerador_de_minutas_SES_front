import { api } from "@/lib/api";
import { TextoPadrao, TextoPadraoInput, TextoCategoria } from "@/types/textoPadrao";

const STORAGE_KEY_TEXTOS = "ses_textos_padroes_mock";
const STORAGE_KEY_CATEGORIAS = "ses_textos_categorias_mock";

const INITIAL_CATEGORIAS: TextoCategoria[] = [
  { id: 1, nome: "Saudações" },
  { id: 2, nome: "Análises Técnicas" },
  { id: 3, nome: "Fechamentos" },
  { id: 4, nome: "Encaminhamentos" },
];

const INITIAL_TEXTOS: TextoPadrao[] = [
  {
    id: 1,
    titulo: "Saudação Formal",
    conteudo: "Prezado(a) Senhor(a), Cumprimentando-o(a) cordialmente, dirijo-me a Vossa Senhoria para tratar de...",
    categoriaId: 1,
  },
  {
    id: 2,
    titulo: "Referência a Processo SEI",
    conteudo: "Em atenção ao Processo SEI nº [NÚMERO], que trata de [ASSUNTO], informamos que...",
    categoriaId: 1,
  },
  {
    id: 3,
    titulo: "Análise de Conformidade",
    conteudo: "Após análise técnica dos documentos acostados aos autos, verificou-se que a solicitação encontra-se em conformidade com as normas vigentes da SES.",
    categoriaId: 2,
  },
  {
    id: 4,
    titulo: "Solicitação de Complementação",
    conteudo: "No entanto, observou-se a ausência de documentos essenciais para a conclusão da análise, sendo necessária a complementação de: [LISTAR DOCUMENTOS].",
    categoriaId: 2,
  },
  {
    id: 5,
    titulo: "Fechamento Padrão",
    conteudo: "Permanecemos à disposição para quaisquer esclarecimentos adicionais que se façam necessários.",
    categoriaId: 3,
  },
  {
    id: 6,
    titulo: "Encaminhamento para Assinatura",
    conteudo: "Encaminho a presente minuta para análise e posterior assinatura da autoridade competente.",
    categoriaId: 4,
  },
];

const readStorage = <T>(key: string): T[] => {
  const stored = localStorage.getItem(key);
  if (!stored) return [];
  return JSON.parse(stored);
};

const writeStorage = (key: string, data: any[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// --- Categorias ---
export const getCategorias = async (): Promise<TextoCategoria[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const stored = readStorage<TextoCategoria>(STORAGE_KEY_CATEGORIAS);
  if (stored.length === 0) {
    writeStorage(STORAGE_KEY_CATEGORIAS, INITIAL_CATEGORIAS);
    return INITIAL_CATEGORIAS;
  }
  return stored;
};

export const createCategoria = async (nome: string): Promise<TextoCategoria> => {
  const current = readStorage<TextoCategoria>(STORAGE_KEY_CATEGORIAS);
  const newItem = { id: Date.now(), nome };
  writeStorage(STORAGE_KEY_CATEGORIAS, [...current, newItem]);
  return newItem;
};

export const deleteCategoria = async (id: number): Promise<{ msg: string }> => {
  const current = readStorage<TextoCategoria>(STORAGE_KEY_CATEGORIAS);
  const filtered = current.filter(c => c.id !== id);
  writeStorage(STORAGE_KEY_CATEGORIAS, filtered);
  return { msg: "Categoria excluída com sucesso" };
};

// --- Textos ---
export const getTextosPadroes = async (): Promise<TextoPadrao[]> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const stored = readStorage<TextoPadrao>(STORAGE_KEY_TEXTOS);
  if (stored.length === 0) {
    writeStorage(STORAGE_KEY_TEXTOS, INITIAL_TEXTOS);
    return INITIAL_TEXTOS;
  }
  return stored;
};

export const createTextoPadrao = async (data: TextoPadraoInput): Promise<TextoPadrao> => {
  const current = readStorage<TextoPadrao>(STORAGE_KEY_TEXTOS);
  const newItem = { id: Date.now(), ...data };
  writeStorage(STORAGE_KEY_TEXTOS, [...current, newItem]);
  return newItem;
};

export const updateTextoPadrao = async (id: number, data: Partial<TextoPadraoInput>): Promise<TextoPadrao> => {
  const current = readStorage<TextoPadrao>(STORAGE_KEY_TEXTOS);
  const updated = current.map(item => item.id === id ? { ...item, ...data } : item);
  writeStorage(STORAGE_KEY_TEXTOS, updated);
  return updated.find(item => item.id === id)!;
};

export const deleteTextoPadrao = async (id: number): Promise<{ TextoPadrao }> => {
  const current = readStorage<TextoPadrao>(STORAGE_KEY_TEXTOS);
  const filtered = current.filter(item => item.id !== id);
  writeStorage(STORAGE_KEY_TEXTOS, filtered);
  return { TextoPadrao: { id: 0, titulo: "", conteudo: "", categoriaId: 0 } }; // Return dummy for compatibility
};
