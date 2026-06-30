import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { apiError } from "@/lib/api-error";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { userSchema } from "@/lib/validations";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  counterId: true,
  createdAt: true,
  counter: { select: { id: true, name: true, service: { select: { name: true } } } },
} as const;

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(["ADMIN"]);
    if (authResult.error) return authResult.error;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const users = await prisma.user.findMany({
      where: status ? { status: status as "PENDING" | "ACTIVE" | "REJECTED" | "DISABLED" } : undefined,
      orderBy: { name: "asc" },
      select: userSelect,
    });
    return NextResponse.json({ users });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(["ADMIN"]);
    if (authResult.error) return authResult.error;

    const body = await request.json();
    const data = userSchema.parse(body);
    if (!data.password) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "กรุณากรอกรหัสผ่าน" } },
        { status: 400 },
      );
    }

    const password = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password,
        status: "ACTIVE",
        role: data.role,
        counterId: data.counterId ?? null,
      },
      select: userSelect,
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
