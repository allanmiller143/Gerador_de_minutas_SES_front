import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { PriorityBadge, StatusBadge, RemetenteBadge, ComplexityBadge } from "@/components/shared/Badges";
import { MultiSelectRemetenteFilter, filterProcessosByRemetentes } from "@/components/shared/MultiSelectRemetenteFilter";
import { SortableHeader, sortProcessos, SortConfig } from "@/components/shared/SortableHeader";
import { TablePagination } from "@/components/shared/TablePagination";
import { type SeiStatus } from "@/data/mock";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, ChevronLeft, ChevronRight, FileText, Filter, Table, Pencil, RotateCcw, Clock } from "lucide-react";
import { useProcessos, useAnalisarProcesso, useReprocessarFalhas } from "@/hooks/useProcessos";
import { useRemetentes } from "@/hooks/useRemetentes";
import { Skeleton } from "@/components/ui/skeleton";
import { isProcessingStatus, isFailedStatus, isPendingStatus, isProcessoReadyForView } from "@/lib/processStatus";
import { PageTutorialWizard, TutorialStep } from "@/components/shared/PageTutorialWizard";
import { toast } from "sonner";

const statusOptions: (SeiStatus | "Todos" | "Falha na análise")[] = ["Todos", "Pré-análise", "Em revisão", "Concluído", "Falha na análise"];

const SEIS_LIST_TUTORIAL_STEPS: TutorialStep[] = [
  {
    target: '[data-tour="seis-card"]',
    title: "Lista Geral de Processos SEI",
    description:
      "Nesta página você visualiza a relação completa de todos os processos SEI cadastrados no sistema, com opções avançadas de busca, filtragem e acesso direto às análises.",
    icon: FileText,
    position: "bottom",
  },
  {
    target: '[data-tour="search-terms"]',
    title: "Busca por Assunto ou Termo",
    description:
      "Digite qualquer palavra-chave ou termo referente ao assunto do processo para encontrar minutas e documentos correspondentes.",
    icon: Search,
    position: "bottom",
  },
  {
    target: '[data-tour="filter-controls"]',
    title: "Filtros de SEI, Status e Remetente",
    description:
      "Refine a listagem combinando o número exato do SEI, a situação atual do processo (Pré-análise, Em revisão, Concluído) e etiquetas de órgãos remetentes.",
    icon: Filter,
    position: "bottom",
  },
  {
    target: '[data-tour="seis-table"]',
    title: "Tabela de Processos",
    description:
      "Confira número do SEI, etiqueta de remetente, assunto, data de recebimento, prioridade e status. Clique nos cabeçalhos de coluna para ordenar a lista.",
    icon: Table,
    position: "top",
  },
  {
    target: '[data-tour="action-sei"]',
    title: "Ações e Acesso ao Minutador",
    description:
      "Clique em 'Detalhes' para visualizar a ficha do processo ou em 'Analisar' / 'Continuar' para abrir a minuta no editor Minutador.",
    icon: Pencil,
    position: "left",
  },
];


//Calcula se o processo chegou com prazo curto.
const verificarProrrogacao = (dataRecebimento?: string, dataVencimento?: string) => {
  if (!dataRecebimento || !dataVencimento) return false;
  
  const parseDate = (dateStr: string) => {
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split(' ')[0].split('/');
      return new Date(Number(year), Number(month) - 1, Number(day));
    }
    return new Date(dateStr);
  };

  const dtRec = parseDate(dataRecebimento);
  const dtVenc = parseDate(dataVencimento);
  
  if (isNaN(dtRec.getTime()) || isNaN(dtVenc.getTime())) return false;

  const diffTempo = dtVenc.getTime() - dtRec.getTime();
  const diffDias = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));

  return diffDias <= 3;
};


