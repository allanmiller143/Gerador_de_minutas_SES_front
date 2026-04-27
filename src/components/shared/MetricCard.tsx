import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: "primary" | "warning" | "info" | "success";
}

const toneMap = {
  primary: "text-primary",
  warning: "text-warning",
  info: "text-info",
  success: "text-success",
};

export const MetricCard = ({ label, value, hint, icon: Icon, tone = "primary" }: MetricCardProps) => {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-card hover:shadow-elevated transition-shadow">
      <div className="flex items-start justify-between">
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        {Icon && <Icon className={cn("h-4 w-4", toneMap[tone])} />}
      </div>
      <div className={cn("mt-2 text-3xl font-bold tracking-tight", toneMap[tone])}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
};
