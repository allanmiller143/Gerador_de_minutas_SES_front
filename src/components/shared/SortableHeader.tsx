import React from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { ProcessoSEI } from "@/types/sei";
import { Remetente } from "@/types/remetente";
import { findMatchingRemetente } from "@/components/shared/Badges";

export type SortDirection = "asc" | "desc" | null;

export interface SortConfig {
  field: string | null;
  direction: SortDirection;
}

const priorityWeights: Record<string, number> = {
  Urgente: 4,
  Alta: 3,
  Média: 2,
  Baixa: 1,
};

const parseDateStringToTimestamp = (dateStr: string | null | undefined): number => {
  if (!dateStr) return 0;

  // Tratar formato brasileiro DD/MM/YYYY ou DD/MM/YYYY HH:mm:ss
  if (dateStr.includes("/")) {
    const parts = dateStr.trim().split(" ");
    const dateParts = parts[0].split("/"); // [DD, MM, YYYY]
    if (dateParts.length === 3) {
      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // 0-indexado
      const year = parseInt(dateParts[2], 10);

      let hour = 0, minute = 0, second = 0;
      if (parts[1]) {
        const timeParts = parts[1].split(":");
        hour = parseInt(timeParts[0] || "0", 10);
        minute = parseInt(timeParts[1] || "0", 10);
        second = parseInt(timeParts[2] || "0", 10);
      }

      return new Date(year, month, day, hour, minute, second).getTime();
    }
  }

  // Fallback para ISO 8601 (YYYY-MM-DD) ou outro formato padrão
  const parsed = Date.parse(dateStr);
  return isNaN(parsed) ? 0 : parsed;
};

export const sortProcessos = (
  items: ProcessoSEI[],
  field: string | null,
  direction: SortDirection,
  remetentes: Remetente[] = []
): ProcessoSEI[] => {
  if (!field || !direction) return items;

  return [...items].sort((a, b) => {
    let comparison = 0;

    switch (field) {
      case "numero":
        comparison = a.numero.localeCompare(b.numero);
        break;

      case "assunto":
        comparison = a.assunto.localeCompare(b.assunto);
        break;

      case "dataRecebimento": {
        const timeA = parseDateStringToTimestamp(a.dataRecebimento);
        const timeB = parseDateStringToTimestamp(b.dataRecebimento);
        comparison = timeA - timeB;
        break;
      }

      case "dataRevisao": {
        const timeA = parseDateStringToTimestamp(a.dataRevisao);
        const timeB = parseDateStringToTimestamp(b.dataRevisao);
        comparison = timeA - timeB;
        break;
      }

      case "prioridade": {
        const weightA = priorityWeights[a.prioridade] || 0;
        const weightB = priorityWeights[b.prioridade] || 0;
        comparison = weightA - weightB;
        break;
      }

      case "iaConfidence":
        comparison = (a.iaConfidence || 0) - (b.iaConfidence || 0);
        break;

      case "analista":
        comparison = (a.analista || "").localeCompare(b.analista || "");
        break;

      case "status":
        comparison = (a.status || "").localeCompare(b.status || "");
        break;

      case "remetente": {
        const remA = findMatchingRemetente(a.numero, remetentes)?.sigla || "";
        const remB = findMatchingRemetente(b.numero, remetentes)?.sigla || "";
        comparison = remA.localeCompare(remB);
        break;
      }

      default:
        comparison = 0;
    }

    return direction === "asc" ? comparison : -comparison;
  });
};

interface SortableHeaderProps {
  field: string;
  currentSort: SortConfig;
  onSort: (field: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const SortableHeader = ({
  field,
  currentSort,
  onSort,
  children,
  className = "",
}: SortableHeaderProps) => {
  const isSorted = currentSort.field === field;
  const direction = isSorted ? currentSort.direction : null;

  return (
    <th
      onClick={() => onSort(field)}
      className={`px-5 py-3 font-medium select-none cursor-pointer hover:bg-secondary/80 transition-colors group ${className}`}
      title={`Clique para ordenar por ${typeof children === "string" ? children : field}`}
    >
      <div className="flex items-center gap-1.5">
        <span>{children}</span>
        <span className="text-muted-foreground transition-colors group-hover:text-foreground">
          {direction === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5 text-primary" />
          ) : direction === "desc" ? (
            <ArrowDown className="h-3.5 w-3.5 text-primary" />
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100" />
          )}
        </span>
      </div>
    </th>
  );
};
