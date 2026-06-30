import type { DefaultSession } from "next-auth";

type UserStatus = "PENDING" | "ACTIVE" | "REJECTED" | "DISABLED";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "STAFF";
      counterId: string | null;
      status: UserStatus;
    } & DefaultSession["user"];
  }

  interface User {
    role: "ADMIN" | "STAFF";
    counterId: string | null;
    status: UserStatus;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "ADMIN" | "STAFF";
    counterId?: string | null;
    status?: UserStatus;
  }
}
