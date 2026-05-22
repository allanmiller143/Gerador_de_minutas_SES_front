import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/AuthContext";
import {
  useCancelResumoBatchRun,
  useResumoBatchConfig,
  useResumoBatchRuns,
  useRunResumoBatch,
  useUpdateResumoBatchConfig,
} from "@/services/domainData";
import { Loader2, Play, Save, Square } from "lucide-react";
import { toast } from "sonner";

const formatDateTime = (value?: string) => (value ? new Date(value).toLocaleString("pt-BR") : "—");
const formatLogTime = (value?: string) => (value ? new Date(value).toLocaleTimeString("pt-BR") : "--:--:--");

const batchLogLevelClass = (level: string) => {
  if (level === "success") return "text-emerald-400";
  if (level === "warning") return "text-amber-300";
  if (level === "error") return "text-red-400";
  return "text-sky-300";
};

const batchStatusLabel = (status: string) => {
  if (status === "success") return "Concluída com sucesso";
  if (status === "running") return "Em execução";
  if (status === "cancel_requested") return "Suspensão solicitada";
  if (status === "canceled") return "Suspensa";
  if (status === "interrupted") return "Interrompida/incompleta";
  return "Falhou";
};

const isLiveRun = (status: string) => status === "running" || status === "cancel_requested";

export default function ResumoBatch() {
  const { user } = useAuth();
  const { data: config, isLoading: loadingConfig } = useResumoBatchConfig();
  const { data: runs = [], isLoading: loadingRuns } = useResumoBatchRuns();
  const updateConfig = useUpdateResumoBatchConfig();
  const runBatch = useRunResumoBatch();
  const cancelBatch = useCancelResumoBatchRun();
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState("03:00");
  const activeRun = runs.find((run) => isLiveRun(run.status));

  useEffect(() => {
    if (!config) return;
    setEnabled(config.enabled);
    setTime(config.time);
  }, [config]);

  const actor = user?.email ?? user?.name ?? "usuário";
  const hasScheduleChanges = !!config && (enabled !== config.enabled || time !== config.time);

  const save = async () => {
    await updateConfig.mutateAsync({ enabled, time, updated_by: actor });
    toast.success(enabled ? "Rotina agendada atualizada." : "Execução recorrente suspensa.");
  };

  const runNow = async () => {
    const result = await runBatch.mutateAsync(actor);
    toast.success(`Execução #${result.id} iniciada em segundo plano. O histórico será atualizado automaticamente.`);
  };

  const cancelRun = async (runId: number) => {
    await cancelBatch.mutateAsync({ runId, triggered_by: actor });
    toast.success(`Suspensão da execução #${runId} solicitada. Ela vai parar ao terminar o processo atual.`);
  };

  return (
    <AppLayout title="Rotina de geração de resumos" subtitle="Agendamento, suspensão, execução manual e histórico do batch online">
      <section className="bg-card border border-border rounded-xl shadow-card p-6 mb-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold">Agenda recorrente</h2>
            <p className="text-sm text-muted-foreground">
              Gera resumos para SEIs sem versão ativa ou marcados para reexecução.
            </p>
          </div>
          {loadingConfig && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="batch-enabled">Execução automática</Label>
            <div className="flex items-center gap-3 h-10">
              <Switch id="batch-enabled" checked={enabled} onCheckedChange={setEnabled} />
              <span className="text-sm">{enabled ? "Ativa" : "Suspensa"}</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="batch-time">Horário diário</Label>
            <Input id="batch-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={save} disabled={updateConfig.isPending || !hasScheduleChanges}>
              {updateConfig.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar agenda
            </Button>
            <Button variant="outline" onClick={runNow} disabled={runBatch.isPending || Boolean(activeRun)}>
              {runBatch.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              Iniciar nova execução
            </Button>
          </div>
        </div>

        {activeRun && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            Já existe uma execução em andamento. Aguarde a conclusão ou suspenda a execução atual antes de iniciar outra.
          </p>
        )}

        {config && (
          <p className="text-xs text-muted-foreground">
            Última alteração: {formatDateTime(config.updated_at)} por {config.updated_by ?? "—"}. Última data automática: {config.last_run_date ?? "—"}.
          </p>
        )}
      </section>

      <section className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <header className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold">Histórico de execuções</h2>
          <p className="text-sm text-muted-foreground">Status, disparador, duração e SEIs contemplados.</p>
        </header>
        <div className="divide-y divide-border">
          {loadingRuns && <div className="p-5 text-sm text-muted-foreground">Carregando histórico...</div>}
          {!loadingRuns && runs.length === 0 && <div className="p-5 text-sm text-muted-foreground">Nenhuma execução registrada.</div>}
          {runs.map((run) => (
            <article key={run.id} className="p-5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">Execução #{run.id} · {batchStatusLabel(run.status)}</div>
                <div className="flex items-center gap-2">
                  {run.status === "running" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => cancelRun(run.id)}
                      disabled={cancelBatch.isPending}
                      aria-label={`Suspender execução #${run.id}`}
                    >
                      {cancelBatch.isPending ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <Square className="h-3 w-3 mr-2" />}
                      Suspender
                    </Button>
                  )}
                  <div className="text-xs text-muted-foreground">{formatDateTime(run.started_at)}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                <div><span className="text-muted-foreground">Disparo:</span> {run.trigger_type}</div>
                <div><span className="text-muted-foreground">Quem disparou:</span> {run.triggered_by}</div>
                <div><span className="text-muted-foreground">Duração:</span> {run.duration_seconds}s</div>
                <div><span className="text-muted-foreground">Gerados:</span> {run.generated_count}/{run.total_seis}</div>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">SEIs:</span> {run.sei_ids.length ? run.sei_ids.join(", ") : "nenhum"}
              </div>
              {run.error_message && <div className="text-sm text-destructive">{run.error_message}</div>}
              <div className="rounded-lg border border-border bg-slate-950 text-slate-100 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 text-xs">
                  <span className="font-medium">{isLiveRun(run.status) ? "Console da execução em tempo real" : "Histórico do console"}</span>
                  {isLiveRun(run.status) && <span className="text-emerald-300">atualizando automaticamente</span>}
                </div>
                <div className="max-h-72 overflow-y-auto p-3 font-mono text-xs space-y-1">
                  {(run.logs ?? []).length === 0 && <div className="text-slate-400">Aguardando primeiras saídas...</div>}
                  {(run.logs ?? []).map((log, index) => (
                    <div key={`${log.timestamp}-${index}`} className="flex gap-2 whitespace-pre-wrap break-words">
                      <span className="text-slate-500 shrink-0">{formatLogTime(log.timestamp)}</span>
                      <span className={`${batchLogLevelClass(log.level)} shrink-0`}>[{log.level}]</span>
                      <span>{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AppLayout>
  );
}
