import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import type { Priority } from "@/data/mock";

export interface Draft {
  seiId: number;
  minuta: string;
  ownerEmail: string;
  ownerName: string;
  status: "Em revisão" | "Concluído";
  updatedAt: string;
  foiAlterado?: boolean; //Verifica se o draft criado pela IA foi alterado ou não.
}

export interface PriorityOverride {
  seiId: number;
  priority: Priority;
  changedBy: string;
  changedByEmail: string;
  updatedAt: string;
}

export interface SeiEvent {
  seiId: number;
  type: "draft_saved" | "finalized" | "priority_changed" | "review_started";
  actor: string;
  at: string; // ISO
  detail?: string;
}

interface DraftsContextValue {
  drafts: Record<number, Draft>;
  priorities: Record<number, PriorityOverride>;
  events: SeiEvent[];
  getDraft: (seiId: number) => Draft | undefined;
  getPriority: (seiId: number) => PriorityOverride | undefined;
  getEvents: (seiId: number) => SeiEvent[];
  saveDraft: (d: Omit<Draft, "updatedAt" | "status"> & { status?: Draft["status"] }) => void;
  finalizeDraft: (seiId: number, actor: string) => void;
  changePriority: (seiId: number, priority: Priority, actor: string, actorEmail: string, previous: Priority) => void;
}

const DraftsContext = createContext<DraftsContextValue | undefined>(undefined);

const STORAGE_KEY = "ses_sei_drafts";
const PRIORITIES_KEY = "ses_sei_priorities";
const EVENTS_KEY = "ses_sei_events";

export const DraftsProvider = ({ children }: { children: ReactNode }) => {
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [priorities, setPriorities] = useState<Record<number, PriorityOverride>>({});
  const [events, setEvents] = useState<SeiEvent[]>([]);

  useEffect(() => {
    try { const r = localStorage.getItem(STORAGE_KEY); if (r) setDrafts(JSON.parse(r)); } catch {}
    try { const r = localStorage.getItem(PRIORITIES_KEY); if (r) setPriorities(JSON.parse(r)); } catch {}
    try { const r = localStorage.getItem(EVENTS_KEY); if (r) setEvents(JSON.parse(r)); } catch {}
  }, []);

  const persistDrafts = (next: Record<number, Draft>) => {
    setDrafts(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };
  const persistPriorities = (next: Record<number, PriorityOverride>) => {
    setPriorities(next);
    localStorage.setItem(PRIORITIES_KEY, JSON.stringify(next));
  };
  const persistEvents = (next: SeiEvent[]) => {
    setEvents(next);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(next));
  };

  const getDraft = useCallback((seiId: number | string) => drafts[Number(seiId)] ?? drafts[String(seiId)] ?? Object.values(drafts).find(d => String(d.seiId) === String(seiId)), [drafts]);
  const getPriority = useCallback((seiId: number | string) => priorities[Number(seiId)] ?? priorities[String(seiId)], [priorities]);
  const getEvents = useCallback((seiId: number | string) => events.filter((e) => String(e.seiId) === String(seiId)), [events]);

  const addEvent = (ev: SeiEvent, currentEvents: SeiEvent[]) => {
    const next = [...currentEvents, ev];
    persistEvents(next);
    return next;
  };

  const saveDraft: DraftsContextValue["saveDraft"] = (d) => {
    const now = new Date().toISOString();
    let hadExisting = false;
    setDrafts((prev) => {
      hadExisting = !!prev[d.seiId];
      const next = {
        ...prev,
        [d.seiId]: {
          seiId: d.seiId,
          minuta: d.minuta,
          ownerEmail: d.ownerEmail,
          ownerName: d.ownerName,
          status: d.status ?? ("Em revisão" as const),
          updatedAt: now,
          foiAlterado: d.foiAlterado,
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setEvents((prev) => {
      const ev: SeiEvent = hadExisting
        ? { seiId: d.seiId, type: "draft_saved", actor: d.ownerName, at: now, detail: "Rascunho salvo" }
        : { seiId: d.seiId, type: "review_started", actor: d.ownerName, at: now, detail: "Revisão humana iniciada" };
      const next = [...prev, ev];
      localStorage.setItem(EVENTS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const finalizeDraft = (seiId: number, actor: string) => {
    const now = new Date().toISOString();
    setDrafts((prev) => {
      const existing = prev[seiId];
      if (!existing) return prev;
      const next = { ...prev, [seiId]: { ...existing, status: "Concluído" as const, updatedAt: now } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setEvents((prev) => {
      const next = [...prev, { seiId, type: "finalized" as const, actor, at: now, detail: "Análise finalizada" }];
      localStorage.setItem(EVENTS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const changePriority: DraftsContextValue["changePriority"] = (seiId, priority, actor, actorEmail, previous) => {
    const now = new Date().toISOString();
    persistPriorities({
      ...priorities,
      [seiId]: { seiId, priority, changedBy: actor, changedByEmail: actorEmail, updatedAt: now },
    });
    addEvent({ seiId, type: "priority_changed", actor, at: now, detail: `Prioridade alterada de ${previous} para ${priority}` }, events);
  };

  return (
    <DraftsContext.Provider value={{ drafts, priorities, events, getDraft, getPriority, getEvents, saveDraft, finalizeDraft, changePriority }}>
      {children}
    </DraftsContext.Provider>
  );
};

export const useDrafts = () => {
  const ctx = useContext(DraftsContext);
  if (!ctx) throw new Error("useDrafts must be used within DraftsProvider");
  return ctx;
};
