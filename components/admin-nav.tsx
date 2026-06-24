"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Building2, LayoutGrid, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "ภาพรวม", icon: BarChart3, exact: true },
  { href: "/admin/services", label: "บริการ", icon: LayoutGrid },
  { href: "/admin/counters", label: "ช่องบริการ", icon: Building2 },
  { href: "/admin/users", label: "เจ้าหน้าที่", icon: Users },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="เมนูแอดมิน"
      className="surface-card flex gap-1 overflow-x-auto p-1"
    >
      {links.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors duration-200",
              active
                ? "bg-brand text-brand-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
