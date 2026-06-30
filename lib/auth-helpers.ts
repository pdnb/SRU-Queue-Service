import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function requireAuth(roles?: Array<"ADMIN" | "STAFF">) {
  const session = await auth();
  if (!session?.user) {
    return {
      error: NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "กรุณาเข้าสู่ระบบ" } },
        { status: 401 },
      ),
    };
  }

  if (session.user.status !== "ACTIVE") {
    return {
      error: NextResponse.json(
        { error: { code: "FORBIDDEN", message: "บัญชีของคุณยังไม่ได้รับการอนุมัติ" } },
        { status: 403 },
      ),
    };
  }

  if (roles && !roles.includes(session.user.role)) {
    return {
      error: NextResponse.json(
        { error: { code: "FORBIDDEN", message: "ไม่มีสิทธิ์เข้าถึง" } },
        { status: 403 },
      ),
    };
  }

  return { session };
}
