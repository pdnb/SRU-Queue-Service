import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { requireAuth } from "@/lib/auth-helpers";
import { exportRatingsCsv } from "@/lib/report-service";
import { ratingsExportQuerySchema } from "@/lib/report-validations";

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(["ADMIN"]);
    if (authResult.error) return authResult.error;

    const { searchParams } = new URL(request.url);
    const query = ratingsExportQuerySchema.parse({
      from: searchParams.get("from") ?? "",
      to: searchParams.get("to") ?? "",
      serviceId: searchParams.get("serviceId") || undefined,
      counterId: searchParams.get("counterId") || undefined,
      sortBy: searchParams.get("sortBy") ?? undefined,
      sortDir: searchParams.get("sortDir") ?? undefined,
    });

    const csv = await exportRatingsCsv(query);
    const filename = `queue-ratings-${searchParams.get("from")}-${searchParams.get("to")}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
