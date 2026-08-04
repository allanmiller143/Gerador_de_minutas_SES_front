import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/shared/MetricCard";
import { PriorityBadge, StatusBadge, OriginBadge, RemetenteBadge } from "@/components/shared/Badges";
import { MultiSelectRemetenteFilter, filterProcessosByRemetentes } from "@/components/shared/MultiSelectRemetenteFilter";
import { SortableHeader, sortProcessos, SortConfig } from "@/components/shared/SortableHeader";
import { TablePagination } from "@/components/shared/TablePagination";
import { Bot, UserCheck, Send, FileStack, ArrowRight, Eye, Sparkles, FileUp, Loader2, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useDashboard } from "@/hooks/useDashboard";
import { useRemetentes } from "@/hooks/useRemetentes";
import { Skeleton } from "@/components/ui/skeleton";
import { UploadDraftModal } from "@/components/shared/UploadDraftModal";
import { isFailedStatus, isProcessingStatus } from "@/lib/processStatus";

// Componente auxiliar para truncar o assunto e mostrar o ícone de (i) -> ( texto truncado + ... + (i) )
const AssuntoCell = ({ texto }: { texto: string }) => {
  const MAX_LENGTH = 35; // Limite máximo de caracteres

  if (!texto) return <span>—</span>;

  if (texto.length <= MAX_LENGTH) {
    return <span>{texto}</span>;
  }

  return (
    <div className="flex items-center gap-1.5 group cursor-help w-fit" title={texto}>
      <span>{texto.substring(0, MAX_LENGTH)}...</span>
      <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 transition-colors group-hover:text-primary" />
    </div>
  );
};

