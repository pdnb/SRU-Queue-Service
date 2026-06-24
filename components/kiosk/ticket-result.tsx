"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QueueNumberPanel } from "@/components/queue-number-panel";
import { getTicketUrl } from "@/lib/app-url";

interface TicketResultProps {
  ticketId: string;
  displayNo: string;
  studentName: string;
  serviceName: string;
  waitingAhead: number;
  isDuplicate: boolean;
  onReset: () => void;
}

export function TicketResult({
  ticketId,
  displayNo,
  studentName,
  serviceName,
  waitingAhead,
  isDuplicate,
  onReset,
}: TicketResultProps) {
  const [ticketUrl, setTicketUrl] = useState("");

  useEffect(() => {
    setTicketUrl(getTicketUrl(ticketId, window.location.origin));
  }, [ticketId]);

  return (
    <Card className="mx-auto w-full max-w-4xl border-cta/25">
      <CardHeader className="text-center">
        {isDuplicate ? (
          <Badge variant="warning" size="lg" className="mx-auto mb-2">
            คุณมีคิวรออยู่แล้ว
          </Badge>
        ) : (
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="size-6" aria-hidden />
          </div>
        )}
        <CardTitle className="text-2xl">
          {isDuplicate ? "คิวที่มีอยู่" : "รับคิวสำเร็จ"}
        </CardTitle>
        <p className="text-muted-foreground">{serviceName}</p>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <QueueNumberPanel label="เลขคิวของคุณ" displayNo={displayNo} size="lg">
            <p className="mt-6 text-lg font-medium">{studentName}</p>
            <p className="mt-2 text-white/70">
              มีคิวรอก่อนหน้า{" "}
              <span className="font-semibold text-white">{waitingAhead}</span> คิว
            </p>
          </QueueNumberPanel>
          <div className="flex flex-col items-center gap-4">
            {ticketUrl && (
              <div className="surface-card bg-white p-4 shadow-sm">
                <QRCodeSVG value={ticketUrl} size={200} level="M" />
              </div>
            )}
            <p className="max-w-xs text-center text-sm text-muted-foreground">
              แสกน QR Code เพื่อติดตามสถานะคิวบนมือถือ
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="cta"
          size="lg"
          className="w-full cursor-pointer text-lg"
          onClick={onReset}
        >
          รับคิวใหม่
        </Button>
      </CardContent>
    </Card>
  );
}
