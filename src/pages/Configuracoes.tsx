import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
import { Plus, Shield, Users, FileText, Scale, Loader2, Trash, Edit } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";

interface BackendUser {
  id?: number | string;
  username: string;
  email: string;
  role: "admin" | "analyst" | string;
}

const cards = [
  { icon: Users, title: "Usuários e perfis", desc: "Gerencie analistas e administradores." },
  { icon: Shield, title: "Controle de acesso", desc: "Defina permissões por perfil (LGPD)." },
  { icon: FileText, title: "Modelos de minuta", desc: "Templates padrão utilizados pela IA." },
  { icon: Scale, title: "Base de jurisprudências", desc: "Importação manual e ativação." },
];

const perfilLabel = (role: string | string[]) => {
  // Extrai o valor real do role (se for array, pega o primeiro item)
  const roleValue = Array.isArray(role) ? role[0] : role;

  console.log("Perfil recebido:", role);
  
  return roleValue === "admin" 
    ? "Administrador" 
    : roleValue === "analyst" 
      ? "Analista" 
      : roleValue;
};

const Configuracoes = () => {
  const [usuarios, setUsuarios] = useState<BackendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<BackendUser | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "analyst" as "admin" | "analyst",
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await api<BackendUser[] | { users: BackendUser[] }>("/users/");
      const list = Array.isArray(data) ? data : data.users ?? [];
      console.log("Usuários carregados:", list);
      setUsuarios(list);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api("/users/create", { method: "POST", body: form });
      toast.success("Usuário criado");
      setOpen(false);
      setForm({ username: "", email: "", password: "", role: "analyst" });
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao criar usuário");
    } finally {
      setCreating(false);
    }
  };

  const handleEditUser = (user: BackendUser) => {
    toast("Funcionalidade de edição ainda não implementada");
  };

  const handleDeleteUser = async (user: BackendUser) => {
    setDeleting(true);
    try {
      await api(`/users/${user.id}`, { method: "DELETE" });
      toast.success("Usuário excluído");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao excluir usuário");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppLayout title="Configurações" subtitle="Parâmetros gerais do sistema">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => (
          <div key={c.title} className="bg-card border border-border rounded-xl shadow-card p-5 hover:shadow-elevated transition-shadow cursor-pointer">
            <c.icon className="h-5 w-5 text-primary mb-3" />
            <div className="font-semibold mb-1">{c.title}</div>
            <div className="text-xs text-muted-foreground">{c.desc}</div>
          </div>
        ))}
      </div>

      <section className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <header className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">Usuários cadastrados</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" /> Novo usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:w-[620px] w-[80%] max-w-[520px]">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">
                  Novo usuário
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Preencha os dados para criar uma nova conta
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreate} className="space-y-6 mt-4">
                {/* Usuário */}
                <div className="space-y-2">
                  <Label htmlFor="u-username" className="font-medium text-sm">
                    Usuário
                  </Label>
                  <div className="relative">
                    <Input
                      id="u-username"
                      placeholder="ex: joao.silva"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      required
                      className="input-field"
                    />
                  </div>
                </div>
                
                {/* E-mail */}
                <div className="space-y-2">
                  <Label htmlFor="u-email" className="font-medium text-sm">
                    E-mail
                  </Label>
                  <div className="relative">
                    <Input
                      id="u-email"
                      type="email"
                      placeholder="ex: joao@empresa.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                      className="input-field"
                    />
                  </div>
                </div>
                
                {/* Senha */}
                <div className="space-y-2">
                  <Label htmlFor="u-pass" className="font-medium text-sm">
                    Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="u-pass"
                      type="password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                      className="input-field password-input"
                    />
                  </div>
                </div>
                
                {/* Perfil */}
                <div className="space-y-2">
                  <Label className="font-medium text-sm">
                    Perfil
                  </Label>
                  <Select 
                    value={form.role} 
                    onValueChange={(v: "admin" | "analyst") => setForm({ ...form, role: v })}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {form.role === 'admin' ? 'Administrador' : 
                        form.role === 'analyst' ? 'Analista' : 
                        'Selecione um perfil'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="analyst">Analista</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Rodapé com botão */}
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={creating}
                    className="w-full"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      "Criar usuário"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </header>
        {loading ? (
          <div className="p-8 flex items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Carregando...
          </div>
        ) : usuarios.length === 0 ? (
          <div className="p-8 text-sm text-muted-foreground text-center">Nenhum usuário cadastrado.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground bg-secondary/50">
                <th className="px-5 py-3 font-medium">Usuário</th>
                <th className="px-5 py-3 font-medium">E-mail</th>
                <th className="px-5 py-3 font-medium">Perfil</th>
                <th className="px-5 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id ?? u.username} className="border-t border-border">
                  <td className="px-5 py-3 font-medium">{u.username}</td>
                  <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold">
                      {perfilLabel(u.roles)}
                    </span>
                  </td>
                  <td className="px-5 py-3" align="right">
                    <div className="inline-flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditUser(u)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Dialog
                        open={!!userToDelete}
                        onOpenChange={(open) => !open && setUserToDelete(null)}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setUserToDelete(u)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
 
                      </Dialog>  
                      
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Dialog de confirmação de exclusão */}
        <Dialog
          open={!!userToDelete}
          onOpenChange={(open) => !open && setUserToDelete(null)}
        >
          <DialogContent className="sm:w-[620px] w-[80%] max-w-[520px]">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                Confirmar exclusão
              </DialogTitle>

              <DialogDescription className="text-sm text-muted-foreground">
                Tem certeza que deseja excluir o usuário "
                {userToDelete?.username}
                "? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setUserToDelete(null)}
              >
                Cancelar
              </Button>

              <Button
                variant="destructive"
                onClick={() => {
                  if (userToDelete) {
                    handleDeleteUser(userToDelete);
                  }

                  setUserToDelete(null);
                }}
              >
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </section>
    </AppLayout>
  );
};

export default Configuracoes;
