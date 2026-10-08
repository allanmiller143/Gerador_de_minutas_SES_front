import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Loader2, AlertTriangle, RotateCcw, Home } from "lucide-react";
import { isPendingStatus, isProcessingStatus, isFailedStatus } from "@/lib/processStatus";

interface ProcessoBloqueadoViewProps {
  processo: {
    id: number | string;
    numero: string;
    assunto?: string;
    remetente?: string;
    dataRecebimento?: string;
    status_processamento?: string | null;
    status?: string;
    erro_processamento?: string | null;
  };
  onReprocessar?: () => Promise<any> | void;
  isReprocessando?: boolean;
}

export const ProcessoBloqueadoView = ({
  processo,
  onReprocessar,
  isReprocessando = false,
}: ProcessoBloqueadoViewProps) => {
  const isPending = isPendingStatus(processo.status_processamento);
  const isProcessing = isProcessingStatus(processo.status_processamento);
  const isFailed = isFailedStatus(processo.status_processamento) || processo.status === "Falha na análise";

  const pageSubtitle = isPending
    ? "Processo aguardando processamento"
    : isProcessing
    ? "Processamento em andamento"
    : "Falha no processamento";

  return (
    <AppLayout title={`Processo ${processo.numero}`} subtitle={pageSubtitle}>
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Card className="border-border shadow-card overflow-hidden">
          <div className="p-6 sm:p-8 flex flex-col items-center text-center">
            {isPending && (
              <>
                <div className="h-16 w-16 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 mb-3">
                  <Clock className="h-3.5 w-3.5" />
                  Pendente de Processamento
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Processo ainda não processado
                </h2>
                <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
                  Este processo foi importado a partir do SEI, mas ainda está na fila aguardando a extração de documentos e a pré-análise da inteligência artificial.
                  <br /><br />
                  A visualização e a revisão da minuta só estarão disponíveis após a conclusão do processamento.
                </p>
              </>
            )}

            {isProcessing && (
              <>
                <div className="h-16 w-16 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-700 dark:text-blue-400 mb-3">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Processando com IA
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Análise em andamento
                </h2>
                <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
                  Os documentos do SEI estão sendo baixados e a análise técnica está sendo gerada pela inteligência artificial em segundo plano.
                  <br /><br />
                  Esta tela será atualizada automaticamente assim que o processamento terminar.
                </p>
              </>
            )}

            {isFailed && (
              <>
                <div className="h-16 w-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
                  <AlertTriangle className="h-8 w-8" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-destructive/15 text-destructive mb-3">
                  Falha no Processamento
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Não foi possível processar este processo
                </h2>
                <p className="text-sm text-muted-foreground max-w-md mb-4 leading-relaxed">
                  Ocorreu um erro durante a extração dos documentos ou na geração da minuta com IA.
                </p>
                {processo.erro_processamento && (
                  <div className="w-full text-left bg-destructive/5 border border-destructive/20 rounded-lg p-3.5 mb-6 text-xs text-destructive font-mono whitespace-pre-wrap break-all">
                    {processo.erro_processamento}
                  </div>
                )}
              </>
            )}

            {/* Metadados resumidos */}
            <div className="w-full bg-secondary/50 rounded-lg p-4 mb-6 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Número SEI:</span>
                <span className="font-mono font-medium text-foreground">{processo.numero}</span>
              </div>
              {processo.assunto && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assunto:</span>
                  <span className="text-foreground max-w-xs truncate">{processo.assunto}</span>
                </div>
              )}
              {processo.remetente && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remetente:</span>
                  <span className="text-foreground">{processo.remetente}</span>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="flex flex-wrap items-center justify-center gap-3 w-full">
              {isFailed && onReprocessar && (
                <Button
                  onClick={onReprocessar}
                  disabled={isReprocessando}
                  className="gap-2"
                >
                  <RotateCcw className={`h-4 w-4 ${isReprocessando ? "animate-spin" : ""}`} />
                  Tentar Processar Novamente
                </Button>
              )}
              <Button asChild variant="outline">
                <Link to="/seis">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para a Lista
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" /> Início
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};
