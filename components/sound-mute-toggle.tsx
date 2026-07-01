"use client";

import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SoundMuteToggleProps {
  muted: boolean;
  onToggle: () => void;
  className?: string;
}

export function SoundMuteToggle({ muted, onToggle, className }: SoundMuteToggleProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      className={cn(
        "fixed right-4 bottom-4 z-40 cursor-pointer border border-white/10 bg-black/30 text-white hover:bg-black/50 hover:text-white",
        className,
      )}
      onClick={onToggle}
      aria-label={muted ? "เปิดเสียงประกาศ" : "ปิดเสียงประกาศ"}
      aria-pressed={muted}
    >
      {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
    </Button>
  );
}
