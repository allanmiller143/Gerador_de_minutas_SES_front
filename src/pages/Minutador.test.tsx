// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Minutador from "./Minutador";
import { AuthProvider } from "@/context/AuthContext";
import { DraftsProvider } from "@/context/DraftsContext";

let resolveResumoRequest: ((response: Response) => void) | undefined;

const detailPayload = {
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
  minuta: "MINUTA INICIAL DO PROCESSO",
};

const resumoVersionPayload = {
  resumos: [
    {
      id: 10,
      sei_id: "1",
      version: 1,
      generated_at: "2026-05-22T22:52:36+00:00",
      generated_by: "sistema",
      source: "manual",
      is_active: true,
      batch_run_id: null,
      minuta: "MINUTA GERADA COM RESUMO REAL",
      resumoTecnico: {},
    },
  ],
};

const resumoPayload = {
  sei: detailPayload.sei,
  id: 10,
  version: 1,
  generated_at: "2026-05-22T22:52:36+00:00",
  generated_by: "sistema",
  is_active: true,
  minuta: "MINUTA GERADA COM RESUMO REAL",
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
};

const jsonResponse = (payload: unknown) =>
  new Response(JSON.stringify(payload), { status: 200, headers: { "Content-Type": "application/json" } });

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
    resolveResumoRequest = undefined;

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = input instanceof Request ? input.url : String(input);
        if (url.endsWith("/api/seis/1/resumo-tecnico")) {
          return new Promise<Response>((resolve) => {
            resolveResumoRequest = resolve;
          });
        }

        if (url.endsWith("/api/seis/1/resumos")) {
          return jsonResponse(resumoVersionPayload);
        }

        if (url.endsWith("/api/seis/1")) {
          return jsonResponse(detailPayload);
        }

        return new Response("{}", { status: 404 });
      }),
    );
  });

  it("mostra os dados gerais enquanto gera o resumo técnico sob demanda", async () => {
    renderMinutador();

    await waitFor(() => {
      expect(screen.getByText("Resumo técnico preliminar")).toBeTruthy();
      expect(screen.getByText("Jurisprudências encontradas")).toBeTruthy();
      expect(screen.getByText("STJ")).toBeTruthy();
      expect(screen.getByText("REsp 1.657.156 / SP")).toBeTruthy();
      expect(screen.getByText("Gerando resumo técnico preliminar... aguarde. Os dados do processo já estão disponíveis para consulta.")).toBeTruthy();
    });

    expect(fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:5000/api/seis/1",
      expect.objectContaining({ headers: expect.objectContaining({ Accept: "application/json" }) }),
    );
    expect(fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:5000/api/seis/1/resumo-tecnico",
      expect.objectContaining({ headers: expect.objectContaining({ Accept: "application/json" }) }),
    );

    await act(async () => {
      resolveResumoRequest?.(jsonResponse(resumoPayload));
    });

    const resumoTab = screen.getByRole("tab", { name: "Resumo técnico" });
    const minutaTab = screen.getByRole("tab", { name: "Minuta" });
    expect(resumoTab.getAttribute("aria-selected")).toBe("true");
    expect(minutaTab.getAttribute("aria-selected")).toBe("false");

    await waitFor(() => {
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
    });

    fireEvent.mouseDown(minutaTab, { button: 0, ctrlKey: false });

    await waitFor(() => {
      expect(minutaTab.getAttribute("aria-selected")).toBe("true");
      expect(resumoTab.getAttribute("aria-selected")).toBe("false");
      expect(screen.getByDisplayValue("MINUTA GERADA COM RESUMO REAL")).toBeTruthy();
    });
  });

  it("posiciona gerar novamente e histórico de versões abaixo das informações do resumo", async () => {
    renderMinutador();

    await act(async () => {
      resolveResumoRequest?.(jsonResponse(resumoPayload));
    });

    await waitFor(() => {
      expect(screen.getByText("Documento PDF")).toBeTruthy();
      expect(screen.getByRole("button", { name: /Gerar novamente/i })).toBeTruthy();
      expect(screen.getByText("Versões anteriores")).toBeTruthy();
    });

    const documentoPdf = screen.getByText("Documento PDF");
    const gerarNovamente = screen.getByRole("button", { name: /Gerar novamente/i });
    const versoesAnteriores = screen.getByText("Versões anteriores");

    expect(documentoPdf.compareDocumentPosition(gerarNovamente) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(documentoPdf.compareDocumentPosition(versoesAnteriores) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
