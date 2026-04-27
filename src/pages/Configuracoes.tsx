import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Plus, Shield, Users, FileText, Scale } from "lucide-react";

const usuarios = [
  { nome: "Mariana Costa", email: "mariana.costa@ses.sp.gov.br", perfil: "Analista da Farmácia" },
  { nome: "Rafael Souza", email: "rafael.souza@ses.sp.gov.br", perfil: "Analista da Farmácia" },
  { nome: "Patrícia Lima", email: "patricia.lima@ses.sp.gov.br", perfil: "Revisor/Coordenador" },
  { nome: "Admin do Sistema", email: "admin@ses.sp.gov.br", perfil: "Administrador" },
];

const cards = [
  { icon: Users, title: "Usuários e perfis", desc: "Gerencie analistas, revisores e administradores." },
  { icon: Shield, title: "Controle de acesso", desc: "Defina permissões por perfil (LGPD)." },
  { icon: FileText, title: "Modelos de minuta", desc: "Templates padrão utilizados pela IA." },
  { icon: Scale, title: "Base de jurisprudências", desc: "Importação manual e ativação." },
];

const Configuracoes = () => (
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
        <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Novo usuário</Button>
      </header>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground bg-secondary/50">
            <th className="px-5 py-3 font-medium">Nome</th>
            <th className="px-5 py-3 font-medium">E-mail</th>
            <th className="px-5 py-3 font-medium">Perfil</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.email} className="border-t border-border">
              <td className="px-5 py-3 font-medium">{u.nome}</td>
              <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
              <td className="px-5 py-3">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold">{u.perfil}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  </AppLayout>
);

export default Configuracoes;
