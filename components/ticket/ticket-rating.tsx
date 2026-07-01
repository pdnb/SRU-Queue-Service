"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DISMISS_KEY_PREFIX = "rating-dismissed:";

interface TicketRatingProps {
  ticketId: string;
  rating: number | null;
  canRate: boolean;
  onRated: (rating: number) => void;
}

function StarRating({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div
      className="flex justify-center gap-1"
      role="radiogroup"
      aria-label="ให้คะแนนความพึงพอใจ"
      onMouseLeave={() => setHovered(0)}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const starValue = index + 1;
        const active = starValue <= (hovered || value);

        return (
          <button
            key={starValue}
            type="button"
            role="radio"
            aria-checked={value === starValue}
            aria-label={`${starValue} ดาว`}
            disabled={disabled}
            className={cn(
              "cursor-pointer rounded-md p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-60",
              active ? "text-warning" : "text-muted-foreground/40 hover:text-warning/70",
            )}
            onMouseEnter={() => setHovered(starValue)}
            onClick={() => onChange(starValue)}
          >
            <Star className={cn("size-9", active && "fill-current")} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}

function isDismissed(ticketId: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`${DISMISS_KEY_PREFIX}${ticketId}`) === "1";
}

function dismiss(ticketId: string) {
  localStorage.setItem(`${DISMISS_KEY_PREFIX}${ticketId}`, "1");
}

export function TicketRating({ ticketId, rating, canRate, onRated }: TicketRatingProps) {
  const [dismissed, setDismissed] = useState(() => isDismissed(ticketId));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (rating !== null) {
    return (
      <div className="space-y-3 rounded-lg border bg-muted/30 px-4 py-5">
        <p className="text-base font-medium">ขอบคุณที่ให้คะแนน</p>
        <StarRating value={rating} onChange={() => {}} disabled />
      </div>
    );
  }

  if (!canRate || dismissed) {
    return null;
  }

  const submitRating = async (value: number) => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/tickets/${ticketId}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: value }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "ไม่สามารถบันทึกคะแนนได้");
        return;
      }

      onRated(data.rating.rating);
    } catch {
      setError("ไม่สามารถบันทึกคะแนนได้");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = () => {
    dismiss(ticketId);
    setDismissed(true);
  };

  return (
    <div className="space-y-4 rounded-lg border border-warning/30 bg-warning/5 px-4 py-5">
      <div className="space-y-1">
        <p className="text-base font-medium">ช่วยให้คะแนนหน่อยนะ</p>
        <p className="text-sm text-muted-foreground">ความพึงพอใจโดยรวมจากการรับบริการครั้งนี้</p>
      </div>
      <StarRating value={0} onChange={submitRating} disabled={submitting} />
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="cursor-pointer text-muted-foreground"
        onClick={handleDismiss}
        disabled={submitting}
      >
        ข้าม
      </Button>
    </div>
  );
}
