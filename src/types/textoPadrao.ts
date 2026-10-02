export interface TextoPadrao {
  id: number;
  titulo: string;
  conteudo: string;
  categoriaId: number;
}

export interface TextoPadraoInput {
  titulo: string;
  conteudo: string;
  categoriaId: number;
}

export interface TextoCategoria {
  id: number;
  nome: string;
}
