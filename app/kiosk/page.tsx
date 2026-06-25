"use client";

import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { StepIndicator } from "@/components/kiosk/step-indicator";
import { ServiceSelector } from "@/components/kiosk/service-selector";
import { StudentConfirm } from "@/components/kiosk/student-confirm";
import { StudentIdKeypad } from "@/components/kiosk/student-id-keypad";
import { TicketResult } from "@/components/kiosk/ticket-result";
import { Button } from "@/components/ui/button";
import { useQueueUpdates } from "@/hooks/use-queue-updates";
import { APP_NAME } from "@/lib/branding";

type Step = "service" | "studentId" | "confirm" | "result";

interface Service {
  id: string;
  name: string;
  description: string | null;
  prefix: string;
}

interface Student {
  studentId: string;
  fullName: string;
}

interface TicketResponse {
  ticket: {
    id: string;
    displayNo: string;
    studentName: string;
    service: { name: string };
  };
  waitingAhead: number;
  isDuplicate: boolean;
}

export default function KioskPage() {
  const [step, setStep] = useState<Step>("service");
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [studentId, setStudentId] = useState("");
  const [student, setStudent] = useState<Student | null>(null);
  const [result, setResult] = useState<TicketResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadServices = useCallback(async () => {
    const response = await fetch("/api/services");
    const data = await response.json();
    setServices(data.services ?? []);
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  useQueueUpdates(loadServices);

  const reset = () => {
    setStep("service");
    setSelectedService(null);
    setStudentId("");
    setStudent(null);
    setResult(null);
    setError(null);
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep("studentId");
    setError(null);
  };

  const handleLookupStudent = async () => {
    if (studentId.length < 8) {
      setError("รหัสนักศึกษาต้องมีอย่างน้อย 8 หลัก");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/students/${studentId}`);
      const data = await response.json();
      if (!response.ok) {
        setError(data.error?.message ?? "ไม่พบรหัสนักศึกษา");
        return;
      }
      setStudent({ studentId: data.studentId, fullName: data.fullName });
      setStep("confirm");
    } catch {
      setError("ไม่สามารถเชื่อมต่อระบบได้");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!selectedService || !student) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService.id,
          studentId: student.studentId,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error?.message ?? "ไม่สามารถรับคิวได้");
        return;
      }
      setResult(data);
      setStep("result");
    } catch {
      setError("ไม่สามารถเชื่อมต่อระบบได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-surface">
      <AppHeader
        title="รับคิว"
        subtitle={APP_NAME}
        variant="brand"
      />
      <main className="page-main">
        <div className="mb-10">
          <StepIndicator current={step} />
        </div>

        {step === "service" && (
          <div className="space-y-6">
            <h2 className="section-heading text-center">เลือกบริการ</h2>
            <ServiceSelector services={services} onSelect={handleServiceSelect} />
          </div>
        )}

        {step === "studentId" && selectedService && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">บริการที่เลือก</p>
                <h2 className="section-heading">{selectedService.name}</h2>
              </div>
              <Button
                variant="outline"
                className="cursor-pointer shrink-0"
                onClick={() => setStep("service")}
              >
                เปลี่ยนบริการ
              </Button>
            </div>
            <StudentIdKeypad
              value={studentId}
              onChange={setStudentId}
              onSubmit={handleLookupStudent}
              loading={loading}
              error={error}
            />
          </div>
        )}

        {step === "confirm" && selectedService && student && (
          <StudentConfirm
            studentName={student.fullName}
            studentId={student.studentId}
            serviceName={selectedService.name}
            onConfirm={handleCreateTicket}
            onBack={() => setStep("studentId")}
            loading={loading}
          />
        )}

        {step === "result" && result && (
          <TicketResult
            ticketId={result.ticket.id}
            displayNo={result.ticket.displayNo}
            studentName={result.ticket.studentName}
            serviceName={result.ticket.service.name}
            waitingAhead={result.waitingAhead}
            isDuplicate={result.isDuplicate}
            onReset={reset}
          />
        )}
      </main>
    </div>
  );
}
