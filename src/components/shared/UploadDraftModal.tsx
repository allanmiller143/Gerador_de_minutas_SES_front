import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUploadProcesso } from "@/hooks/useProcessos";
import { FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function UploadDraftModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [numero, setNumero] = useState("");
  const [assunto, setAssunto] = useState("");
  const [prioridade, setPrioridade] = useState("Normal");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadProcesso();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Auto-fill SEI number from filename if empty
      if (!numero) {
        const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
        setNumero(nameWithoutExt);
      }
    }
  };

  const handleUpload = () => {
    if (!file || !numero || !assunto || !prioridade) {
      toast.error("Por favor, preencha todos os campos e selecione um arquivo.");
      return;
    }

    const regexSei = /^\d{10}\.\d{6}\/\d{4}-\d{2}$/;
    if (!regexSei.test(numero)) {
      toast.error("O Número SEI deve estar no formato: 0000000000.000000/0000-00");
      return;
    }

    uploadMutation.mutate(
      { file, numero, assunto, prioridade },
      {
        onSuccess: () => {
          toast.success("Rascunho criado com sucesso!");
          handleClose();
        },
        onError: (err: any) => {
          toast.error(err?.message || "Erro ao fazer upload do rascunho.");
          console.error(err);
        }
      }
    );
  };

  const handleClose = () => {
    setFile(null);
    setNumero("");
    setAssunto("");
    setPrioridade("Normal");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload de Novo Processo</DialogTitle>
          <DialogDescription>
            Envie o PDF do processo para criar um novo rascunho.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4 overflow-hidden">
          <div className="grid gap-2 overflow-hidden">
            <Label htmlFor="file">Arquivo PDF</Label>
            <div className="flex items-center gap-2 overflow-hidden">
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex justify-start text-muted-foreground overflow-hidden"
              >
                <FileUp className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate block min-w-0 flex-1 text-left">
                  {file ? file.name : "Selecionar arquivo..."}
                </span>
              </Button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="application/pdf"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="numero">Número SEI</Label>
            <Input 
              id="numero" 
              value={numero} 
              onChange={(e) => setNumero(e.target.value)} 
              placeholder="Ex: 0000000000.000000/0000-00" 
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="assunto">Assunto</Label>
            <Input 
              id="assunto" 
              value={assunto} 
              onChange={(e) => setAssunto(e.target.value)} 
              placeholder="Descreva o assunto..." 
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="prioridade">Prioridade</Label>
            <Select value={prioridade} onValueChange={setPrioridade}>
              <SelectTrigger id="prioridade">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="Urgente">Urgente</SelectItem>
                <SelectItem value="Emergência">Emergência</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleUpload} disabled={!file || !numero || !assunto || uploadMutation.isPending}>
            {uploadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Rascunho
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
