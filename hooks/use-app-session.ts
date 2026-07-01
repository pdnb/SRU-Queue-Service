"use client";

import { useSession } from "next-auth/react";
import { useUser } from "@auth0/nextjs-auth0/client";
import type { AppSession } from "@/lib/app-session";

function isUserStatus(value: unknown): value is AppSession["user"]["status"] {
  return value === "PENDING" || value === "ACTIVE" || value === "REJECTED" || value === "DISABLED";
}

function isUserRole(value: unknown): value is AppSession["user"]["role"] {
  return value === "ADMIN" || value === "STAFF";
}

export function useAppSession() {
  const { data: nextAuthSession, status: nextAuthStatus } = useSession();
  const { user: auth0User, isLoading: auth0Loading } = useUser();

  if (
    auth0User &&
    typeof auth0User.appUserId === "string" &&
    isUserRole(auth0User.role) &&
    isUserStatus(auth0User.status)
  ) {
    return {
      data: {
        user: {
          id: auth0User.appUserId,
          name: auth0User.name ?? null,
          email: auth0User.email ?? null,
          role: auth0User.role,
          counterId: typeof auth0User.counterId === "string" ? auth0User.counterId : null,
          status: auth0User.status,
          authProvider: "auth0" as const,
        },
      },
      status: auth0Loading ? ("loading" as const) : ("authenticated" as const),
    };
  }

  if (nextAuthSession?.user?.id) {
    return {
      data: {
        user: {
          id: nextAuthSession.user.id,
          name: nextAuthSession.user.name ?? null,
          email: nextAuthSession.user.email ?? null,
          role: nextAuthSession.user.role,
          counterId: nextAuthSession.user.counterId,
          status: nextAuthSession.user.status,
          authProvider: "credentials" as const,
        },
      },
      status: nextAuthStatus,
    };
  }

  return {
    data: null,
    status:
      auth0Loading || nextAuthStatus === "loading"
        ? ("loading" as const)
        : ("unauthenticated" as const),
  };
}
