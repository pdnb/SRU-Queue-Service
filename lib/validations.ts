import { z } from "zod";

export const studentIdSchema = z
  .string()
  .trim()
  .regex(/^\d{8,13}$/, "รหัสนักศึกษาต้องเป็นตัวเลข 8-13 หลัก");

export const createTicketSchema = z.object({
  serviceId: z.string().min(1, "กรุณาเลือกบริการ"),
  studentId: studentIdSchema,
});

export const callNextSchema = z.object({
  counterId: z.string().min(1, "กรุณาเลือกเคาน์เตอร์"),
});

export const updateTicketSchema = z.object({
  status: z.enum(["SERVING", "COMPLETED", "SKIPPED", "NO_SHOW"]),
});

export const loginSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export const serviceSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อบริการ"),
  prefix: z
    .string()
    .min(1, "กรุณากรอก prefix")
    .max(3, "prefix สูงสุด 3 ตัวอักษร")
    .regex(/^[A-Z]$/, "prefix ต้องเป็นตัวอักษรภาษาอังกฤษตัวใหญ่ 1 ตัว"),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const counterSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อเคาน์เตอร์"),
  serviceId: z.string().min(1, "กรุณาเลือกบริการ"),
  isActive: z.boolean().optional(),
});

export const userSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อ"),
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านอย่างน้อย 6 ตัวอักษร").optional(),
  role: z.enum(["ADMIN", "STAFF"]),
  counterId: z.string().nullable().optional(),
});
