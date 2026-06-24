import { TicketStatus } from "@/app/generated/prisma/enums";

export interface TicketStatusData {
  id: string;
  displayNo: string;
  studentName: string;
  status: TicketStatus;
  waitingAhead: number;
  service: { id: string; name: string };
  counter: { id: string; name: string } | null;
}

export function getStatusMessage(ticket: TicketStatusData): string {
  switch (ticket.status) {
    case TicketStatus.WAITING:
      return `รอเรียกคิว — มีคิวรอก่อนหน้า ${ticket.waitingAhead} คิว`;
    case TicketStatus.CALLED:
      return ticket.counter
        ? `กรุณาไปที่ ${ticket.counter.name}`
        : "คิวของคุณถูกเรียกแล้ว";
    case TicketStatus.SERVING:
      return ticket.counter
        ? `กำลังให้บริการที่ ${ticket.counter.name}`
        : "กำลังให้บริการ";
    case TicketStatus.COMPLETED:
      return "ให้บริการเสร็จสิ้น";
    case TicketStatus.SKIPPED:
      return "คิวถูกข้าม";
    case TicketStatus.NO_SHOW:
      return "ไม่มาตามคิว";
    default:
      return "";
  }
}

export function getStatusLabel(status: TicketStatus): string {
  switch (status) {
    case TicketStatus.WAITING:
      return "รอเรียก";
    case TicketStatus.CALLED:
      return "ถูกเรียก";
    case TicketStatus.SERVING:
      return "กำลังให้บริการ";
    case TicketStatus.COMPLETED:
      return "เสร็จสิ้น";
    case TicketStatus.SKIPPED:
      return "ข้าม";
    case TicketStatus.NO_SHOW:
      return "ไม่มาตามคิว";
    default:
      return status;
  }
}
