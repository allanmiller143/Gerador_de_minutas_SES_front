import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/shared/MetricCard";
import { Clock, TrendingUp, FileStack } from "lucide-react";

const tipos = [
  { tipo: "Fornecimento de medicamento", qtd: 82, pct: 64 },
  { tipo: "Medicamento de alto custo", qtd: 28, pct: 22 },
  { tipo: "Insumo para diabetes", qtd: 10, pct: 8 },
  { tipo: "Fórmula nutricional", qtd: 8, pct: 6 },
];

const porStatus = [
  { status: "Pré-analisado (IA)", qtd: 47 },
  { status: "Em revisão", qtd: 12 },
  { status: "Revisado", qtd: 32 },
  { status: "Enviado", qtd: 88 },
];

const Relatorios = () => (
  <AppLayout title="Relatórios" subtitle="Indicadores de desempenho da análise de SEIs">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <MetricCard label="SEIs no período" value={187} hint="Últimos 30 dias" icon={FileStack} tone="primary" />
      <MetricCard label="Tempo médio de análise" value="2,4 dias" hint="Mediana: 2 dias" icon={Clock} tone="info" />
      <MetricCard label="Taxa de aprovação" value="94%" hint="Últimos 30 dias" icon={TrendingUp} tone="success" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section className="bg-card border border-border rounded-xl shadow-card p-6">
        <h2 className="font-semibold mb-4">SEIs por status</h2>
        <ul className="space-y-3">
          {porStatus.map((s) => (
            <li key={s.status}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>{s.status}</span>
                <span className="font-semibold">{s.qtd}</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-gradient-primary" style={{ width: `${Math.min(100, (s.qtd / 90) * 100)}%` }} />
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
  </AppLayout>
);

export default Relatorios;
