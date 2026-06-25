"use client";

import { useState } from "react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentPhotoProps {
  src?: string | null;
  alt: string;
  size?: "md" | "lg" | "xl" | "fill";
  className?: string;
}

const sizeStyles = {
  md: "size-36 sm:size-40",
  lg: "size-44 sm:size-52",
  xl: "size-52 sm:size-60",
  fill: "size-52 aspect-square sm:size-60",
};

export function StudentPhoto({ src, alt, size = "lg", className }: StudentPhotoProps) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <div
      className={cn(
        "surface-card relative shrink-0 overflow-hidden bg-muted",
        sizeStyles[size],
        className,
      )}
      aria-label={showImage ? `รูปถ่าย ${alt}` : `ไม่มีรูปถ่าย ${alt}`}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="size-full object-cover object-top"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex size-full items-center justify-center text-muted-foreground">
          <User className="size-16 sm:size-20" aria-hidden />
        </div>
      )}
    </div>
  );
}
