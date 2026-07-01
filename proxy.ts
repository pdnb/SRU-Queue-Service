import type { NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";
import { getAppSession } from "@/lib/app-session";
import { authorizeRequest } from "@/lib/authorize-request";

export async function proxy(request: NextRequest) {
  const authResponse = await auth0.middleware(request);

  const requestUrl = new URL(request.url);
  const pathname = requestUrl.pathname;
  const isProtected =
    pathname.startsWith("/staff") ||
    pathname.startsWith("/admin") ||
    pathname === "/pending-approval";

  if (!isProtected) {
    return authResponse;
  }

  const session = await getAppSession(request);
  const decision = authorizeRequest(pathname, session, requestUrl);

  if (decision === true) {
    return authResponse;
  }

  return decision;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
