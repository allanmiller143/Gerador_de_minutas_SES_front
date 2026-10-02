import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Plus, Loader2, Search, FileText, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { Label } from "@/components/ui/label";
import { TextoPadrao, TextoPadraoInput, TextoCategoria } from "@/types/textoPadrao";
import {
  getTextosPadroes,
  createTextoPadrao,
  updateTextoPadrao,
  deleteTextoPadrao,
  getCategorias,
  createCategoria,
  deleteCategoria,
} from "@/services/textoPadraoService";
import { TextoPadraoTable } from "./TextoPadraoTable";
import { TextoPadraoForm } from "./TextoPadraoForm";
import { TextoPadraoDelete } from "./TextoPadraoDelete";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TextosPadroes() {
  const [textos, setTextos] = useState<TextoPadrao[]>([]);
  const [categorias, setCategorias] = useState<TextoCategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTexto, setEditingTexto] = useState<TextoPadrao | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Category states
  const [isCatFormOpen, setIsCatFormOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [catSubmitting, setCatSubmitting] = useState(false);

  // Category Delete confirmation states
  const [catToDelete, setCatToDelete] = useState<TextoCategoria | null>(null);
  const [catDeleteAction, setCatDeleteAction] = useState<"none" | "none_cat" | "delete_all" | "move">("none");
  const [moveTargetCat, setMoveTargetCat] = useState<string>("");

  // Delete dialog state
  const [textoToDelete, setTextoToDelete] = useState<TextoPadrao | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [textosData, catsData] = await Promise.all([
        getTextosPadroes(),
        getCategorias(),
      ]);
      setTextos(textosData || []);
      setCategorias(catsData || []);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingTexto(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (texto: TextoPadrao) => {
    setEditingTexto(texto);
    setIsFormOpen(true);
  };

  const handleSubmit = async (data: TextoPadraoInput) => {
    if (!data.categoriaId) {
      toast.error("Por favor, selecione uma categoria.");
      return;
    }
    setSubmitting(true);
    try {
      if (editingTexto) {
        await updateTextoPadrao(editingTexto.id, data);
        toast.success("Texto padrão atualizado com sucesso!");
      } else {
        await createTextoPadrao(data);
        toast.success("Texto padrão criado com sucesso!");
      }
      setIsFormOpen(false);
      loadData();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar texto padrão");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!textoToDelete) return;
    setDeleting(true);
    try {
      await deleteTextoPadrao(textoToDelete.id);
      toast.success("Texto padrão excluído com sucesso!");
      setTextoToDelete(null);
      loadData();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao excluir texto padrão");
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateCategoria = async () => {
    if (!newCatName.trim()) return;
    setCatSubmitting(true);
    try {
      const newCat = await createCategoria(newCatName);
      setCategorias(prev => [...prev, newCat]);
      toast.success("Categoria criada com sucesso!");
      setNewCatName("");
      setIsCatFormOpen(false);
    } catch (err) {
      toast.error("Erro ao criar categoria");
    } finally {
      setCatSubmitting(false);
    }
  };

  const executeCategoriaDeletion = async () => {
    if (!catToDelete) return;

    try {
      if (catDeleteAction === "delete_all") {
        const textsToDelete = textos.filter(t => t.categoriaId === catToDelete.id);
        await Promise.all(textsToDelete.map(t => deleteTextoPadrao(t.id)));
      } else if (catDeleteAction === "move" && moveTargetCat) {
        const textsToMove = textos.filter(t => t.categoriaId === catToDelete.id);
        await Promise.all(textsToMove.map(t => updateTextoPadrao(t.id, { categoriaId: parseInt(moveTargetCat) })));
      }

      await deleteCategoria(catToDelete.id);
      toast.success("Categoria removida com sucesso!");
      setCategorias(prev => prev.filter(cat => cat.id !== catToDelete.id));
      setCatToDelete(null);
      setCatDeleteAction("none");
      setMoveTargetCat("");
      loadData();
    } catch (err) {
      toast.error("Erro ao processar a exclusão da categoria");
    }
  };

  const filteredTextos = textos.filter((t) => {
    const q = search.toLowerCase();
    const matchesSearch = t.titulo.toLowerCase().includes(q) || t.conteudo.toLowerCase().includes(q);
    const matchesCategory = selectedCategoryFilter === "all" || t.categoriaId === parseInt(selectedCategoryFilter);
    return matchesSearch && matchesCategory;
  });

  return (
    <AppLayout title="Textos Padrões" subtitle="Cadastre e gerencie textos reutilizáveis para suas minutas">
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Textos Padrões
            </h1>
            <p className="text-sm text-muted-foreground">
              Textos pré-definidos que podem ser inseridos rapidamente em qualquer parte da minuta.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <Loader2 className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <Button onClick={handleOpenCreate} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Novo Texto
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-1 h-fit">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  Categorias
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setIsCatFormOpen(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>Organize seus textos por temas.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {categorias.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/50 border border-border">
                    <span className="text-sm font-medium">{cat.nome}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => setCatToDelete(cat)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 flex flex-col sm:flex-row gap-4">
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar texto..."
                      className="pl-8"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="relative w-full sm:w-48">
                    <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as categorias" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as categorias</SelectItem>
                        {categorias.map(cat => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <CardTitle className="text-lg">Base de Textos</CardTitle>
                  <CardDescription>
                    Total de {textos.length} texto(s) cadastrado(s).
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                  <span className="text-sm text-muted-foreground">Carregando textos...</span>
                </div>
              ) : filteredTextos.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-lg">
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <h3 className="text-base font-semibold">Nenhum texto encontrado</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    {search || selectedCategoryFilter !== "all"
                      ? "Tente ajustar os filtros de busca ou categoria."
                      : "Comece cadastrando seu primeiro texto padrão."}
                  </p>
                  {!search && selectedCategoryFilter === "all" && (
                    <Button size="sm" onClick={handleOpenCreate}>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Texto
                    </Button>
                  )}
                </div>
              ) : (
                <TextoPadraoTable
                  data={filteredTextos}
                  categorias={categorias}
                  onEdit={handleOpenEdit}
                  onDelete={(t) => setTextoToDelete(t)}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={isCatFormOpen} onOpenChange={setIsCatFormOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Nova Categoria</DialogTitle>
              <DialogDescription>
                Crie uma nova categoria para organizar seus textos padrão.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cat-name">Nome da Categoria *</Label>
                <Input
                  id="cat-name"
                  placeholder="Ex: Saudações, Pareceres..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCatFormOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateCategoria} disabled={!newCatName.trim() || catSubmitting}>
                {catSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar Categoria
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!catToDelete} onOpenChange={(open) => { if(!open) setCatToDelete(null); setCatDeleteAction("none"); }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Excluir Categoria</DialogTitle>
              <DialogDescription>
                Você está prestes a excluir a categoria <strong className="text-foreground">{catToDelete?.nome}</strong>.
                O que deve acontecer com os textos associados a ela?
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-3">
                <Button
                  variant={catDeleteAction === "none_cat" ? "default" : "outline"}
                  className="justify-start h-auto py-3 px-4 text-left"
                  onClick={() => setCatDeleteAction("none_cat")}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">Deixar sem categoria</span>
                    <span className="text-xs opacity-80">Os textos permanecerão, mas ficarão como "Sem Categoria"</span>
                  </div>
                </Button>

                <Button
                  variant={catDeleteAction === "move" ? "default" : "outline"}
                  className="justify-start h-auto py-3 px-4 text-left"
                  onClick={() => setCatDeleteAction("move")}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">Mover para outra categoria</span>
                    <span className="text-xs opacity-80">Transferir todos os textos para um grupo existente</span>
                  </div>
                </Button>

                <Button
                  variant={catDeleteAction === "delete_all" ? "destructive" : "outline"}
                  className="justify-start h-auto py-3 px-4 text-left"
                  onClick={() => setCatDeleteAction("delete_all")}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">Excluir tudo</span>
                    <span className="text-xs opacity-80">Apagar a categoria e todos os textos vinculados a ela</span>
                  </div>
                </Button>
              </div>

              {catDeleteAction === "move" && (
                <div className="space-y-2 p-3 border rounded-md bg-muted/30">
                  <Label className="text-xs">Selecione a nova categoria:</Label>
                  <Select value={moveTargetCat} onValueChange={setMoveTargetCat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.filter(c => c.id !== catToDelete?.id).map(cat => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCatToDelete(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={executeCategoriaDeletion}
                disabled={catDeleteAction === "none" || (catDeleteAction === "move" && !moveTargetCat)}
              >
                Confirmar Exclusão
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <TextoPadraoForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          initialData={editingTexto}
          onSubmit={handleSubmit}
          submitting={submitting}
          categorias={categorias}
        />

        <TextoPadraoDelete
          open={!!textoToDelete}
          onOpenChange={() => setTextoToDelete(null)}
          item={textoToDelete}
          onDelete={handleDelete}
          deleting={deleting}
        />
      </div>
    </AppLayout>
  );
}
