import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

export interface Draft {
  seiId: string;
  minuta: string;
  ownerEmail: string;   // quem está revisando / revisou
  ownerName: string;
  status: "Em revisão" | "Concluído";
  updatedAt: string;    // ISO
}

interface DraftsContextValue {
  drafts: Record<string, Draft>;
  getDraft: (seiId: string) => Draft | undefined;
  saveDraft: (d: Omit<Draft, "updatedAt" | "status"> & { status?: Draft["status"] }) => void;
  finalizeDraft: (seiId: string) => void;
}

const DraftsContext = createContext<DraftsContextValue | undefined>(undefined);

const STORAGE_KEY = "ses_sei_drafts";

export const DraftsProvider = ({ children }: { children: ReactNode }) => {
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { setDrafts(JSON.parse(raw)); } catch { /* noop */ }
    }
  }, []);

  const persist = (next: Record<string, Draft>) => {
    setDrafts(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const getDraft = useCallback((seiId: string) => drafts[seiId], [drafts]);

  const saveDraft: DraftsContextValue["saveDraft"] = (d) => {
    const next = {
      ...drafts,
      [d.seiId]: {
        seiId: d.seiId,
        minuta: d.minuta,
        ownerEmail: d.ownerEmail,
        ownerName: d.ownerName,
        status: d.status ?? "Em revisão",
        updatedAt: new Date().toISOString(),
      },
    };
    persist(next);
  };

  const finalizeDraft = (seiId: string) => {
    const existing = drafts[seiId];
    if (!existing) return;
    persist({
      ...drafts,
      [seiId]: { ...existing, status: "Concluído", updatedAt: new Date().toISOString() },
    });
  };

  return (
    <DraftsContext.Provider value={{ drafts, getDraft, saveDraft, finalizeDraft }}>
      {children}
    </DraftsContext.Provider>
  );
};

export const useDrafts = () => {
  const ctx = useContext(DraftsContext);
  if (!ctx) throw new Error("useDrafts must be used within DraftsProvider");
  return ctx;
};
