"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { ButtonLink } from "@/components/button-link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_NAME } from "@/lib/branding";

const ERROR_MESSAGES: Record<string, string> = {
  Rejected: "บัญชีของคุณถูกปฏิเสธ กรุณาติดต่อผู้ดูแลระบบ",
  AccessDenied: "ไม่สามารถเข้าสู่ระบบได้ กรุณาตรวจสอบอีเมลหรือสิทธิ์การเข้าถึง",
  Disabled: "บัญชีของคุณถูกระงับการใช้งาน",
};

interface LoginFormProps {
  ssoEnabled: boolean;
}

export function LoginForm({ ssoEnabled }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/staff";
  const queryError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    queryError ? (ERROR_MESSAGES[queryError] ?? "ไม่สามารถเข้าสู่ระบบได้") : null,
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  };

  const ssoLoginHref = `/auth/login?returnTo=${encodeURIComponent(callbackUrl)}`;

  return (
    <div className="page-surface flex min-h-screen flex-col">
      <AppHeader
        title={APP_NAME}
        subtitle="เข้าสู่ระบบเจ้าหน้าที่และผู้ดูแล"
        variant="brand"
        layout="centered"
      />

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">เข้าสู่ระบบ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ssoEnabled && (
              <>
                <ButtonLink
                  href={ssoLoginHref}
                  variant="outline"
                  className="h-10 w-full"
                >
                  เข้าสู่ระบบด้วยบัญชีมหาวิทยาลัย
                </ButtonLink>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">หรือ</span>
                  </div>
                </div>
              </>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">อีเมล</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">รหัสผ่าน</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p role="alert" className="alert-error">{error}</p>}
              <Button type="submit" variant="cta" className="h-10 w-full cursor-pointer" disabled={loading}>
                {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
