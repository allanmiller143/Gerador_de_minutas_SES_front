import { useState } from "react";
import { Filter, X, Check, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Remetente } from "@/types/remetente";
import { findMatchingRemetente } from "@/components/shared/Badges";
import { ProcessoSEI } from "@/types/sei";

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

export const filterProcessosByRemetentes = (
  processos: ProcessoSEI[],
  selectedValues: string[],
  remetentes: Remetente[]
): ProcessoSEI[] => {
  if (!selectedValues || selectedValues.length === 0) return processos;

  const includeSemRemetente = selectedValues.includes("sem_remetente");
  const selectedIds = selectedValues.filter((v) => v !== "sem_remetente");

  return processos.filter((s) => {
    const match = findMatchingRemetente(s.numero, remetentes);

    if (!match) {
      return includeSemRemetente;
    }

    return selectedIds.includes(String(match.id));
  });
};

interface MultiSelectRemetenteFilterProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  remetentes: Remetente[];
  className?: string;
  placeholder?: string;
}

export const MultiSelectRemetenteFilter = ({
  selected,
  onChange,
  remetentes,
  className = "",
  placeholder = "Filtrar por Remetente",
}: MultiSelectRemetenteFilterProps) => {
  const [open, setOpen] = useState(false);

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const clearAll = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange([]);
  };

  const selectedRemetentes = remetentes.filter((r) => selected.includes(String(r.id)));
  const hasSemRemetente = selected.includes("sem_remetente");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-9 px-3 justify-between bg-background border-input font-normal ${className}`}
        >
          <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
            <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            
            {selected.length === 0 ? (
              <span className="text-xs text-muted-foreground truncate">{placeholder}</span>
            ) : (
              <div className="flex items-center gap-1 overflow-hidden flex-wrap max-w-[200px]">
                {hasSemRemetente && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-medium shrink-0">
                    Sem Remetente
                  </Badge>
                )}
                {selectedRemetentes.slice(0, 2).map((r) => (
                  <Badge
                    key={r.id}
                    className="text-[10px] px-1.5 py-0 h-5 font-medium border-none shrink-0"
                    style={{
                      backgroundColor: r.cor,
                      color: getContrastColor(r.cor),
                    }}
                  >
                    {r.sigla}
                  </Badge>
                ))}
                {selectedRemetentes.length > 2 && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-5 shrink-0">
                    +{selectedRemetentes.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 ml-2 shrink-0">
            {selected.length > 0 && (
              <span
                onClick={clearAll}
                className="p-0.5 hover:bg-accent rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Limpar seleção"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-72 p-3" align="start">
        <div className="flex items-center justify-between pb-2 mb-2 border-b">
          <span className="text-xs font-semibold text-foreground">Remetentes</span>
          {selected.length > 0 && (
            <button
              onClick={() => clearAll()}
              className="text-[11px] text-primary hover:underline font-medium"
            >
              Limpar seleção ({selected.length})
            </button>
          )}
        </div>

        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
          {/* Option: Sem Remetente */}
          <div
            onClick={() => toggleOption("sem_remetente")}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-accent/60 cursor-pointer transition-colors text-xs"
          >
            <Checkbox
              checked={hasSemRemetente}
              onCheckedChange={() => toggleOption("sem_remetente")}
              onClick={(e) => e.stopPropagation()}
            />
            <span className="font-medium text-foreground">Sem Remetente</span>
            <span className="text-[11px] text-muted-foreground ml-auto">(não atribuído)</span>
          </div>

          {remetentes.length > 0 && <div className="my-1 border-t" />}

          {/* List of Remetentes */}
          {remetentes.map((r) => {
            const isChecked = selected.includes(String(r.id));
            return (
              <div
                key={r.id}
                onClick={() => toggleOption(String(r.id))}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-accent/60 cursor-pointer transition-colors text-xs"
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => toggleOption(String(r.id))}
                  onClick={(e) => e.stopPropagation()}
                />
                <Badge
                  className="text-[10px] px-1.5 py-0 h-5 font-semibold border-none shrink-0"
                  style={{
                    backgroundColor: r.cor,
                    color: getContrastColor(r.cor),
                  }}
                >
                  {r.sigla}
                </Badge>
                <span className="font-medium text-foreground truncate">{r.nome_completo}</span>
                <span className="text-[11px] text-muted-foreground ml-auto font-mono shrink-0">
                  ({r.prefixo})
                </span>
              </div>
            );
          })}

          {remetentes.length === 0 && (
            <div className="py-3 text-center text-xs text-muted-foreground">
              Nenhum remetente cadastrado.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
