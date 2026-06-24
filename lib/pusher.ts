import Pusher from "pusher";
import PusherClient from "pusher-js";

export const QUEUE_CHANNEL = "queue-updates";

export type QueueEventType =
  | "ticket_created"
  | "ticket_called"
  | "ticket_updated"
  | "queue_reset";

export interface QueueEventPayload {
  type: QueueEventType;
  ticket?: unknown;
  counter?: unknown;
  service?: unknown;
}

function isPusherConfigured() {
  return Boolean(
    process.env.PUSHER_APP_ID &&
      process.env.PUSHER_KEY &&
      process.env.PUSHER_SECRET &&
      process.env.PUSHER_CLUSTER,
  );
}

let serverPusher: Pusher | null = null;

export function getPusherServer(): Pusher | null {
  if (!isPusherConfigured()) return null;
  if (!serverPusher) {
    serverPusher = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS: true,
    });
  }
  return serverPusher;
}

export async function broadcastQueueUpdate(payload: QueueEventPayload) {
  const pusher = getPusherServer();
  if (!pusher) return;
  await pusher.trigger(QUEUE_CHANNEL, "update", payload);
}

export function createPusherClient(): PusherClient | null {
  if (!process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
    return null;
  }

  return new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  });
}
