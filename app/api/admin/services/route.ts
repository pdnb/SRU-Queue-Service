import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { serviceSchema } from "@/lib/validations";

export async function GET() {
  try {
    const authResult = await requireAuth(["ADMIN"]);
    if (authResult.error) return authResult.error;

    const services = await prisma.service.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { counters: true, tickets: true } } },
    });
    return NextResponse.json({ services });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(["ADMIN"]);
    if (authResult.error) return authResult.error;

    const body = await request.json();
    const data = serviceSchema.parse(body);
    const service = await prisma.service.create({ data });
    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
