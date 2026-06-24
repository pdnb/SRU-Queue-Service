import { TicketStatus } from "@/app/generated/prisma/enums";
import { formatDisplayNo, getQueueDate, isSameQueueDate } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { broadcastQueueUpdate } from "@/lib/pusher";
import { sisClient } from "@/lib/sis-client";

const ACTIVE_STATUSES: TicketStatus[] = [TicketStatus.WAITING, TicketStatus.CALLED];

export class QueueError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number = 400,
  ) {
    super(message);
    this.name = "QueueError";
  }
}

const ticketInclude = {
  service: true,
  counter: true,
} as const;

export async function getActiveServices() {
  return prisma.service.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function lookupStudent(studentId: string) {
  const student = await sisClient.lookupStudent(studentId);
  if (!student) {
    throw new QueueError("ไม่พบรหัสนักศึกษาในระบบทะเบียน", "STUDENT_NOT_FOUND", 404);
  }
  return student;
}

export async function findDuplicateTicket(
  studentId: string,
  serviceId: string,
  queueDate: Date,
) {
  const tickets = await prisma.queueTicket.findMany({
    where: {
      studentId,
      serviceId,
      status: { in: ACTIVE_STATUSES },
    },
    include: ticketInclude,
    orderBy: { createdAt: "desc" },
  });

  return (
    tickets.find((ticket) => isSameQueueDate(ticket.queueDate, queueDate)) ??
    null
  );
}

export async function createTicket(serviceId: string, studentId: string) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, isActive: true },
  });

  if (!service) {
    throw new QueueError("ไม่พบบริการที่เลือก", "SERVICE_NOT_FOUND", 404);
  }

  const student = await lookupStudent(studentId);
  const queueDate = getQueueDate();

  const existing = await findDuplicateTicket(studentId, serviceId, queueDate);
  if (existing) {
    const waitingAhead = await countWaitingAhead(existing);
    return { ticket: existing, isDuplicate: true, waitingAhead };
  }

  const ticket = await prisma.$transaction(async (tx) => {
    const lastTicket = await tx.queueTicket.findFirst({
      where: {
        serviceId,
        queueDate,
      },
      orderBy: { number: "desc" },
    });

    const number = (lastTicket?.number ?? 0) + 1;
    const displayNo = formatDisplayNo(service.prefix, number);

    return tx.queueTicket.create({
      data: {
        number,
        displayNo,
        studentId: student.studentId,
        studentName: student.fullName,
        serviceId,
        queueDate,
        status: TicketStatus.WAITING,
      },
      include: ticketInclude,
    });
  });

  const waitingAhead = await countWaitingAhead(ticket);

  await broadcastQueueUpdate({
    type: "ticket_created",
    ticket,
    service: ticket.service,
  });

  return { ticket, isDuplicate: false, waitingAhead };
}

export async function getTicketStatus(ticketId: string) {
  const ticket = await prisma.queueTicket.findUnique({
    where: { id: ticketId },
    include: ticketInclude,
  });

  if (!ticket) {
    throw new QueueError("ไม่พบคิว", "TICKET_NOT_FOUND", 404);
  }

  if (!isSameQueueDate(ticket.queueDate, new Date())) {
    throw new QueueError("คิวนี้หมดอายุแล้ว", "TICKET_EXPIRED", 410);
  }

  const waitingAhead = await countWaitingAhead(ticket);

  return {
    id: ticket.id,
    displayNo: ticket.displayNo,
    studentName: ticket.studentName,
    status: ticket.status,
    waitingAhead,
    service: {
      id: ticket.service.id,
      name: ticket.service.name,
    },
    counter: ticket.counter
      ? { id: ticket.counter.id, name: ticket.counter.name }
      : null,
  };
}

async function countWaitingAhead(ticket: {
  id: string;
  serviceId: string;
  queueDate: Date;
  number: number;
  status: TicketStatus;
}) {
  if (ticket.status !== TicketStatus.WAITING) return 0;

  return prisma.queueTicket.count({
    where: {
      serviceId: ticket.serviceId,
      queueDate: ticket.queueDate,
      status: TicketStatus.WAITING,
      number: { lt: ticket.number },
    },
  });
}

export async function callNext(counterId: string, staffUserId?: string) {
  const counter = await prisma.counter.findFirst({
    where: { id: counterId, isActive: true },
    include: { service: true, staff: true },
  });

  if (!counter) {
    throw new QueueError("ไม่พบช่องบริการ", "COUNTER_NOT_FOUND", 404);
  }

  if (staffUserId && counter.staff && counter.staff.id !== staffUserId) {
    throw new QueueError(
      "ช่องบริการนี้ถูกใช้งานโดยเจ้าหน้าที่คนอื่น",
      "COUNTER_IN_USE",
      403,
    );
  }

  const queueDate = getQueueDate();

  const ticket = await prisma.$transaction(async (tx) => {
    const next = await tx.queueTicket.findFirst({
      where: {
        serviceId: counter.serviceId,
        queueDate,
        status: TicketStatus.WAITING,
      },
      orderBy: { number: "asc" },
    });

    if (!next) {
      throw new QueueError("ไม่มีคิวรออยู่", "NO_WAITING_TICKETS", 404);
    }

    return tx.queueTicket.update({
      where: { id: next.id },
      data: {
        status: TicketStatus.CALLED,
        counterId,
        calledAt: new Date(),
      },
      include: ticketInclude,
    });
  });

  await broadcastQueueUpdate({
    type: "ticket_called",
    ticket,
    counter,
    service: counter.service,
  });

  return ticket;
}

