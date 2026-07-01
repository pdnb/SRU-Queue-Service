"use client";

import { signOut } from "next-auth/react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LogoutButtonProps {
  className?: string;
  showLabel?: boolean;
  variant?: "default" | "outline" | "secondary";
}

export function LogoutButton({
  className,
  showLabel = true,
  variant = "outline",
}: LogoutButtonProps) {
  const { user: auth0User } = useUser();

  const handleLogout = () => {
    if (auth0User?.appUserId) {
      window.location.href = "/auth/logout";
      return;
    }

    void signOut({ callbackUrl: "/login" });
  };

  return (
    <Button
      type="button"
      variant={variant}
      className={cn("cursor-pointer", className)}
      onClick={handleLogout}
    >
      <LogOut className="size-4" aria-hidden />
      {showLabel && <span className="hidden sm:inline">ออกจากระบบ</span>}
    </Button>
  );
}
