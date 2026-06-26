import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { getEffectiveSei, type Priority } from "@/data/mock";
import { useSeiDetail } from "@/services/domainData";
import { PriorityBadge, StatusBadge, OriginBadge } from "@/components/shared/Badges";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileEdit, Flag, Scale, Bot, Eye, Sparkles } from "lucide-react";
import { useDrafts } from "@/context/DraftsContext";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const SeiDetail = () => {
  const { id } = useParams();
  const { data, isLoading, error } = useSeiDetail(id);
  const { drafts, priorities, getEvents, changePriority } = useDrafts();
  const { user } = useAuth();
  const base = data?.sei;
  const sei = base ? getEffectiveSei(base, drafts, priorities) : undefined;

  const [priorityOpen, setPriorityOpen] = useState(false);
  const [newPriority, setNewPriority] = useState<Priority>(sei?.prioridade ?? "Média");

  const draft = sei ? drafts[sei.id] : undefined;
  const events = useMemo(() => (sei ? getEvents(sei.id) : []), [sei, getEvents]);

  const juris = data?.jurisprudencias ?? [];

  if (isLoading) {
    return <AppLayout title="Carregando SEI" subtitle="Buscando dados do backend..." />;
  }

  if (error || !sei || !base) {
    return (
      <AppLayout title="SEI não encontrado">
        <Button asChild variant="outline"><Link to="/seis"><ArrowLeft className="h-4 w-4 mr-2" /> Voltar</Link></Button>
      </AppLayout>
    );
  }

  // Texto da minuta exibido no detalhe (somente leitura aqui):
  // se há rascunho humano, mostra a versão atual; senão, uma prévia da sugestão da IA.
  const minutaPreview = draft?.minuta ?? data?.minuta ?? sei.iaSugestao;

  // Histórico completo: eventos base + eventos dinâmicos
  const baseHistorico = [
    { at: sei.dataRecebimento, evento: "SEI recebido", ator: "Sistema" },
    { at: sei.dataPreAnalise, evento: "Pré-análise concluída pela IA", ator: "IA · Farmácia SES", detail: `Confiança ${Math.round(sei.iaConfidence * 100)}%` },
  ];
  const dynamicHistorico = events.map((e) => ({
    at: new Date(e.at).toLocaleString("pt-BR"),
    evento: e.detail ?? e.type,
    ator: e.actor,
  }));
  const historico = [...baseHistorico, ...dynamicHistorico];

  const handleChangePriority = () => {
    if (!user) return;
    if (newPriority === sei.prioridade) {
      setPriorityOpen(false);
      return;
    }
    changePriority(sei.id, newPriority, user.name, user.email, sei.prioridade);
    toast.success(`Prioridade alterada para ${newPriority}.`);
    setPriorityOpen(false);
  };

  return (
    <AppLayout title={`SEI ${sei.numero}`} subtitle={sei.assunto}>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm"><Link to="/seis"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Link></Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Metadados */}
          <section className="bg-card border border-border rounded-xl shadow-card p-6">
            <h2 className="font-semibold mb-4">Metadados do processo</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><dt className="text-xs text-muted-foreground">Número</dt><dd className="font-mono">{sei.numero}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Assunto</dt><dd>{sei.assunto}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Partes</dt><dd>{sei.partes ?? "—"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Recebimento</dt><dd>{sei.dataRecebimento}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Pré-análise</dt><dd>{sei.dataPreAnalise}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Revisado em</dt><dd>{sei.dataRevisao ?? "—"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Prioridade</dt><dd><PriorityBadge value={sei.prioridade} /></dd></div>
              <div><dt className="text-xs text-muted-foreground">Status</dt><dd className="flex items-center gap-2"><StatusBadge value={sei.status} /><OriginBadge origin={sei.status === "Concluído" ? "humano" : "ia"} /></dd></div>
              <div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">Analista responsável</dt><dd>{sei.analista ?? "— (ainda não atribuído)"}</dd></div>
            </dl>
          </section>

          {/* Resumo */}
          <section className="bg-card border border-border rounded-xl shadow-card p-6">
            <h2 className="font-semibold mb-3">Resumo do processo</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {sei.resumo ?? "Nenhum resumo registrado."}
            </p>
          </section>

          {/* Prévia da minuta */}
          <section className="bg-card border border-border rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {draft ? <Eye className="h-4 w-4 text-primary" /> : <Sparkles className="h-4 w-4 text-primary" />}
                <h2 className="font-semibold">
                  {draft ? "Minuta atual (prévia)" : "Sugestão de minuta gerada pela IA"}
                </h2>
              </div>
              <span className="text-xs text-muted-foreground">Somente leitura</span>
            </div>
            <div className="border border-border rounded-lg p-4 bg-secondary/30 max-h-80 overflow-auto">
              <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed text-foreground/90">
{minutaPreview}
              </pre>
            </div>
          </section>

          {/* Jurisprudências */}
          <section className="bg-card border border-border rounded-xl shadow-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Jurisprudências encontradas pela IA</h2>
            </div>
            <ul className="space-y-3">
              {juris.map((j) => (
                <li key={j.id} className="border border-border rounded-lg p-4 hover:bg-secondary/40 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-primary">{j.tribunal}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{j.numero}</span>
                  </div>
                  <div className="text-sm font-medium mb-1">{j.tema}</div>
                  <p className="text-xs text-muted-foreground">{j.resumo}</p>
                </li>
              ))}
              {juris.length === 0 && (
                <li className="text-sm text-muted-foreground">Nenhuma jurisprudência associada.</li>
              )}
            </ul>
          </section>

          {/* Histórico */}
          <section className="bg-card border border-border rounded-xl shadow-card p-6">
            <h2 className="font-semibold mb-4">Histórico</h2>
            <ol className="relative border-l border-border ml-2 space-y-4">
              {historico.map((h, i) => (
                <li key={i} className="ml-4">
                  <span className="absolute -left-1.5 h-3 w-3 rounded-full bg-primary" />
                  <div className="text-sm font-medium">{h.evento}</div>
                  <div className="text-xs text-muted-foreground">
                    {h.at} · {h.ator}
                    {"detail" in h && h.detail ? ` · ${h.detail}` : ""}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-3">
          <Button asChild className="w-full">
            <Link to={`/minutador/${sei.id}`}>
              <FileEdit className="h-4 w-4 mr-2" />
              {sei.status === "Concluído" ? "Visualizar minuta" : "Editar minuta"}
            </Link>
          </Button>
          <Button
            variant="outline"
            className="w-full"
            disabled={sei.status === "Concluído"}
            title={sei.status === "Concluído" ? "Processo já analisado – prioridade bloqueada" : undefined}
            onClick={() => { setNewPriority(sei.prioridade); setPriorityOpen(true); }}
          >
            <Flag className="h-4 w-4 mr-2" /> Alterar prioridade
          </Button>
          {sei.status === "Concluído" && (
            <p className="text-[11px] text-muted-foreground text-center -mt-1">
              A prioridade não pode ser alterada em processos já analisados.
            </p>
          )}

          {/* Card resumo IA */}
          <div className="bg-card border border-border rounded-xl shadow-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Avaliação da IA</h3>
            </div>
            <div className="text-xs text-muted-foreground mb-1">Confiança</div>
            <div className="text-2xl font-semibold text-foreground mb-2">{Math.round(sei.iaConfidence * 100)}%</div>
            <p className="text-xs text-muted-foreground">{sei.iaSugestao}</p>
          </div>
        </aside>
      </div>

      {/* Modal – alterar prioridade */}
      <Dialog open={priorityOpen} onOpenChange={setPriorityOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar prioridade</DialogTitle>
            <DialogDescription>
              Defina o novo nível de prioridade para o processo <span className="font-mono">{sei.numero}</span>.
            </DialogDescription>
          </DialogHeader>
          <RadioGroup value={newPriority} onValueChange={(v) => setNewPriority(v as Priority)} className="py-2">
            {(["Alta", "Média", "Baixa"] as Priority[]).map((p) => (
              <div key={p} className="flex items-center space-x-2 border border-border rounded-lg p-3 hover:bg-secondary/40">
                <RadioGroupItem value={p} id={`p-${p}`} />
                <Label htmlFor={`p-${p}`} className="flex-1 cursor-pointer flex items-center justify-between">
                  <span>{p}</span>
                  <PriorityBadge value={p} />
                </Label>
              </div>
            ))}
          </RadioGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPriorityOpen(false)}>Cancelar</Button>
            <Button onClick={handleChangePriority}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default SeiDetail;
