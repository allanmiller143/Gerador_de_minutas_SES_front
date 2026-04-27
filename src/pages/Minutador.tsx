import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { seis, jurisprudencias } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, CheckCircle2, Save, Lock, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useDrafts } from "@/context/DraftsContext";

const etapas = ["Pré-análise IA", "Jurisprudências", "Minuta gerada", "Revisão humana"];

const Minutador = () => {
  const { id } = useParams();
  const sei = seis.find((s) => s.id === id) ?? seis[0];
  const { user } = useAuth();
  const { getDraft, saveDraft, finalizeDraft } = useDrafts();

  const existingDraft = getDraft(sei.id);

  // Todo SEI já entra pré-analisado pela IA (fluxo off-line). Não há loading.
  // Se já existe rascunho humano, carrega o texto editado.
  // Caso contrário, carrega a minuta sugerida pela IA, pronta para edição.
  const [minuta, setMinuta] = useState(
    existingDraft?.minuta ?? gerarMinuta(sei.numero, sei.assunto)
  );

  const isLockedByOther = !!existingDraft && !!user && existingDraft.ownerEmail !== user.email;
  const isFinalized = existingDraft?.status === "Concluído";
  const readOnly = isLockedByOther || isFinalized;

  // Etapa visual: em revisão/finalizado → 3, caso contrário → 2 (minuta pronta)
  const etapaAtual = existingDraft ? 3 : 2;

  const juris = useMemo(() => jurisprudencias.slice(0, 3), []);

  const handleSaveDraft = () => {
    if (!user) return;
    if (isLockedByOther) {
      toast.error("Esta análise pertence a outro usuário.");
      return;
    }
    saveDraft({ seiId: sei.id, minuta, ownerEmail: user.email, ownerName: user.name });
    toast.success("Rascunho salvo com sucesso.");
  };

  const handleFinalize = () => {
    if (!user) return;
    if (isLockedByOther) {
      toast.error("Esta análise pertence a outro usuário.");
      return;
    }
    saveDraft({ seiId: sei.id, minuta, ownerEmail: user.email, ownerName: user.name });
    finalizeDraft(sei.id);
    toast.success("Análise finalizada e marcada como concluída.");
  };

  return (
    <AppLayout title="Minutador de Resposta" subtitle={`SEI: ${sei.numero}`}>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm"><Link to="/seis"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Link></Button>
      </div>

      {/* Stepper */}
      <div className="bg-card border border-border rounded-xl shadow-card p-6 mb-6">
        <div className="flex items-center justify-between">
          {etapas.map((label, i) => {
            const active = i === etapaAtual;
            const complete = i < etapaAtual || isFinalized;
            return (
              <div key={label} className="flex-1 flex items-center">
                <div className="flex flex-col items-center text-center flex-1">
                  <div className={cn(
                    "h-9 w-9 rounded-full flex items-center justify-center font-semibold text-sm transition-colors",
                    complete ? "bg-success text-success-foreground" :
                    active ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                    "bg-secondary text-muted-foreground"
                  )}>
                    {complete ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <div className={cn("mt-2 text-xs font-medium max-w-[110px]", active ? "text-foreground" : "text-muted-foreground")}>
                    {label}
                  </div>
                </div>
                {i < etapas.length - 1 && (
                  <div className={cn("h-0.5 flex-1 -mt-6 mx-1", complete ? "bg-success" : "bg-border")} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Banner – pré-análise IA já realizada */}
      {!existingDraft && (
        <div className="mb-6 rounded-xl border border-primary/20 bg-accent/50 px-4 py-3 text-sm text-accent-foreground flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          Este processo já foi <strong className="mx-1">pré-analisado pela IA</strong>. Revise, ajuste e finalize a minuta abaixo.
        </div>
      )}

      <section className="bg-card border border-border rounded-xl shadow-card p-6">
        {isLockedByOther && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive px-4 py-3 text-sm flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Esta análise está sob responsabilidade de <strong className="mx-1">{existingDraft?.ownerName}</strong>. Você pode visualizar, mas não editar.
          </div>
        )}
        {isFinalized && !isLockedByOther && (
          <div className="mb-4 rounded-lg border border-success/30 bg-success/10 text-success px-4 py-3 text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Esta análise já foi finalizada.
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold">
              {isFinalized ? "Minuta finalizada" : readOnly ? "Minuta (somente leitura)" : "Minuta – pronta para edição"}
            </h2>
            {existingDraft && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Última atualização por {existingDraft.ownerName} em {new Date(existingDraft.updatedAt).toLocaleString("pt-BR")}
              </p>
            )}
          </div>
          {!readOnly && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSaveDraft}>
                <Save className="h-4 w-4 mr-2" /> Salvar rascunho
              </Button>
              <Button size="sm" onClick={handleFinalize}>
                <CheckCircle2 className="h-4 w-4 mr-2" /> Finalizar análise
              </Button>
            </div>
          )}
        </div>

        <textarea
          value={minuta}
          onChange={(e) => setMinuta(e.target.value)}
          readOnly={readOnly}
          className={cn(
            "w-full min-h-[420px] border border-border rounded-lg p-4 text-sm font-mono leading-relaxed bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-y",
            readOnly && "bg-secondary/40 cursor-not-allowed"
          )}
        />

        <div className="mt-4 p-4 bg-accent/40 rounded-lg">
          <div className="text-xs font-semibold text-accent-foreground uppercase tracking-wide mb-2">Jurisprudências referenciadas pela IA</div>
          <ul className="space-y-1 text-sm">
            {juris.map((j) => (
              <li key={j.id}>• <span className="font-medium">{j.tribunal} – {j.numero}</span> · {j.tema}</li>
            ))}
          </ul>
        </div>
      </section>
    </AppLayout>
  );
};

function gerarMinuta(numero: string, assunto: string) {
  return `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO

Processo SEI: ${numero}
Assunto: ${assunto}

A SECRETARIA DE ESTADO DA SAÚDE, por meio da Farmácia/Assistência Farmacêutica, vem, respeitosamente, apresentar manifestação nos autos em epígrafe, nos seguintes termos:

1. DO RELATÓRIO
Trata-se de demanda relativa ao fornecimento de medicamento/insumo, na qual a parte autora pleiteia providências junto ao Poder Público.

2. DA ANÁLISE TÉCNICO-FARMACÊUTICA
Após análise da documentação médica apresentada, verifica-se a necessidade de avaliação quanto à imprescindibilidade do tratamento, à existência de alternativas terapêuticas no SUS e à observância dos protocolos clínicos vigentes.

3. DO DIREITO
O entendimento dos tribunais superiores é consolidado no sentido de que o dever do Estado no fornecimento de medicamentos pressupõe a demonstração dos requisitos da imprescindibilidade, inexistência de alternativa fornecida pelo SUS e capacidade financeira, conforme Tema 793/STF e REsp 1.657.156/SP.

4. DA CONCLUSÃO
Ante o exposto, manifesta-se pela observância dos requisitos legais e jurisprudenciais indicados, submetendo-se a presente minuta à revisão da coordenação.

Atenciosamente,
Analista – Farmácia da SES.`;
}

export default Minutador;
