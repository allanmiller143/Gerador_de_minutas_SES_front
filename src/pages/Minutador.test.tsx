// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Minutador from "./Minutador";
import { AuthProvider } from "@/context/AuthContext";
import { DraftsProvider } from "@/context/DraftsContext";

const renderMinutador = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/minutador/1"]}>
        <AuthProvider>
          <DraftsProvider>
            <Routes>
              <Route path="/minutador/:id" element={<Minutador />} />
            </Routes>
          </DraftsProvider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("Minutador", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      "ses_auth_user",
      JSON.stringify({ name: "Analista Teste", email: "analista@ses.test", role: "analista" }),
    );

    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.endsWith("/api/seis/1")) {
          return new Response(
            JSON.stringify({
              sei: {
                id: "1",
                numero: "0001234-56.2024.8.26.0053",
                assunto: "Fornecimento de medicamento oncológico",
                dataRecebimento: "20/05/2024",
                dataPreAnalise: "20/05/2024",
                prioridade: "Alta",
                status: "Pré-análise",
                partes: "João da Silva x Estado de SP",
                resumo: "Paciente requer fornecimento de medicamento de alto custo.",
                iaConfidence: 0.92,
                iaSugestao: "Deferimento parcial sugerido pela IA.",
                jurisprudenciasSugeridas: ["j1"],
                documentoPdf: {
                  filename: "exemplo-processo-2.pdf",
                  mime_type: "application/pdf",
                  url: "/api/seis/1/pdf",
                },
              },
              jurisprudencias: [
                {
                  id: "j1",
                  tribunal: "STJ",
                  numero: "REsp 1.657.156 / SP",
                  tema: "Fornecimento obrigatório – requisitos",
                  resumo: "Requisitos para fornecimento obrigatório pelo Estado.",
                  link: "#",
                  tags: ["alto custo"],
                },
              ],
              minuta: "MINUTA GERADA PELA API",
              resumoTecnico: {
                resumo_processo: {
                  tipo_demanda: "solicitação administrativa de medicamento",
                  medicamento_solicitado: "medicamento oncológico de alto custo não incorporado ao SUS",
                  cid_informado: "não informado no mock",
                  diagnostico_informado: "tratamento oncológico",
                  objetivo_da_solicitacao: "fornecimento de medicamento para continuidade terapêutica",
                },
                evidencias_clinicas_do_processo: [
                  "Laudo médico informa tratamento oncológico e necessidade terapêutica.",
                ],
                confronto_documentacao_suporte: {
                  cid_validado: false,
                  medicamento_contemplado_para_o_cid: "indeterminado",
                  observacoes: ["Conferir compatibilidade com PCDT/CEAF antes de concluir."],
                },
                insumo_parecer: {
                  conclusao_tecnica_sugerida: "Análise preliminar condicionada à revisão farmacêutica.",
                  fundamentos: ["Pedido envolve medicamento não incorporado ao SUS."],
                  alternativas_orientaveis: ["Verificar alternativa terapêutica padronizada no SUS."],
                  pendencias_documentais: ["Confirmar prescrição atualizada, laudo e exames."],
                  necessita_revisao_humana: true,
                  nivel_confianca: "médio",
                },
                fontes_consultadas: ["Texto extraído do PDF do processo"],
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }

        return new Response("{}", { status: 404 });
      }),
    );
  });

  it("apresenta na tela de minutador os dados do processo retornados pela API", async () => {
    renderMinutador();

    await waitFor(() => {
      expect(screen.getByText("Resumo técnico preliminar")).toBeTruthy();
    });

    const resumoTab = screen.getByRole("tab", { name: "Resumo técnico" });
    const minutaTab = screen.getByRole("tab", { name: "Minuta" });
    expect(resumoTab.getAttribute("aria-selected")).toBe("true");
    expect(minutaTab.getAttribute("aria-selected")).toBe("false");

    expect(screen.getByText("0001234-56.2024.8.26.0053")).toBeTruthy();
    expect(screen.getByText("Fornecimento de medicamento oncológico")).toBeTruthy();
    expect(screen.getByText("João da Silva x Estado de SP")).toBeTruthy();
    expect(screen.getByText("Resumo técnico preliminar"));
    expect(screen.getByText("Solicitação administrativa de medicamento"));
    expect(screen.getByText("Medicamento solicitado"));
    expect(screen.getByText("medicamento oncológico de alto custo não incorporado ao SUS"));
    expect(screen.getByText("Evidências clínicas do processo"));
    expect(screen.getByText("Laudo médico informa tratamento oncológico e necessidade terapêutica."));
    expect(screen.getByText("Confronto com documentação de suporte"));
    expect(screen.getByText("CID validado: Não"));
    expect(screen.getByText("Insumo para parecer"));
    expect(screen.getByText("Necessita revisão humana: Sim"));
    expect(screen.getByText("Nível de confiança: médio"));
    expect(screen.getByText("Fontes consultadas"));
    expect(screen.getByText("Texto extraído do PDF do processo"));

    fireEvent.mouseDown(minutaTab, { button: 0, ctrlKey: false });

    await waitFor(() => {
      expect(minutaTab.getAttribute("aria-selected")).toBe("true");
      expect(resumoTab.getAttribute("aria-selected")).toBe("false");
      expect(screen.getByDisplayValue("MINUTA GERADA PELA API")).toBeTruthy();
    });
  });
});
