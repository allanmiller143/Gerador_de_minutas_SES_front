import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/shared/MetricCard";
import { PriorityBadge, StatusBadge } from "@/components/shared/Badges";
import { metrics, seis } from "@/data/mock";
import { CheckCircle2, Clock, FileEdit, FileStack, ArrowRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const pendentes = seis.filter((s) => s.status === "Pendente");
  const recentes = seis.filter((s) => s.dataAnalise).slice(0, 4);

  return (
    <AppLayout title="Dashboard" subtitle="Visão geral da análise de processos">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="SEIs analisados" value={metrics.analisados30d} hint="Últimos 30 dias" icon={CheckCircle2} tone="success" />
        <MetricCard label="SEIs pendentes" value={metrics.pendentes} hint="Aguardando análise" icon={Clock} tone="warning" />
        <MetricCard label="Em elaboração" value={metrics.emElaboracao} hint="Minutas em andamento" icon={FileEdit} tone="info" />
        <MetricCard label="Total de SEIs" value={metrics.total30d} hint="Últimos 30 dias" icon={FileStack} tone="primary" />
      </div>

      <section className="bg-card border border-border rounded-xl shadow-card mb-6 overflow-hidden">
        <header className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">SEIs pendentes de análise</h2>
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
                <th className="px-5 py-3 font-medium">Data de recebimento</th>
                <th className="px-5 py-3 font-medium">Prioridade</th>
                <th className="px-5 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pendentes.map((s) => (
                <tr key={s.id} className="border-t border-border hover:bg-secondary/40 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-foreground">{s.numero}</td>
                  <td className="px-5 py-3">{s.assunto}</td>
                  <td className="px-5 py-3 text-muted-foreground">{s.dataRecebimento}</td>
                  <td className="px-5 py-3"><PriorityBadge value={s.prioridade} /></td>
                  <td className="px-5 py-3 text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/minutador/${s.id}`}>Analisar</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <header className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">SEIs analisados recentemente</h2>
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
                <th className="px-5 py-3 font-medium">Data da análise</th>
                <th className="px-5 py-3 font-medium">Analista</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {recentes.map((s) => (
                <tr key={s.id} className="border-t border-border hover:bg-secondary/40 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs">{s.numero}</td>
                  <td className="px-5 py-3">{s.assunto}</td>
                  <td className="px-5 py-3 text-muted-foreground">{s.dataAnalise}</td>
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
