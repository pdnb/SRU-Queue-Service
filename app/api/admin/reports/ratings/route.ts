import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { requireAuth } from "@/lib/auth-helpers";
import { getRatingsReport } from "@/lib/report-service";
import { ratingsQuerySchema } from "@/lib/report-validations";

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(["ADMIN"]);
    if (authResult.error) return authResult.error;

    const { searchParams } = new URL(request.url);
    const query = ratingsQuerySchema.parse({
      from: searchParams.get("from") ?? "",
      to: searchParams.get("to") ?? "",
      serviceId: searchParams.get("serviceId") || undefined,
      counterId: searchParams.get("counterId") || undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
      sortBy: searchParams.get("sortBy") ?? undefined,
      sortDir: searchParams.get("sortDir") ?? undefined,
    });

    const result = await getRatingsReport(query);
    return NextResponse.json(result);
  } catch (error) {
    return apiError(error);
  }
}
