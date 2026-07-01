import { Prisma } from "@/app/generated/prisma/client";
import { TicketStatus } from "@/app/generated/prisma/enums";
import { formatDateTime, formatQueueDate } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { computeAvgRating, computeResponseRate } from "@/lib/rating";
import type {
  ratingsExportQuerySchema,
  ratingsQuerySchema,
  ticketsExportQuerySchema,
  ticketsQuerySchema,
} from "@/lib/report-validations";
import { getStatusLabel } from "@/lib/ticket-status";
import type { z } from "zod";

export const EXPORT_MAX_ROWS = 10_000;

const ticketInclude = {
  service: { select: { id: true, name: true } },
  counter: { select: { id: true, name: true } },
} as const;

type TicketRow = Prisma.QueueTicketGetPayload<{ include: typeof ticketInclude }>;

type TicketsQuery = z.infer<typeof ticketsQuerySchema>;
type TicketsExportQuery = z.infer<typeof ticketsExportQuerySchema>;
type RatingsQuery = z.infer<typeof ratingsQuerySchema>;
type RatingsExportQuery = z.infer<typeof ratingsExportQuerySchema>;

interface BreakdownRow {
  id: string;
  name: string;
  total: number;
  completed: number;
  skipped: number;
  skipRate: number;
  avgWaitMinutes: number;
  avgServiceMinutes: number;
}

interface SummaryMetrics {
  total: number;
  completed: number;
  skipped: number;
  skipRate: number;
  avgWaitMinutes: number;
  avgServiceMinutes: number;
}

function roundMinutes(ms: number): number {
  return Math.round(ms / 60_000);
}

function computeSummary(tickets: TicketRow[]): SummaryMetrics {
  const completed = tickets.filter((t) => t.status === TicketStatus.COMPLETED);
  const skipped = tickets.filter(
    (t) => t.status === TicketStatus.SKIPPED || t.status === TicketStatus.NO_SHOW,
  );

  const waitTimes = completed
    .filter((t) => t.calledAt)
    .map((t) => t.calledAt!.getTime() - t.createdAt.getTime());

  const serviceTimes = completed
    .filter((t) => t.calledAt && t.completedAt)
    .map((t) => t.completedAt!.getTime() - t.calledAt!.getTime());

  const avgWaitMs =
    waitTimes.length > 0 ? waitTimes.reduce((sum, ms) => sum + ms, 0) / waitTimes.length : 0;

  const avgServiceMs =
    serviceTimes.length > 0
      ? serviceTimes.reduce((sum, ms) => sum + ms, 0) / serviceTimes.length
      : 0;

  const total = tickets.length;
  const skippedCount = skipped.length;

  return {
    total,
    completed: completed.length,
    skipped: skippedCount,
    skipRate: total > 0 ? Math.round((skippedCount / total) * 100) : 0,
    avgWaitMinutes: roundMinutes(avgWaitMs),
    avgServiceMinutes: roundMinutes(avgServiceMs),
  };
}

function computeBreakdown(
  tickets: TicketRow[],
  getKey: (ticket: TicketRow) => { id: string; name: string } | null,
): BreakdownRow[] {
  const groups = new Map<string, { name: string; tickets: TicketRow[] }>();

  for (const ticket of tickets) {
    const key = getKey(ticket);
    if (!key) continue;

    if (!groups.has(key.id)) {
      groups.set(key.id, { name: key.name, tickets: [] });
    }
    groups.get(key.id)!.tickets.push(ticket);
  }

  return Array.from(groups.entries())
    .map(([id, { name, tickets: groupTickets }]) => {
      const summary = computeSummary(groupTickets);
      return {
        id,
        name,
        ...summary,
      };
    })
    .sort((a, b) => b.total - a.total);
}

function buildTicketWhere(query: Pick<TicketsQuery, "from" | "to" | "studentId" | "status" | "serviceId">) {
  const where: Prisma.QueueTicketWhereInput = {
    queueDate: { gte: query.from, lte: query.to },
  };

  if (query.studentId) {
    where.studentId = { contains: query.studentId };
  }
  if (query.status) {
    where.status = query.status;
  }
  if (query.serviceId) {
    where.serviceId = query.serviceId;
  }

  return where;
}

function buildOrderBy(
  sortBy: TicketsQuery["sortBy"],
  sortDir: TicketsQuery["sortDir"],
): Prisma.QueueTicketOrderByWithRelationInput {
  return { [sortBy]: sortDir };
}

