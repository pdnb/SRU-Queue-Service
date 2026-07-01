"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  createPusherClient,
  QUEUE_CHANNEL,
  type QueueEventPayload,
} from "@/lib/pusher";

type UseQueueUpdatesOptions = {
  pollIntervalMs?: number;
  onEvent?: (payload: QueueEventPayload) => void;
};

export function useQueueUpdates(
  onUpdate: () => void,
  options?: number | UseQueueUpdatesOptions,
) {
  const opts: UseQueueUpdatesOptions =
    typeof options === "number" ? { pollIntervalMs: options } : (options ?? {});
  const pollIntervalMs = opts.pollIntervalMs ?? 5000;

  const onUpdateRef = useRef(onUpdate);
  const onEventRef = useRef(opts.onEvent);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
    onEventRef.current = opts.onEvent;
  });

  const refresh = useCallback(() => {
    onUpdateRef.current();
  }, []);

  useEffect(() => {
    const pusher = createPusherClient();
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    if (pusher) {
      const channel = pusher.subscribe(QUEUE_CHANNEL);
      channel.bind("update", (payload: QueueEventPayload) => {
        onEventRef.current?.(payload);
        refresh();
      });
    } else {
      pollTimer = setInterval(refresh, pollIntervalMs);
    }

    return () => {
      if (pollTimer) clearInterval(pollTimer);
      if (pusher) {
        pusher.unsubscribe(QUEUE_CHANNEL);
        pusher.disconnect();
      }
    };
  }, [pollIntervalMs, refresh]);

  return { refresh };
}
