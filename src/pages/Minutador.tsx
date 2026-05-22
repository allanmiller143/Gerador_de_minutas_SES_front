import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGenerateResumo, useRestoreResumo, useResumoVersions, useSeiDetail, useSeiResumoTecnico } from "@/services/domainData";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Check, CheckCircle2, Save, Lock, Bot, Scale, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useDrafts } from "@/context/DraftsContext";

const etapas = ["Pré-análise", "Jurisprudências", "Minuta gerada", "Revisão humana"];

const Minutador = () => {
  const { id } = useParams();
  const { data, isLoading, error } = useSeiDetail(id);
  const {
    data: resumoData,
    isLoading: isResumoLoading,
    error: resumoError,
  } = useSeiResumoTecnico(id);
  const { data: resumoVersions = [] } = useResumoVersions(id);
  const generateResumo = useGenerateResumo(id);
  const restoreResumo = useRestoreResumo(id);
  const sei = data?.sei;
  const { user } = useAuth();
  const { getDraft, saveDraft, finalizeDraft } = useDrafts();

  const existingDraft = sei ? getDraft(sei.id) : undefined;

  const [minuta, setMinuta] = useState("");

  useEffect(() => {
    if (!sei) return;
    setMinuta(existingDraft?.minuta ?? resumoData?.minuta ?? data?.minuta ?? "");
  }, [data?.minuta, existingDraft?.minuta, resumoData?.minuta, sei]);

  const isAdmin = user?.role === "administrador";
  const isLockedByOther = !!existingDraft && !!user && existingDraft.ownerEmail !== user.email && !isAdmin;
  const isFinalized = existingDraft?.status === "Concluído";
  const readOnly = isLockedByOther || isFinalized;

  // A IA já terminou tudo off-line. Ao abrir o editor, estamos sempre na etapa de revisão humana.
  const etapaAtual = 3;

  const juris = useMemo(
    () => data?.jurisprudencias ?? [],
    [data?.jurisprudencias]
  );
  const resumoTecnico = resumoData?.resumoTecnico;
  const activeResumoVersion = resumoVersions.find((version) => version.is_active);
  const resumoProcesso = resumoTecnico?.resumo_processo;
  const confronto = resumoTecnico?.confronto_documentacao_suporte;
  const insumoParecer = resumoTecnico?.insumo_parecer;

  if (isLoading) {
    return <AppLayout title="Minutador de Resposta" subtitle="Carregando dados do backend..." />;
  }

  if (error || !sei) {
    return (
      <AppLayout title="SEI não encontrado">
        <Button asChild variant="outline"><Link to="/seis"><ArrowLeft className="h-4 w-4 mr-2" /> Voltar</Link></Button>
      </AppLayout>
    );
  }

  // Admin edita em nome do analista original (preserva autoria). Usuário comum salva como dono.
  const effectiveOwnerEmail = isAdmin && existingDraft ? existingDraft.ownerEmail : user?.email ?? "";
  const effectiveOwnerName = isAdmin && existingDraft ? existingDraft.ownerName : user?.name ?? "";

  const handleSaveDraft = () => {
    if (!user) return;
    if (isLockedByOther) { toast.error("Esta análise pertence a outro usuário."); return; }
    saveDraft({ seiId: sei.id, minuta, ownerEmail: effectiveOwnerEmail, ownerName: effectiveOwnerName });
    toast.success(isAdmin && existingDraft && existingDraft.ownerEmail !== user.email
      ? `Rascunho salvo (edição administrativa em nome de ${existingDraft.ownerName}).`
      : "Rascunho salvo com sucesso.");
  };

  const handleFinalize = () => {
    if (!user) return;
    if (isLockedByOther) { toast.error("Esta análise pertence a outro usuário."); return; }
    saveDraft({ seiId: sei.id, minuta, ownerEmail: effectiveOwnerEmail, ownerName: effectiveOwnerName });
    finalizeDraft(sei.id, user.name);
    toast.success("Análise finalizada e marcada como concluída.");
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
              <TabsTrigger value="minuta">Minuta</TabsTrigger>
            </TabsList>

            <TabsContent value="resumo" className="mt-0">
              <div className="rounded-xl border border-border bg-secondary/20 p-4">
                <div className="mb-3">
                  <h2 className="font-semibold">Resumo técnico preliminar</h2>
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
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Evidências clínicas do processo</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {(resumoTecnico.evidencias_clinicas_do_processo ?? []).map((item) => <li key={item}>{item}</li>)}
                    {resumoTecnico.evidencias_clinicas_do_processo?.length === 0 && <li>Nenhuma evidência clínica informada.</li>}
                  </ul>
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
                    <p>{insumoParecer?.conclusao_tecnica_sugerida ?? "Conclusão técnica não informada."}</p>
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
                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
                  <Button size="sm" variant="outline" onClick={handleGenerateResumo} disabled={generateResumo.isPending}>
                    <RotateCcw className="h-4 w-4 mr-2" /> Gerar novamente
                  </Button>
                </div>
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
            </TabsContent>
          </Tabs>
        </section>

        <aside className="bg-card border border-border rounded-xl shadow-card p-5 h-fit">
          <div className="flex items-center gap-2 mb-3">
            <Scale className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Jurisprudências encontradas</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Selecionadas pela IA com base no tema do processo.
          </p>
          <ul className="space-y-3">
            {juris.map((j) => (
              <li key={j.id} className="border border-border rounded-lg p-3 hover:bg-secondary/40 transition-colors">
                <div className="text-xs font-semibold text-primary">{j.tribunal}</div>
                <div className="font-mono text-[11px] text-muted-foreground mb-1">{j.numero}</div>
                <div className="text-sm font-medium mb-1">{j.tema}</div>
                <p className="text-xs text-muted-foreground line-clamp-3">{j.resumo}</p>
              </li>
            ))}
            {juris.length === 0 && (
              <li className="text-xs text-muted-foreground">Nenhuma jurisprudência associada.</li>
            )}
          </ul>
        </aside>
      </div>
    </AppLayout>
  );
};

export default Minutador;
