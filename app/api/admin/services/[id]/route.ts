import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { serviceSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAuth(["ADMIN"]);
    if (authResult.error) return authResult.error;

    const { id } = await params;
    const body = await request.json();
    const data = serviceSchema.partial().parse(body);
    const service = await prisma.service.update({ where: { id }, data });
    return NextResponse.json({ service });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAuth(["ADMIN"]);
    if (authResult.error) return authResult.error;

    const { id } = await params;
    await prisma.service.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