export async function updateTicketStatus(
  ticketId: string,
  status: "SERVING" | "COMPLETED" | "SKIPPED" | "NO_SHOW",
) {
  const ticket = await prisma.queueTicket.findUnique({
    where: { id: ticketId },
    include: ticketInclude,
  });

  if (!ticket) {
    throw new QueueError("ไม่พบคิว", "TICKET_NOT_FOUND", 404);
  }

  const updated = await prisma.queueTicket.update({
    where: { id: ticketId },
    data: {
      status: status as TicketStatus,
      completedAt:
        status === "COMPLETED" || status === "SKIPPED" || status === "NO_SHOW"
          ? new Date()
          : undefined,
    },
    include: ticketInclude,
  });

  await broadcastQueueUpdate({
    type: "ticket_updated",
    ticket: updated,
    counter: updated.counter,
    service: updated.service,
  });

  return updated;
}

export async function getQueueState() {
  const queueDate = getQueueDate();

  const [services, counters, calledTickets, waitingTickets] = await Promise.all([
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.counter.findMany({
      where: { isActive: true },
      include: { service: true, staff: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.queueTicket.findMany({
      where: {
        queueDate,
        status: { in: [TicketStatus.CALLED, TicketStatus.SERVING] },
      },
      include: { service: true, counter: true },
      orderBy: { calledAt: "desc" },
    }),
    prisma.queueTicket.findMany({
      where: {
        queueDate,
        status: TicketStatus.WAITING,
      },
      include: { service: true },
      orderBy: { number: "asc" },
      take: 20,
    }),
  ]);

  const calledByCounter = new Map<string, (typeof calledTickets)[number]>();
  for (const ticket of calledTickets) {
    if (ticket.counterId && !calledByCounter.has(ticket.counterId)) {
      calledByCounter.set(ticket.counterId, ticket);
    }
  }

  return {
    queueDate: queueDate.toISOString(),
    services,
    counters: counters.map((counter) => ({
      ...counter,
      currentTicket: calledByCounter.get(counter.id) ?? null,
    })),
    recentWaiting: waitingTickets.map((ticket) => ({
      id: ticket.id,
      displayNo: ticket.displayNo,
      serviceId: ticket.serviceId,
      serviceName: ticket.service.name,
    })),
  };
}

export async function getStaffQueueContext(counterId: string) {
  const queueDate = getQueueDate();
  const counter = await prisma.counter.findUnique({
    where: { id: counterId },
    include: { service: true },
  });

  if (!counter) {
    throw new QueueError("ไม่พบช่องบริการ", "COUNTER_NOT_FOUND", 404);
  }

  const [currentTicket, waitingTickets] = await Promise.all([
    prisma.queueTicket.findFirst({
      where: {
        counterId,
        queueDate,
        status: { in: [TicketStatus.CALLED, TicketStatus.SERVING] },
      },
      include: ticketInclude,
      orderBy: { calledAt: "desc" },
    }),
    prisma.queueTicket.findMany({
      where: {
        serviceId: counter.serviceId,
        queueDate,
        status: TicketStatus.WAITING,
      },
      include: ticketInclude,
      orderBy: { number: "asc" },
      take: 3,
    }),
  ]);

  return { counter, currentTicket, waitingTickets };
}

export async function getTodayStats() {
  const queueDate = getQueueDate();
  const tickets = await prisma.queueTicket.findMany({
    where: { queueDate },
    include: { service: true },
  });

  const completed = tickets.filter((t) => t.status === TicketStatus.COMPLETED);
  const skipped = tickets.filter(
    (t) => t.status === TicketStatus.SKIPPED || t.status === TicketStatus.NO_SHOW,
  );

  const waitTimes = completed
    .filter((t) => t.calledAt)
    .map((t) => t.calledAt!.getTime() - t.createdAt.getTime());

  const avgWaitMs =
    waitTimes.length > 0
      ? waitTimes.reduce((sum, ms) => sum + ms, 0) / waitTimes.length
      : 0;

  return {
    total: tickets.length,
    waiting: tickets.filter((t) => t.status === TicketStatus.WAITING).length,
    called: tickets.filter(
      (t) => t.status === TicketStatus.CALLED || t.status === TicketStatus.SERVING,
    ).length,
    completed: completed.length,
    skipped: skipped.length,
    avgWaitMinutes: Math.round(avgWaitMs / 60000),
    byService: Object.values(
      tickets.reduce<
        Record<string, { serviceName: string; count: number }>
      >((acc, ticket) => {
        if (!acc[ticket.serviceId]) {
          acc[ticket.serviceId] = {
            serviceName: ticket.service.name,
            count: 0,
          };
        }
        acc[ticket.serviceId].count += 1;
        return acc;
      }, {}),
    ),
  };
}

export async function resetTodayQueue() {
  const queueDate = getQueueDate();
  await prisma.queueTicket.deleteMany({ where: { queueDate } });
  await broadcastQueueUpdate({ type: "queue_reset" });
}
