import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";

import { PriorityBadge, StatusBadge } from "@/components/shared/Badges";
import { Button } from "@/components/ui/button";
import { Pencil, Eye, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useDrafts } from "@/context/DraftsContext";
import { useProcessos } from "@/hooks/useProcessos";
import { Skeleton } from "@/components/ui/skeleton";

const MinhasAnalises = () => {
  const { user } = useAuth();
  const { drafts } = useDrafts();
  const { data: processos, isLoading, error } = useProcessos();

  // "Minhas análises" = SEIs onde o usuário atual é dono do rascunho (em revisão ou concluído)
  const meusIds = useMemo(() => {
    return Object.values(drafts)
      .filter((d) => user && d.ownerEmail === user.email)
      .map((d) => d.seiId);
  }, [drafts, user]);

  const minhas = useMemo(() => {
    if (!processos) return [];
    return processos.filter((s) => meusIds.includes(s.id));
  }, [processos, meusIds]);

  if (isLoading) {
    return <AppLayout title="Minhas Análises" subtitle="Carregando dados do backend..." />;
  }

  if (error) {
    return <AppLayout title="Minhas Análises" subtitle="Não foi possível carregar os dados do backend." />;
  }

  return (
    <AppLayout title="Minhas Análises" subtitle="SEIs que você revisou ou está revisando">
      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground bg-secondary/50">
              <th className="px-5 py-3 font-medium">SEI</th>
              <th className="px-5 py-3 font-medium">Assunto</th>
              <th className="px-5 py-3 font-medium">Prioridade</th>
              <th className="px-5 py-3 font-medium">Situação</th>
              <th className="px-5 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-5 py-4"><Skeleton className="h-4 w-28" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-48" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                  <td className="px-5 py-4 text-right"><Skeleton className="h-8 w-24 ml-auto rounded-md" /></td>
                </tr>
              ))
            ) : (
              minhas.map((s) => {
                const draft = drafts[s.id];
                const finalized = draft?.status === "Concluído";
                return (
                  <tr key={s.id} className="border-t border-border hover:bg-secondary/40">
                    <td className="px-5 py-3 font-mono text-xs">{s.numero}</td>
                    <td className="px-5 py-3">{s.assunto}</td>
                    <td className="px-5 py-3"><PriorityBadge value={s.prioridade} /></td>
                    <td className="px-5 py-3">
                      <StatusBadge value={finalized ? "Concluído" : "Em revisão"} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button asChild size="sm" variant={finalized ? "ghost" : "default"}>
                        <Link to={`/minutador/${s.id}`}>
                          {finalized ? (
                            <><Eye className="h-3.5 w-3.5 mr-1" /> Visualizar</>
                          ) : (
                            <><Pencil className="h-3.5 w-3.5 mr-1" /> Editar</>
                          )}
                        </Link>
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
            {!isLoading && minhas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                  <Lock className="h-4 w-4 inline mr-1" />
                  Você ainda não iniciou nenhuma análise. Vá em <Link to="/seis" className="text-primary font-medium hover:underline">SEIs</Link> para começar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
};

export default MinhasAnalises;
