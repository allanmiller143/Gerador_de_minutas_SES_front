import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGenerateResumo, useRestoreResumo, useResumoVersions, useSeiDetail, useSeiResumoTecnico, useUpdateProcesso } from "@/services/domainData";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Check, CheckCircle2, Save, Lock, Bot, Sparkles, FileText, RotateCcw, Loader2, Download, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadProcessoPDF, downloadKnowledgeBaseFile } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useDrafts } from "@/context/DraftsContext";
import { useAnalisarProcesso } from "@/hooks/useProcessos";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { domainDataQueryKeys } from "@/services/domainData";
import ReactMarkdown from "react-markdown";
import { PromptEditorDialog } from "./Resumo_Minuta/PromptEditorDialog";
import { isFailedStatus, isProcessingStatus } from "@/lib/processStatus";

const etapas = ["Pré-análise", "Jurisprudências", "Minuta gerada", "Revisão humana"];

const Minutador = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useSeiDetail(id, {
    refetchInterval: (query: any) => {
      return isProcessingStatus(query.state.data?.sei?.status_processamento) ? 3000 : false;
    }
  });
  const {
    data: resumoData,
    isLoading: isResumoLoading,
    error: resumoError,
  } = useSeiResumoTecnico(id, {
    refetchInterval: (query: any) => {
      return isProcessingStatus(query.state.data?.sei?.status_processamento) ? 3000 : false;
    }
  });
  const { data: resumoVersions = [] } = useResumoVersions(id);
  const generateResumo = useGenerateResumo(id);
  const restoreResumo = useRestoreResumo(id);
  const sei = data?.sei;
  const { user } = useAuth();
  const { getDraft, saveDraft, finalizeDraft } = useDrafts();

  // Support string or number IDs safely
  const existingDraft = useMemo(() => {
    if (!sei) return undefined;
    return getDraft(sei.id) || getDraft(Number(sei.id));
  }, [sei, getDraft]);

  const [minuta, setMinuta] = useState("");

  // Mutação para chamar o serviço Gemini IA
  const { mutateAsync: analisarProcesso, isPending: isAnalyzing } = useAnalisarProcesso();
  const updateProcesso = useUpdateProcesso(id);

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
      await downloadProcessoPDF(Number(sei.id), originalName);
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
    if (!sei) return;
    try {
      toast.info("Iniciando a geração da minuta com o Gemini... Isso pode levar alguns segundos.");
      
      // Mudança aqui: passando um objeto com o ID e a flag 'apenasMinuta'
      const updatedSei = await analisarProcesso({ 
        id: Number(sei.id), 
        apenasMinuta: true 
      });

      if (updatedSei) {
        queryClient.invalidateQueries({ queryKey: domainDataQueryKeys.seiDetail(id) });
        toast.success("Geração de minuta enfileirada com sucesso! O processamento está sendo executado em background.");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(`Falha ao gerar minuta por IA: ${error?.message || "Erro desconhecido"}`);
    }
  };

  useEffect(() => {
    if (!sei) return;
    setMinuta(existingDraft?.minuta ?? sei?.minuta ?? resumoData?.minuta ?? data?.minuta ?? "");
  }, [data?.minuta, existingDraft?.minuta, resumoData?.minuta, sei, sei?.minuta]);

  const isAdmin = user?.role === "administrador";
  const isLockedByOther = !!existingDraft && !!user && existingDraft.ownerEmail !== user.email && !isAdmin;
  const isFinalized = existingDraft?.status === "Concluído";
  const readOnly = isLockedByOther || isFinalized || isProcessingStatus(sei?.status_processamento);

  const etapaAtual = isResumoLoading ? 1 : isFinalized ? 3 : 2;

  const juris = useMemo(
    () => data?.jurisprudencias ?? [],
    [data?.jurisprudencias]
  );

  const resumoTecnico = resumoData?.resumoTecnico;
  const activeResumoVersion = resumoVersions.find((version) => version.is_active);
  const resumoProcesso = resumoTecnico?.resumo_processo;
  const confronto = resumoTecnico?.confronto_documentacao_suporte;
  const insumoParecer = resumoTecnico?.insumo_parecer;
  const minutaOriginal = resumoData?.minuta ?? data?.minuta ?? sei?.iaSugestao ?? "";

  const documentosIA = useMemo(() => {
    if (!sei) return [];
    return (sei.jurisprudenciasSugeridas || []).filter(
      (item) => typeof item === "string" && (!item.startsWith("j") || item.length > 3)
    );
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

  if (error || !sei) {
    return (
      <AppLayout title="SEI não encontrado">
        <div className="p-4 space-y-4">
          <p className="text-muted-foreground">O processo solicitado não existe ou foi removido do sistema.</p>
          <Button asChild>
            <Link to="/">Voltar para o Dashboard</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const effectiveOwnerEmail = isAdmin && existingDraft ? existingDraft.ownerEmail : user?.email ?? "";
  const effectiveOwnerName = isAdmin && existingDraft ? existingDraft.ownerName : user?.name ?? "";

  const normalizar = (txt: string) => (txt || "").replace(/\r/g, "").trim();

  const handleSaveDraft = async () => {
    if (!user) return;
    if (isLockedByOther) { toast.error("Esta análise pertence a outro usuário."); return; }

    const mudouOTexto = normalizar(minuta) !== normalizar(minutaOriginal);

    saveDraft({
      seiId: sei.id,
      minuta,
      ownerEmail: effectiveOwnerEmail,
      ownerName: effectiveOwnerName,
      foiAlterado: mudouOTexto
    });

    try {
      await updateProcesso.mutateAsync({
        minuta,
        foi_alterado: mudouOTexto
      });
      toast.success(isAdmin && existingDraft && existingDraft.ownerEmail !== user.email
        ? `Rascunho salvo (edição administrativa em nome de ${existingDraft.ownerName}).`
        : "Rascunho salvo com sucesso.");
    } catch (err: any) {
      toast.error(`Erro ao salvar no servidor: ${err.message || "Erro desconhecido"}`);
    }
  };

  const handleFinalize = async () => {
    if (!user) return;
    if (isLockedByOther) { toast.error("Esta análise pertence a outro usuário."); return; }

    const mudouOTexto = normalizar(minuta) !== normalizar(minutaOriginal);

    saveDraft({
      seiId: sei.id,
      minuta,
      ownerEmail: effectiveOwnerEmail,
      ownerName: effectiveOwnerName,
      foiAlterado: mudouOTexto
    });

    try {
      await updateProcesso.mutateAsync({
        status: "Concluído",
        minuta,
        foi_alterado: mudouOTexto
      });
      finalizeDraft(sei.id, user.name);
      toast.success("Análise finalizada e marcada como concluída.");
    } catch (err: any) {
      toast.error(`Erro ao finalizar no servidor: ${err.message || "Erro desconhecido"}`);
    }
  };

  const handleGenerateResumo = async () => {
    await generateResumo.mutateAsync(user?.email ?? user?.name ?? "usuário");
    toast.success("Nova versão de resumo gerada e ativada.");
  };

  const handleRestoreResumo = async (resumoId: number) => {
    await restoreResumo.mutateAsync(resumoId);
    toast.success("Versão anterior restaurada como resumo ativo.");
  };

  return (
    <AppLayout title="Minutador de Resposta" subtitle={`SEI: ${sei.numero}`}>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm"><Link to="/seis"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Link></Button>
      </div>
      {isProcessingStatus(sei?.status_processamento) && (
        <div className="mb-6 p-4 border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900 rounded-xl flex items-center gap-3 text-blue-800 dark:text-blue-200 animate-pulse">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">Análise de IA em andamento no background:</span> A minuta e o resumo técnico estão sendo gerados. As edições e ações estão travadas temporariamente.
          </div>
        </div>
      )}

      {isFailedStatus(sei?.status_processamento) && (
        <div className="mb-6 p-4 border border-destructive/20 bg-destructive/5 rounded-xl flex items-center gap-3 text-destructive font-medium">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">Falha na análise em background:</span> Ocorreu um erro ao gerar a minuta ou o resumo técnico. Você pode tentar analisar com Gemini novamente.
          </div>
        </div>
      )}
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

          <Tabs defaultValue="resumo" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="resumo">Resumo técnico</TabsTrigger>
              <TabsTrigger value="minuta" disabled={isResumoLoading} className={isResumoLoading ? "opacity-50 cursor-not-allowed" : ""}>
                {isResumoLoading ? "Minuta (carregando...)" : "Minuta"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="resumo" className="mt-0">
              <div className="rounded-xl border border-border bg-secondary/20 p-4">
                <div className="mb-3">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 mb-1 justify-between">
                    <h2 className="font-semibold">Resumo técnico preliminar</h2>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm" variant="outline" onClick={handleGenerateResumo} disabled={generateResumo.isPending || isResumoLoading}>
                        {generateResumo.isPending || isResumoLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4 mr-2" />
                        )}
                        {generateResumo.isPending || isResumoLoading ? "Gerando..." : "Gerar novamente"}
                      </Button>
                      
                      <PromptEditorDialog />
                    </div>
                  </div>
                  {activeResumoVersion && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Versão ativa #{activeResumoVersion.version}, gerada em {new Date(activeResumoVersion.generated_at).toLocaleString("pt-BR")} por {activeResumoVersion.generated_by}.
                    </p>
                  )}
                </div>
                {isResumoLoading ? (
                  <div className="rounded-lg border border-dashed border-primary/30 bg-background/60 p-4 text-sm text-muted-foreground">
                    Gerando resumo técnico preliminar... aguarde. Os dados do processo já estão disponíveis para consulta.
                  </div>
                ) : resumoError ? (
                  <p className="text-sm text-destructive">Não foi possível gerar o resumo técnico preliminar. Tente novamente em instantes.</p>
                ) : resumoTecnico ? (
                  <div className="space-y-5 text-sm">
                    <section>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                        {resumoProcesso?.tipo_demanda
                          ? resumoProcesso.tipo_demanda.charAt(0).toUpperCase() + resumoProcesso.tipo_demanda.slice(1)
                          : "Resumo do processo"}
                      </h3>
                      <dl className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <dt className="text-xs text-muted-foreground">Número</dt>
                          <dd className="font-mono">{sei.numero}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Assunto</dt>
                          <dd>{sei.assunto}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Partes</dt>
                          <dd>{sei.partes ?? "—"}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Status / prioridade</dt>
                          <dd>{sei.status} · {sei.prioridade}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Medicamento solicitado</dt>
                          <dd>{resumoProcesso?.medicamento_solicitado ?? "Não informado"}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">CID informado</dt>
                          <dd>{resumoProcesso?.cid_informado ?? "Não informado"}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Diagnóstico informado</dt>
                          <dd>{resumoProcesso?.diagnostico_informado ?? "Não informado"}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Confiança da IA</dt>
                          <dd>{Math.round(sei.iaConfidence * 100)}%</dd>
                        </div>
                        <div className="md:col-span-2">
                          <dt className="text-xs text-muted-foreground">Objetivo da solicitação</dt>
                          <dd>{resumoProcesso?.objetivo_da_solicitacao ?? sei.resumo ?? "Não informado"}</dd>
                        </div>
                      </dl>
                    </section>

                    <section>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Confronto com documentação de suporte</h3>
                      <div className="space-y-2">
                        <p>CID validado: {confronto?.cid_validado ? "Sim" : "Não"}</p>
                        <p>Medicamento contemplado para o CID: {confronto?.medicamento_contemplado_para_o_cid ?? "indeterminado"}</p>
                        <ul className="list-disc pl-5 space-y-1">
                          {(confronto?.observacoes ?? []).map((item) => <li key={item}>{item}</li>)}
                        </ul>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Insumo para parecer</h3>
                      <div className="space-y-2">
                        <div className="border border-border bg-background/50 rounded-xl p-4 shadow-sm mb-3">
                          <ReactMarkdown
                            components={{
                              p: ({ node, ...props }) => <p className="mb-4 text-sm leading-relaxed" {...props} />
                            }}
                          >
                            {insumoParecer?.conclusao_tecnica_sugerida ?? "Conclusão técnica não informada."}
                          </ReactMarkdown>
                        </div>
                        <p>Necessita revisão humana: {insumoParecer?.necessita_revisao_humana ? "Sim" : "Não"}</p>
                        <p>Nível de confiança: {insumoParecer?.nivel_confianca ?? "não informado"}</p>
                        {insumoParecer?.fundamentos && insumoParecer.fundamentos.length > 0 && (
                          <div>
                            <div className="text-xs text-muted-foreground">Fundamentos</div>
                            <ul className="list-disc pl-5 space-y-1">{insumoParecer.fundamentos.map((item) => <li key={item}>{item}</li>)}</ul>
                          </div>
                        )}
                        {insumoParecer?.alternativas_orientaveis && insumoParecer.alternativas_orientaveis.length > 0 && (
                          <div>
                            <div className="text-xs text-muted-foreground">Alternativas orientáveis</div>
                            <ul className="list-disc pl-5 space-y-1">{insumoParecer.alternativas_orientaveis.map((item) => <li key={item}>{item}</li>)}</ul>
                          </div>
                        )}
                        {insumoParecer?.pendencias_documentais && insumoParecer.pendencias_documentais.length > 0 && (
                          <div>
                            <div className="text-xs text-muted-foreground">Pendências documentais</div>
                            <ul className="list-disc pl-5 space-y-1">{insumoParecer.pendencias_documentais.map((item) => <li key={item}>{item}</li>)}</ul>
                          </div>
                        )}
                      </div>
                    </section>

                    <section>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Fontes consultadas</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {(resumoTecnico.fontes_consultadas ?? []).map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Documento PDF</h3>
                      {sei.documentoPdf ? (
                        <div className="space-y-1 font-mono text-xs break-all">
                          <div>{sei.documentoPdf.filename}</div>
                          <div>{sei.documentoPdf.url}</div>
                        </div>
                      ) : (
                        <p>Nenhum documento PDF informado.</p>
                      )}
                    </section>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum resumo técnico estruturado retornado pela API.</p>
                )}
                {resumoVersions.length > 0 && (
                  <div className="mt-3 rounded-lg border border-border bg-background/70 p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Versões anteriores</div>
                    <div className="space-y-2">
                      {resumoVersions.map((version) => (
                        <div key={version.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span>
                            Versão #{version.version} · {new Date(version.generated_at).toLocaleString("pt-BR")} · {version.generated_by}
                            {version.is_active ? " · ativa" : ""}
                          </span>
                          {!version.is_active && (
                            <Button size="sm" variant="ghost" onClick={() => handleRestoreResumo(version.id)} disabled={restoreResumo.isPending}>
                              Restaurar
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="minuta" className="mt-0">
              {isResumoLoading ? (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-6 text-center space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <p className="font-semibold text-primary">Carregando evidências...</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Aguarde o carregamento completo das evidências e jurisprudências para começar a editar a minuta.</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4">
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
                      <div className="flex flex-wrap gap-2 items-center">
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

                  <RichTextEditor
                    value={minuta}
                    onChange={setMinuta}
                    readOnly={readOnly || isAnalyzing}
                    minHeight="420px"
                    placeholder="Digite ou edite a minuta aqui..."
                  />
                </>
              )}
            </TabsContent>
          </Tabs>
        </section>

        <aside className="bg-card border border-border rounded-xl shadow-card p-5 h-fit space-y-6">
          {sei.arquivoPdf && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Documento do Processo</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Arquivo PDF original recebido pelo SEI.
              </p>
              <div className="p-3 rounded-lg border border-border bg-secondary/15 flex flex-col gap-3">
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-foreground break-all" title={sei.arquivoPdf}>
                    {cleanFilename(sei.arquivoPdf)}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="w-full bg-background hover:bg-secondary border-border shadow-sm flex items-center justify-center gap-2"
                >
                  <Download className={cn("h-4 w-4", isDownloading && "animate-pulse")} />
                  {isDownloading ? "Baixando..." : "Baixar PDF Original"}
                </Button>
              </div>
            </div>
          )}

          {/* Evidências clínicas */}
          {resumoTecnico && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Evidências encontradas</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Informações-chave extraídas dos relatórios médicos.
              </p>

              <div className="space-y-4">
                {resumoTecnico?.evidencias_clinicas_do_processo && resumoTecnico.evidencias_clinicas_do_processo.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold mb-2 text-primary">Evidências Clínicas</div>
                    <ul className="space-y-2">
                      {resumoTecnico.evidencias_clinicas_do_processo.map((item, idx) => (
                        <li key={idx} className="border border-border/50 rounded-lg p-2 bg-secondary/10 text-xs hover:bg-secondary/20 transition-colors">
                          <p className="line-clamp-3">{item}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {confronto?.observacoes && confronto.observacoes.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold mb-2 text-primary">Observações</div>
                    <ul className="space-y-2">
                      {confronto.observacoes.map((item, idx) => (
                        <li key={idx} className="border border-border/50 rounded-lg p-2 bg-secondary/10 text-xs hover:bg-secondary/20 transition-colors">
                          <p className="line-clamp-3">{item}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {insumoParecer?.fundamentos && insumoParecer.fundamentos.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold mb-2 text-primary">Fundamentos</div>
                    <ul className="space-y-2">
                      {insumoParecer.fundamentos.map((item, idx) => (
                        <li key={idx} className="border border-border/50 rounded-lg p-2 bg-secondary/10 text-xs hover:bg-secondary/20 transition-colors">
                          <p className="line-clamp-3">{item}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {insumoParecer?.alternativas_orientaveis && insumoParecer.alternativas_orientaveis.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold mb-2 text-primary">Alternativas</div>
                    <ul className="space-y-2">
                      {insumoParecer.alternativas_orientaveis.map((item, idx) => (
                        <li key={idx} className="border border-border/50 rounded-lg p-2 bg-secondary/10 text-xs hover:bg-secondary/20 transition-colors">
                          <p className="line-clamp-3">{item}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {insumoParecer?.pendencias_documentais && insumoParecer.pendencias_documentais.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold mb-2 text-destructive">Pendências</div>
                    <ul className="space-y-2">
                      {insumoParecer.pendencias_documentais.map((item, idx) => (
                        <li key={idx} className="border border-destructive/30 rounded-lg p-2 bg-destructive/10 text-xs hover:bg-destructive/20 transition-colors">
                          <p className="line-clamp-3">{item}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Base de Conhecimento IA */}
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

export default Minutador;