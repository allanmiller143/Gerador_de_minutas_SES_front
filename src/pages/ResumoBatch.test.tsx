// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
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
                  { timestamp: "2026-01-01T03:00:02+00:00", level: "info", message: "Iniciando SEI 1 (1/2)." },
                  { timestamp: "2026-01-01T03:00:05+00:00", level: "success", message: "SEI 1 concluído com sucesso." },
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
      expect(screen.getByText("Iniciando SEI 1 (1/2).")).toBeTruthy();
      expect(screen.getByText("[success]")).toBeTruthy();
      expect(screen.getByText("SEI 1 concluído com sucesso.")).toBeTruthy();
    });
  });
});
