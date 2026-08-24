import { useEffect, useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/shared/MetricCard";
import { TablePagination } from "@/components/shared/TablePagination";
import {Clock,TrendingUp,FileStack,Upload,Search,Download,Pencil,Trash2,FileText,Loader2,X,Eye,BookOpen} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue,} from "@/components/ui/select";
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogTrigger,DialogFooter,} from "@/components/ui/dialog";
import {AlertDialog,AlertDialogAction,AlertDialogCancel,AlertDialogContent,AlertDialogDescription,AlertDialogFooter,AlertDialogHeader,AlertDialogTitle,AlertDialogTrigger,} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError, downloadKnowledgeBaseFile } from "@/lib/api";
import { toast } from "sonner";
import { PageTutorialWizard, TutorialStep } from "@/components/shared/PageTutorialWizard";

interface KnowledgeDoc {
  id: number;
  titulo: string;
  categoria: string;
  descricao?: string;
  filename: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  created_by?: string;
  created_at?: string;
}

const CATEGORIAS = [
  "Protocolo Clínico",
  "Nota Técnica",
  "Diretriz Terapêutica",
  "Jurisprudência",
  "Outro",
];

const KNOWLEDGE_BASE_TUTORIAL_STEPS: TutorialStep[] = [
  {
    target: '[data-tour="kb-metrics"]',
    title: "Indicadores da Base de Conhecimento",
    description:
      "Veja as métricas gerais: quantidade total de documentos cadastrados, novos arquivos adicionados nos últimos 30 dias e a categoria mais frequente.",
    icon: BookOpen,
    position: "bottom",
  },
  {
    target: '[data-tour="kb-search-filters"]',
    title: "Busca e Filtragem por Categoria",
    description:
      "Pesquise documentos por título, descrição ou nome de arquivo, ou filtre a exibição selecionando categorias como Nota Técnica, Protocolo Clínico e Diretriz Terapêutica.",
    icon: Search,
    position: "bottom",
  },
  {
    target: '[data-tour="kb-btn-upload"]',
    title: "Cadastrar Novo Documento PDF",
    description:
      "Clique em 'Novo documento' para fazer upload de diretrizes ou normas técnicas em PDF, definindo título, categoria e descrição.",
    icon: Upload,
    position: "left",
  },
  {
    target: '[data-tour="kb-docs-list"]',
    title: "Listagem de Documentos e Ações",
    description:
      "Consulte os detalhes de cada arquivo, faça o download do PDF original, edite as informações cadastradas ou remova documentos da base.",
    icon: FileText,
    position: "top",
  },
];

const formatFileSize = (bytes?: number) => {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
};

