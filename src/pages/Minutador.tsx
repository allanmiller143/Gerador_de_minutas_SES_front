import { useMemo, useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { jurisprudencias } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, CheckCircle2, Save, Lock, Bot, Scale, Sparkles, FileText, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadProcessoPDF, downloadKnowledgeBaseFile } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useDrafts } from "@/context/DraftsContext";
import { useProcessos, useAnalisarProcesso } from "@/hooks/useProcessos";
import { Skeleton } from "@/components/ui/skeleton";
import { ProcessoSEI } from "@/types/sei";
import { Progress } from "@/components/ui/progress";


const etapas = ["Pré-análise", "Jurisprudências", "Minuta gerada", "Revisão humana"];

const Minutador = () => {
  const { id } = useParams();
  const { data: processos, isLoading } = useProcessos();
  const { user } = useAuth();
  const { getDraft, saveDraft, finalizeDraft } = useDrafts();

  const processoId = Number(id);

  // Busca o processo na lista mesclada global do React Query
  const sei = useMemo(() => processos?.find((s) => s.id === processoId), [processos, processoId]);
  const existingDraft = useMemo(() => getDraft(processoId), [processoId, getDraft]);

  const isAdmin = user?.role === "administrador";
  const isLockedByOther = !!existingDraft && !!user && existingDraft.ownerEmail !== user.email && !isAdmin;
  const isFinalized = existingDraft?.status === "Concluído";
  const readOnly = isLockedByOther || isFinalized;

  // A IA já terminou tudo off-line. Ao abrir o editor, estamos sempre na etapa de revisão humana.
  const etapaAtual = 3;

  // Estado reativo para a minuta que está sendo editada
  const [minuta, setMinuta] = useState("");

  // Mutação para chamar o serviço Gemini IA
  const { mutateAsync: analisarProcesso, isPending: isAnalyzing } = useAnalisarProcesso();

  const [isDownloading, setIsDownloading] = useState(false);

  // Limpa o nome do arquivo, removendo caminhos e o prefixo do UUID
  const cleanFilename = (path: string) => {
    if (!path) return "";
    const parts = path.split("/");
    const base = parts[parts.length - 1];
    const match = base.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_(.+)$/i);
    return match ? match[1] : base;
  };

  const handleDownloadPDF = async () => {
    if (!sei || !sei.arquivoPdf) return;
    try {
      setIsDownloading(true);
      const originalName = cleanFilename(sei.arquivoPdf);
      toast.info(`Iniciando o download do arquivo "${originalName}"...`);
      await downloadProcessoPDF(sei.id, originalName);
      toast.success("Download concluído com sucesso!");
    } catch (error: any) {
      console.error(error);
      toast.error(`Falha ao baixar o arquivo: ${error?.message || "Erro de conexão"}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const [downloadingKB, setDownloadingKB] = useState<string | null>(null);

  const handleDownloadKB = async (filePath: string) => {
    try {
      setDownloadingKB(filePath);
      const fileName = filePath.split("/").pop() || "documento.pdf";
      toast.info(`Iniciando o download de "${fileName}"...`);
      await downloadKnowledgeBaseFile(filePath);
      toast.success(`Download de "${fileName}" concluído!`);
    } catch (error: any) {
      console.error(error);
      toast.error(`Falha ao baixar o arquivo da base de conhecimento: ${error?.message || "Erro de conexão"}`);
    } finally {
      setDownloadingKB(null);
    }
  };



  const handleAnalisarIA = async () => {
    try {
      toast.info("Iniciando a análise do processo com o Gemini IA... Isso pode levar alguns segundos.");
      const updatedSei = await analisarProcesso(processoId);
      
      if (updatedSei) {
        const novaMinuta = gerarMinuta(updatedSei);
        setMinuta(novaMinuta);
        toast.success("Minuta gerada com sucesso pela IA do Gemini!");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(`Falha ao gerar minuta por IA: ${error?.message || "Erro desconhecido"}`);
    }
  };

  // Sincroniza a minuta assim que os dados do processo e rascunho carregarem
  useEffect(() => {
    if (sei) {
      setMinuta((prev) => {
        const generated = gerarMinuta(sei);
        if (!prev || prev === generated) {
          return existingDraft?.minuta || generated;
        }
        return prev;
      });
    }
  }, [sei, existingDraft]);

  const { mockJuris, documentosIA } = useMemo(() => {
    if (!sei) return { mockJuris: [], documentosIA: [] };
    const mockList = jurisprudencias.filter((j) => sei.jurisprudenciasSugeridas.includes(j.id));
    const docsList = sei.jurisprudenciasSugeridas.filter(
      (item) => typeof item === "string" && (!item.startsWith("j") || item.length > 3)
    );
    return { mockJuris: mockList, documentosIA: docsList };
  }, [sei]);

  if (isLoading) {
    return (
      <AppLayout title="Carregando..." subtitle="Buscando informações do processo SEI">
        <div className="space-y-6 p-4">
          <Skeleton className="h-10 w-28 rounded-md" />
          <Skeleton className="h-[80px] w-full rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[450px] lg:col-span-2 rounded-xl" />
            <Skeleton className="h-[450px] rounded-xl" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!sei) {
    return (
      <AppLayout title="Processo não encontrado">
        <div className="p-4 space-y-4">
          <p className="text-muted-foreground">O processo solicitado não existe ou foi removido do sistema.</p>
          <Button asChild variant="outline">
            <Link to="/seis"><ArrowLeft className="h-4 w-4 mr-2" /> Voltar para a lista</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  // Admin edita em nome do analista original (preserva autoria). Usuário comum salva como dono.
  const effectiveOwnerEmail = isAdmin && existingDraft ? existingDraft.ownerEmail : user?.email ?? "";
  const effectiveOwnerName = isAdmin && existingDraft ? existingDraft.ownerName : user?.name ?? "";

  // Remove quebras de linha do Windows (\r) e espaços inúteis nas pontas
  const normalizar = (txt: string) => (txt || "").replace(/\r/g, "").trim();

  const handleSaveDraft = () => {
    if (!user) return;
    if (isLockedByOther) { toast.error("Esta análise pertence a outro usuário."); return; }

    //Define qual é o texto original da IA para este processo.
    const textoOriginal = sei.iaSugestao;

    //Compara se o texto atual na tela (sendo editado) é diferente do original.
    const mudouOTexto = normalizar(minuta) !== normalizar(textoOriginal);

    saveDraft({
      seiId: sei.id,
      minuta,
      ownerEmail: effectiveOwnerEmail,
      ownerName: effectiveOwnerName,
      foiAlterado: mudouOTexto
    });

    toast.success(isAdmin && existingDraft && existingDraft.ownerEmail !== user.email
      ? `Rascunho salvo (edição administrativa em nome de ${existingDraft.ownerName}).`
      : "Rascunho salvo com sucesso.");
  };

  const handleFinalize = () => {
    if (!user) return;
    if (isLockedByOther) { toast.error("Esta análise pertence a outro usuário."); return; }

    const textoOriginal = gerarMinuta(sei);
    const mudouOTexto = normalizar(minuta) !== normalizar(textoOriginal);

    saveDraft({
      seiId: sei.id,
      minuta,
      ownerEmail: effectiveOwnerEmail,
      ownerName: effectiveOwnerName,
      foiAlterado: mudouOTexto
    });

    finalizeDraft(sei.id, user.name);
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
            const active = i === etapaAtual && !isFinalized;
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

      <div className="mb-6 rounded-xl border border-primary/20 bg-accent/50 px-4 py-3 text-sm text-accent-foreground flex items-center gap-2">
        <Bot className="h-4 w-4 text-primary" />
        Pré-análise, pesquisa de jurisprudência e minuta inicial já foram geradas pela IA. Revise, ajuste e finalize abaixo.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-card border border-border rounded-xl shadow-card p-6">
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
          {isAdmin && existingDraft && user && existingDraft.ownerEmail !== user.email && !isFinalized && (
            <div className="mb-4 rounded-lg border border-primary/30 bg-accent/60 text-accent-foreground px-4 py-3 text-sm flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              Edição administrativa: você está modificando a análise de <strong className="mx-1">{existingDraft.ownerName}</strong>. A autoria será preservada.
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
              <div className="flex gap-2 items-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAnalisarIA} 
                  disabled={isAnalyzing}
                  className="border-primary/40 text-primary hover:bg-primary/5 hover:text-primary transition-all"
                >
                  <Sparkles className={cn("h-4 w-4 mr-2 text-primary", isAnalyzing && "animate-spin")} />
                  Analisar com Gemini IA
                </Button>
                <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={isAnalyzing}>
                  <Save className="h-4 w-4 mr-2" /> Salvar rascunho
                </Button>
                <Button size="sm" onClick={handleFinalize} disabled={isAnalyzing}>
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Finalizar análise
                </Button>
              </div>
            )}
          </div>

          {isAnalyzing && (
            <div className="mb-4 space-y-2 p-3 bg-primary/5 rounded-lg border border-primary/20 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex justify-between items-center text-xs font-medium text-primary">
                <span className="flex items-center gap-1.5">
                  <Bot className="h-3.5 w-3.5 animate-bounce" />
                  O Gemini está analisando os PDFs do processo e as normas técnicas...
                </span>
              </div>
              <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-full animate-pulse rounded-full" />
              </div>
            </div>
          )}

          {/* Informações do Arquivo PDF do Processo */}
          <div className="mb-4 p-4 rounded-xl border border-border bg-secondary/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary mt-0.5 shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs text-muted-foreground font-medium block">Documento Original do Processo</span>
                <span className="text-sm font-semibold text-foreground break-all" title={sei.arquivoPdf || "Sem arquivo cadastrado"}>
                  {sei.arquivoPdf ? cleanFilename(sei.arquivoPdf) : "Nenhum arquivo anexado a este processo."}
                </span>
              </div>
            </div>
            {sei.arquivoPdf && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="shrink-0 bg-background hover:bg-secondary border-border shadow-sm flex items-center gap-2"
              >
                <Download className={cn("h-4 w-4", isDownloading && "animate-pulse")} />
                {isDownloading ? "Baixando..." : "Baixar PDF Original"}
              </Button>
            )}
          </div>

          <textarea
            value={minuta}
            onChange={(e) => setMinuta(e.target.value)}
            readOnly={readOnly || isAnalyzing}
            className={cn(
              "w-full min-h-[420px] border border-border rounded-lg p-4 text-sm font-mono leading-relaxed bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-y",
              (readOnly || isAnalyzing) && "bg-secondary/40 cursor-not-allowed"
            )}
          />
        </section>

        <aside className="bg-card border border-border rounded-xl shadow-card p-5 h-fit space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Scale className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Jurisprudências encontradas</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Selecionadas pela IA com base no tema do processo.
            </p>
            <ul className="space-y-3">
              {mockJuris.map((j) => (
                <li key={j.id} className="border border-border rounded-lg p-3 hover:bg-secondary/40 transition-colors">
                  <div className="text-xs font-semibold text-primary">{j.tribunal}</div>
                  <div className="font-mono text-[11px] text-muted-foreground mb-1">{j.numero}</div>
                  <div className="text-sm font-medium mb-1">{j.tema}</div>
                  <p className="text-xs text-muted-foreground line-clamp-3">{j.resumo}</p>
                </li>
              ))}
              {mockJuris.length === 0 && (
                <li className="text-xs text-muted-foreground">Nenhuma jurisprudência associada.</li>
              )}
            </ul>
          </div>

          {documentosIA.length > 0 && (
            <div className="border-t border-border pt-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Base de Conhecimento IA</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Documentos e diretrizes técnicas utilizados para fundamentar esta minuta.
              </p>
              <ul className="space-y-2">
                {documentosIA.map((doc, idx) => {
                  const filename = doc.split("/").pop() || doc;
                  const isDownloadingThis = downloadingKB === doc;
                  return (
                    <li key={idx} className="border border-border rounded-lg p-2.5 bg-primary/5 hover:bg-primary/10 transition-all flex items-center justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <Bot className="h-4 w-4 text-primary/70 shrink-0 mt-0.5" />
                        <span 
                          className="text-xs font-medium text-foreground truncate block cursor-help" 
                          title={doc}
                        >
                          {filename}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadKB(doc)}
                        disabled={isDownloadingThis}
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                        title={`Baixar ${filename}`}
                      >
                        <Download className={cn("h-3.5 w-3.5", isDownloadingThis && "animate-pulse")} />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </AppLayout>
  );
};

function gerarMinuta(sei: ProcessoSEI) {
  return `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO

Processo SEI: ${sei.numero}
Assunto: ${sei.assunto}

${sei.iaSugestao}
`;
}

export default Minutador;