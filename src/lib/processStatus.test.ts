import { describe, expect, it } from "vitest";
import { isFailedStatus, isProcessingStatus, normalizeProcessingStatus } from "./processStatus";

describe("process status helpers", () => {
  it("recognizes Brazilian and English processing aliases", () => {
    expect(normalizeProcessingStatus("Processando")).toBe("processing");
    expect(normalizeProcessingStatus("Em análise")).toBe("processing");
    expect(normalizeProcessingStatus("em_analise")).toBe("processing");
    expect(isProcessingStatus("Em análise")).toBe(true);
  });

  it("recognizes failed states from the backend", () => {
    expect(normalizeProcessingStatus("Falhou")).toBe("failed");
    expect(normalizeProcessingStatus("failed")).toBe("failed");
    expect(isFailedStatus("Falhou")).toBe(true);
  });

  it("treats terminal states as not processing", () => {
    expect(isProcessingStatus("Concluído")).toBe(false);
    expect(isFailedStatus("Concluído")).toBe(false);
  });
});
