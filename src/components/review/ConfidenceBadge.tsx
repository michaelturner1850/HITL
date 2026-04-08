import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ConfidenceBadge({ value, className }: { value: number; className?: string }) {
  const pct = Math.round(value * 100);
  const variant =
    value >= 0.9 ? "success" : value >= 0.75 ? "default" : value >= 0.5 ? "warning" : "danger";
  return (
    <Badge variant={variant} className={cn("tabular-nums", className)}>
      {pct}% conf
    </Badge>
  );
}
