import { NextResponse } from "next/server";
import { QueueError } from "@/lib/queue-service";
import { ZodError } from "zod";

export function apiError(error: unknown) {
  if (error instanceof QueueError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
        },
      },
      { status: 400 },
    );
  }

  console.error(error);
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "เกิดข้อผิดพลาดภายในระบบ" } },
    { status: 500 },
  );
}
