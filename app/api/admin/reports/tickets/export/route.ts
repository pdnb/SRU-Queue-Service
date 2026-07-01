import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { requireAuth } from "@/lib/auth-helpers";
import { exportTicketsCsv } from "@/lib/report-service";
import { ticketsExportQuerySchema } from "@/lib/report-validations";

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(["ADMIN"]);
    if (authResult.error) return authResult.error;

    const { searchParams } = new URL(request.url);
    const query = ticketsExportQuerySchema.parse({
      from: searchParams.get("from") ?? "",
      to: searchParams.get("to") ?? "",
      studentId: searchParams.get("studentId") || undefined,
      status: searchParams.get("status") || undefined,
      serviceId: searchParams.get("serviceId") || undefined,
      sortBy: searchParams.get("sortBy") ?? undefined,
      sortDir: searchParams.get("sortDir") ?? undefined,
    });

    const csv = await exportTicketsCsv(query);
    const filename = `queue-tickets-${searchParams.get("from")}-${searchParams.get("to")}.csv`;

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
