import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { counterSchema } from "@/lib/validations";

export async function GET() {
  try {
    const authResult = await requireAuth(["ADMIN", "STAFF"]);
    if (authResult.error) return authResult.error;

    const counters = await prisma.counter.findMany({
      orderBy: { name: "asc" },
      include: {
        service: true,
        staff: { select: { id: true, name: true, email: true } },
      },
    });
    return NextResponse.json({ counters });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(["ADMIN"]);
    if (authResult.error) return authResult.error;

    const body = await request.json();
    const data = counterSchema.parse(body);
    const counter = await prisma.counter.create({
      data,
      include: { service: true },
    });
    return NextResponse.json({ counter }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
