import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { requireAuth } from "@/lib/auth-helpers";
import { getTodayStats, resetTodayQueue } from "@/lib/queue-service";

export async function GET() {
  try {
    const authResult = await requireAuth(["ADMIN"]);
    if (authResult.error) return authResult.error;

    const stats = await getTodayStats();
    return NextResponse.json({ stats });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE() {
  try {
    const authResult = await requireAuth(["ADMIN"]);
    if (authResult.error) return authResult.error;

    await resetTodayQueue();
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
