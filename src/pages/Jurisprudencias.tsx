import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useJurisprudencias } from "@/services/domainData";
import { Input } from "@/components/ui/input";
import { Star, ExternalLink, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const Jurisprudencias = () => {
  const [q, setQ] = useState("");
  const [tribunal, setTribunal] = useState<string>("Todos");
  const { data: jurisprudencias = [], isLoading, error } = useJurisprudencias();
  const tribunais = ["Todos", ...Array.from(new Set(jurisprudencias.map((j) => j.tribunal)))];

  const filtered = useMemo(() => jurisprudencias.filter((j) => {
    const mq = !q || j.tema.toLowerCase().includes(q.toLowerCase()) || j.resumo.toLowerCase().includes(q.toLowerCase()) || j.numero.includes(q);
    const mt = tribunal === "Todos" || j.tribunal === tribunal;
    return mq && mt;
  }), [q, tribunal, jurisprudencias]);

  if (isLoading) {
    return <AppLayout title="Jurisprudências" subtitle="Carregando dados do backend..." />;
  }

  if (error) {
    return <AppLayout title="Jurisprudências" subtitle="Não foi possível carregar os dados do backend." />;
  }

  return (
    <AppLayout title="Jurisprudências" subtitle="Base interna de decisões aplicáveis à Assistência Farmacêutica">
      <div className="bg-card border border-border rounded-xl shadow-card p-4 mb-6 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por palavras-chave, tema ou número..." className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {tribunais.map((t) => (
            <button key={t} onClick={() => setTribunal(t)}
              className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                tribunal === t ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-secondary")}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((j) => (
          <article key={j.id} className="bg-card border border-border rounded-xl shadow-card p-5 hover:shadow-elevated transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-bold">{j.tribunal}</span>
                <span className="text-xs text-muted-foreground font-mono">{j.numero}</span>
              </div>
              {j.preferencial && <Star className="h-4 w-4 fill-warning text-warning" />}
            </div>
            <h3 className="font-semibold text-foreground mb-2">{j.tema}</h3>
            <p className="text-sm text-muted-foreground italic leading-relaxed">"{j.resumo}"</p>
            <div className="flex items-center justify-between mt-4">
              <div className="flex flex-wrap gap-1">
                {j.tags.map((t) => <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">{t}</span>)}
              </div>
              <a href={j.link} className="text-xs text-primary font-medium inline-flex items-center gap-1 hover:underline">
                Ver detalhes <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </article>
        ))}
      </div>
    </AppLayout>
  );
};

export default Jurisprudencias;
