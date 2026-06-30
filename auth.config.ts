import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role;
        token.counterId = user.counterId;
        token.status = user.status;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as "ADMIN" | "STAFF";
        session.user.counterId = (token.counterId as string | null) ?? null;
        session.user.status = token.status as "PENDING" | "ACTIVE" | "REJECTED" | "DISABLED";
      }
      return session;
    },
    authorized: async ({ auth, request }) => {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;
      const status = auth?.user?.status;
      const isStaffRoute = pathname.startsWith("/staff");
      const isAdminRoute = pathname.startsWith("/admin");
      const isPendingRoute = pathname === "/pending-approval";

      if (isPendingRoute) {
        if (!isLoggedIn) return false;
        if (status === "ACTIVE") {
          return Response.redirect(new URL("/staff", request.nextUrl));
        }
        if (status === "REJECTED") {
          return Response.redirect(new URL("/login?error=Rejected", request.nextUrl));
        }
        return status === "PENDING";
      }

      if ((isStaffRoute || isAdminRoute) && !isLoggedIn) {
        return false;
      }

      if ((isStaffRoute || isAdminRoute) && status === "PENDING") {
        return Response.redirect(new URL("/pending-approval", request.nextUrl));
      }

      if ((isStaffRoute || isAdminRoute) && status === "REJECTED") {
        return Response.redirect(new URL("/login?error=Rejected", request.nextUrl));
      }

      if ((isStaffRoute || isAdminRoute) && status === "DISABLED") {
        return Response.redirect(new URL("/login?error=Disabled", request.nextUrl));
      }

      if (isAdminRoute && auth?.user?.role !== "ADMIN") {
        return Response.redirect(new URL("/staff", request.nextUrl));
      }

      return true;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
