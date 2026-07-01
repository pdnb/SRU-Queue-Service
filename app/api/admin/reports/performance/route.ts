import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { requireAuth } from "@/lib/auth-helpers";
import { performanceQuerySchema } from "@/lib/report-validations";
import { getPerformanceReport } from "@/lib/report-service";

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(["ADMIN"]);
    if (authResult.error) return authResult.error;

    const { searchParams } = new URL(request.url);
    const query = performanceQuerySchema.parse({
      from: searchParams.get("from"),
      to: searchParams.get("to"),
    });

    const report = await getPerformanceReport(query.from, query.to);
    return NextResponse.json({ report });
  } catch (error) {
    return apiError(error);
  }
}
