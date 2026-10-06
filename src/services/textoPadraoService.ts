import { api } from "@/lib/api";
import { TextoPadrao, TextoPadraoInput, TextoCategoria } from "@/types/textoPadrao";

export const getCategorias = async (): Promise<TextoCategoria[]> => {
  return api<TextoCategoria[]>("/categorias-textos-padroes/");
};

export const createCategoria = async (nome: string): Promise<TextoCategoria> => {
  return api<TextoCategoria>("/categorias-textos-padroes/", {
    method: "POST",
    body: { nome },
  });
};

export const deleteCategoria = async (id: number): Promise<{ msg: string }> => {
  return api<{ msg: string }>(`/categorias-textos-padroes/${id}`, {
    method: "DELETE",
  });
};

export const getTextosPadroes = async (): Promise<TextoPadrao[]> => {
  const textos = await api<Array<Omit<TextoPadrao, "categoriaId"> & { categoriaId: number | null }>>(
    "/textos-padroes/",
  );

  return textos.map((texto) => ({
    ...texto,
    categoriaId: texto.categoriaId ?? 0,
  }));
};

export const createTextoPadrao = async (data: TextoPadraoInput): Promise<TextoPadrao> => {
  return api<TextoPadrao>("/textos-padroes/", {
    method: "POST",
    body: data,
  });
};

export const updateTextoPadrao = async (id: number, data: Partial<TextoPadraoInput>): Promise<TextoPadrao> => {
  return api<TextoPadrao>(`/textos-padroes/${id}`, {
    method: "PUT",
    body: data,
  });
};

export const deleteTextoPadrao = async (id: number): Promise<{ msg: string }> => {
  return api<{ msg: string }>(`/textos-padroes/${id}`, {
    method: "DELETE",
  });
};
