import { Badge } from "@/components/ui/badge";

interface ActiveBadgeProps {
  active: boolean;
}

export function ActiveBadge({ active }: ActiveBadgeProps) {
  return (
    <Badge variant={active ? "success" : "muted"}>
      {active ? "เปิด" : "ปิด"}
    </Badge>
  );
}