function toTicketDto(ticket: TicketRow) {
  const waitMs = ticket.calledAt ? ticket.calledAt.getTime() - ticket.createdAt.getTime() : null;
  const serviceMs =
    ticket.calledAt && ticket.completedAt
      ? ticket.completedAt.getTime() - ticket.calledAt.getTime()
      : null;

  return {
    id: ticket.id,
    displayNo: ticket.displayNo,
    studentId: ticket.studentId,
    studentName: ticket.studentName,
    serviceId: ticket.serviceId,
    serviceName: ticket.service.name,
    counterId: ticket.counterId,
    counterName: ticket.counter?.name ?? null,
    status: ticket.status,
    queueDate: ticket.queueDate.toISOString(),
    createdAt: ticket.createdAt.toISOString(),
    calledAt: ticket.calledAt?.toISOString() ?? null,
    completedAt: ticket.completedAt?.toISOString() ?? null,
    waitMinutes: waitMs !== null ? roundMinutes(waitMs) : null,
    serviceMinutes: serviceMs !== null ? roundMinutes(serviceMs) : null,
  };
}

export async function getPerformanceReport(from: Date, to: Date) {
  const tickets = await prisma.queueTicket.findMany({
    where: { queueDate: { gte: from, lte: to } },
    include: ticketInclude,
  });

  const summary = computeSummary(tickets);

  return {
    summary,
    byService: computeBreakdown(tickets, (t) => ({
      id: t.serviceId,
      name: t.service.name,
    })),
    byCounter: computeBreakdown(tickets, (t) =>
      t.counter ? { id: t.counter.id, name: t.counter.name } : null,
    ),
  };
}

export async function getTicketReport(query: TicketsQuery) {
  const where = buildTicketWhere(query);
  const orderBy = buildOrderBy(query.sortBy, query.sortDir);
  const skip = (query.page - 1) * query.pageSize;

  const [total, tickets] = await prisma.$transaction([
    prisma.queueTicket.count({ where }),
    prisma.queueTicket.findMany({
      where,
      include: ticketInclude,
      orderBy,
      skip,
      take: query.pageSize,
    }),
  ]);

  return {
    tickets: tickets.map(toTicketDto),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  };
}

