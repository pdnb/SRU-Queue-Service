"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { TicketStatusView } from "@/components/ticket/ticket-status-view";
import { useQueueUpdates } from "@/hooks/use-queue-updates";
import type { TicketStatusData } from "@/lib/ticket-status";

type PageState =
  | { kind: "loading" }
  | { kind: "ready"; ticket: TicketStatusData }
  | { kind: "expired" }
  | { kind: "not_found" }
  | { kind: "error" };

function StatusMessage({ title, description }: { title: string; description: string }) {
  return (
    <div role="status" className="status-message">
      <p className="text-lg font-medium">{title}</p>
      <p className="mt-2 text-muted-foreground">{description}</p>
    </div>
  );
}

export default function TicketPage() {
  const params = useParams<{ id: string }>();
  const [state, setState] = useState<PageState>({ kind: "loading" });

  const loadTicket = useCallback(async () => {
    const response = await fetch(`/api/tickets/${params.id}`);
    const data = await response.json();

    if (response.status === 410) {
      setState({ kind: "expired" });
      return;
    }

    if (response.status === 404) {
      setState({ kind: "not_found" });
      return;
    }

    if (!response.ok) {
      setState({ kind: "error" });
      return;
    }

    setState({ kind: "ready", ticket: data.ticket });
  }, [params.id]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  useQueueUpdates(loadTicket);

  return (
    <div className="page-surface min-h-screen">
      <AppHeader
        title="ติดตามคิวบริการนักศึกษา"
        subtitle="ระบบรันคิวให้บริการนักศึกษา"
        variant="brand"
        layout="centered"
        backLabel="ระบบรันคิวให้บริการนักศึกษา"
      />
      <main className="page-main max-w-lg">
        {state.kind === "loading" && (
          <div className="space-y-4" aria-busy="true" aria-label="กำลังโหลด">
            <div className="h-40 animate-pulse rounded-xl bg-muted" />
            <div className="h-6 w-2/3 mx-auto animate-pulse rounded bg-muted" />
          </div>
        )}
        {state.kind === "ready" && <TicketStatusView ticket={state.ticket} />}
        {state.kind === "expired" && (
          <StatusMessage title="คิวหมดอายุแล้ว" description="คิวนี้ไม่สามารถติดตามได้อีกต่อไป" />
        )}
        {state.kind === "not_found" && (
          <StatusMessage title="ไม่พบคิว" description="ตรวจสอบลิงก์หรือ QR Code อีกครั้ง" />
        )}
        {state.kind === "error" && (
          <StatusMessage title="เกิดข้อผิดพลาด" description="ไม่สามารถโหลดข้อมูลคิวได้" />
        )}
      </main>
    </div>
  );
}
