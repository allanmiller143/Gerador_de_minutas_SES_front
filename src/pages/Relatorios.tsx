import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/shared/MetricCard";
import { Clock, TrendingUp, FileStack } from "lucide-react";
import { api } from "@/lib/api";

interface RelatorioMetrics {
  periodo: string;
  total: number;
  tempo_medio_dias: number;
  taxa_aprovacao: number;
  por_status: { status: string; qtd: number }[];
}

// Dados mockados !!! 
// Definir a maneira de pegar os TIPOS das demandas 
var tipos = [
  { tipo: "Solicitação de medicamentos", qtd: 120, pct: 30 },
  { tipo: "Requisição de documentos", qtd: 80, pct: 20 },
  { tipo: "Pedido de revisão", qtd: 60, pct: 15 },
  { tipo: "Outros", qtd: 140, pct: 35 },
];

const Relatorios = () => {
  const [metrics, setMetrics] = useState<RelatorioMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api<RelatorioMetrics>("/processos/relatorios/metrics")
      .then(setMetrics)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const maxQtd = Math.max(...(metrics?.por_status.map(s => s.qtd) ?? [1]));

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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-card border border-border rounded-xl shadow-card p-6">
              <h2 className="font-semibold mb-4">SEIs por status</h2>
              <ul className="space-y-3">
                {metrics.por_status.map((s) => (
                  <li key={s.status}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{s.status}</span>
                      <span className="font-semibold">{s.qtd}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-primary" style={{ width: `${Math.min(100, (s.qtd / metrics.total) * 100)}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="bg-card border border-border rounded-xl shadow-card p-6">
            <h2 className="font-semibold mb-4">Tipos de demandas mais frequentes</h2>
            <ul className="space-y-3">
              {tipos.map((t) => (
                <li key={t.tipo}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>{t.tipo}</span>
                    <span className="font-semibold">{t.qtd} ({t.pct}%)</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${t.pct}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            </section>
        </div>
      </>
      )}
    </AppLayout>
  );
};

export default Relatorios;
