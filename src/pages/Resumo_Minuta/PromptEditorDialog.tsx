import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Settings } from "lucide-react";
import { usePromptConfig, useUpdatePromptConfig } from "@/services/domainData";
import { useAuth } from "@/context/AuthContext";

export const PromptEditorDialog = () => {
  const { data, isLoading } = usePromptConfig("resumo_default");
  const update = useUpdatePromptConfig("resumo_default");
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    if (data?.editable_prompt) setText(data.editable_prompt);
  }, [data?.editable_prompt]);

  const handleSave = () => {
    update.mutate(
      { editable_prompt: text, updated_by: user?.name },
      { onSuccess: () => setOpen(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Editar prompt
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editor de Prompt - Resumo Técnico Preeliminar</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center gap-2 py-4 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando prompt atual...
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Prompt editável</label>
              <p className="text-xs text-muted-foreground mb-1">
                Última atualização por {data?.updated_by} em{" "}
                {data?.updated_at ? new Date(data.updated_at).toLocaleString("pt-BR") : "—"}
              </p>
              <Textarea
                value={text || ""}
                onChange={(e) => setText(e.target.value)}
                rows={12}
                className="font-mono text-xs leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={update.isPending}>
                {update.isPending ? "Salvando..." : "Salvar prompt"}
              </Button>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Estrutura fixa (não editável)
              </label>
              <div className="rounded-md border bg-muted p-3 font-mono text-xs text-muted-foreground whitespace-pre-wrap">
                {data?.fixed_schema || "Carregando..."}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};