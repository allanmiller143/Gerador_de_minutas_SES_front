import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { TextoPadrao, TextoPadraoInput, TextoCategoria } from "@/types/textoPadrao";

interface TextoPadraoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: TextoPadrao | null;
  onSubmit: (data: TextoPadraoInput) => Promise<void>;
  submitting: boolean;
  categorias: TextoCategoria[];
}

export function TextoPadraoForm({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  submitting,
  categorias,
}: TextoPadraoFormProps) {
  const [form, setForm] = useState<TextoPadraoInput>({
    titulo: "",
    conteudo: "",
    categoriaId: 0,
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        titulo: initialData.titulo,
        conteudo: initialData.conteudo,
        categoriaId: initialData.categoriaId,
      });
    } else {
      setForm({ titulo: "", conteudo: "", categoriaId: 0 });
    }
  }, [initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoriaId) {
      // O formulário não impedirá o submit, mas trataremos isso no index.tsx
    }
    await onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {initialData ? "Editar Texto Padrão" : "Novo Texto Padrão"}
            </DialogTitle>
            <DialogDescription>
              Preencha as informações do texto padrão abaixo.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                placeholder="Ex: Saudação Inicial"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria *</Label>
              <Select
                value={form.categoriaId.toString()}
                onValueChange={(val) => setForm({ ...form, categoriaId: parseInt(val) })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map(cat => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="conteudo">Conteúdo *</Label>
              <Textarea
                id="conteudo"
                placeholder="Insira o texto que será utilizado como padrão..."
                value={form.conteudo}
                onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
                className="min-h-[150px]"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {initialData ? "Salvar Alterações" : "Criar Texto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
