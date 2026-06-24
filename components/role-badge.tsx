import { Badge } from "@/components/ui/badge";

interface RoleBadgeProps {
  role: "ADMIN" | "STAFF";
}

export function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <Badge variant={role === "ADMIN" ? "default" : "secondary"}>
      {role === "ADMIN" ? "แอดมิน" : "เจ้าหน้าที่"}
    </Badge>
  );
}
