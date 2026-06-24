import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { requireAuth } from "@/lib/auth-helpers";
import { callNextSchema } from "@/lib/validations";
import { callNext } from "@/lib/queue-service";

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(["ADMIN", "STAFF"]);
    if (authResult.error) return authResult.error;

    const body = await request.json();
    const data = callNextSchema.parse(body);
    const ticket = await callNext(data.counterId, authResult.session.user.id);
    return NextResponse.json({ ticket });
  } catch (error) {
    return apiError(error);
  }
}
