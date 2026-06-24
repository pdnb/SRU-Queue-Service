"use client";

import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StudentConfirmProps {
  studentName: string;
  studentId: string;
  serviceName: string;
  onConfirm: () => void;
  onBack: () => void;
  loading?: boolean;
}

export function StudentConfirm({
  studentName,
  studentId,
  serviceName,
  onConfirm,
  onBack,
  loading,
}: StudentConfirmProps) {
  return (
    <Card className="mx-auto w-full max-w-xl border-cta/20">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-cta/10 text-cta">
          <User className="size-7" aria-hidden />
        </div>
        <CardTitle className="text-2xl">ยืนยันข้อมูล</CardTitle>
        <p className="text-muted-foreground">บริการ: {serviceName}</p>
      </CardHeader>
      <CardContent className="space-y-8 text-center">
        <div className="info-panel">
          <p className="text-sm font-medium text-muted-foreground">ชื่อ-นามสกุล</p>
          <p className="mt-1 text-3xl font-bold text-foreground sm:text-4xl">{studentName}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">รหัสนักศึกษา</p>
          <p className="mt-1 text-2xl font-semibold tracking-wider text-brand tabular-nums">
            {studentId}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1 cursor-pointer text-lg"
            onClick={onBack}
            disabled={loading}
          >
            ย้อนกลับ
          </Button>
          <Button
            type="button"
            variant="cta"
            size="lg"
            className="flex-1 cursor-pointer text-lg"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "กำลังออกคิว..." : "ยืนยันรับคิว"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
