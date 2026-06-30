import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import {
  isSsoConfigured,
  OIDC_PROVIDER_ID,
  resolveSsoUser,
  toAuthUser,
} from "@/lib/sso-user";
import { loginSchema } from "@/lib/validations";

const OIDC_SCOPES: string = '';

const oidcProvider = isSsoConfigured()
  ? {
      id: OIDC_PROVIDER_ID,
      name: "SSO",
      type: "oidc" as const,
      issuer: process.env.AUTH_OIDC_ISSUER!,
      clientId: process.env.AUTH_OIDC_CLIENT_ID!,
      clientSecret: process.env.AUTH_OIDC_CLIENT_SECRET!,
      authorization: { params: { scope: OIDC_SCOPES } },
    }
  : null;

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  providers: [
    ...(oidcProvider ? [oidcProvider] : []),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          include: { counter: true },
        });

        if (!user || !user.password) return null;
        if (user.status !== "ACTIVE") return null;

        const valid = await bcrypt.compare(parsed.data.password, user.password);
        if (!valid) return null;

        return toAuthUser(user);
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    signIn: async ({ account, profile }) => {
      if (account?.provider !== OIDC_PROVIDER_ID) {
        return true;
      }

      const email = profile?.email;
      if (!email || typeof email !== "string") {
        return "/login?error=AccessDenied";
      }

      const name =
        (typeof profile.name === "string" && profile.name) ||
        (typeof profile.preferred_username === "string" && profile.preferred_username) ||
        email;

      const result = await resolveSsoUser({
        email,
        name,
        providerAccountId: account.providerAccountId,
      });

      if (!result.ok) {
        if (result.reason === "rejected") return "/login?error=Rejected";
        if (result.reason === "disabled") return "/login?error=Disabled";
        return "/login?error=AccessDenied";
      }

      if (result.user.status === "PENDING") {
        return "/pending-approval";
      }

      return true;
    },
    jwt: async ({ token, user, account, profile }) => {
      if (account?.provider === OIDC_PROVIDER_ID && profile?.email) {
        const email = typeof profile.email === "string" ? profile.email : "";
        const name =
          (typeof profile.name === "string" && profile.name) ||
          (typeof profile.preferred_username === "string" && profile.preferred_username) ||
          email;

        const result = await resolveSsoUser({
          email,
          name,
          providerAccountId: account.providerAccountId,
        });

        if (result.ok) {
          const dbUser = result.user;
          token.sub = dbUser.id;
          token.role = dbUser.role;
          token.counterId = dbUser.counterId;
          token.status = dbUser.status;
        }

        return token;
      }

      if (user) {
        token.role = user.role;
        token.counterId = user.counterId;
        token.status = user.status;
      }

      return token;
    },
  },
});
