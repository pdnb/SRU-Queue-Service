"use client";

import { Volume2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QueueNumberPanel } from "@/components/queue-number-panel";
import { StatusBadge } from "@/components/status-badge";
import {
  getStatusMessage,
  type TicketStatusData,
} from "@/lib/ticket-status";
import { TicketStatus } from "@/app/generated/prisma/enums";
import { cn } from "@/lib/utils";

interface TicketStatusViewProps {
  ticket: TicketStatusData;
  soundEnabled?: boolean;
  onReplayAnnouncement?: () => void;
}

export function TicketStatusView({
  ticket,
  soundEnabled = false,
  onReplayAnnouncement,
}: TicketStatusViewProps) {
  const isActive =
    ticket.status === TicketStatus.WAITING ||
    ticket.status === TicketStatus.CALLED ||
    ticket.status === TicketStatus.SERVING;

  const showReplay =
    soundEnabled &&
    ticket.status === TicketStatus.CALLED &&
    ticket.counter &&
    onReplayAnnouncement;

  return (
    <Card className="mx-auto w-full max-w-lg overflow-hidden">
      <QueueNumberPanel label="เลขคิว" displayNo={ticket.displayNo} className="rounded-none border-0" />
      <CardHeader className="text-center">
        <CardTitle className="text-lg">ติดตามคิว</CardTitle>
        <p className="text-muted-foreground">{ticket.service.name}</p>
      </CardHeader>
      <CardContent className="space-y-6 text-center">
        <div>
          <p className="text-lg font-medium">{ticket.studentName}</p>
          <StatusBadge status={ticket.status} className="mt-3" />
        </div>
        <p
          className={cn(
            "rounded-lg px-4 py-3 text-base",
            isActive ? "bg-cta/5 text-foreground" : "text-muted-foreground",
          )}
          role="status"
          aria-live="polite"
        >
          {getStatusMessage(ticket)}
        </p>
        {showReplay && (
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={onReplayAnnouncement}
          >
            <Volume2 className="size-4" aria-hidden />
            ฟังซ้ำ
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
