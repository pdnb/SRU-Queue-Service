import { z } from "zod";
import { TicketStatus } from "@/app/generated/prisma/enums";
import { parseDateParam } from "@/lib/date";

const dateRangeSchema = z
  .object({
    from: z.string().min(1, "กรุณาระบุวันที่เริ่มต้น"),
    to: z.string().min(1, "กรุณาระบุวันที่สิ้นสุด"),
  })
  .transform(({ from, to }) => {
    const fromDate = parseDateParam(from);
    const toDate = parseDateParam(to);

    if (!fromDate || !toDate) {
      throw new z.ZodError([
        {
          code: "custom",
          message: "รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)",
          path: ["from"],
        },
      ]);
    }

    if (fromDate > toDate) {
      throw new z.ZodError([
        {
          code: "custom",
          message: "วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด",
          path: ["from"],
        },
      ]);
    }

    return { from: fromDate, to: toDate };
  });

export const performanceQuerySchema = dateRangeSchema;

const ticketSortFields = [
  "createdAt",
  "calledAt",
  "completedAt",
  "displayNo",
  "studentId",
  "status",
] as const;

export const ticketsQuerySchema = dateRangeSchema.and(
  z.object({
    studentId: z.string().optional(),
    status: z.enum(TicketStatus).optional(),
    serviceId: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(50),
    sortBy: z.enum(ticketSortFields).default("createdAt"),
    sortDir: z.enum(["asc", "desc"]).default("desc"),
  }),
);

export const ticketsExportQuerySchema = dateRangeSchema.and(
  z.object({
    studentId: z.string().optional(),
    status: z.enum(TicketStatus).optional(),
    serviceId: z.string().optional(),
    sortBy: z.enum(ticketSortFields).default("createdAt"),
    sortDir: z.enum(["asc", "desc"]).default("desc"),
  }),
);

const ratingSortFields = ["completedAt", "ratedAt", "displayNo", "rating", "studentId"] as const;

export const ratingsQuerySchema = dateRangeSchema.and(
  z.object({
    serviceId: z.string().optional(),
    counterId: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(50),
    sortBy: z.enum(ratingSortFields).default("completedAt"),
    sortDir: z.enum(["asc", "desc"]).default("desc"),
  }),
);

export const ratingsExportQuerySchema = dateRangeSchema.and(
  z.object({
    serviceId: z.string().optional(),
    counterId: z.string().optional(),
    sortBy: z.enum(ratingSortFields).default("completedAt"),
    sortDir: z.enum(["asc", "desc"]).default("desc"),
  }),
);
