import { cn } from "@/lib/utils";
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
    Pendente: "bg-priority-medium-bg text-priority-medium",
    "Em elaboração": "bg-accent text-accent-foreground",
    "Em revisão": "bg-priority-medium-bg text-priority-medium",
    Aprovada: "bg-priority-low-bg text-priority-low",
    Enviado: "bg-priority-low-bg text-priority-low",
  };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold", map[value])}>
      {value}
    </span>
  );
};
