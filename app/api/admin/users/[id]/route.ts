import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { apiError } from "@/lib/api-error";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { userSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAuth(["ADMIN"]);
    if (authResult.error) return authResult.error;

    const { id } = await params;
    const body = await request.json();
    const data = userSchema.partial().parse(body);

    const updateData: {
      name?: string;
      email?: string;
      role?: "ADMIN" | "STAFF";
      counterId?: string | null;
      password?: string;
    } = {
      name: data.name,
      email: data.email,
      role: data.role,
      counterId: data.counterId,
    };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        counterId: true,
      },
    });
    return NextResponse.json({ user });
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
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
