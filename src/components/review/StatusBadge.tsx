import { Badge } from "@/components/ui/badge";
import type { ReviewStatus } from "@/types/review";

const variantFor: Record<ReviewStatus, "default" | "success" | "warning" | "danger" | "info" | "muted" | "secondary"> = {
  unreviewed: "warning",
  confirmed: "success",
  edited: "info",
  rejected: "danger",
  uncertain: "warning",
  added: "secondary",
};

export function StatusBadge({ status }: { status: ReviewStatus }) {
  return (
    <Badge variant={variantFor[status]} className="capitalize">
      {status.replaceAll("_", " ")}
    </Badge>
  );
}
