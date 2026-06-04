import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/shared/MetricCard";
import { PriorityBadge, StatusBadge, OriginBadge } from "@/components/shared/Badges";
import { Bot, UserCheck, Send, FileStack, ArrowRight, Eye, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useDashboard } from "@/hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { data, metrics, isLoading } = useDashboard();

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
      <div className="mb-6 rounded-xl border border-border bg-gradient-to-r from-accent/60 to-card p-4 flex items-start gap-3">
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
                      <span>{s.assunto}</span>
                      <OriginBadge origin="ia" />
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{s.dataRecebimento}</td>
                  <td className="px-5 py-3"><PriorityBadge value={s.prioridade} /></td>
                  <td className="px-5 py-3 w-40">
                    <div className="flex items-center gap-2">
                      <Progress value={s.iaConfidence * 100} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground w-9 text-right">{Math.round(s.iaConfidence * 100)}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button asChild size="sm">
                      <Link to={`/minutador/${s.id}`}>Revisar</Link>
                    </Button>
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
                    <td className="px-5 py-3">{s.assunto}</td>
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
                      <span>{s.assunto}</span>
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
    </AppLayout>
  );
};

export default Dashboard;