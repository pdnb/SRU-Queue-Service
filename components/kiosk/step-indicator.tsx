import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "service", label: "เลือกบริการ" },
  { key: "studentId", label: "รหัสนักศึกษา" },
  { key: "confirm", label: "ยืนยัน" },
  { key: "result", label: "รับคิว" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

interface StepIndicatorProps {
  current: StepKey;
}

export function StepIndicator({ current }: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <ol
      aria-label="ขั้นตอนการรับคิว"
      className="mx-auto flex max-w-2xl items-center justify-between gap-2"
    >
      {STEPS.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        return (
          <li key={step.key} className="flex flex-1 items-center gap-2">
            <div className="flex flex-col items-center gap-1.5">
              <span
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-200",
                  done && "bg-cta text-cta-foreground",
                  active && "bg-brand text-brand-foreground ring-4 ring-brand/15",
                  !done && !active && "bg-muted text-muted-foreground"
                )}
              >
                {done ? <Check className="size-4" aria-hidden /> : index + 1}
              </span>
              <span
                className={cn(
                  "hidden text-xs font-medium sm:block",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                aria-hidden
                className={cn(
                  "mb-5 h-0.5 flex-1 transition-colors duration-200",
                  done ? "bg-cta" : "bg-border"
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
