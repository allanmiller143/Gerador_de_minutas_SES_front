import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pill, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { ApiError, API_BASE_URL } from "@/lib/api";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success("Login realizado com sucesso");
      navigate("/");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 401
            ? "Usuário ou senha inválidos"
            : err.message
          : "Não foi possível conectar ao servidor";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
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
            A IA pré-analisa todos os processos SEI assim que chegam. Você apenas revisa, ajusta e salva.
          </p>
        </div>
        <div className="relative z-10 text-xs text-sidebar-foreground/50">
          Secretaria Estadual de Saúde
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
          <p className="text-sm text-muted-foreground mb-6">
            Entre com suas credenciais institucionais.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-[calc(50%-0.5em)] text-muted-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-gradient-primary" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Entrar
            </Button>
          </form>

          <div className="mt-6 rounded-lg border border-dashed border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
            <strong className="text-foreground">API:</strong> {API_BASE_URL}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