const Dashboard = () => {
  const { data, metrics, isLoading } = useDashboard();
  const { remetentes } = useRemetentes();
  const [filterPre, setFilterPre] = useState<string[]>([]);
  const [filterEmRevisao, setFilterEmRevisao] = useState<string[]>([]);
  const [filterRevisados, setFilterRevisados] = useState<string[]>([]);

  const [sortPre, setSortPre] = useState<SortConfig>({ field: null, direction: null });
  const [sortEmRevisao, setSortEmRevisao] = useState<SortConfig>({ field: null, direction: null });
  const [sortRevisados, setSortRevisados] = useState<SortConfig>({ field: null, direction: null });

  // Pagination states for all 3 Dashboard tables
  const [pagePre, setPagePre] = useState(1);
  const [pageSizePre, setPageSizePre] = useState(10);

  const [pageEmRevisao, setPageEmRevisao] = useState(1);
  const [pageSizeEmRevisao, setPageSizeEmRevisao] = useState(10);

  const [pageRevisados, setPageRevisados] = useState(1);
  const [pageSizeRevisados, setPageSizeRevisados] = useState(10);

  useEffect(() => { setPagePre(1); }, [filterPre, sortPre]);
  useEffect(() => { setPageEmRevisao(1); }, [filterEmRevisao, sortEmRevisao]);
  useEffect(() => { setPageRevisados(1); }, [filterRevisados, sortRevisados]);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleSort = (
    setSort: React.Dispatch<React.SetStateAction<SortConfig>>,
    field: string
  ) => {
    setSort((prev) => {
      if (prev.field === field) {
        if (prev.direction === "asc") return { field, direction: "desc" };
        if (prev.direction === "desc") return { field: null, direction: null };
      }
      return { field, direction: "asc" };
    });
  };

  const preAnalisados = useMemo(() => {
    if (!data) return [];
    return sortProcessos(
      filterProcessosByRemetentes(
        data.filter((s) => s.status === "Pré-análise"),
        filterPre,
        remetentes
      ),
      sortPre.field,
      sortPre.direction,
      remetentes
    );
  }, [data, filterPre, remetentes, sortPre]);

  const emRevisao = useMemo(() => {
    if (!data) return [];
    return sortProcessos(
      filterProcessosByRemetentes(
        data.filter((s) => s.status === "Em revisão"),
        filterEmRevisao,
        remetentes
      ),
      sortEmRevisao.field,
      sortEmRevisao.direction,
      remetentes
    );
  }, [data, filterEmRevisao, remetentes, sortEmRevisao]);

  const revisadosHumanos = useMemo(() => {
    if (!data) return [];
    return sortProcessos(
      filterProcessosByRemetentes(
        data.filter((s) => s.status === "Concluído"),
        filterRevisados,
        remetentes
      ),
      sortRevisados.field,
      sortRevisados.direction,
      remetentes
    );
  }, [data, filterRevisados, remetentes, sortRevisados]);

  const paginatedPre = useMemo(() => {
    const start = (pagePre - 1) * pageSizePre;
    return preAnalisados.slice(start, start + pageSizePre);
  }, [preAnalisados, pagePre, pageSizePre]);

  const paginatedEmRevisao = useMemo(() => {
    const start = (pageEmRevisao - 1) * pageSizeEmRevisao;
    return emRevisao.slice(start, start + pageSizeEmRevisao);
  }, [emRevisao, pageEmRevisao, pageSizeEmRevisao]);

  const paginatedRevisados = useMemo(() => {
    const start = (pageRevisados - 1) * pageSizeRevisados;
    return revisadosHumanos.slice(start, start + pageSizeRevisados);
  }, [revisadosHumanos, pageRevisados, pageSizeRevisados]);

  if (isLoading || !metrics) {
    return (
      <AppLayout title="Dashboard" subtitle="Carregando dados do sistema...">
        <div className="space-y-6 p-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Dashboard" subtitle="Visão geral da análise de processos">
      <div className="mb-6 rounded-xl border border-border bg-gradient-to-r from-accent/60 to-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="text-sm">
            <div className="font-semibold text-foreground">Como funciona</div>
            <p className="text-muted-foreground">
              Assim que um processo chega, o sistema realiza a <strong>pré-análise automática com IA</strong>. O trabalho humano é <strong>revisar, ajustar e salvar</strong> a resposta antes do envio oficial.
            </p>
          </div>
        </div>

        <Button onClick={() => setIsUploadModalOpen(true)} className="shrink-0 gap-2">
          <FileUp className="h-4 w-4" />
          Upload PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Pré-analisados pela IA" value={metrics.preAnalisadosIA} hint="Aguardando revisão humana" icon={Bot} tone="info" />
        <MetricCard label="Em revisão humana" value={metrics.emRevisaoHumana} hint="Revisão em andamento" tone="warning" icon={UserCheck} />
        <MetricCard label="Concluídos" value={metrics.concluidos} hint="Análises finalizadas" icon={Send} tone="success" />
        <MetricCard label="Total no sistema" value={metrics.total} hint="Todos os SEIs" icon={FileStack} tone="primary" />
      </div>

      {/* SEIs pré-analisados pela IA */}
      <section className="bg-card border border-border rounded-xl shadow-card mb-6 overflow-hidden">
        <header className="px-5 py-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-accent/40">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary shrink-0" />
            <h2 className="font-semibold text-foreground">Pré-analisados pela IA · aguardando revisão humana</h2>
          </div>
          <div className="flex items-center gap-3">
            <MultiSelectRemetenteFilter selected={filterPre} onChange={setFilterPre} remetentes={remetentes} />
            <Link to="/seis" className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1 shrink-0">
              Ver todos <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground bg-secondary/50">
                <SortableHeader field="numero" currentSort={sortPre} onSort={(f) => handleSort(setSortPre, f)}>SEI</SortableHeader>
                <SortableHeader field="assunto" currentSort={sortPre} onSort={(f) => handleSort(setSortPre, f)}>Assunto</SortableHeader>
                <SortableHeader field="dataRecebimento" currentSort={sortPre} onSort={(f) => handleSort(setSortPre, f)}>Recebido</SortableHeader>
                <SortableHeader field="prioridade" currentSort={sortPre} onSort={(f) => handleSort(setSortPre, f)}>Prioridade</SortableHeader>
                <SortableHeader field="iaConfidence" currentSort={sortPre} onSort={(f) => handleSort(setSortPre, f)}>Confiança IA</SortableHeader>
                <th className="px-5 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPre.map((s) => (
                <tr key={s.id} className="border-t border-border hover:bg-secondary/40 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span>{s.numero}</span>
                      <RemetenteBadge numero={s.numero} remetentes={remetentes} />
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-1">
                      <AssuntoCell texto={s.assunto} />
                      <OriginBadge origin="ia" />
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    <div className="flex flex-col">
                      <span>{s.dataRecebimento}</span>
                      {s.tempo_analise !== undefined && s.tempo_analise !== null && (
                        <span className="text-[11px] text-muted-foreground/80 mt-0.5 flex items-center gap-1" title={`Tempo de análise da IA: ${s.tempo_analise}s`}>
                          <Clock className="h-3 w-3 shrink-0" /> {s.tempo_analise < 60 ? `${s.tempo_analise}s` : `${Math.floor(s.tempo_analise / 60)}m ${s.tempo_analise % 60}s`}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3"><PriorityBadge value={s.prioridade} /></td>
                  <td className="px-5 py-3 w-40">
                    {isProcessingStatus(s.status_processamento) ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-xs text-muted-foreground animate-pulse">Analisando...</span>
                      </div>
                    ) : isFailedStatus(s.status_processamento) ? (
                      <span className="text-xs font-semibold text-destructive">Falha na análise</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Progress value={s.iaConfidence * 100} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground w-9 text-right">{Math.round(s.iaConfidence * 100)}%</span>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {isProcessingStatus(s.status_processamento) ? (
                      <Button size="sm" disabled className="cursor-not-allowed">
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Analisando
                      </Button>
                    ) : (
                      <Button asChild size="sm">
                        <Link to={`/minutador/${s.id}`}>Revisar</Link>
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {preAnalisados.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">Nenhum processo aguardando revisão.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          currentPage={pagePre}
          totalPages={Math.ceil(preAnalisados.length / pageSizePre)}
          totalItems={preAnalisados.length}
          itemsPerPage={pageSizePre}
          onPageChange={setPagePre}
          onItemsPerPageChange={setPageSizePre}
          pageSizeOptions={[10, 25, 50]}
        />
      </section>

      {/* Em revisão humana */}
      <section className="bg-card border border-border rounded-xl shadow-card mb-6 overflow-hidden">
        <header className="px-5 py-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-accent/40">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-warning shrink-0" />
            <h2 className="font-semibold text-foreground">Em revisão humana</h2>
          </div>
          <MultiSelectRemetenteFilter selected={filterEmRevisao} onChange={setFilterEmRevisao} remetentes={remetentes} />
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground bg-secondary/50">
                <SortableHeader field="numero" currentSort={sortEmRevisao} onSort={(f) => handleSort(setSortEmRevisao, f)}>SEI</SortableHeader>
                <SortableHeader field="assunto" currentSort={sortEmRevisao} onSort={(f) => handleSort(setSortEmRevisao, f)}>Assunto</SortableHeader>
                <SortableHeader field="analista" currentSort={sortEmRevisao} onSort={(f) => handleSort(setSortEmRevisao, f)}>Revisor</SortableHeader>
                <SortableHeader field="prioridade" currentSort={sortEmRevisao} onSort={(f) => handleSort(setSortEmRevisao, f)}>Prioridade</SortableHeader>
                <th className="px-5 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEmRevisao.map((s) => (
                <tr key={s.id} className="border-t border-border hover:bg-secondary/40">
                  <td className="px-5 py-3 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span>{s.numero}</span>
                      <RemetenteBadge numero={s.numero} remetentes={remetentes} />
                      {s.isEditadoLocalmente && (
                        <span
                          className="h-2 w-2 rounded-full bg-orange-500 shrink-0"
                          title="Texto da IA foi alterado"
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3"><AssuntoCell texto={s.assunto} /></td>
                  <td className="px-5 py-3">{s.analista ?? "—"}</td>
                  <td className="px-5 py-3"><PriorityBadge value={s.prioridade} /></td>
                  <td className="px-5 py-3 text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/minutador/${s.id}`}>Continuar revisão</Link>
                    </Button>
                  </td>
                </tr>
              ))}
              {emRevisao.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">Nenhum processo em revisão humana.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          currentPage={pageEmRevisao}
          totalPages={Math.ceil(emRevisao.length / pageSizeEmRevisao)}
          totalItems={emRevisao.length}
          itemsPerPage={pageSizeEmRevisao}
          onPageChange={setPageEmRevisao}
          onItemsPerPageChange={setPageSizeEmRevisao}
          pageSizeOptions={[10, 25, 50]}
        />
      </section>

      {/* Finalizados por humanos */}
      <section className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <header className="px-5 py-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-success shrink-0" />
            <h2 className="font-semibold text-foreground">Revisados por humanos recentemente</h2>
          </div>
          <div className="flex items-center gap-3">
            <MultiSelectRemetenteFilter selected={filterRevisados} onChange={setFilterRevisados} remetentes={remetentes} />
            <Link to="/seis" className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1 shrink-0">
              Ver todos <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground bg-secondary/50">
                <SortableHeader field="numero" currentSort={sortRevisados} onSort={(f) => handleSort(setSortRevisados, f)}>SEI</SortableHeader>
                <SortableHeader field="assunto" currentSort={sortRevisados} onSort={(f) => handleSort(setSortRevisados, f)}>Assunto</SortableHeader>
                <SortableHeader field="dataRevisao" currentSort={sortRevisados} onSort={(f) => handleSort(setSortRevisados, f)}>Revisado em</SortableHeader>
                <SortableHeader field="analista" currentSort={sortRevisados} onSort={(f) => handleSort(setSortRevisados, f)}>Analista</SortableHeader>
                <SortableHeader field="status" currentSort={sortRevisados} onSort={(f) => handleSort(setSortRevisados, f)}>Status</SortableHeader>
                <th className="px-5 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRevisados.map((s) => (
                <tr key={s.id} className="border-t border-border hover:bg-secondary/40">
                  <td className="px-5 py-3 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span>{s.numero}</span>
                      <RemetenteBadge numero={s.numero} remetentes={remetentes} />
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-1">
                      <AssuntoCell texto={s.assunto} />
                      <OriginBadge origin="humano" />
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{s.dataRevisao ?? "—"}</td>
                  <td className="px-5 py-3">{s.analista}</td>
                  <td className="px-5 py-3"><StatusBadge value={s.status} /></td>
                  <td className="px-5 py-3 text-right">
                    <Button asChild size="sm" variant="ghost">
                      <Link to={`/seis/${s.id}`}><Eye className="h-3.5 w-3.5 mr-1" /> Visualizar</Link>
                    </Button>
                  </td>
                </tr>
              ))}
              {revisadosHumanos.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">Nenhum processo revisado por humanos.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          currentPage={pageRevisados}
          totalPages={Math.ceil(revisadosHumanos.length / pageSizeRevisados)}
          totalItems={revisadosHumanos.length}
          itemsPerPage={pageSizeRevisados}
          onPageChange={setPageRevisados}
          onItemsPerPageChange={setPageSizeRevisados}
          pageSizeOptions={[10, 25, 50]}
        />
      </section>

      <UploadDraftModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </AppLayout>
  );
};

export default Dashboard;