// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ResumoBatch from "./ResumoBatch";
import { AuthProvider } from "@/context/AuthContext";

const jsonResponse = (payload: unknown) =>
  new Response(JSON.stringify(payload), { status: 200, headers: { "Content-Type": "application/json" } });

const renderResumoBatch = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/resumo-batch"]}>
        <AuthProvider>
          <ResumoBatch />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("ResumoBatch", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      "ses_auth_user",
      JSON.stringify({ name: "Analista Teste", email: "analista@ses.test", role: "analista" }),
    );

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = input instanceof Request ? input.url : String(input);

        if (url.endsWith("/api/resumo-batch/config")) {
          return jsonResponse({
            id: 1,
            enabled: true,
            time: "03:00",
            updated_at: "2026-01-01T03:00:00+00:00",
            updated_by: "admin@ses.test",
            last_run_date: null,
          });
        }

        if (url.endsWith("/api/resumo-batch/runs/7/cancel")) {
          return jsonResponse({
            id: 7,
            status: "cancel_requested",
            logs: [
              { timestamp: "2026-01-01T03:00:06+00:00", level: "warning", message: "Cancelamento solicitado por analista@ses.test. A execução será suspensa ao concluir o processo atual." },
            ],
          });
        }

        if (url.endsWith("/api/resumo-batch/runs")) {
          return jsonResponse({
            runs: [
              {
                id: 7,
                status: "running",
                trigger_type: "manual",
                triggered_by: "admin@ses.test",
                started_at: "2026-01-01T03:00:00+00:00",
                finished_at: null,
                duration_seconds: 0,
                total_seis: 2,
                generated_count: 1,
                failed_count: 0,
                sei_ids: ["1"],
                error_message: null,
                logs: [
                  { timestamp: "2026-01-01T03:00:01+00:00", level: "info", message: "Execução manual iniciada por admin@ses.test." },
                  { timestamp: "2026-01-01T03:00:02+00:00", level: "info", message: "Iniciando processo SEI 1/2: 0001234-56.2024.8.26.0053 — Fornecimento de medicamento oncológico." },
                  { timestamp: "2026-01-01T03:00:05+00:00", level: "success", message: "Resumo gerado para o processo SEI 0001234-56.2024.8.26.0053." },
                ],
              },
              {
                id: 6,
                status: "interrupted",
                trigger_type: "manual",
                triggered_by: "sistema",
                started_at: "2026-01-01T02:00:00+00:00",
                finished_at: "2026-01-01T02:10:00+00:00",
                duration_seconds: 600,
                total_seis: 0,
                generated_count: 0,
                failed_count: 0,
                sei_ids: [],
                error_message: "Execução interrompida sem registro de conclusão.",
                logs: [
                  { timestamp: "2026-01-01T02:10:00+00:00", level: "warning", message: "Execução marcada como interrompida porque estava em andamento, mas não tinha logs de progresso." },
                ],
              },
            ],
          });
        }

        return new Response("{}", { status: 404 });
      }),
    );
  });

  it("mostra as saídas da execução em formato de console no histórico", async () => {
    renderResumoBatch();

    await waitFor(() => {
      expect(screen.getByText("Execução #7 · Em execução")).toBeTruthy();
      expect(screen.getByText("Console da execução em tempo real")).toBeTruthy();
      expect(screen.getAllByText("[info]").length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText("Execução manual iniciada por admin@ses.test.")).toBeTruthy();
      expect(screen.getByText("Iniciando processo SEI 1/2: 0001234-56.2024.8.26.0053 — Fornecimento de medicamento oncológico.")).toBeTruthy();
      expect(screen.getByText("[success]")).toBeTruthy();
      expect(screen.getByText("Resumo gerado para o processo SEI 0001234-56.2024.8.26.0053.")).toBeTruthy();
      expect(screen.getByRole("button", { name: "Suspender execução #7" })).toBeTruthy();
      expect(screen.getByRole("button", { name: "Iniciar nova execução" })).toBeDisabled();
      expect(screen.getByText("Já existe uma execução em andamento. Aguarde a conclusão ou suspenda a execução atual antes de iniciar outra."));
    });
  });

  it("mostra execução interrompida como histórico e permite solicitar suspensão", async () => {
    renderResumoBatch();

    await waitFor(() => {
      expect(screen.getByText("Execução #6 · Interrompida/incompleta")).toBeTruthy();
      expect(screen.getByText("Histórico do console")).toBeTruthy();
      expect(screen.getByText("Execução interrompida sem registro de conclusão.")).toBeTruthy();
      expect(screen.getByText("Execução marcada como interrompida porque estava em andamento, mas não tinha logs de progresso.")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Suspender execução #7" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://127.0.0.1:5000/api/resumo-batch/runs/7/cancel",
        expect.objectContaining({ method: "POST", body: JSON.stringify({ triggered_by: "analista@ses.test" }) }),
      );
    });
  });
});
