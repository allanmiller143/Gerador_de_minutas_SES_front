import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Shield, Users, FileText, Scale, Loader2 } from "lucide-react";
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

const perfilLabel = (role: string) =>
  role === "admin" ? "Administrador" : role === "analyst" ? "Analista" : role;

const Configuracoes = () => {
  const [usuarios, setUsuarios] = useState<BackendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);

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
              <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Novo usuário</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo usuário</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="u-username">Usuário</Label>
                  <Input id="u-username" value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="u-email">E-mail</Label>
                  <Input id="u-email" type="email" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="u-pass">Senha</Label>
                  <Input id="u-pass" type="password" value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Perfil</Label>
                  <Select value={form.role} onValueChange={(v: "admin" | "analyst") => setForm({ ...form, role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="analyst">Analista</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={creating}>
                    {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Criar
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
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id ?? u.username} className="border-t border-border">
                  <td className="px-5 py-3 font-medium">{u.username}</td>
                  <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold">
                      {perfilLabel(u.role)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </AppLayout>
  );
};

export default Configuracoes;
