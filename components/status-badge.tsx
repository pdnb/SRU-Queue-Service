import { Badge } from "@/components/ui/badge";
import { getStatusLabel } from "@/lib/ticket-status";
import { TicketStatus } from "@/app/generated/prisma/enums";
import type { VariantProps } from "class-variance-authority";
import { badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusVariant: Record<TicketStatus, VariantProps<typeof badgeVariants>["variant"]> = {
  [TicketStatus.WAITING]: "warning",
  [TicketStatus.CALLED]: "cta",
  [TicketStatus.SERVING]: "success",
  [TicketStatus.COMPLETED]: "muted",
  [TicketStatus.SKIPPED]: "muted",
  [TicketStatus.NO_SHOW]: "destructive",
};

interface StatusBadgeProps {
  status: TicketStatus;
  appearance?: "default" | "onBrand";
  size?: VariantProps<typeof badgeVariants>["size"];
  className?: string;
}

export function StatusBadge({
  status,
  appearance = "default",
  size = "lg",
  className,
}: StatusBadgeProps) {
  const variant = appearance === "onBrand" ? "onBrand" : statusVariant[status];

  return (
    <Badge variant={variant} size={size} className={className}>
      {getStatusLabel(status)}
    </Badge>
  );
}
