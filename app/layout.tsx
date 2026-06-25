import type { Metadata } from "next";
import { Anuphan } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const anuphan = Anuphan({
  variable: "--font-anuphan",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ระบบจัดการคิวบริการศูนย์คอมพิวเตอร์ มหาวิทยาลัยราชภัฏสุราษฎร์ธานี",
  description: "ระบบจัดการคิวบริการศูนย์คอมพิวเตอร์ มหาวิทยาลัยราชภัฏสุราษฎร์ธานี",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${anuphan.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
