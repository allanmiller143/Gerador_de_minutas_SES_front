// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Minutador from "./Minutador";
import Dashboard from "./Dashboard";
import SeisList from "./SeisList";
import { AuthProvider } from "@/context/AuthContext";
import { DraftsProvider } from "@/context/DraftsContext";

const pendingSei = {
  id: "99",
  numero: "0009999-99.2024.8.26.0053",
  assunto: "Medicamento Pendente",
  dataRecebimento: "20/05/2024",
  dataPreAnalise: "20/05/2024",
  prioridade: "Média",
  status: "Pré-análise",
  status_processamento: "Pendente",
  iaConfidence: 0.0,
  iaSugestao: "",
  jurisprudenciasSugeridas: [],
};

const completedSei = {
  id: "100",
  numero: "0001000-00.2024.8.26.0053",
  assunto: "Medicamento Concluído",
  dataRecebimento: "20/05/2024",
  dataPreAnalise: "20/05/2024",
  prioridade: "Alta",
  status: "Pré-análise",
  status_processamento: "Concluído",
  iaConfidence: 0.95,
  iaSugestao: "Minuta concluída pela IA",
  jurisprudenciasSugeridas: [],
};

describe("Processo Lifecycle - Bloqueio de processos pendentes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  const renderWithProviders = (ui: React.ReactNode, initialEntries = ["/"]) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <DraftsProvider>
            <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
          </DraftsProvider>
        </AuthProvider>
      </QueryClientProvider>
    );
  };

  it("não permite que o usuário visualize a minuta de um processo com status_processamento Pendente no Minutador", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/seis/99/resumos")) {
        return Promise.resolve(new Response(JSON.stringify({ resumos: [] }), { status: 200 }));
      }
      if (url.includes("/api/seis/99/resumo-tecnico")) {
        return Promise.resolve(new Response(JSON.stringify({ sei: pendingSei, minuta: "", resumoTecnico: {} }), { status: 200 }));
      }
      if (url.includes("/api/seis/99")) {
        return Promise.resolve(new Response(JSON.stringify({ sei: pendingSei, jurisprudencias: [], minuta: "" }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
    });

    renderWithProviders(
      <Routes>
        <Route path="/minutador/:id" element={<Minutador />} />
      </Routes>,
      ["/minutador/99"]
    );

    await waitFor(() => {
      expect(screen.getByText("Processo ainda não processado")).toBeInTheDocument();
    });

    expect(screen.getByText("Pendente de Processamento")).toBeInTheDocument();
    expect(screen.queryByText("Salvar rascunho")).not.toBeInTheDocument();
    expect(screen.queryByText("Finalizar análise")).not.toBeInTheDocument();
  });

  it("no Dashboard, não exibe o botão Revisar para processos pendentes, exibindo o botão desabilitado Pendente", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/processos")) {
        return Promise.resolve(new Response(JSON.stringify([pendingSei, completedSei]), { status: 200 }));
      }
      if (url.includes("/remetentes")) {
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
    });

    renderWithProviders(<Dashboard />, ["/"]);

    await waitFor(() => {
      expect(screen.getByText(pendingSei.numero)).toBeInTheDocument();
      expect(screen.getByText(completedSei.numero)).toBeInTheDocument();
    });

    // Para o processo pendente, deve ter o botão "Pendente" desabilitado
    const pendenteButtons = screen.getAllByRole("button", { name: /pendente/i });
    expect(pendenteButtons.length).toBeGreaterThanOrEqual(1);
    expect(pendenteButtons[0]).toBeDisabled();

    // Deve ter apenas 1 link "Revisar" (para o completedSei), e não para o pendingSei
    const revisarLinks = screen.getAllByRole("link", { name: "Revisar" });
    expect(revisarLinks).toHaveLength(1);
    expect(revisarLinks[0]).toHaveAttribute("href", `/minutador/${completedSei.id}`);
  });

  it("na SeisList, desabilita Detalhes e mostra botão Pendente para processos pendentes", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/processos")) {
        return Promise.resolve(new Response(JSON.stringify([pendingSei, completedSei]), { status: 200 }));
      }
      if (url.includes("/remetentes")) {
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
    });

    renderWithProviders(<SeisList />, ["/seis"]);

    await waitFor(() => {
      expect(screen.getByText(pendingSei.numero)).toBeInTheDocument();
    });

    const pendenteButton = screen.getByRole("button", { name: /pendente/i });
    expect(pendenteButton).toBeDisabled();

    // O processo concluído tem o botão Analisar / Continuar
    expect(screen.getByRole("link", { name: /analisar/i })).toHaveAttribute("href", `/minutador/${completedSei.id}`);
  });
});
