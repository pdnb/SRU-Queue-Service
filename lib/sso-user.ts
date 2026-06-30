import type { User } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const OIDC_PROVIDER_ID = "oidc";

export type SsoUserResult =
  | { ok: true; user: User }
  | { ok: false; reason: "invalid_email" | "domain_denied" | "rejected" | "disabled" };

export function isSsoConfigured(): boolean {
  return Boolean(
    process.env.AUTH_OIDC_ISSUER &&
      process.env.AUTH_OIDC_CLIENT_ID &&
      process.env.AUTH_OIDC_CLIENT_SECRET,
  );
}

export function isEmailDomainAllowed(email: string): boolean {
  const allowedDomain = process.env.SSO_ALLOWED_EMAIL_DOMAIN?.trim().toLowerCase();
  if (!allowedDomain) return true;

  const atIndex = email.lastIndexOf("@");
  if (atIndex === -1) return false;

  const domain = email.slice(atIndex + 1).toLowerCase();
  return domain === allowedDomain;
}

async function linkAccount(userId: string, providerAccountId: string) {
  await prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: OIDC_PROVIDER_ID,
        providerAccountId,
      },
    },
    create: {
      userId,
      type: "oidc",
      provider: OIDC_PROVIDER_ID,
      providerAccountId,
    },
    update: { userId },
  });
}

export async function resolveSsoUser(input: {
  email: string;
  name: string;
  providerAccountId: string;
}): Promise<SsoUserResult> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim() || email;

  if (!email) {
    return { ok: false, reason: "invalid_email" };
  }

  if (!isEmailDomainAllowed(email)) {
    return { ok: false, reason: "domain_denied" };
  }

  const existingAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: OIDC_PROVIDER_ID,
        providerAccountId: input.providerAccountId,
      },
    },
    include: { user: true },
  });

  if (existingAccount) {
    const user = existingAccount.user;
    if (user.status === "REJECTED") return { ok: false, reason: "rejected" };
    if (user.status === "DISABLED") return { ok: false, reason: "disabled" };
    return { ok: true, user };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    if (existingUser.status === "REJECTED") return { ok: false, reason: "rejected" };
    if (existingUser.status === "DISABLED") return { ok: false, reason: "disabled" };

    await linkAccount(existingUser.id, input.providerAccountId);
    return { ok: true, user: existingUser };
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: null,
      status: "PENDING",
      role: "STAFF",
      accounts: {
        create: {
          type: "oidc",
          provider: OIDC_PROVIDER_ID,
          providerAccountId: input.providerAccountId,
        },
      },
    },
  });

  return { ok: true, user };
}

export function toAuthUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    counterId: user.counterId,
    status: user.status,
  };
}
