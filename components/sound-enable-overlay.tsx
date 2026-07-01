"use client";

import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SoundEnableOverlayProps {
  onEnable: () => void;
  className?: string;
}

export function SoundEnableOverlay({ onEnable, className }: SoundEnableOverlayProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm",
        className,
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sound-enable-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-background p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-cta/10 text-cta">
          <Volume2 className="size-7" aria-hidden />
        </div>
        <h2 id="sound-enable-title" className="text-xl font-semibold">
          เปิดเสียงเรียกคิว
        </h2>
        <p className="mt-2 text-muted-foreground">
          กดปุ่มด้านล่างเพื่อเปิดเสียงประกาศเรียกคิวบนอุปกรณ์นี้
        </p>
        <Button
          size="lg"
          variant="cta"
          className="mt-6 h-11 w-full cursor-pointer"
          onClick={onEnable}
        >
          เปิดเสียง
        </Button>
      </div>
    </div>
  );
}
