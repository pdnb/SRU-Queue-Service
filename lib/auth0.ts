import { Auth0Client } from "@auth0/nextjs-auth0/server";
import type { OnCallbackContext, SessionData } from "@auth0/nextjs-auth0/types";
import { NextResponse } from "next/server";
import { resolveSsoUser } from "@/lib/sso-user";

async function provisionSsoUser(session: SessionData) {
  const email = session.user.email;
  if (!email) {
    return { ok: false as const, reason: "invalid_email" as const };
  }

  const name = session.user.name?.trim() || email;

  return resolveSsoUser({
    email,
    name,
    providerAccountId: session.user.sub,
  });
}

function redirectToLoginError(ctx: OnCallbackContext, code: string) {
  if (!ctx.appBaseUrl) {
    throw new Error("appBaseUrl could not be resolved for the callback redirect.");
  }

  return NextResponse.redirect(new URL(`/login?error=${code}`, ctx.appBaseUrl));
}

export const auth0 = new Auth0Client({
  async onCallback(error, ctx, session) {
    if (error || !session) {
      return redirectToLoginError(ctx, "AccessDenied");
    }

    const result = await provisionSsoUser(session);

    if (!result.ok) {
      if (result.reason === "rejected") return redirectToLoginError(ctx, "Rejected");
      if (result.reason === "disabled") return redirectToLoginError(ctx, "Disabled");
      return redirectToLoginError(ctx, "AccessDenied");
    }

    if (result.user.status === "PENDING") {
      return NextResponse.redirect(new URL("/pending-approval", ctx.appBaseUrl!));
    }

    const returnTo = ctx.returnTo || "/staff";
    return NextResponse.redirect(new URL(returnTo, ctx.appBaseUrl!));
  },

  async beforeSessionSaved(session, _idToken) {
    const result = await provisionSsoUser(session);

    if (!result.ok) {
      return session;
    }

    const user = result.user;

    return {
      ...session,
      user: {
        ...session.user,
        appUserId: user.id,
        role: user.role,
        counterId: user.counterId,
        status: user.status,
        authProvider: "auth0",
      },
    };
  },
});
