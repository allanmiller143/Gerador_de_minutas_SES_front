import { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/shared/MetricCard";
import { PriorityBadge, StatusBadge, OriginBadge } from "@/components/shared/Badges";
import { Bot, UserCheck, Send, FileStack, ArrowRight, Eye, Sparkles, FileUp, Loader2, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useDashboard } from "@/hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { UploadDraftModal } from "@/components/shared/UploadDraftModal";

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
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

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

  const preAnalisados = data.filter((s) => s.status === "Pré-análise");
  const emRevisao = data.filter((s) => s.status === "Em revisão");
  const revisadosHumanos = data.filter((s) => s.status === "Concluído").slice(0, 4);

  return (
    <AppLayout title="Dashboard" subtitle="Visão geral da análise de processos">
      <div className="mb-6 rounded-xl border border-border bg-gradient-to-r from-accent/60 to-card p-4 flex items-start gap-3 justify-between">
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
        <header className="px-5 py-4 border-b border-border flex items-center justify-between bg-accent/40">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-foreground">Pré-analisados pela IA · aguardando revisão humana</h2>
          </div>
          <Link to="/seis" className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1">
            Ver todos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground bg-secondary/50">
                <th className="px-5 py-3 font-medium">SEI</th>
                <th className="px-5 py-3 font-medium">Assunto</th>
                <th className="px-5 py-3 font-medium">Recebido</th>
                <th className="px-5 py-3 font-medium">Prioridade</th>
                <th className="px-5 py-3 font-medium">Confiança IA</th>
                <th className="px-5 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {preAnalisados.map((s) => (
                <tr key={s.id} className="border-t border-border hover:bg-secondary/40 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs">{s.numero}</td>
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
                    {s.status_processamento === "Processando" ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-xs text-muted-foreground animate-pulse">Analisando...</span>
                      </div>
                    ) : s.status_processamento === "Falhou" ? (
                      <span className="text-xs font-semibold text-destructive">Falha na análise</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Progress value={s.iaConfidence * 100} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground w-9 text-right">{Math.round(s.iaConfidence * 100)}%</span>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {s.status_processamento === "Processando" ? (
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
      </section>

      {/* Em revisão humana */}
      {emRevisao.length > 0 && (
        <section className="bg-card border border-border rounded-xl shadow-card mb-6 overflow-hidden">
          <header className="px-5 py-4 border-b border-border flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-warning" />
            <h2 className="font-semibold text-foreground">Em revisão humana</h2>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground bg-secondary/50">
                  <th className="px-5 py-3 font-medium">SEI</th>
                  <th className="px-5 py-3 font-medium">Assunto</th>
                  <th className="px-5 py-3 font-medium">Revisor</th>
                  <th className="px-5 py-3 font-medium">Prioridade</th>
                  <th className="px-5 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {emRevisao.map((s) => (
                  <tr key={s.id} className="border-t border-border hover:bg-secondary/40">
                    <td className="px-5 py-3 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        {s.numero}
                        {s.isEditadoLocalmente && (
                          <span 
                            className="h-2 w-2 rounded-full bg-orange-500" 
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
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Finalizados por humanos */}
      <section className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <header className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-success" />
            <h2 className="font-semibold text-foreground">Revisados por humanos recentemente</h2>
          </div>
          <Link to="/seis" className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1">
            Ver todos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground bg-secondary/50">
                <th className="px-5 py-3 font-medium">SEI</th>
                <th className="px-5 py-3 font-medium">Assunto</th>
                <th className="px-5 py-3 font-medium">Revisado em</th>
                <th className="px-5 py-3 font-medium">Analista</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {revisadosHumanos.map((s) => (
                <tr key={s.id} className="border-t border-border hover:bg-secondary/40">
                  <td className="px-5 py-3 font-mono text-xs">{s.numero}</td>
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
            </tbody>
          </table>
        </div>
      </section>

      <UploadDraftModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
      />
    </AppLayout>
  );
};

export default Dashboard;