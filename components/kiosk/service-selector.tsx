"use client";

import { ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  description: string | null;
  prefix: string;
}

interface ServiceSelectorProps {
  services: Service[];
  onSelect: (service: Service) => void;
}

export function ServiceSelector({ services, onSelect }: ServiceSelectorProps) {
  if (services.length === 0) {
    return (
      <EmptyState
        title="ยังไม่มีบริการที่เปิดใช้งาน"
        description="กรุณาติดต่อเจ้าหน้าที่"
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => (
        <button
          key={service.id}
          type="button"
          onClick={() => onSelect(service)}
          className={cn(
            "group surface-card-interactive flex flex-col items-start gap-4 p-6 text-left",
            "hover:border-cta/40"
          )}
        >
          <span className="queue-number text-5xl">{service.prefix}</span>
          <div className="space-y-1">
            <span className="block text-xl font-semibold">{service.name}</span>
            {service.description && (
              <span className="block text-sm leading-relaxed text-muted-foreground">
                {service.description}
              </span>
            )}
          </div>
          <span className="mt-auto flex items-center gap-1 text-sm font-medium text-cta opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
            เลือกบริการนี้
            <ChevronRight className="size-4" aria-hidden />
          </span>
        </button>
      ))}
    </div>
  );
}
