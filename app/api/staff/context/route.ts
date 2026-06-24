import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getStaffQueueContext } from "@/lib/queue-service";

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(["ADMIN", "STAFF"]);
    if (authResult.error) return authResult.error;

    const { searchParams } = new URL(request.url);
    const counterId =
      searchParams.get("counterId") ?? authResult.session.user.counterId;

    if (!counterId) {
      return NextResponse.json(
        { error: { code: "NO_COUNTER", message: "กรุณาเลือกช่องบริการ" } },
        { status: 400 },
      );
    }

    const context = await getStaffQueueContext(counterId);
    return NextResponse.json(context);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const authResult = await requireAuth(["ADMIN", "STAFF"]);
    if (authResult.error) return authResult.error;

    const body = await request.json();
    const counterId = body.counterId as string | undefined;
    if (!counterId) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "กรุณาเลือกช่องบริการ" } },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: authResult.session.user.id },
      data: { counterId },
    });

    return NextResponse.json({ success: true, counterId });
  } catch (error) {
    return apiError(error);
  }
}
