"use client";

import { Delete } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StudentIdKeypadProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
  error?: string | null;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "ลบ", "0", "ตรวจสอบ"];

export function StudentIdKeypad({
  value,
  onChange,
  onSubmit,
  loading,
  error,
}: StudentIdKeypadProps) {
  const handleKey = (key: string) => {
    if (key === "ลบ") {
      onChange(value.slice(0, -1));
      return;
    }
    if (key === "ตรวจสอบ") {
      onSubmit();
      return;
    }
    if (value.length >= 13) return;
    onChange(value + key);
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="surface-card px-6 py-8 text-center">
        <p className="mb-2 text-sm font-medium text-muted-foreground">รหัสนักศึกษา</p>
        <p
          className="min-h-14 text-4xl font-bold tracking-[0.2em] text-brand tabular-nums"
          aria-live="polite"
        >
          {value || "—"}
        </p>
      </div>

      {error && <p role="alert" className="alert-error">{error}</p>}

      <div className="grid grid-cols-3 gap-3">
        {KEYS.map((key) => (
          <Button
            key={key}
            type="button"
            size="lg"
            variant={key === "ตรวจสอบ" ? "cta" : "outline"}
            className={cn("touch-target text-xl", key === "ตรวจสอบ" && "col-span-1")}
            disabled={loading}
            onClick={() => handleKey(key)}
          >
            {key === "ลบ" ? <Delete className="size-6" aria-label="ลบ" /> : key}
          </Button>
        ))}
      </div>
    </div>
  );
}
