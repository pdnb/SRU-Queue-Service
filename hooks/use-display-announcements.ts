"use client";

import { useCallback, useRef } from "react";
import { announceForDisplay } from "@/lib/queue-announcement";
import type { QueueEventPayload } from "@/lib/pusher";

export interface DisplayCounterState {
  id: string;
  name: string;
  currentTicket: { id: string; displayNo: string } | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseCalledEvent(payload: QueueEventPayload) {
  if (payload.type !== "ticket_called") return null;
  if (!isRecord(payload.ticket) || !isRecord(payload.counter)) return null;

  const displayNo = payload.ticket.displayNo;
  const ticketId = payload.ticket.id;
  const counterId = payload.counter.id;
  const counterName = payload.counter.name;

  if (
    typeof displayNo !== "string" ||
    typeof ticketId !== "string" ||
    typeof counterId !== "string" ||
    typeof counterName !== "string"
  ) {
    return null;
  }

  return { displayNo, ticketId, counterId, counterName };
}

export function useDisplayAnnouncements(canAnnounce: boolean) {
  const announcedByCounterRef = useRef(new Map<string, string>());
  const pollInitializedRef = useRef(false);

  const rememberCall = useCallback((counterId: string, ticketId: string) => {
    announcedByCounterRef.current.set(counterId, ticketId);
  }, []);

  const onQueueEvent = useCallback(
    (payload: QueueEventPayload) => {
      const event = parseCalledEvent(payload);
      if (!event) return;

      rememberCall(event.counterId, event.ticketId);
      if (!canAnnounce) return;

      announceForDisplay(event.displayNo, event.counterName);
    },
    [canAnnounce, rememberCall],
  );

  const onStateLoaded = useCallback(
    (counters: DisplayCounterState[]) => {
      if (!pollInitializedRef.current) {
        for (const counter of counters) {
          if (counter.currentTicket) {
            rememberCall(counter.id, counter.currentTicket.id);
          }
        }
        pollInitializedRef.current = true;
        return;
      }

      if (!canAnnounce) {
        for (const counter of counters) {
          if (counter.currentTicket) {
            rememberCall(counter.id, counter.currentTicket.id);
          } else {
            announcedByCounterRef.current.delete(counter.id);
          }
        }
        return;
      }

      for (const counter of counters) {
        const ticket = counter.currentTicket;
        const previousTicketId = announcedByCounterRef.current.get(counter.id);

        if (!ticket) {
          announcedByCounterRef.current.delete(counter.id);
          continue;
        }

        if (previousTicketId !== undefined && ticket.id !== previousTicketId) {
          announceForDisplay(ticket.displayNo, counter.name);
        }

        rememberCall(counter.id, ticket.id);
      }
    },
    [canAnnounce, rememberCall],
  );

  return { onQueueEvent, onStateLoaded };
}
