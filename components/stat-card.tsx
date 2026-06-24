import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  tone?: "brand" | "cta" | "muted" | "success" | "warning";
}

const toneStyles = {
  brand: "border-l-brand bg-brand/5 text-brand",
  cta: "border-l-cta bg-cta/5 text-cta",
  muted: "border-l-border bg-muted/50 text-muted-foreground",
  success: "border-l-success bg-success/5 text-success",
  warning: "border-l-warning bg-warning/5 text-warning-foreground",
};

export function StatCard({ title, value, icon: Icon, tone = "brand" }: StatCardProps) {
  return (
    <Card className={cn("border-l-4", toneStyles[tone])}>
      <CardContent className="flex items-start justify-between gap-4 pt-6">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tabular-nums text-foreground">{value}</p>
        </div>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            tone === "brand" && "bg-brand/10 text-brand",
            tone === "cta" && "bg-cta/10 text-cta",
            tone === "muted" && "bg-muted text-muted-foreground",
            tone === "success" && "bg-success/10 text-success",
            tone === "warning" && "bg-warning/10 text-warning-foreground"
          )}
        >
          <Icon className="size-5" aria-hidden />
        </div>
      </CardContent>
    </Card>
  );
}
