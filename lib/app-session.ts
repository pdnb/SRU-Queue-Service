import type { SessionData } from "@auth0/nextjs-auth0/types";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { auth0 } from "@/lib/auth0";

export type UserStatus = "PENDING" | "ACTIVE" | "REJECTED" | "DISABLED";

export type AppUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: "ADMIN" | "STAFF";
  counterId: string | null;
  status: UserStatus;
  authProvider: "auth0" | "credentials";
};

export type AppSession = {
  user: AppUser;
};

function isUserStatus(value: unknown): value is UserStatus {
  return value === "PENDING" || value === "ACTIVE" || value === "REJECTED" || value === "DISABLED";
}

function isUserRole(value: unknown): value is "ADMIN" | "STAFF" {
  return value === "ADMIN" || value === "STAFF";
}

function mapAuth0Session(session: SessionData): AppSession | null {
  const { user } = session;

  if (
    typeof user.appUserId !== "string" ||
    !isUserRole(user.role) ||
    !isUserStatus(user.status)
  ) {
    return null;
  }

  return {
    user: {
      id: user.appUserId,
      name: user.name ?? null,
      email: user.email ?? null,
      role: user.role,
      counterId: typeof user.counterId === "string" ? user.counterId : null,
      status: user.status,
      authProvider: "auth0",
    },
  };
}

export async function getAppSession(req?: NextRequest): Promise<AppSession | null> {
  const auth0Session = req ? await auth0.getSession(req) : await auth0.getSession();

  if (auth0Session) {
    const mapped = mapAuth0Session(auth0Session);
    if (mapped) {
      return mapped;
    }
  }

  const nextAuthSession = await auth();

  if (nextAuthSession?.user?.id) {
    return {
      user: {
        id: nextAuthSession.user.id,
        name: nextAuthSession.user.name,
        email: nextAuthSession.user.email,
        role: nextAuthSession.user.role,
        counterId: nextAuthSession.user.counterId,
        status: nextAuthSession.user.status,
        authProvider: "credentials",
      },
    };
  }

  return null;
}
