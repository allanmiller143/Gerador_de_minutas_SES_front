import { Bell, ChevronDown, LogOut, UserCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth, roleLabel } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export const Topbar = ({ title, subtitle }: TopbarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-xl font-bold text-foreground leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        <button className="relative h-9 w-9 rounded-full hover:bg-secondary flex items-center justify-center transition-colors">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-secondary transition-colors">
              <UserCircle2 className="h-7 w-7 text-muted-foreground" />
              <div className="text-left hidden sm:block">
                <div className="text-sm font-medium leading-tight">{user?.name ?? "Convidado"}</div>
                <div className="text-[11px] text-muted-foreground leading-tight">
                  {user ? roleLabel[user.role] : "—"}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="font-medium">{user?.name}</div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4 mr-2" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
