"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Home, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/button-link";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showLogout?: boolean;
  adminLink?: boolean;
  variant?: "light" | "brand";
  layout?: "bar" | "centered";
  backHref?: string;
  backLabel?: string;
  showBackLink?: boolean;
  trailing?: React.ReactNode;
}

export function AppHeader({
  title,
  subtitle,
  showLogout,
  adminLink,
  variant = "light",
  layout = "bar",
  backHref = "/",
  backLabel = "กลับหน้าแรก",
  showBackLink = true,
  trailing,
}: AppHeaderProps) {
  const isBrand = variant === "brand";

  if (layout === "centered") {
    return (
      <header
        className={
          isBrand
            ? "border-b border-white/10 bg-brand px-4 py-6 text-center text-brand-foreground sm:py-8"
            : "border-b bg-card/90 px-4 py-6 text-center backdrop-blur-sm sm:py-8"
        }
      >
        <div className="relative mx-auto max-w-7xl">
          {trailing && (
            <div className="absolute top-0 right-0 hidden sm:block">{trailing}</div>
          )}
          {showBackLink && (
            <Link
              href={backHref}
              className={
                isBrand
                  ? "text-sm text-white/70 transition-colors hover:text-white"
                  : "text-sm text-muted-foreground transition-colors hover:text-foreground"
              }
            >
              ← {backLabel}
            </Link>
          )}
          <h1 className={cn("text-2xl font-bold sm:text-3xl", showBackLink && "mt-4")}>
            {title}
          </h1>
          {subtitle && (
            <p
              className={
                isBrand
                  ? "mx-auto mt-2 max-w-xl text-base text-white/80"
                  : "mx-auto mt-2 max-w-xl text-base text-muted-foreground"
              }
            >
              {subtitle}
            </p>
          )}
        </div>
      </header>
    );
  }

  return (
    <header
      className={
        isBrand
          ? "border-b border-white/10 bg-brand text-brand-foreground"
          : "border-b bg-card/90 backdrop-blur-sm"
      }
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href="/"
            className={
              isBrand
                ? "flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-white/10 transition-colors duration-200 hover:bg-white/15 focus-visible:ring-3 focus-visible:ring-white/30"
                : "flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border bg-background transition-colors duration-200 hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40"
            }
            aria-label="กลับหน้าแรก"
          >
            <Home className="size-5" aria-hidden />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold sm:text-2xl">{title}</h1>
            {subtitle && (
              <p
                className={
                  isBrand
                    ? "truncate text-sm text-white/70"
                    : "truncate text-sm text-muted-foreground"
                }
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {adminLink && (
            <ButtonLink
              href="/admin"
              variant={isBrand ? "secondary" : "outline"}
              className={isBrand ? "border-white/20 bg-white/10 text-white hover:bg-white/15" : ""}
            >
              แอดมิน
            </ButtonLink>
          )}
          {showLogout && (
            <Button
              variant={isBrand ? "secondary" : "outline"}
              className={
                isBrand
                  ? "cursor-pointer border-white/20 bg-white/10 text-white hover:bg-white/15"
                  : "cursor-pointer"
              }
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="size-4" aria-hidden />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
