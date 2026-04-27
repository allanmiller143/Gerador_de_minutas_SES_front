import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import type { Priority, SeiStatus } from "@/data/mock";

export const PriorityBadge = ({ value }: { value: Priority }) => {
  const map: Record<Priority, string> = {
    Alta: "bg-priority-high-bg text-priority-high",
    Média: "bg-priority-medium-bg text-priority-medium",
    Baixa: "bg-priority-low-bg text-priority-low",
  };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold", map[value])}>
      {value}
    </span>
  );
};

export const StatusBadge = ({ value }: { value: SeiStatus }) => {
  const map: Record<SeiStatus, string> = {
    "Pré-análise": "bg-accent text-accent-foreground",
    "Em revisão": "bg-priority-medium-bg text-priority-medium",
    "Concluído": "bg-priority-low-bg text-priority-low",
  };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold", map[value])}>
      {value}
    </span>
  );
};

/** Marca visível indicando se a análise vigente foi feita pela IA ou pelo humano. */
export const OriginBadge = ({ origin }: { origin: "ia" | "humano" }) => {
  if (origin === "ia") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-accent text-accent-foreground border border-primary/20">
        <Bot className="h-3 w-3" /> Pré-análise
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-priority-low-bg text-priority-low">
      <User className="h-3 w-3" /> Revisado por humano
    </span>
  );
};
