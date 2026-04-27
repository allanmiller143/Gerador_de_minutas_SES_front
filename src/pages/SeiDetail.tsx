import { Link, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { seis, getEffectiveSei } from "@/data/mock";
import { PriorityBadge, StatusBadge } from "@/components/shared/Badges";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileEdit, PlayCircle } from "lucide-react";
import { useDrafts } from "@/context/DraftsContext";

const SeiDetail = () => {
  const { id } = useParams();
  const { drafts } = useDrafts();
  const base = seis.find((s) => s.id === id);
  const sei = base ? getEffectiveSei(base, drafts) : undefined;

  if (!sei) {
    return (
      <AppLayout title="SEI não encontrado">
        <Button asChild variant="outline"><Link to="/seis"><ArrowLeft className="h-4 w-4 mr-2" /> Voltar</Link></Button>
      </AppLayout>
    );
  }

  const historico = [
    { data: sei.dataRecebimento, evento: "SEI recebido", ator: "Sistema" },
    { data: sei.dataPreAnalise, evento: "Pré-análise concluída pela IA", ator: "IA · Farmácia SES" },
    ...(sei.status === "Em revisão" ? [{ data: sei.dataPreAnalise, evento: "Revisão humana iniciada", ator: sei.analista ?? "Analista" }] : []),
    ...(sei.dataRevisao ? [{ data: sei.dataRevisao, evento: `Status atualizado para ${sei.status}`, ator: sei.analista ?? "Analista" }] : []),
  ];

  return (
    <AppLayout title={`SEI ${sei.numero}`} subtitle={sei.assunto}>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm"><Link to="/seis"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Link></Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-card border border-border rounded-xl shadow-card p-6">
            <h2 className="font-semibold mb-4">Metadados do processo</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><dt className="text-xs text-muted-foreground">Número</dt><dd className="font-mono">{sei.numero}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Assunto</dt><dd>{sei.assunto}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Partes</dt><dd>{sei.partes ?? "—"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Recebimento</dt><dd>{sei.dataRecebimento}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Prioridade</dt><dd><PriorityBadge value={sei.prioridade} /></dd></div>
              <div><dt className="text-xs text-muted-foreground">Status</dt><dd><StatusBadge value={sei.status} /></dd></div>
            </dl>
          </section>

          <section className="bg-card border border-border rounded-xl shadow-card p-6">
            <h2 className="font-semibold mb-3">Resumo do processo</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {sei.resumo ?? "Nenhum resumo registrado ainda. Utilize a função 'Editar dados do SEI' para adicionar as principais peças do processo."}
            </p>
          </section>

          <section className="bg-card border border-border rounded-xl shadow-card p-6">
            <h2 className="font-semibold mb-4">Histórico</h2>
            <ol className="relative border-l border-border ml-2 space-y-4">
              {historico.map((h, i) => (
                <li key={i} className="ml-4">
                  <span className="absolute -left-1.5 h-3 w-3 rounded-full bg-primary" />
                  <div className="text-sm font-medium">{h.evento}</div>
                  <div className="text-xs text-muted-foreground">{h.data} · {h.ator}</div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-3">
          <Button asChild className="w-full"><Link to={`/minutador/${sei.id}`}><PlayCircle className="h-4 w-4 mr-2" /> Iniciar análise</Link></Button>
          <Button variant="outline" className="w-full"><FileEdit className="h-4 w-4 mr-2" /> Editar dados do SEI</Button>
          <Button variant="ghost" className="w-full">Alterar status</Button>
        </aside>
      </div>
    </AppLayout>
  );
};

export default SeiDetail;
