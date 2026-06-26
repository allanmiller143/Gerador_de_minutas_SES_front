import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { PriorityBadge, StatusBadge } from "@/components/shared/Badges";
import { getEffectiveList, type SeiStatus } from "@/data/mock";
import { useSeis } from "@/services/domainData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useDrafts } from "@/context/DraftsContext";

const statusOptions: (SeiStatus | "Todos")[] = ["Todos", "Pré-análise", "Em revisão", "Concluído"];

const SeisList = () => {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("Todos");
  const { drafts, priorities } = useDrafts();
  const { data: seis = [], isLoading, error } = useSeis();

  const filtered = useMemo(() => {
    return getEffectiveList(seis, drafts, priorities).filter((s) => {
      const matchQ = !q || s.numero.includes(q) || s.assunto.toLowerCase().includes(q.toLowerCase());
      const matchS = status === "Todos" || s.status === status;
      return matchQ && matchS;
    });
  }, [q, status, drafts, priorities, seis]);

  if (isLoading) {
    return <AppLayout title="SEIs" subtitle="Carregando dados do backend..." />;
  }

  if (error) {
    return <AppLayout title="SEIs" subtitle="Não foi possível carregar os dados do backend." />;
  }

  return (
    <AppLayout title="SEIs" subtitle="Processos SEI cadastrados no sistema">
      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="p-4 flex flex-col md:flex-row gap-3 md:items-center border-b border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por número ou assunto..." className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="md:w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              {statusOptions.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground bg-secondary/50">
                <th className="px-5 py-3 font-medium">SEI</th>
                <th className="px-5 py-3 font-medium">Assunto</th>
                <th className="px-5 py-3 font-medium">Recebimento</th>
                <th className="px-5 py-3 font-medium">Prioridade</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-t border-border hover:bg-secondary/40">
                  <td className="px-5 py-3 font-mono text-xs">{s.numero}</td>
                  <td className="px-5 py-3">{s.assunto}</td>
                  <td className="px-5 py-3 text-muted-foreground">{s.dataRecebimento}</td>
                  <td className="px-5 py-3"><PriorityBadge value={s.prioridade} /></td>
                  <td className="px-5 py-3"><StatusBadge value={s.status} /></td>
                  <td className="px-5 py-3 text-right space-x-2">
                    <Button asChild size="sm" variant="ghost"><Link to={`/seis/${s.id}`}>Detalhes</Link></Button>
                    {s.status !== "Concluído" && (
                      <Button asChild size="sm">
                        <Link to={`/minutador/${s.id}`}>
                          {s.status === "Em revisão" ? "Continuar" : "Analisar"}
                        </Link>
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">Nenhum SEI encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
};

export default SeisList;
