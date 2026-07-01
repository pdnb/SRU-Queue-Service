"use client";

import { Auth0Provider } from "@auth0/nextjs-auth0/client";
import type { User } from "@auth0/nextjs-auth0/types";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";

interface ProvidersProps {
  children: React.ReactNode;
  auth0User?: User | null;
}

export function Providers({ children, auth0User }: ProvidersProps) {
  return (
    <Auth0Provider user={auth0User ?? undefined}>
      <SessionProvider>
        {children}
        <Toaster />
      </SessionProvider>
    </Auth0Provider>
  );
}
