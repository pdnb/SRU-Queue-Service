"use client";

import { useCallback, useEffect, useRef } from "react";
import { createPusherClient, QUEUE_CHANNEL } from "@/lib/pusher";

export function useQueueUpdates(onUpdate: () => void, pollIntervalMs = 5000) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const refresh = useCallback(() => {
    onUpdateRef.current();
  }, []);

  useEffect(() => {
    const pusher = createPusherClient();
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    if (pusher) {
      const channel = pusher.subscribe(QUEUE_CHANNEL);
      channel.bind("update", refresh);
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
  }, [refresh, pollIntervalMs]);

  return { refresh };
}
