import { api } from "@/lib/api";
import { Remetente, RemetenteInput } from "@/types/remetente";

export const getRemetentes = async (): Promise<Remetente[]> => {
  return await api<Remetente[]>("/remetentes/");
};

export const getRemetenteById = async (id: number): Promise<Remetente> => {
  return await api<Remetente>(`/remetentes/${id}`);
};

export const createRemetente = async (data: RemetenteInput): Promise<Remetente> => {
  return await api<Remetente>("/remetentes/", {
    method: "POST",
    body: data,
  });
};

export const updateRemetente = async (id: number, data: Partial<RemetenteInput>): Promise<Remetente> => {
  return await api<Remetente>(`/remetentes/${id}`, {
    method: "PUT",
    body: data,
  });
};

export const deleteRemetente = async (id: number): Promise<{ msg: string }> => {
  return await api<{ msg: string }>(`/remetentes/${id}`, {
    method: "DELETE",
  });
};
