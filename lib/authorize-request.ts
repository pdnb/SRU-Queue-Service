import { NextResponse } from "next/server";
import type { AppSession } from "@/lib/app-session";

export function authorizeRequest(
  pathname: string,
  session: AppSession | null,
  requestUrl: URL,
): true | NextResponse {
  const isLoggedIn = !!session?.user;
  const status = session?.user?.status;
  const isStaffRoute = pathname.startsWith("/staff");
  const isAdminRoute = pathname.startsWith("/admin");
  const isPendingRoute = pathname === "/pending-approval";

  if (isPendingRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", requestUrl));
    }
    if (status === "ACTIVE") {
      return NextResponse.redirect(new URL("/staff", requestUrl));
    }
    if (status === "REJECTED") {
      return NextResponse.redirect(new URL("/login?error=Rejected", requestUrl));
    }
    return status === "PENDING" ? true : NextResponse.redirect(new URL("/login", requestUrl));
  }

  if ((isStaffRoute || isAdminRoute) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", requestUrl));
  }

  if ((isStaffRoute || isAdminRoute) && status === "PENDING") {
    return NextResponse.redirect(new URL("/pending-approval", requestUrl));
  }

  if ((isStaffRoute || isAdminRoute) && status === "REJECTED") {
    return NextResponse.redirect(new URL("/login?error=Rejected", requestUrl));
  }

  if ((isStaffRoute || isAdminRoute) && status === "DISABLED") {
    return NextResponse.redirect(new URL("/login?error=Disabled", requestUrl));
  }

  if (isAdminRoute && session?.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/staff", requestUrl));
  }

  return true;
}
