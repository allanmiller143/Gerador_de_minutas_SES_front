import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import type { Priority } from "@/data/mock";

export interface Draft {
  seiId: string;
  minuta: string;
  ownerEmail: string;
  ownerName: string;
  status: "Em revisão" | "Concluído";
  updatedAt: string;
}

export interface PriorityOverride {
  seiId: string;
  priority: Priority;
  changedBy: string;
  changedByEmail: string;
  updatedAt: string;
}

export interface SeiEvent {
  seiId: string;
  type: "draft_saved" | "finalized" | "priority_changed" | "review_started";
  actor: string;
  at: string; // ISO
  detail?: string;
}

interface DraftsContextValue {
  drafts: Record<string, Draft>;
  priorities: Record<string, PriorityOverride>;
  events: SeiEvent[];
  getDraft: (seiId: string) => Draft | undefined;
  getPriority: (seiId: string) => PriorityOverride | undefined;
  getEvents: (seiId: string) => SeiEvent[];
  saveDraft: (d: Omit<Draft, "updatedAt" | "status"> & { status?: Draft["status"] }) => void;
  finalizeDraft: (seiId: string, actor: string) => void;
  changePriority: (seiId: string, priority: Priority, actor: string, actorEmail: string, previous: Priority) => void;
}

const DraftsContext = createContext<DraftsContextValue | undefined>(undefined);

const STORAGE_KEY = "ses_sei_drafts";
const PRIORITIES_KEY = "ses_sei_priorities";
const EVENTS_KEY = "ses_sei_events";

export const DraftsProvider = ({ children }: { children: ReactNode }) => {
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [priorities, setPriorities] = useState<Record<string, PriorityOverride>>({});
  const [events, setEvents] = useState<SeiEvent[]>([]);

  useEffect(() => {
    try { const r = localStorage.getItem(STORAGE_KEY); if (r) setDrafts(JSON.parse(r)); } catch {}
    try { const r = localStorage.getItem(PRIORITIES_KEY); if (r) setPriorities(JSON.parse(r)); } catch {}
    try { const r = localStorage.getItem(EVENTS_KEY); if (r) setEvents(JSON.parse(r)); } catch {}
  }, []);

  const persistDrafts = (next: Record<string, Draft>) => {
    setDrafts(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };
  const persistPriorities = (next: Record<string, PriorityOverride>) => {
    setPriorities(next);
    localStorage.setItem(PRIORITIES_KEY, JSON.stringify(next));
  };
  const persistEvents = (next: SeiEvent[]) => {
    setEvents(next);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(next));
  };

  const getDraft = useCallback((seiId: string) => drafts[seiId], [drafts]);
  const getPriority = useCallback((seiId: string) => priorities[seiId], [priorities]);
  const getEvents = useCallback((seiId: string) => events.filter((e) => e.seiId === seiId), [events]);

  const addEvent = (ev: SeiEvent, currentEvents: SeiEvent[]) => {
    const next = [...currentEvents, ev];
    persistEvents(next);
    return next;
  };

  const saveDraft: DraftsContextValue["saveDraft"] = (d) => {
    const existing = drafts[d.seiId];
    const now = new Date().toISOString();
    const next = {
      ...drafts,
      [d.seiId]: {
        seiId: d.seiId,
        minuta: d.minuta,
        ownerEmail: d.ownerEmail,
        ownerName: d.ownerName,
        status: d.status ?? "Em revisão" as const,
        updatedAt: now,
      },
    };
    persistDrafts(next);
    if (!existing) {
      addEvent({ seiId: d.seiId, type: "review_started", actor: d.ownerName, at: now, detail: "Revisão humana iniciada" }, events);
    } else {
      addEvent({ seiId: d.seiId, type: "draft_saved", actor: d.ownerName, at: now, detail: "Rascunho salvo" }, events);
    }
  };

  const finalizeDraft = (seiId: string, actor: string) => {
    const existing = drafts[seiId];
    if (!existing) return;
    const now = new Date().toISOString();
    persistDrafts({
      ...drafts,
      [seiId]: { ...existing, status: "Concluído", updatedAt: now },
    });
    addEvent({ seiId, type: "finalized", actor, at: now, detail: "Análise finalizada" }, events);
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
