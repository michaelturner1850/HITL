import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { EvidenceBox } from "@/types/review";

type Props = {
  ev: EvidenceBox;
  style: CSSProperties;
  className?: string;
  onSelect: () => void;
  relatedFieldId?: string;
  onSelectField: (fieldId: string) => void;
};

export function EvidenceBoxRect({
  ev,
  style,
  className,
  onSelect,
  relatedFieldId,
  onSelectField,
}: Props) {
  return (
    <button
      type="button"
      title={`${ev.label}${ev.sourceText ? ` — ${ev.sourceText}` : ""}`}
      className={cn(
        "pointer-events-auto absolute box-border rounded-sm border-2 transition-opacity",
        className,
      )}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        if (relatedFieldId) onSelectField(relatedFieldId);
        else onSelect();
      }}
    >
      <span className="sr-only">Evidence {ev.label}</span>
    </button>
  );
}
