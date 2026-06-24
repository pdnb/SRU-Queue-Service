import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { createTicketSchema } from "@/lib/validations";
import { createTicket } from "@/lib/queue-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createTicketSchema.parse(body);
    const result = await createTicket(data.serviceId, data.studentId);
    return NextResponse.json(result, { status: result.isDuplicate ? 200 : 201 });
  } catch (error) {
    return apiError(error);
  }
}
