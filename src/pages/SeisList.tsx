import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { PriorityBadge, StatusBadge, RemetenteBadge } from "@/components/shared/Badges";
import { MultiSelectRemetenteFilter, filterProcessosByRemetentes } from "@/components/shared/MultiSelectRemetenteFilter";
import { SortableHeader, sortProcessos, SortConfig } from "@/components/shared/SortableHeader";
import { TablePagination } from "@/components/shared/TablePagination";
import { type SeiStatus } from "@/data/mock";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useProcessos } from "@/hooks/useProcessos";
import { useRemetentes } from "@/hooks/useRemetentes";
import { Skeleton } from "@/components/ui/skeleton";
import { isProcessingStatus } from "@/lib/processStatus";

const statusOptions: (SeiStatus | "Todos")[] = ["Todos", "Pré-análise", "Em revisão", "Concluído"];

const SeisList = () => {
  const { data: processos, isLoading, error } = useProcessos();
  const { remetentes } = useRemetentes();
  const [q, setQ] = useState("");
  const [numeroFilter, setNumeroFilter] = useState("");
  const [status, setStatus] = useState<string>("Todos");
  const [selectedRemetentes, setSelectedRemetentes] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: null, direction: null });

  const handleSort = (field: string) => {
    setSortConfig((prev) => {
      if (prev.field === field) {
        if (prev.direction === "asc") return { field, direction: "desc" };
        if (prev.direction === "desc") return { field: null, direction: null };
      }
      return { field, direction: "asc" };
    });
  };

  const filtered = useMemo(() => {
    if (!processos) return [];
    const searchFiltered = processos.filter((s) => {
      const matchNum = !numeroFilter.trim() || s.numero.toLowerCase().includes(numeroFilter.trim().toLowerCase());
      const matchQ = !q || s.numero.toLowerCase().includes(q.toLowerCase()) || s.assunto.toLowerCase().includes(q.toLowerCase());
      const matchS = status === "Todos" || s.status === status;
      return matchNum && matchQ && matchS;
    });

    const remFiltered = filterProcessosByRemetentes(searchFiltered, selectedRemetentes, remetentes);
    return sortProcessos(remFiltered, sortConfig.field, sortConfig.direction, remetentes);
  }, [processos, remetentes, q, numeroFilter, status, selectedRemetentes, sortConfig]);

  // Estados da Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Exibir apenas os itens da página atual
  const paginatedProcessos = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [q, numeroFilter, status, selectedRemetentes, itemsPerPage]);

  if (error) {
    return <AppLayout title="SEIs" subtitle="Não foi possível carregar os dados do backend." />;
  }

  return (
    <AppLayout title="SEIs" subtitle="Processos SEI cadastrados no sistema">
      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="p-4 flex flex-col md:flex-row gap-3 md:items-center border-b border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por assunto ou termo..." className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Filtrar por nº SEI..."
              className="w-full sm:w-72 text-sm"
              value={numeroFilter}
              onChange={(e) => setNumeroFilter(e.target.value)}
            />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
              </SelectContent>
            </Select>

            <MultiSelectRemetenteFilter
              selected={selectedRemetentes}
              onChange={setSelectedRemetentes}
              remetentes={remetentes}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground bg-secondary/50">
                <SortableHeader field="numero" currentSort={sortConfig} onSort={handleSort} className="whitespace-nowrap">SEI</SortableHeader>
                <SortableHeader field="assunto" currentSort={sortConfig} onSort={handleSort}>Assunto</SortableHeader>
                <SortableHeader field="dataRecebimento" currentSort={sortConfig} onSort={handleSort} className="whitespace-nowrap">Recebimento</SortableHeader>
                <SortableHeader field="prioridade" currentSort={sortConfig} onSort={handleSort} className="whitespace-nowrap">Prioridade</SortableHeader>
                <SortableHeader field="status" currentSort={sortConfig} onSort={handleSort} className="whitespace-nowrap">Status</SortableHeader>
                <th className="px-5 py-3 font-medium text-right whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-5 py-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="px-5 py-4 text-right"><Skeleton className="h-8 w-24 ml-auto rounded-md" /></td>
                  </tr>
                ))
              ) :
                paginatedProcessos.map((s) => (
                  <tr key={s.id} className="border-t border-border hover:bg-secondary/40">
                    <td className="px-5 py-3 font-mono text-xs whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span>{s.numero}</span>
                        <RemetenteBadge numero={s.numero} remetentes={remetentes} />
                      </div>
                    </td>
                    <td className="px-5 py-3">{s.assunto}</td>
                    <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">{s.dataRecebimento}</td>
                    <td className="px-5 py-3 whitespace-nowrap"><PriorityBadge value={s.prioridade} /></td>
                    <td className="px-5 py-3 whitespace-nowrap"><StatusBadge value={s.status} /></td>
                    <td className="px-5 py-3 text-right space-x-2">
                      <Button asChild size="sm" variant="ghost"><Link to={`/seis/${s.id}`}>Detalhes</Link></Button>
                      {s.status !== "Concluído" && (
                        isProcessingStatus(s.status_processamento) ? (
                          <Button size="sm" disabled className="cursor-not-allowed">
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Analisando
                          </Button>
                        ) : (
                          <Button asChild size="sm">
                            <Link to={`/minutador/${s.id}`}>
                              {s.status === "Em revisão" ? "Continuar" : "Analisar"}
                            </Link>
                          </Button>
                        )
                      )}
                    </td>
                  </tr>
                ))
              }
              {!isLoading && paginatedProcessos.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">Nenhum SEI encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Rodapé da Paginação */}
        {!isLoading && filtered.length > 0 && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            pageSizeOptions={[10, 25, 50]}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default SeisList;
