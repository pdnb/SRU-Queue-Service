import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { apiError } from "@/lib/api-error";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { userActionSchema, userSchema } from "@/lib/validations";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  counterId: true,
  createdAt: true,
} as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAuth(["ADMIN"]);
    if (authResult.error) return authResult.error;

    const { id } = await params;
    const body = await request.json();

    if (body.action === "approve" || body.action === "reject") {
      const action = userActionSchema.parse(body);
      const existing = await prisma.user.findUnique({ where: { id } });

      if (!existing) {
        return NextResponse.json(
          { error: { code: "NOT_FOUND", message: "ไม่พบผู้ใช้" } },
          { status: 404 },
        );
      }

      if (existing.status !== "PENDING") {
        return NextResponse.json(
          { error: { code: "VALIDATION_ERROR", message: "ผู้ใช้นี้ไม่ได้อยู่ในสถานะรออนุมัติ" } },
          { status: 400 },
        );
      }

      if (action.action === "reject") {
        const user = await prisma.user.update({
          where: { id },
          data: { status: "REJECTED" },
          select: userSelect,
        });
        return NextResponse.json({ user });
      }

      const user = await prisma.user.update({
        where: { id },
        data: {
          status: "ACTIVE",
          role: action.role,
          counterId: action.counterId ?? null,
        },
        select: userSelect,
      });
      return NextResponse.json({ user });
    }

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
      select: userSelect,
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
