"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-10 w-full cursor-pointer"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      ออกจากระบบ
    </Button>
  );
}
