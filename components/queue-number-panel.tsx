import { cn } from "@/lib/utils";

interface QueueNumberPanelProps {
  label?: string;
  displayNo: string;
  size?: "md" | "lg" | "xl";
  className?: string;
  children?: React.ReactNode;
}

const sizeStyles = {
  md: "text-6xl sm:text-7xl",
  lg: "text-7xl sm:text-8xl",
  xl: "text-7xl sm:text-8xl display-pulse",
};

export function QueueNumberPanel({
  label,
  displayNo,
  size = "lg",
  className,
  children,
}: QueueNumberPanelProps) {
  return (
    <div className={cn("brand-panel", className)}>
      {label && <p className="text-sm font-medium text-white/70">{label}</p>}
      <p className={cn("mt-2 font-black tracking-tight tabular-nums", sizeStyles[size])}>
        {displayNo}
      </p>
      {children}
    </div>
  );
}
