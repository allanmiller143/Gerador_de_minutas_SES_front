import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";

import { PriorityBadge, StatusBadge, RemetenteBadge } from "@/components/shared/Badges";
import { SortableHeader, sortProcessos, SortConfig } from "@/components/shared/SortableHeader";
import { TablePagination } from "@/components/shared/TablePagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Eye, Lock, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useDrafts } from "@/context/DraftsContext";
import { useProcessos } from "@/hooks/useProcessos";
import { useRemetentes } from "@/hooks/useRemetentes";
import { Skeleton } from "@/components/ui/skeleton";

const MinhasAnalises = () => {
  const { user } = useAuth();
  const { drafts } = useDrafts();
  const { data: processos, isLoading, error } = useProcessos();
  const { remetentes } = useRemetentes();
  const [numeroFilter, setNumeroFilter] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: null, direction: null });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => { setCurrentPage(1); }, [numeroFilter, sortConfig]);

  const handleSort = (field: string) => {
    setSortConfig((prev) => {
      if (prev.field === field) {
        if (prev.direction === "asc") return { field, direction: "desc" };
        if (prev.direction === "desc") return { field: null, direction: null };
      }
      return { field, direction: "asc" };
    });
  };

  // "Minhas análises" = SEIs onde o usuário atual é dono do rascunho (em revisão ou concluído)
  const meusIds = useMemo(() => {
    return Object.values(drafts)
      .filter((d) => user && d.ownerEmail === user.email)
      .map((d) => d.seiId);
  }, [drafts, user]);

  const minhas = useMemo(() => {
    if (!processos) return [];
    const list = processos.filter(
      (s) =>
        meusIds.includes(s.id) &&
        (!numeroFilter.trim() || s.numero.toLowerCase().includes(numeroFilter.trim().toLowerCase()))
    );
    return sortProcessos(list, sortConfig.field, sortConfig.direction, remetentes);
  }, [processos, meusIds, numeroFilter, sortConfig, remetentes]);

  const paginatedMinhas = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return minhas.slice(start, start + itemsPerPage);
  }, [minhas, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(minhas.length / itemsPerPage);

  if (isLoading) {
    return <AppLayout title="Minhas Análises" subtitle="Carregando dados do backend..." />;
  }

  if (error) {
    return <AppLayout title="Minhas Análises" subtitle="Não foi possível carregar os dados do backend." />;
  }

  return (
    <AppLayout title="Minhas Análises" subtitle="SEIs que você revisou ou está revisando">
      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center border-b border-border">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por nº SEI..."
              className="pl-9 text-sm"
              value={numeroFilter}
              onChange={(e) => setNumeroFilter(e.target.value)}
            />
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground bg-secondary/50">
              <SortableHeader field="numero" currentSort={sortConfig} onSort={handleSort}>SEI</SortableHeader>
              <SortableHeader field="assunto" currentSort={sortConfig} onSort={handleSort}>Assunto</SortableHeader>
              <SortableHeader field="prioridade" currentSort={sortConfig} onSort={handleSort}>Prioridade</SortableHeader>
              <SortableHeader field="status" currentSort={sortConfig} onSort={handleSort}>Situação</SortableHeader>
              <th className="px-5 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-5 py-4"><Skeleton className="h-4 w-28" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-48" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                  <td className="px-5 py-4 text-right"><Skeleton className="h-8 w-24 ml-auto rounded-md" /></td>
                </tr>
              ))
            ) : (
              paginatedMinhas.map((s) => {
                const draft = drafts[s.id];
                const finalized = draft?.status === "Concluído";
                return (
                  <tr key={s.id} className="border-t border-border hover:bg-secondary/40">
                    <td className="px-5 py-3 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <span>{s.numero}</span>
                        <RemetenteBadge numero={s.numero} remetentes={remetentes} />
                      </div>
                    </td>
                    <td className="px-5 py-3">{s.assunto}</td>
                    <td className="px-5 py-3"><PriorityBadge value={s.prioridade} /></td>
                    <td className="px-5 py-3">
                      <StatusBadge value={finalized ? "Concluído" : "Em revisão"} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button asChild size="sm" variant={finalized ? "ghost" : "default"}>
                        <Link to={`/minutador/${s.id}`}>
                          {finalized ? (
                            <><Eye className="h-3.5 w-3.5 mr-1" /> Visualizar</>
                          ) : (
                            <><Pencil className="h-3.5 w-3.5 mr-1" /> Editar</>
                          )}
                        </Link>
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
            {!isLoading && minhas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                  <Lock className="h-4 w-4 inline mr-1" />
                  Você ainda não iniciou nenhuma análise. Vá em <Link to="/seis" className="text-primary font-medium hover:underline">SEIs</Link> para começar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {!isLoading && minhas.length > 0 && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={minhas.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            pageSizeOptions={[5, 10, 20]}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default MinhasAnalises;
