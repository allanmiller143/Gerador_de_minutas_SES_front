import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { seis } from "@/data/mock";
import { PriorityBadge, StatusBadge } from "@/components/shared/Badges";
import { Button } from "@/components/ui/button";

const MinhasAnalises = () => {
  const minhas = seis.filter((s) => s.analista === "Mariana Costa" || s.status === "Em elaboração");
  return (
    <AppLayout title="Minhas Análises" subtitle="SEIs sob sua responsabilidade">
      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground bg-secondary/50">
              <th className="px-5 py-3 font-medium">SEI</th>
              <th className="px-5 py-3 font-medium">Assunto</th>
              <th className="px-5 py-3 font-medium">Prioridade</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {minhas.map((s) => (
              <tr key={s.id} className="border-t border-border hover:bg-secondary/40">
                <td className="px-5 py-3 font-mono text-xs">{s.numero}</td>
                <td className="px-5 py-3">{s.assunto}</td>
                <td className="px-5 py-3"><PriorityBadge value={s.prioridade} /></td>
                <td className="px-5 py-3"><StatusBadge value={s.status} /></td>
                <td className="px-5 py-3 text-right"><Button asChild size="sm"><Link to={`/minutador/${s.id}`}>Continuar</Link></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
};

export default MinhasAnalises;
