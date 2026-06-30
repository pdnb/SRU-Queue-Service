import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/lib/branding";
import { SignOutButton } from "./sign-out-button";

export default async function PendingApprovalPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.status === "ACTIVE") {
    redirect("/staff");
  }

  if (session.user.status === "REJECTED") {
    redirect("/login?error=Rejected");
  }

  return (
    <div className="page-surface flex min-h-screen flex-col">
      <AppHeader
        title={APP_NAME}
        subtitle="รอการอนุมัติบัญชี"
        variant="brand"
        layout="centered"
      />

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">รอการอนุมัติ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              บัญชีของคุณรอการอนุมัติจากผู้ดูแลระบบ กรุณารอจนกว่าจะได้รับการอนุมัติ
            </p>
            <div className="rounded-lg border bg-muted/40 p-4 text-sm">
              <p>
                <span className="font-medium">ชื่อ:</span> {session.user.name}
              </p>
              <p>
                <span className="font-medium">อีเมล:</span> {session.user.email}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              หากได้รับการอนุมัติแล้ว กรุณาออกจากระบบและเข้าสู่ระบบใหม่
            </p>
            <SignOutButton />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