const KnowledgeBase = () => {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todos");

  // Estados da Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const paginatedDocs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return docs.slice(startIndex, endIndex);
  }, [docs, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(docs.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoriaFiltro, itemsPerPage]);

  // Upload
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitulo, setUploadTitulo] = useState("");
  const [uploadCategoria, setUploadCategoria] = useState(CATEGORIAS[0]);
  const [uploadDescricao, setUploadDescricao] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Edição
  const [editDoc, setEditDoc] = useState<KnowledgeDoc | null>(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editCategoria, setEditCategoria] = useState("");
  const [editDescricao, setEditDescricao] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const fetchDocs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoriaFiltro !== "Todos") params.set("categoria", categoriaFiltro);
      if (search.trim()) params.set("search", search.trim());

      const query = params.toString();
      const data = await api<KnowledgeDoc[]>(
        `/knowledge-base${query ? `?${query}` : ""}`
      );
      setDocs(data);
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? `Erro ao carregar documentos: ${err.message}`
          : "Erro ao carregar documentos."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Busca inicial e sempre que o filtro de categoria mudar
  useEffect(() => {
    fetchDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriaFiltro]);

  // Debounce simples pra busca por texto
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchDocs();
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadTitulo("");
    setUploadCategoria(CATEGORIAS[0]);
    setUploadDescricao("");
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitulo.trim()) {
      toast.error("Selecione um arquivo e preencha o título.");
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("titulo", uploadTitulo.trim());
    formData.append("categoria", uploadCategoria);
    formData.append("descricao", uploadDescricao.trim());

    setIsUploading(true);
    try {
      await api<{ message: string; documento: KnowledgeDoc }>(
        "/knowledge-base/upload",
        { method: "POST", body: formData }
      );
      toast.success("Documento cadastrado com sucesso!");
      setUploadOpen(false);
      resetUploadForm();
      fetchDocs();
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? `Falha no upload: ${err.message}`
          : "Falha no upload do documento."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const openEdit = (doc: KnowledgeDoc) => {
    setEditDoc(doc);
    setEditTitulo(doc.titulo);
    setEditCategoria(doc.categoria);
    setEditDescricao(doc.descricao ?? "");
  };

  const handleSaveEdit = async () => {
    if (!editDoc) return;
    if (!editTitulo.trim()) {
      toast.error("O título não pode ficar vazio.");
      return;
    }

    setIsSavingEdit(true);
    try {
      const updated = await api<KnowledgeDoc>(`/knowledge-base/${editDoc.id}`, {
        method: "PUT",
        body: {
          titulo: editTitulo.trim(),
          categoria: editCategoria,
          descricao: editDescricao.trim(),
        },
      });
      setDocs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      toast.success("Documento atualizado com sucesso.");
      setEditDoc(null);
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? `Erro ao atualizar: ${err.message}`
          : "Erro ao atualizar documento."
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await api<{ message: string }>(`/knowledge-base/${id}`, {
        method: "DELETE",
      });
      setDocs((prev) => prev.filter((d) => d.id !== id));
      toast.success("Documento removido da base de conhecimento.");
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? `Erro ao remover: ${err.message}`
          : "Erro ao remover documento."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (doc: KnowledgeDoc) => {
    setDownloadingId(doc.id);
    try {
      await downloadKnowledgeBaseFile(doc.file_path);
    } catch (err: any) {
      toast.error(`Falha ao baixar: ${err?.message || "Erro de conexão"}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const totalDocs = docs.length;
  const categoriaMaisComum = docs.length
    ? Object.entries(
        docs.reduce<Record<string, number>>((acc, d) => {
          acc[d.categoria] = (acc[d.categoria] ?? 0) + 1;
          return acc;
        }, {})
      ).sort((a, b) => b[1] - a[1])[0]?.[0]
    : "—";
  const adicionadosRecentemente = docs.filter((d) => {
    if (!d.created_at) return false;
    const diffDias =
      (Date.now() - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return diffDias <= 30;
  }).length;

  return (
    <AppLayout
      title="Base de Conhecimento"
      subtitle="Aqui você encontra a base de conhecimento da análise de SEIs."
    >
      {/* Ajuste os props de MetricCard conforme a assinatura real do componente */}
      <div data-tour="kb-metrics" className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricCard
          icon={FileStack}
          label="Total de documentos"
          value={totalDocs}
        />
        <MetricCard
          icon={TrendingUp}
          label="Adicionados nos últimos 30 dias"
          value={adicionadosRecentemente}
        />
        <MetricCard
          icon={Clock}
          label="Categoria mais frequente"
          value={categoriaMaisComum}
        />
      </div>

      <div className="bg-card border border-border rounded-xl shadow-card p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
          <div data-tour="kb-search-filters" className="flex flex-col sm:flex-row gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, descrição ou arquivo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todas as categorias</SelectItem>
                {CATEGORIAS.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Dialog
            open={uploadOpen}
            onOpenChange={(open) => {
              setUploadOpen(open);
              if (!open) resetUploadForm();
            }}
          >
            <DialogTrigger asChild>
              <Button data-tour="kb-btn-upload" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Novo documento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Cadastrar documento</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="kb-file">Arquivo (PDF)</Label>
                  <Input
                    id="kb-file"
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="kb-titulo">Título</Label>
                  <Input
                    id="kb-titulo"
                    value={uploadTitulo}
                    onChange={(e) => setUploadTitulo(e.target.value)}
                    placeholder="Ex.: Protocolo clínico de hipertensão"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="kb-categoria">Categoria</Label>
                  <Select value={uploadCategoria} onValueChange={setUploadCategoria}>
                    <SelectTrigger id="kb-categoria">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="kb-descricao">Descrição</Label>
                  <Textarea
                    id="kb-descricao"
                    value={uploadDescricao}
                    onChange={(e) => setUploadDescricao(e.target.value)}
                    rows={3}
                    placeholder="Contexto ou observações sobre o documento (opcional)"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setUploadOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpload} disabled={isUploading}>
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {isUploading ? "Enviando..." : "Cadastrar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <FileText className="h-8 w-8 mx-auto mb-3 opacity-50" />
            Nenhum documento encontrado
            {search || categoriaFiltro !== "Todos" ? " para esse filtro." : "."}
          </div>
        ) : (
          <div data-tour="kb-docs-list" className="space-y-2">
            {paginatedDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border bg-secondary/10 p-3 hover:bg-secondary/20 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <FileText className="h-5 w-5 text-primary/70 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground truncate">
                        {doc.titulo}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide bg-primary/10 text-primary rounded-full px-2 py-0.5">
                        {doc.categoria}
                      </span>
                    </div>
                    {doc.descricao && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {doc.descricao}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-1 font-mono truncate">
                      {doc.filename}
                      {doc.file_size ? ` · ${formatFileSize(doc.file_size)}` : ""}
                      {doc.created_by ? ` · enviado por ${doc.created_by}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Baixar"
                    onClick={() => handleDownload(doc)}
                    disabled={downloadingId === doc.id}
                  >
                    {downloadingId === doc.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Editar"
                    onClick={() => openEdit(doc)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        title="Remover"
                        disabled={deletingId === doc.id}
                      >
                        {deletingId === doc.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover documento?</AlertDialogTitle>
                        <AlertDialogDescription>
                          "{doc.titulo}" será removido da base de conhecimento.
                          Essa ação não exclui o arquivo original do
                          armazenamento, apenas o retira da listagem.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(doc.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rodapé da Paginação */}
        {!isLoading && docs.length > 0 && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={docs.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            pageSizeOptions={[10, 25, 50]}
            className="-mx-5 -mb-5 mt-5 rounded-b-xl"
          />
        )}
      </div>

      {/* Dialog de edição */}
      <Dialog open={!!editDoc} onOpenChange={(open) => !open && setEditDoc(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar documento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-titulo">Título</Label>
              <Input
                id="edit-titulo"
                value={editTitulo}
                onChange={(e) => setEditTitulo(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-categoria">Categoria</Label>
              <Select value={editCategoria} onValueChange={setEditCategoria}>
                <SelectTrigger id="edit-categoria">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-descricao">Descrição</Label>
              <Textarea
                id="edit-descricao"
                value={editDescricao}
                onChange={(e) => setEditDescricao(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDoc(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSavingEdit}>
              {isSavingEdit && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isSavingEdit ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Tutorial Wizard */}
      <PageTutorialWizard
        steps={KNOWLEDGE_BASE_TUTORIAL_STEPS}
        tutorialTitle="Tutorial da Base de Conhecimento"
        buttonLabel="Guia da Página"
      />
    </AppLayout>
  );
};

export default KnowledgeBase;