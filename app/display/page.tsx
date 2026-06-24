"use client";

import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { useQueueUpdates } from "@/hooks/use-queue-updates";
import { cn } from "@/lib/utils";

interface QueueState {
  counters: Array<{
    id: string;
    name: string;
    service: { name: string; prefix: string };
    currentTicket: { displayNo: string } | null;
  }>;
  recentWaiting: Array<{
    id: string;
    displayNo: string;
    serviceName: string;
  }>;
}

export default function DisplayPage() {
  const [state, setState] = useState<QueueState | null>(null);
  const [time, setTime] = useState("");

  const loadState = useCallback(async () => {
    const response = await fetch("/api/queue/state");
    if (!response.ok) return;
    const data = await response.json();
    setState(data);
  }, []);

  useEffect(() => {
    loadState();
  }, [loadState]);

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  useQueueUpdates(loadState);

  return (
    <div className="display-surface">
      <AppHeader
        title="ระบบเรียกคิวบริการนักศึกษา"
        subtitle="กรุณารอฟังเรียกเลขคิวของท่าน"
        variant="brand"
        layout="centered"
        showBackLink={false}
        trailing={
          time ? (
            <time dateTime={time} className="text-2xl font-medium tabular-nums text-warning/90">
              {time}
            </time>
          ) : null
        }
      />

      <main className="page-main grid max-w-7xl gap-8 lg:grid-cols-[2fr_1fr]">
        <section aria-labelledby="calling-heading">
          <h2
            id="calling-heading"
            className="mb-5 flex items-center gap-2 text-xl font-semibold text-warning/90"
          >
            <span className="size-2.5 animate-pulse rounded-full bg-warning" aria-hidden />
            กำลังเรียก
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {state?.counters.map((counter) => (
              <article
                key={counter.id}
                className={cn(
                  "display-card text-center",
                  counter.currentTicket && "display-card-active"
                )}
              >
                <p className="text-base text-white/70">
                  {counter.service.name}
                  <span className="mx-2 text-white/30">·</span>
                  {counter.name}
                </p>
                <p
                  className={cn(
                    "mt-4",
                    counter.currentTicket
                      ? "display-calling-number text-7xl sm:text-8xl"
                      : "text-7xl font-black tracking-tight text-white/20 tabular-nums sm:text-8xl"
                  )}
                >
                  {counter.currentTicket?.displayNo ?? "—"}
                </p>
              </article>
            ))}
            {!state?.counters.length && (
              <p className="col-span-full py-12 text-center text-white/50">กำลังโหลด...</p>
            )}
          </div>
        </section>

        <section aria-labelledby="waiting-heading">
          <h2 id="waiting-heading" className="mb-5 text-xl font-semibold text-white/80">
            คิวรอล่าสุด
          </h2>
          <div className="display-card space-y-1 p-4">
            {state?.recentWaiting.length ? (
              state.recentWaiting.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between border-b border-white/10 py-3 last:border-0"
                >
                  <span className="display-waiting-number text-3xl">{ticket.displayNo}</span>
                  <span className="text-white/60">{ticket.serviceName}</span>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-white/50">ไม่มีคิวรอ</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