function escapeCsvCell(value: string | number | null): string {
  if (value === null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function exportTicketsCsv(query: TicketsExportQuery): Promise<string> {
  const where = buildTicketWhere(query);
  const orderBy = buildOrderBy(query.sortBy, query.sortDir);

  const tickets = await prisma.queueTicket.findMany({
    where,
    include: ticketInclude,
    orderBy,
    take: EXPORT_MAX_ROWS,
  });

  const headers = [
    "เลขคิว",
    "รหัสนักศึกษา",
    "ชื่อนักศึกษา",
    "บริการ",
    "เคาน์เตอร์",
    "สถานะ",
    "วันคิว",
    "เวลารับคิว",
    "เวลาเรียก",
    "เวลาเสร็จ",
    "เวลารอ (นาที)",
    "เวลาให้บริการ (นาที)",
  ];

  const rows = tickets.map((ticket) => {
    const dto = toTicketDto(ticket);
    return [
      dto.displayNo,
      dto.studentId,
      dto.studentName,
      dto.serviceName,
      dto.counterName ?? "",
      getStatusLabel(dto.status),
      formatQueueDate(dto.queueDate),
      formatDateTime(dto.createdAt),
      formatDateTime(dto.calledAt),
      formatDateTime(dto.completedAt),
      dto.waitMinutes ?? "",
      dto.serviceMinutes ?? "",
    ]
      .map(escapeCsvCell)
      .join(",");
  });

  return `\uFEFF${headers.join(",")}\n${rows.join("\n")}`;
}

interface RatingBreakdownRow {
  id: string;
  name: string;
  completed: number;
  rated: number;
  responseRate: number;
  avgRating: number;
}

function buildRatingsWhere(
  query: Pick<RatingsQuery, "from" | "to" | "serviceId" | "counterId">,
): Prisma.QueueTicketWhereInput {
  const where: Prisma.QueueTicketWhereInput = {
    queueDate: { gte: query.from, lte: query.to },
    status: TicketStatus.COMPLETED,
  };

  if (query.serviceId) {
    where.serviceId = query.serviceId;
  }
  if (query.counterId) {
    where.counterId = query.counterId;
  }

  return where;
}

function computeRatingBreakdown(
  tickets: TicketRow[],
  getKey: (ticket: TicketRow) => { id: string; name: string } | null,
): RatingBreakdownRow[] {
  const groups = new Map<string, { name: string; tickets: TicketRow[] }>();

  for (const ticket of tickets) {
    const key = getKey(ticket);
    if (!key) continue;

    if (!groups.has(key.id)) {
      groups.set(key.id, { name: key.name, tickets: [] });
    }
    groups.get(key.id)!.tickets.push(ticket);
  }

  return Array.from(groups.entries())
    .map(([id, { name, tickets: groupTickets }]) => {
      const rated = groupTickets.filter((ticket) => ticket.rating !== null);
      return {
        id,
        name,
        completed: groupTickets.length,
        rated: rated.length,
        responseRate: computeResponseRate(rated.length, groupTickets.length),
        avgRating: computeAvgRating(rated.map((ticket) => ticket.rating)),
      };
    })
    .sort((a, b) => b.completed - a.completed);
}

function toRatingDto(ticket: TicketRow) {
  return {
    id: ticket.id,
    displayNo: ticket.displayNo,
    studentId: ticket.studentId,
    studentName: ticket.studentName,
    serviceId: ticket.serviceId,
    serviceName: ticket.service.name,
    counterId: ticket.counterId,
    counterName: ticket.counter?.name ?? null,
    rating: ticket.rating,
    ratedAt: ticket.ratedAt?.toISOString() ?? null,
    completedAt: ticket.completedAt?.toISOString() ?? null,
    queueDate: ticket.queueDate.toISOString(),
  };
}

export async function getRatingsReport(query: RatingsQuery) {
  const where = buildRatingsWhere(query);
  const orderBy: Prisma.QueueTicketOrderByWithRelationInput = {
    [query.sortBy]: query.sortDir,
  };
  const skip = (query.page - 1) * query.pageSize;

  const [allTickets, total, tickets] = await prisma.$transaction([
    prisma.queueTicket.findMany({
      where,
      include: ticketInclude,
    }),
    prisma.queueTicket.count({ where }),
    prisma.queueTicket.findMany({
      where,
      include: ticketInclude,
      orderBy,
      skip,
      take: query.pageSize,
    }),
  ]);

  const rated = allTickets.filter((ticket) => ticket.rating !== null);

  return {
    summary: {
      completed: allTickets.length,
      rated: rated.length,
      responseRate: computeResponseRate(rated.length, allTickets.length),
      avgRating: computeAvgRating(rated.map((ticket) => ticket.rating)),
    },
    byService: computeRatingBreakdown(allTickets, (ticket) => ({
      id: ticket.serviceId,
      name: ticket.service.name,
    })),
    byCounter: computeRatingBreakdown(allTickets, (ticket) =>
      ticket.counter ? { id: ticket.counter.id, name: ticket.counter.name } : null,
    ),
    tickets: tickets.map(toRatingDto),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  };
}

export async function exportRatingsCsv(query: RatingsExportQuery): Promise<string> {
  const where = buildRatingsWhere(query);
  const orderBy: Prisma.QueueTicketOrderByWithRelationInput = {
    [query.sortBy]: query.sortDir,
  };

  const tickets = await prisma.queueTicket.findMany({
    where,
    include: ticketInclude,
    orderBy,
    take: EXPORT_MAX_ROWS,
  });

  const headers = [
    "เลขคิว",
    "รหัสนักศึกษา",
    "ชื่อนักศึกษา",
    "บริการ",
    "เคาน์เตอร์",
    "คะแนน",
    "ให้คะแนนเมื่อ",
    "เสร็จสิ้นเมื่อ",
    "วันคิว",
  ];

  const rows = tickets.map((ticket) => {
    const dto = toRatingDto(ticket);
    return [
      dto.displayNo,
      dto.studentId,
      dto.studentName,
      dto.serviceName,
      dto.counterName ?? "",
      dto.rating ?? "",
      formatDateTime(dto.ratedAt),
      formatDateTime(dto.completedAt),
      formatQueueDate(dto.queueDate),
    ]
      .map(escapeCsvCell)
      .join(",");
  });

  return `\uFEFF${headers.join(",")}\n${rows.join("\n")}`;
}
