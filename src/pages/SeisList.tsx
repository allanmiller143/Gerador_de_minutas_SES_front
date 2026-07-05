import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { PriorityBadge, StatusBadge } from "@/components/shared/Badges";
import { type SeiStatus } from "@/data/mock";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";
import { useProcessos } from "@/hooks/useProcessos";
import { Skeleton } from "@/components/ui/skeleton";

const statusOptions: (SeiStatus | "Todos")[] = ["Todos", "Pré-análise", "Em revisão", "Concluído"];

const SeisList = () => {
  const { data: processos, isLoading, error } = useProcessos();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("Todos");

  const filtered = useMemo(() => {
    if (!processos) return [];
    return processos.filter((s) => {
      const matchQ = !q || s.numero.includes(q) || s.assunto.toLowerCase().includes(q.toLowerCase());
      const matchS = status === "Todos" || s.status === status;
      return matchQ && matchS;
    });
  }, [processos, q, status]);

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
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-5 py-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="px-5 py-4 text-right"><Skeleton className="h-8 w-24 ml-auto rounded-md" /></td>
                  </tr>
                ))
              ) :
                filtered.map((s) => (
                  <tr key={s.id} className="border-t border-border hover:bg-secondary/40">
                    <td className="px-5 py-3 font-mono text-xs">{s.numero}</td>
                    <td className="px-5 py-3">{s.assunto}</td>
                    <td className="px-5 py-3 text-muted-foreground">{s.dataRecebimento}</td>
                    <td className="px-5 py-3"><PriorityBadge value={s.prioridade} /></td>
                    <td className="px-5 py-3"><StatusBadge value={s.status} /></td>
                    <td className="px-5 py-3 text-right space-x-2">
                      <Button asChild size="sm" variant="ghost"><Link to={`/seis/${s.id}`}>Detalhes</Link></Button>
                      {s.status !== "Concluído" && (
                        s.status_processamento === "Processando" ? (
                          <Button size="sm" disabled className="cursor-not-allowed">
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Analisando
                          </Button>
                        ) : (
                          <Button asChild size="sm">
                            <Link to={`/minutador/${s.id}`}>
                              {s.status === "Em revisão" ? "Continuar" : "Analisar"}
                            </Link>
                          </Button>
                        )
                      )}
                    </td>
                  </tr>
                ))
              }
              {!isLoading && filtered.length === 0 && (
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
