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
    <span className={cn("inline-flex w-fit items-center px-2.5 py-0.5 rounded-full text-xs font-semibold", map[value])}>
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
    <span className={cn("inline-flex w-fit items-center px-2.5 py-0.5 rounded-full text-xs font-semibold", map[value])}>
      {value}
    </span>
  );
};

/** Marca visível indicando se a análise vigente foi feita pela IA ou pelo humano. */
export const OriginBadge = ({ origin }: { origin: "ia" | "humano" }) => {
  if (origin === "ia") {
    return (
      <span className="inline-flex w-fit items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-accent text-accent-foreground border border-primary/20">
        <Bot className="h-3 w-3" /> Pré-análise
      </span>
    );
  }
  return (
    <span className="inline-flex w-fit items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-priority-low-bg text-priority-low">
      <User className="h-3 w-3" /> Revisado por humano
    </span>
  );
};

import { Remetente } from "@/types/remetente";

const getContrastColor = (color: string): string => {
  if (color && color.startsWith("#") && (color.length === 7 || color.length === 4)) {
    let hex = color.slice(1);
    if (hex.length === 3) {
      hex = hex.split("").map((c) => c + c).join("");
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 140 ? "#0f172a" : "#ffffff";
  }
  return "#ffffff";
};

export const findMatchingRemetente = (
  numero: string,
  remetentes: Remetente[] | undefined
): Remetente | undefined => {
  if (!numero || !remetentes || remetentes.length === 0) return undefined;
  const numLower = numero.toLowerCase().trim();

  // Sort remetentes by prefix length descending so longer matching prefixes take precedence
  const sorted = [...remetentes].sort(
    (a, b) => (b.prefixo?.length || 0) - (a.prefixo?.length || 0)
  );

  return sorted.find((r) => {
    if (!r.prefixo) return false;
    const prefLower = r.prefixo.toLowerCase().trim();
    return numLower.startsWith(prefLower);
  });
};

export const RemetenteBadge = ({
  numero,
  remetentes,
}: {
  numero: string;
  remetentes: Remetente[] | undefined;
}) => {
  const match = findMatchingRemetente(numero, remetentes);
  if (!match) return null;

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold shadow-xs shrink-0"
      style={{
        backgroundColor: match.cor,
        color: getContrastColor(match.cor),
      }}
      title={`Remetente: ${match.nome_completo} (${match.prefixo})`}
    >
      {match.sigla}
    </span>
  );
};