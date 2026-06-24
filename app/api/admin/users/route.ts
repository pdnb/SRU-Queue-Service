import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { apiError } from "@/lib/api-error";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { userSchema } from "@/lib/validations";

export async function GET() {
  try {
    const authResult = await requireAuth(["ADMIN"]);
    if (authResult.error) return authResult.error;

    const users = await prisma.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        counterId: true,
        counter: { select: { id: true, name: true, service: { select: { name: true } } } },
      },
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
        role: data.role,
        counterId: data.counterId ?? null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        counterId: true,
      },
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
