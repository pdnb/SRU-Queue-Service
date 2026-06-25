import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PortalCardProps {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accent?: "cta" | "brand" | "muted";
}

const accentStyles = {
  cta: "bg-cta/10 text-cta group-hover:bg-cta group-hover:text-cta-foreground",
  brand: "bg-brand/8 text-brand group-hover:bg-brand group-hover:text-brand-foreground",
  muted:
    "bg-muted text-muted-foreground group-hover:bg-secondary group-hover:text-secondary-foreground",
};

export function PortalCard({
  href,
  title,
  description,
  icon: Icon,
  accent = "brand",
}: PortalCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group surface-card-interactive flex flex-col gap-4 p-6",
      )}
    >
      <div
        className={cn(
          "flex size-12 items-center justify-center rounded-lg transition-colors duration-200",
          accentStyles[accent]
        )}
      >
        <Icon className="size-6" aria-hidden />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}
