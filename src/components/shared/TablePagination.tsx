import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export const TablePagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [5, 10, 20, 50],
  className = "",
}: TablePaginationProps) => {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={`p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border bg-card text-xs text-muted-foreground ${className}`}>
      <div className="flex items-center gap-3">
        <span>
          Mostrando <strong className="font-semibold text-foreground">{startItem}</strong> a{" "}
          <strong className="font-semibold text-foreground">{endItem}</strong> de{" "}
          <strong className="font-semibold text-foreground">{totalItems}</strong> resultados
        </span>

        {onItemsPerPageChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="hidden md:inline">Exibir:</span>
            <Select
              value={String(itemsPerPage)}
              onValueChange={(val) => {
                onItemsPerPageChange(Number(val));
                onPageChange(1);
              }}
            >
              <SelectTrigger className="h-7 w-16 text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)} className="text-xs">
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          <span className="mr-2">
            Página <strong className="font-semibold text-foreground">{currentPage}</strong> de{" "}
            <strong className="font-semibold text-foreground">{totalPages}</strong>
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
};
