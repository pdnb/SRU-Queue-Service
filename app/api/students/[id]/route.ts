import { NextResponse } from "next/server";
import { studentIdSchema } from "@/lib/validations";
import { apiError } from "@/lib/api-error";
import { lookupStudent } from "@/lib/queue-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const studentId = studentIdSchema.parse(id);
    const student = await lookupStudent(studentId);
    return NextResponse.json(student);
  } catch (error) {
    return apiError(error);
  }
}
