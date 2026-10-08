import { describe, expect, it } from "vitest";
import {
  getProcessosPollingInterval,
  isFailedStatus,
  isPendingStatus,
  isProcessingStatus,
  isProcessoReadyForView,
  normalizeProcessingStatus,
} from "./processStatus";

describe("process status helpers", () => {
  it("recognizes Brazilian and English processing aliases", () => {
    expect(normalizeProcessingStatus("Processando")).toBe("processing");
    expect(normalizeProcessingStatus("Em análise")).toBe("processing");
    expect(normalizeProcessingStatus("em_analise")).toBe("processing");
    expect(isProcessingStatus("Em análise")).toBe(true);
    expect(isProcessingStatus("Processando")).toBe(true);
  });

  it("recognizes pending states from SEI import", () => {
    expect(normalizeProcessingStatus("Pendente")).toBe("pending");
    expect(normalizeProcessingStatus("pending")).toBe("pending");
    expect(normalizeProcessingStatus("Aguardando")).toBe("pending");
    expect(isPendingStatus("Pendente")).toBe(true);
    expect(isProcessingStatus("Pendente")).toBe(false);
  });

  it("recognizes failed states from the backend", () => {
    expect(normalizeProcessingStatus("Falhou")).toBe("failed");
    expect(normalizeProcessingStatus("failed")).toBe("failed");
    expect(isFailedStatus("Falhou")).toBe(true);
  });

  it("treats terminal states as not processing or pending", () => {
    expect(isProcessingStatus("Concluído")).toBe(false);
    expect(isPendingStatus("Concluído")).toBe(false);
    expect(isFailedStatus("Concluído")).toBe(false);
  });

  it("correctly identifies when a process is ready for viewing and editing", () => {
    expect(isProcessoReadyForView({ status_processamento: "Pendente" })).toBe(false);
    expect(isProcessoReadyForView({ status_processamento: "Processando" })).toBe(false);
    expect(isProcessoReadyForView({ status_processamento: "Falhou" })).toBe(false);
    expect(isProcessoReadyForView({ status: "Falha na análise" })).toBe(false);
    expect(isProcessoReadyForView({ status_processamento: "Concluído", status: "Pré-análise" })).toBe(true);
    expect(isProcessoReadyForView({ status_processamento: "Concluído", status: "Em revisão" })).toBe(true);
  });

  it("polls while any process remains in processing or pending state", () => {
    expect(getProcessosPollingInterval([{ status_processamento: "Processando" }] as any)).toBe(5000);
    expect(getProcessosPollingInterval([{ status_processamento: "Pendente" }] as any)).toBe(5000);
    expect(getProcessosPollingInterval([{ status_processamento: "Concluído" }] as any)).toBe(false);
  });
});
