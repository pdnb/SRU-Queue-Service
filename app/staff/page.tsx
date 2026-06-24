"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Megaphone } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { EmptyState } from "@/components/empty-state";
import { QueueNumberPanel } from "@/components/queue-number-panel";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useQueueUpdates } from "@/hooks/use-queue-updates";
import { TicketStatus } from "@/app/generated/prisma/enums";
import { cn } from "@/lib/utils";

interface Counter {
  id: string;
  name: string;
  service: { id: string; name: string };
}

interface Ticket {
  id: string;
  displayNo: string;
  studentId: string;
  studentName: string;
  status: string;
}

interface StaffContext {
  counter: Counter;
  currentTicket: Ticket | null;
  waitingTickets: Ticket[];
}

export default function StaffPage() {
  const { data: session } = useSession();
  const [counters, setCounters] = useState<Counter[]>([]);
  const [selectedCounterId, setSelectedCounterId] = useState<string>("");
  const [context, setContext] = useState<StaffContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadCounters = useCallback(async () => {
    const response = await fetch("/api/admin/counters");
    if (!response.ok) return;
    const data = await response.json();
    const active = (data.counters ?? []).filter((c: Counter & { isActive: boolean }) => c.isActive);
    setCounters(active);
  }, []);

  const loadContext = useCallback(async () => {
    if (!selectedCounterId) return;
    const response = await fetch(`/api/staff/context?counterId=${selectedCounterId}`);
    if (!response.ok) return;
    const data = await response.json();
    setContext(data);
  }, [selectedCounterId]);

  useEffect(() => {
    loadCounters();
  }, [loadCounters]);

  useEffect(() => {
    if (session?.user.counterId && !selectedCounterId) {
      setSelectedCounterId(session.user.counterId);
    }
  }, [session, selectedCounterId]);

  useEffect(() => {
    loadContext();
  }, [loadContext]);

  useQueueUpdates(loadContext);

  const assignCounter = async () => {
    if (!selectedCounterId) return;
    await fetch("/api/staff/context", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ counterId: selectedCounterId }),
    });
    setMessage("บันทึกช่องบริการแล้ว");
  };

  const callNext = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/tickets/call-next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ counterId: selectedCounterId }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error?.message ?? "ไม่สามารถเรียกคิวได้");
        return;
      }
      await loadContext();
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: "SERVING" | "COMPLETED" | "SKIPPED" | "NO_SHOW") => {
    if (!context?.currentTicket) return;
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/tickets/${context.currentTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error?.message ?? "ไม่สามารถอัปเดตคิวได้");
        return;
      }
      await loadContext();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-surface">
      <AppHeader
        title="หน้าจอเจ้าหน้าที่"
        subtitle={session?.user?.name ?? ""}
        showLogout
        adminLink={session?.user?.role === "ADMIN"}
      />
      <main className="page-main grid gap-6 lg:grid-cols-[300px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>ช่องบริการ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="counter">เลือกช่อง</Label>
              <Select
                id="counter"
                value={selectedCounterId}
                onChange={(e) => setSelectedCounterId(e.target.value)}
              >
                <option value="">-- เลือกช่องบริการ --</option>
                {counters.map((counter) => (
                  <option key={counter.id} value={counter.id}>
                    {counter.name} ({counter.service.name})
                  </option>
                ))}
              </Select>
            </div>
            <Button
              className="h-10 w-full cursor-pointer"
              variant="outline"
              onClick={assignCounter}
            >
              บันทึกช่องบริการ
            </Button>
            {message && (
              <p role="status" className="text-sm text-muted-foreground">
                {message}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle>คิวปัจจุบัน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {context?.currentTicket ? (
                <>
                  <QueueNumberPanel displayNo={context.currentTicket.displayNo} size="md">
                    <p className="mt-4 text-2xl font-semibold">
                      {context.currentTicket.studentName}
                    </p>
                    <p className="mt-1 text-white/70">
                      รหัส {context.currentTicket.studentId}
                    </p>
                    <StatusBadge
                      status={context.currentTicket.status as TicketStatus}
                      appearance="onBrand"
                      className="mt-3"
                    />
                  </QueueNumberPanel>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      size="lg"
                      variant="cta"
                      className="cursor-pointer"
                      disabled={loading}
                      onClick={() => updateStatus("SERVING")}
                    >
                      เริ่มให้บริการ
                    </Button>
                    <Button
                      size="lg"
                      variant="success"
                      className="cursor-pointer"
                      disabled={loading}
                      onClick={() => updateStatus("COMPLETED")}
                    >
                      เสร็จสิ้น
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="cursor-pointer"
                      disabled={loading}
                      onClick={() => updateStatus("SKIPPED")}
                    >
                      ข้าม
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="cursor-pointer"
                      disabled={loading}
                      onClick={() => updateStatus("NO_SHOW")}
                    >
                      ไม่มาติดต่อ
                    </Button>
                  </div>
                </>
              ) : (
                <EmptyState title="ยังไม่มีคิวที่เรียก" />
              )}
              <Button
                size="lg"
                variant="cta"
                className="w-full cursor-pointer text-lg"
                disabled={loading || !selectedCounterId}
                onClick={callNext}
              >
                <Megaphone className="size-5" aria-hidden />
                เรียกคิวถัดไป
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>คิวรอถัดไป</CardTitle>
              <Badge variant="secondary">
                {context?.waitingTickets.length ?? 0} คิว
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {context?.waitingTickets.length ? (
                context.waitingTickets.map((ticket, index) => (
                  <div
                    key={ticket.id}
                    className={cn(
                      "surface-card flex items-center justify-between px-4 py-3 transition-colors duration-200",
                      index === 0 && "border-cta/30 bg-cta/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="queue-number text-2xl">{ticket.displayNo}</span>
                      {index === 0 && (
                        <Badge variant="cta" size="default">
                          ถัดไป
                        </Badge>
                      )}
                    </div>
                    <span className="text-muted-foreground">{ticket.studentName}</span>
                  </div>
                ))
              ) : (
                <p role="status" className="py-6 text-center text-muted-foreground">
                  ไม่มีคิวรอ
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
