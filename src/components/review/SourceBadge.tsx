import { Badge } from "@/components/ui/badge";
import type { FieldSource } from "@/types/review";

const labels: Record<FieldSource, string> = {
  direct_extraction: "Direct",
  inferred: "Inferred",
  missing: "Missing",
  reviewer_added: "Reviewer",
};

export function SourceBadge({ source }: { source: FieldSource }) {
  const variant =
    source === "direct_extraction"
      ? "secondary"
      : source === "inferred"
        ? "info"
        : source === "missing"
          ? "muted"
          : "success";
  return <Badge variant={variant}>{labels[source]}</Badge>;
}
