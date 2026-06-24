import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { requireAuth } from "@/lib/auth-helpers";
import { updateTicketSchema } from "@/lib/validations";
import { getTicketStatus, updateTicketStatus } from "@/lib/queue-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const ticket = await getTicketStatus(id);
    return NextResponse.json({ ticket });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAuth(["ADMIN", "STAFF"]);
    if (authResult.error) return authResult.error;

    const { id } = await params;
    const body = await request.json();
    const data = updateTicketSchema.parse(body);
    const ticket = await updateTicketStatus(id, data.status);
    return NextResponse.json({ ticket });
  } catch (error) {
    return apiError(error);
  }
}
