"use client";

import { useRef } from "react";
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
  const inputRef = useRef<HTMLInputElement>(null);

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
    inputRef.current?.focus();
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="surface-card px-6 py-8 text-center">
        <label htmlFor="student-id-input" className="mb-2 block text-sm font-medium text-muted-foreground">
          รหัสนักศึกษา
        </label>
        <input
          ref={inputRef}
          id="student-id-input"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
          value={value}
          placeholder="—"
          disabled={loading}
          aria-live="polite"
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, 13);
            onChange(digits);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSubmit();
            }
          }}
          className="min-h-14 w-full border-0 bg-transparent text-center text-4xl font-bold tracking-[0.2em] text-brand tabular-nums outline-none placeholder:text-brand/30 focus:ring-0 disabled:opacity-50"
        />
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
