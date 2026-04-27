import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { seis, jurisprudencias } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, FileText, Loader2, Send, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const etapas = ["Analisando processo", "Buscando jurisprudências", "Gerando minuta", "Revisão humana"];

const processingSteps = [
  "Leitura do processo (SEI)",
  "Extração de informações relevantes",
  "Busca de jurisprudências",
  "Organização das referências",
  "Geração da minuta",
];

const Minutador = () => {
  const { id } = useParams();
  const sei = seis.find((s) => s.id === id) ?? seis[0];

  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [etapa, setEtapa] = useState(0);
  const [minuta, setMinuta] = useState("");

  // Simula o processamento da IA
  useEffect(() => {
    setProgress(0);
    setCurrentStep(0);
    setEtapa(0);
    setMinuta("");

    const interval = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + 4);
        const stepIdx = Math.min(processingSteps.length - 1, Math.floor((next / 100) * processingSteps.length));
        setCurrentStep(stepIdx);
        if (next < 25) setEtapa(0);
        else if (next < 55) setEtapa(1);
        else if (next < 95) setEtapa(2);
        else setEtapa(3);
        if (next >= 100) {
          clearInterval(interval);
          setMinuta(gerarMinuta(sei.numero, sei.assunto));
        }
        return next;
      });
    }, 180);
    return () => clearInterval(interval);
  }, [sei.numero, sei.assunto]);

  const done = progress >= 100;
  const juris = useMemo(() => jurisprudencias.slice(0, 3), []);

  return (
    <AppLayout title="Minutador de Resposta" subtitle={`SEI: ${sei.numero}`}>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm"><Link to="/seis"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Link></Button>
      </div>

      {/* Stepper */}
      <div className="bg-card border border-border rounded-xl shadow-card p-6 mb-6">
        <div className="flex items-center justify-between">
          {etapas.map((label, i) => {
            const active = i === etapa;
            const complete = i < etapa || done;
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

      {!done ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-card border border-border rounded-xl shadow-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
              <h2 className="font-semibold">Processando...</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-5">Estamos analisando o processo e buscando jurisprudências aplicáveis.</p>

            <ul className="space-y-3 mb-6">
              {processingSteps.map((step, i) => {
                const state = i < currentStep ? "done" : i === currentStep ? "run" : "wait";
                return (
                  <li key={step} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {state === "done" && <Check className="h-4 w-4 text-success" />}
                      {state === "run" && <Loader2 className="h-4 w-4 text-primary animate-spin" />}
                      {state === "wait" && <div className="h-4 w-4 rounded-full border-2 border-border" />}
                      <span className={cn(state === "wait" && "text-muted-foreground")}>{step}</span>
                    </div>
                    <span className={cn("text-xs font-medium",
                      state === "done" && "text-success",
                      state === "run" && "text-primary",
                      state === "wait" && "text-muted-foreground"
                    )}>
                      {state === "done" ? "Concluído" : state === "run" ? "Em andamento" : "Aguardando"}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-gradient-primary transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Isso pode levar alguns segundos. Aguarde...</span>
              <span className="font-semibold text-primary">{progress}%</span>
            </div>
          </section>

          <section className="bg-card border border-border rounded-xl shadow-card p-6">
            <h2 className="font-semibold mb-4">Prévia das jurisprudências encontradas ({juris.length})</h2>
            <ul className="space-y-4">
              {juris.map((j) => (
                <li key={j.id} className="pb-4 border-b border-border last:border-0 last:pb-0">
                  <div className="text-sm font-semibold text-foreground">{j.tribunal} – {j.numero}</div>
                  <p className="text-sm text-muted-foreground italic mt-1">"{j.resumo}"</p>
                  <a href={j.link} className="text-xs text-primary font-medium mt-1 inline-block hover:underline">Ver detalhes</a>
                </li>
              ))}
            </ul>
            <Link to="/jurisprudencias" className="text-sm text-primary font-medium mt-4 inline-block hover:underline">
              Ver todas as jurisprudências encontradas
            </Link>
          </section>

          <div className="lg:col-span-2 bg-accent/50 border border-accent rounded-xl px-4 py-3 text-sm text-accent-foreground flex items-center gap-2">
            <FileText className="h-4 w-4" />
            A minuta será apresentada na próxima etapa para revisão e edição.
          </div>
        </div>
      ) : (
        <section className="bg-card border border-border rounded-xl shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Minuta gerada – pronta para revisão</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => toast.success("Rascunho salvo")}>
                <Save className="h-4 w-4 mr-2" /> Salvar rascunho
              </Button>
              <Button size="sm" onClick={() => toast.success("Minuta enviada para revisão do coordenador")}>
                <Send className="h-4 w-4 mr-2" /> Enviar para revisão
              </Button>
            </div>
          </div>

          <textarea
            value={minuta}
            onChange={(e) => setMinuta(e.target.value)}
            className="w-full min-h-[420px] border border-border rounded-lg p-4 text-sm font-mono leading-relaxed bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          />

          <div className="mt-4 p-4 bg-accent/40 rounded-lg">
            <div className="text-xs font-semibold text-accent-foreground uppercase tracking-wide mb-2">Jurisprudências referenciadas</div>
            <ul className="space-y-1 text-sm">
              {juris.map((j) => (
                <li key={j.id}>• <span className="font-medium">{j.tribunal} – {j.numero}</span> · {j.tema}</li>
              ))}
            </ul>
          </div>
        </section>
      )}
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
