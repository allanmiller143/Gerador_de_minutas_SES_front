import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { TextoPadrao } from "@/types/textoPadrao";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TextoPadraoTableProps {
  data: TextoPadrao[];
  categorias: { id: number; nome: string }[];
  onEdit: (item: TextoPadrao) => void;
  onDelete: (item: TextoPadrao) => void;
}

export function TextoPadraoTable({ data = [], categorias = [], onEdit, onDelete }: TextoPadraoTableProps) {
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  const toggleRow = (id: number) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Conteúdo</TableHead>
            <TableHead className="w-[120px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => {
            const categoria = categorias?.find(c => c.id === item.categoriaId);
            const isExpanded = expandedRows[item.id];

            return (
              <>
                <TableRow
                  key={item.id}
                  className={cn(
                    "transition-colors",
                    isExpanded && "bg-muted/20"
                  )}
                >
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleRow(item.id)}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">{item.titulo}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-medium">
                      {categoria?.nome || "Sem Categoria"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md truncate text-muted-foreground">
                    {item.conteudo}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(item)}
                      title="Editar texto padrão"
                    >
                      <Edit className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(item)}
                      title="Excluir texto padrão"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow className="bg-muted/30 transition-all">
                    <TableCell colSpan={5} className="p-0">
                      <div className="p-4 animate-in fade-in slide-in-from-top-2 duration-200 ease-out">
                        <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed border-l-4 border-primary pl-4">
                          {item.conteudo}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
