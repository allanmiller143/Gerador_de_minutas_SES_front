import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, FileText, ClipboardList, Scale, BarChart3, Settings, LogOut, Pill } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/data/mock";

const items: { to: string; label: string; icon: typeof Home; end?: boolean; roles?: UserRole[] }[] = [
  { to: "/", label: "Início", icon: Home, end: true },
  { to: "/seis", label: "SEIs", icon: FileText },
  { to: "/minhas-analises", label: "Minhas Análises", icon: ClipboardList },
  { to: "/jurisprudencias", label: "Jurisprudências", icon: Scale },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3, roles: ["administrador"] },
  { to: "/configuracoes", label: "Configurações", icon: Settings, roles: ["administrador"] },
];

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const visible = items.filter((it) => !it.roles || (user && it.roles.includes(user.role)));

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-gradient-sidebar text-sidebar-foreground border-r border-sidebar-border shrink-0">
      <div className="px-5 py-6 flex items-center gap-3 border-b border-sidebar-border">
        <div className="h-10 w-10 rounded-lg bg-sidebar-primary/20 ring-1 ring-sidebar-primary/40 flex items-center justify-center">
          <Pill className="h-5 w-5 text-sidebar-primary" />
        </div>
        <div>
          <div className="font-bold text-sidebar-accent-foreground leading-tight">Farmácia SES</div>
          <div className="text-xs text-sidebar-foreground/60">Análise de SEI</div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {visible.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )
            }
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
      <input type="hidden" value={location.pathname} readOnly />
    </aside>
  );
};
