"use client";

import { useCallback, useEffect, useRef } from "react";
import { TicketStatus } from "@/app/generated/prisma/enums";
import { announceForTicket } from "@/lib/queue-announcement";
import type { TicketStatusData } from "@/lib/ticket-status";

export function useTicketAnnouncement(
  ticket: TicketStatusData | null,
  canAnnounce: boolean,
) {
  const previousStatusRef = useRef<TicketStatus | null>(null);

  const announce = useCallback((data: TicketStatusData) => {
    if (!data.counter) return;
    announceForTicket(data.displayNo, data.counter.name);
  }, []);

  useEffect(() => {
    if (!ticket) {
      previousStatusRef.current = null;
      return;
    }

    const previousStatus = previousStatusRef.current;
    if (
      canAnnounce &&
      previousStatus === TicketStatus.WAITING &&
      ticket.status === TicketStatus.CALLED
    ) {
      announce(ticket);
    }

    previousStatusRef.current = ticket.status;
  }, [announce, canAnnounce, ticket]);

  const replay = useCallback(() => {
    if (!ticket || ticket.status !== TicketStatus.CALLED) return;
    announce(ticket);
  }, [announce, ticket]);

  return { replay };
}
