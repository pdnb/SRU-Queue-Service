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
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as "ADMIN" | "STAFF";
        session.user.counterId = (token.counterId as string | null) ?? null;
      }
      return session;
    },
    authorized: async ({ auth, request }) => {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;
      const isStaffRoute = pathname.startsWith("/staff");
      const isAdminRoute = pathname.startsWith("/admin");

      if ((isStaffRoute || isAdminRoute) && !isLoggedIn) {
        return false;
      }

      if (isAdminRoute && auth?.user?.role !== "ADMIN") {
        return Response.redirect(new URL("/staff", request.nextUrl));
      }

      return true;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
