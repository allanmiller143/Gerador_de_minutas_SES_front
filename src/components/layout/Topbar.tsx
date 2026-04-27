import { Bell, ChevronDown, UserCircle2 } from "lucide-react";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export const Topbar = ({ title, subtitle }: TopbarProps) => {
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
        <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-secondary transition-colors">
          <UserCircle2 className="h-7 w-7 text-muted-foreground" />
          <span className="text-sm font-medium">Analista</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
};
