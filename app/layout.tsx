import type { Metadata } from "next";
import { Anuphan } from "next/font/google";
import { Providers } from "@/components/providers";
import { auth0 } from "@/lib/auth0";
import { APP_DESCRIPTION, APP_TITLE } from "@/lib/branding";
import "./globals.css";

const anuphan = Anuphan({
  variable: "--font-anuphan",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: APP_TITLE,
  description: APP_DESCRIPTION,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth0.getSession();

  return (
    <html lang="th" className={`${anuphan.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers auth0User={session?.user}>{children}</Providers>
      </body>
    </html>
  );
}
