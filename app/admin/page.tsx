"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, ListOrdered, Timer, Users } from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Stats {
  total: number;
  waiting: number;
  called: number;
  completed: number;
  skipped: number;
  avgWaitMinutes: number;
  byService: Array<{ serviceName: string; count: number }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  const loadStats = async () => {
    const response = await fetch("/api/admin/stats");
    if (!response.ok) return;
    const data = await response.json();
    setStats(data.stats);
  };

  useEffect(() => {
    loadStats();
  }, []);

  const resetQueue = async () => {
    if (!confirm("ยืนยันรีเซ็ตคิววันนี้ทั้งหมด?")) return;
    await fetch("/api/admin/stats", { method: "DELETE" });
    await loadStats();
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="section-heading">ภาพรวมวันนี้</h2>
          <p className="text-sm text-muted-foreground">สถิติคิวประจำวัน</p>
        </div>
        <Button variant="destructive" className="cursor-pointer shrink-0" onClick={resetQueue}>
          รีเซ็ตคิววันนี้
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="คิวทั้งหมด" value={stats?.total ?? 0} icon={ListOrdered} tone="brand" />
        <StatCard title="รออยู่" value={stats?.waiting ?? 0} icon={Users} tone="warning" />
        <StatCard title="เสร็จสิ้น" value={stats?.completed ?? 0} icon={CheckCircle2} tone="success" />
        <StatCard
          title="เวลารอเฉลี่ย (นาที)"
          value={stats?.avgWaitMinutes ?? 0}
          icon={Timer}
          tone="cta"
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-5 text-muted-foreground" aria-hidden />
            คิวแยกตามบริการ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {stats?.byService.length ? (
            stats.byService.map((item) => (
              <div
                key={item.serviceName}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
              >
                <span>{item.serviceName}</span>
                <span className="font-semibold tabular-nums">{item.count}</span>
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-muted-foreground">ยังไม่มีข้อมูลคิววันนี้</p>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <ButtonLink
          href="/admin/services"
          variant="outline"
          className="h-auto cursor-pointer flex-col items-start gap-1 py-5 text-left"
        >
          <span className="font-semibold">จัดการบริการ</span>
          <span className="text-xs font-normal text-muted-foreground">เพิ่ม แก้ไข เปิด/ปิดบริการ</span>
        </ButtonLink>
        <ButtonLink
          href="/admin/counters"
          variant="outline"
          className="h-auto cursor-pointer flex-col items-start gap-1 py-5 text-left"
        >
          <span className="font-semibold">จัดการเคาน์เตอร์</span>
          <span className="text-xs font-normal text-muted-foreground">กำหนดเคาน์เตอร์และบริการ</span>
        </ButtonLink>
        <ButtonLink
          href="/admin/users"
          variant="outline"
          className="h-auto cursor-pointer flex-col items-start gap-1 py-5 text-left"
        >
          <span className="font-semibold">จัดการเจ้าหน้าที่</span>
          <span className="text-xs font-normal text-muted-foreground">บัญชีและสิทธิ์การใช้งาน</span>
        </ButtonLink>
      </div>
    </div>
  );
}
