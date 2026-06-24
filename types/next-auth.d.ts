import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "STAFF";
      counterId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: "ADMIN" | "STAFF";
    counterId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "ADMIN" | "STAFF";
    counterId?: string | null;
  }
}
