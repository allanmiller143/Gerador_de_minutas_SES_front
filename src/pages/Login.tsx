import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pill, ShieldCheck, UserCheck, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth, demoUsers, roleLabel } from "@/context/AuthContext";
import type { UserRole } from "@/data/mock";

const roleCards: { role: UserRole; icon: typeof UserCheck; desc: string }[] = [
  { role: "analista", icon: UserCheck, desc: "Revisa as pré-análises geradas pela IA, edita e finaliza a minuta." },
  { role: "administrador", icon: Users, desc: "Gerencia usuários, perfis e configurações do sistema." },
];

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState<UserRole>("analista");
  const [email, setEmail] = useState(demoUsers.analista.email);
  const [password, setPassword] = useState("demo1234");

  const handleRole = (r: UserRole) => {
    setRole(r);
    setEmail(demoUsers[r].email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const base = demoUsers[role];
    login({ ...base, email });
    navigate("/");
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-sidebar text-sidebar-foreground relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-lg bg-sidebar-primary/20 ring-1 ring-sidebar-primary/40 flex items-center justify-center">
              <Pill className="h-5 w-5 text-sidebar-primary" />
            </div>
            <div>
              <div className="font-bold text-sidebar-accent-foreground">Farmácia SES</div>
              <div className="text-xs text-sidebar-foreground/60">Análise de SEI</div>
            </div>
          </div>
        </div>
        <div className="relative z-10 space-y-4 max-w-md">
          <h2 className="text-3xl font-bold text-sidebar-accent-foreground leading-tight">
            Assistência Farmacêutica com apoio de IA.
          </h2>
          <p className="text-sidebar-foreground/70 leading-relaxed">
            A IA pré-analisa todos os processos SEI assim que chegam. Você apenas revisa, ajusta e salva — ganhando tempo e padronização nas respostas.
          </p>
        </div>
        <div className="relative z-10 text-xs text-sidebar-foreground/50">
          Secretaria Estadual de Saúde · Ambiente de demonstração
        </div>
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-sidebar-primary/10 blur-3xl" />
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-sidebar-primary/10 blur-3xl" />
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Pill className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-bold">Farmácia SES</div>
              <div className="text-xs text-muted-foreground">Análise de SEI</div>
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-1">Acessar o sistema</h1>
          <p className="text-sm text-muted-foreground mb-6">Selecione seu perfil e entre com suas credenciais.</p>

          <div className="grid grid-cols-2 gap-2 mb-6">
            {roleCards.map(({ role: r, icon: Icon }) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRole(r)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-all",
                  role === r
                    ? "border-primary bg-accent text-accent-foreground ring-2 ring-primary/30"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                <Icon className="h-4 w-4" />
                {roleLabel[r]}
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground -mt-3 mb-6">
            {roleCards.find((c) => c.role === role)?.desc}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail institucional</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full bg-gradient-primary">
              Entrar como {roleLabel[role]}
            </Button>
          </form>

          <div className="mt-6 rounded-lg border border-dashed border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
            <strong className="text-foreground">Ambiente de demonstração.</strong> Qualquer e-mail/senha é aceito; o perfil selecionado define o nível de acesso.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
