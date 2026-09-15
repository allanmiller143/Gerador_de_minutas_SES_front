import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/shared/MetricCard";
import { Clock, TrendingUp, FileStack } from "lucide-react";
import { api } from "@/lib/api";

interface DiaQtd { dia: string; qtd: number; }

interface MetricasEquipe {
  recebidos_por_dia: DiaQtd[];
  finalizados_por_dia: DiaQtd[];
  tempo_medio_em_pre_analise_dias: number;
  falhas_ia: number;
  pendentes: number;
}

interface RelatorioMetrics {
  periodo: string;
  total: number;
  tempo_medio_dias: number;
  taxa_aprovacao: number;
  por_status: { status: string; qtd: number }[];
  metricas_equipe: MetricasEquipe;
}

const Relatorios = () => {
  const [metrics, setMetrics] = useState<RelatorioMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api<RelatorioMetrics>("/processos/relatorios/metrics")
      .then(setMetrics)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const maxStatus = Math.max(...(metrics?.por_status.map(s => s.qtd) ?? [1]));
  const total_por_status = metrics.por_status.reduce((acc, s) => acc + s.qtd, 0);

  const maxRecebidos = Math.max(...(metrics?.metricas_equipe.recebidos_por_dia.map(d => d.qtd) ?? [1]));
  const maxFinalizados = Math.max(...(metrics?.metricas_equipe.finalizados_por_dia.map(d => d.qtd) ?? [1]));

  const formatDia = (iso: string) => {
    const [, mes, dia] = iso.split("-");
    return `${dia}/${mes}`;
  };

  return (
    <AppLayout title="Relatórios" subtitle="Indicadores de desempenho da análise de SEIs">
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : !metrics ? (
        <p className="text-muted-foreground text-sm">Não foi possível carregar os relatórios.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <MetricCard label="SEIs no período" value={metrics.total} hint={metrics.periodo} icon={FileStack} tone="primary" />
            <MetricCard label="Tempo médio de análise" value={`${metrics.tempo_medio_dias} dias`} hint="Baseado em processos concluídos" icon={Clock} tone="info" />
            <MetricCard label="Taxa de aprovação" value={`${metrics.taxa_aprovacao}%`} hint={metrics.periodo} icon={TrendingUp} tone="success" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <section className="bg-card border border-border rounded-xl shadow-card p-6 lg:col-span-1">
              <h2 className="font-semibold mb-4">SEIs por status</h2>
              <ul className="space-y-3">
                {metrics.por_status.map((s) => {
                  const pct = metrics.total > 0 ? Math.round((s.qtd / total_por_status) * 100) : 0;
                  return (
                    <li key={s.status}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>{s.status}</span>
                        <span className="font-semibold">{s.qtd} <span className="text-muted-foreground font-normal">({pct}%)</span></span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-primary" style={{ width: `${Math.min(100, (s.qtd / maxStatus) * 100)}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="bg-card border border-border rounded-xl shadow-card p-6 space-y-5 lg:col-span-3">
              <h2 className="font-semibold">Métricas da equipe</h2>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Recebidos por dia (últimos 7 dias)</p>
                <ul className="space-y-2">
                  {metrics.metricas_equipe.recebidos_por_dia.map((d) => (
                    <li key={d.dia}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>{formatDia(d.dia)}</span>
                        <span className="font-semibold">{d.qtd}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${Math.min(100, (d.qtd / maxRecebidos) * 100)}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Finalizados por dia (últimos 7 dias)</p>
                <ul className="space-y-2">
                  {metrics.metricas_equipe.finalizados_por_dia.map((d) => (
                    <li key={d.dia}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>{formatDia(d.dia)}</span>
                        <span className="font-semibold">{d.qtd}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-success" style={{ width: `${Math.min(100, (d.qtd / metrics.total) * 100)}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Tempo médio de espera em Pré-análise</p>
                  <p className="text-lg font-bold">{metrics.metricas_equipe.tempo_medio_em_pre_analise_dias} dias</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Falhas na IA</p>
                  <p className="text-lg font-bold text-destructive">{metrics.metricas_equipe.falhas_ia}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Processos pendentes</p>
                  <p className="text-lg font-bold text-amber-500">{metrics.metricas_equipe.pendentes}</p>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </AppLayout>
  );
};

export default Relatorios;