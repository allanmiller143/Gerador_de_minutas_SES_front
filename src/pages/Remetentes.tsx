import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Loader2, Trash2, Edit, Search, UserCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { Remetente, RemetenteInput } from "@/types/remetente";
import {
  getRemetentes,
  createRemetente,
  updateRemetente,
  deleteRemetente,
} from "@/services/remetenteService";

const getContrastColor = (color: string): string => {
  if (color.startsWith("#") && (color.length === 7 || color.length === 4)) {
    let hex = color.slice(1);
    if (hex.length === 3) {
      hex = hex.split("").map((c) => c + c).join("");
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 140 ? "#0f172a" : "#ffffff";
  }
  return "#ffffff";
};

const PRESET_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#6366F1", // Indigo
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#64748B", // Slate
];

const INITIAL_FORM: RemetenteInput = {
  prefixo: "",
  nome_completo: "",
  sigla: "",
  cor: "#3B82F6",
};

export default function Remetentes() {
  const [remetentes, setRemetentes] = useState<Remetente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRemetente, setEditingRemetente] = useState<Remetente | null>(null);
  const [form, setForm] = useState<RemetenteInput>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog state
  const [remetenteToDelete, setRemetenteToDelete] = useState<Remetente | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getRemetentes();
      setRemetentes(data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao carregar remetentes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingRemetente(null);
    setForm(INITIAL_FORM);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (remetente: Remetente) => {
    setEditingRemetente(remetente);
    setForm({
      prefixo: remetente.prefixo,
      nome_completo: remetente.nome_completo,
      sigla: remetente.sigla,
      cor: remetente.cor,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.prefixo.trim() || !form.nome_completo.trim() || !form.sigla.trim() || !form.cor.trim()) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingRemetente) {
        await updateRemetente(editingRemetente.id, form);
        toast.success("Remetente atualizado com sucesso!");
      } else {
        await createRemetente(form);
        toast.success("Remetente criado com sucesso!");
      }
      setIsFormOpen(false);
      loadData();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar remetente");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!remetenteToDelete) return;
    setDeleting(true);
    try {
      await deleteRemetente(remetenteToDelete.id);
      toast.success("Remetente excluído com sucesso!");
      setRemetenteToDelete(null);
      loadData();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao excluir remetente");
    } finally {
      setDeleting(false);
    }
  };

  const filteredRemetentes = remetentes.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.nome_completo.toLowerCase().includes(q) ||
      r.sigla.toLowerCase().includes(q) ||
      r.prefixo.toLowerCase().includes(q)
    );
  });

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <UserCheck className="h-6 w-6 text-primary" />
              Remetentes
            </h1>
            <p className="text-sm text-muted-foreground">
              Cadastre e gerencie os remetentes de processos e documentos no sistema.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <Button onClick={handleOpenCreate} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Novo Remetente
            </Button>
          </div>
        </div>

        {/* Filters and Card Container */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Base de Remetentes</CardTitle>
                <CardDescription>
                  Total de {remetentes.length} remetente(s) cadastrado(s).
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por nome, sigla ou prefixo..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                <span className="text-sm text-muted-foreground">Carregando remetentes...</span>
              </div>
            ) : filteredRemetentes.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-lg">
                <UserCheck className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                <h3 className="text-base font-semibold">Nenhum remetente encontrado</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  {search
                    ? "Tente buscar com outros termos."
                    : "Comece cadastrando seu primeiro remetente."}
                </p>
                {!search && (
                  <Button size="sm" onClick={handleOpenCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Remetente
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">Prefixo</TableHead>
                      <TableHead>Nome Completo</TableHead>
                      <TableHead className="w-[140px]">Sigla</TableHead>
                      <TableHead className="w-[120px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRemetentes.map((remetente) => (
                      <TableRow key={remetente.id}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {remetente.prefixo}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{remetente.nome_completo}</TableCell>
                        <TableCell>
                          <Badge
                            className="font-semibold shadow-sm border-none px-2.5 py-0.5"
                            style={{
                              backgroundColor: remetente.cor,
                              color: getContrastColor(remetente.cor),
                            }}
                          >
                            {remetente.sigla}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(remetente)}
                            title="Editar remetente"
                          >
                            <Edit className="h-4 w-4 text-muted-foreground hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setRemetenteToDelete(remetente)}
                            title="Excluir remetente"
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create / Edit Modal */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingRemetente ? "Editar Remetente" : "Novo Remetente"}
                </DialogTitle>
                <DialogDescription>
                  Preencha os dados do remetente abaixo.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prefixo">Prefixo *</Label>
                    <Input
                      id="prefixo"
                      placeholder="Ex: REQ, OF"
                      value={form.prefixo}
                      onChange={(e) => setForm({ ...form, prefixo: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sigla">Sigla *</Label>
                    <Input
                      id="sigla"
                      placeholder="Ex: TJSP"
                      value={form.sigla}
                      onChange={(e) => setForm({ ...form, sigla: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome_completo">Nome Completo *</Label>
                  <Input
                    id="nome_completo"
                    placeholder="Ex: Tribunal de Justiça do Estado de SP"
                    value={form.nome_completo}
                    onChange={(e) => setForm({ ...form, nome_completo: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cor">Cor (RGB / Hex) *</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="color"
                      id="cor-picker"
                      value={form.cor.startsWith("#") ? form.cor : "#3B82F6"}
                      onChange={(e) => setForm({ ...form, cor: e.target.value })}
                      className="h-10 w-14 p-1 cursor-pointer"
                    />
                    <Input
                      id="cor"
                      placeholder="#3B82F6 ou rgb(59, 130, 246)"
                      value={form.cor}
                      onChange={(e) => setForm({ ...form, cor: e.target.value })}
                      className="font-mono"
                      required
                    />
                  </div>

                  {/* Preset colors */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`h-6 w-6 rounded-full border transition-transform hover:scale-110 ${
                          form.cor === c ? "ring-2 ring-primary ring-offset-1" : ""
                        }`}
                        style={{ backgroundColor: c }}
                        onClick={() => setForm({ ...form, cor: c })}
                      />
                    ))}
                  </div>

                  {/* Live Tag Preview */}
                  <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                    <span>Pré-visualização da tag:</span>
                    <Badge
                      className="font-semibold shadow-sm border-none px-2.5 py-0.5"
                      style={{
                        backgroundColor: form.cor || "#3B82F6",
                        color: getContrastColor(form.cor || "#3B82F6"),
                      }}
                    >
                      {form.sigla || "SIGLA"}
                    </Badge>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingRemetente ? "Salvar Alterações" : "Criar Remetente"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Alert */}
        <AlertDialog
          open={!!remetenteToDelete}
          onOpenChange={(open) => !open && setRemetenteToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o remetente{" "}
                <strong>{remetenteToDelete?.nome_completo}</strong> ({remetenteToDelete?.sigla})?
                Esta ação não poderá ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