const SeisList = () => {
  const { data: processos, isLoading, error } = useProcessos();
  const { remetentes } = useRemetentes();
  const [q, setQ] = useState("");
  const [numeroFilter, setNumeroFilter] = useState("");
  const [status, setStatus] = useState<string>("Todos");
  const [selectedRemetentes, setSelectedRemetentes] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: null, direction: null });

  const analisarMutation = useAnalisarProcesso();
  const reprocessarFalhasMutation = useReprocessarFalhas();

  const failedProcessos = useMemo(() => {
    if (!processos) return [];
    return processos.filter((p) => isFailedStatus(p.status_processamento) || p.status === "Falha na análise");
  }, [processos]);

  const handleReprocessar = async (id: number) => {
    try {
      await analisarMutation.mutateAsync({ id, apenasMinuta: false });
      toast.success("Processo reenfileirado para análise com IA.");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao reenfileirar processo para análise.");
    }
  };

  const handleReprocessarFalhas = async () => {
    try {
      const res = await reprocessarFalhasMutation.mutateAsync();
      toast.success(res.message || "Processos com falha reenfileirados com sucesso.");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao reenfileirar processos com falha.");
    }
  };

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

  // 1. Filtragem comum (Busca, Número, Status)
  const searchFiltered = processos.filter((s) => {
    const matchNum = !numeroFilter.trim() || s.numero.toLowerCase().includes(numeroFilter.trim().toLowerCase());
    const matchQ = !q || s.numero.toLowerCase().includes(q.toLowerCase()) || s.assunto.toLowerCase().includes(q.toLowerCase());
    const matchS = status === "Todos" || s.status === status;
    return matchNum && matchQ && matchS;
  });

  const remFiltered = filterProcessosByRemetentes(searchFiltered, selectedRemetentes, remetentes);

  // 2. Ordenação por Complexidade (Fácil -> Médio -> Difícil ou vice-versa)
  if (sortConfig.field === "complexidade" && sortConfig.direction) {
    const orderMap: Record<string, number> = {
      FACIL: 1,
      MEDIO: 2,
      DIFICIL: 3,
    };

    return [...remFiltered].sort((a, b) => {
      const normA = (a.complexidade || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const normB = (b.complexidade || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      const valA = orderMap[normA] ?? 99;
      const valB = orderMap[normB] ?? 99;

      return sortConfig.direction === "asc" ? valA - valB : valB - valA;
    });
  }

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
      <div data-tour="seis-card" className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="p-4 flex flex-col md:flex-row gap-3 md:items-center border-b border-border">
          <div data-tour="search-terms" className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por assunto ou termo..." className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div data-tour="filter-controls" className="flex flex-col sm:flex-row gap-3">
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
            {failedProcessos.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 whitespace-nowrap"
                onClick={handleReprocessarFalhas}
                disabled={reprocessarFalhasMutation.isPending}
              >
                <RotateCcw className={`h-3.5 w-3.5 ${reprocessarFalhasMutation.isPending ? "animate-spin" : ""}`} />
                Reprocessar Falhas ({failedProcessos.length})
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table data-tour="seis-table" className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground bg-secondary/50">
                <SortableHeader field="numero" currentSort={sortConfig} onSort={handleSort} className="whitespace-nowrap">SEI</SortableHeader>
                <SortableHeader field="assunto" currentSort={sortConfig} onSort={handleSort}>Assunto</SortableHeader>
                <SortableHeader field="dataRecebimento" currentSort={sortConfig} onSort={handleSort} className="whitespace-nowrap">Recebimento</SortableHeader>
                <SortableHeader field="prioridade" currentSort={sortConfig} onSort={handleSort} className="whitespace-nowrap">Prioridade</SortableHeader>
                <SortableHeader field="dias_restantes" currentSort={sortConfig} onSort={handleSort} className="whitespace-nowrap">Prazo</SortableHeader>
                <SortableHeader field="status" currentSort={sortConfig} onSort={handleSort} className="whitespace-nowrap">Status</SortableHeader>
                <SortableHeader field="complexidade" currentSort={sortConfig} onSort={handleSort} className="whitespace-nowrap">Complexidade</SortableHeader>
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
                    <td className="px-5 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-5 py-4 text-right"><Skeleton className="h-8 w-24 ml-auto rounded-md" /></td>
                  </tr>
                ))
              ) : (
                paginatedProcessos.map((s, index) => (
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
                    <td className="px-5 py-3 whitespace-nowrap font-medium">
                      {s.dias_restantes !== null && s.dias_restantes !== undefined ? (
                        <div className="flex items-center gap-1.5">
                          <span className={s.dias_restantes < 0 ? "text-red-500" : s.dias_restantes === 0 ? "text-orange-500" : "text-muted-foreground"}>
                            {s.dias_restantes < 0 ? "Vencido" : s.dias_restantes === 0 ? "Vence hoje" : `${s.dias_restantes} dias`}
                          </span>
                          
                          {verificarProrrogacao(s.dataRecebimento, s.data_vencimento) && s.dias_restantes >= 0 && s.dias_restantes <= 3 && (
                            <span 
                              title="Processo com pouco tempo de resposta, recomendado pedir prorrogação."
                              className="cursor-help text-base leading-none"
                            >
                              ⚠️️
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50">Sem prazo</span>
                      )}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <StatusBadge value={s.status} statusProcessamento={s.status_processamento} />
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <ComplexityBadge value={s.complexidade} justificativa={s.complexidade_justificativa} />
                    </td>
                    <td
                      data-tour={index === 0 ? "action-sei" : undefined}
                      className="px-5 py-3 text-right space-x-2 whitespace-nowrap"
                    >
                      {isProcessoReadyForView(s) ? (
                        <Button asChild size="sm" variant="ghost">
                          <Link to={`/seis/${s.id}`}>Detalhes</Link>
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" disabled className="cursor-not-allowed opacity-60" title="Processo aguardando processamento">
                          Detalhes
                        </Button>
                      )}
                      {s.status !== "Concluído" && (
                        isPendingStatus(s.status_processamento) ? (
                          <Button size="sm" variant="outline" disabled className="cursor-not-allowed opacity-60">
                            <Clock className="mr-1.5 h-3.5 w-3.5" /> Pendente
                          </Button>
                        ) : isProcessingStatus(s.status_processamento) ? (
                          <Button size="sm" disabled className="cursor-not-allowed">
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Analisando
                          </Button>
                        ) : (isFailedStatus(s.status_processamento) || s.status === "Falha na análise") ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-1.5"
                            onClick={() => handleReprocessar(Number(s.id))}
                            title={s.erro_processamento ? `Erro: ${s.erro_processamento}` : "Clique para tentar novamente"}
                            disabled={analisarMutation.isPending}
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Tentar Novamente
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
              )}
              {!isLoading && paginatedProcessos.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">Nenhum SEI encontrado.</td></tr>
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

      {/* Floating Tutorial Wizard */}
      <PageTutorialWizard
        steps={SEIS_LIST_TUTORIAL_STEPS}
        tutorialTitle="Tutorial de Processos SEI"
        buttonLabel="Guia da Página"
      />
    </AppLayout>
  );
};

export default SeisList;

