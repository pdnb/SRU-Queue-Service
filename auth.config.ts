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
  },
  trustHost: true,
} satisfies NextAuthConfig;
