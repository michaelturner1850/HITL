import type { CSSProperties } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TagEntity } from "@/types/review";

type Props = {
  tag: TagEntity;
  style: CSSProperties;
  onClick: () => void;
  dim: boolean;
  selected: boolean;
};

export function OverlayTagChip({ tag, style, onClick, dim, selected }: Props) {
  return (
    <button
      type="button"
      className={cn(
        "absolute z-[5] flex max-w-[min(40%,180px)] items-start justify-start text-left",
        dim && "opacity-40",
        selected && "z-20 opacity-100",
      )}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <Badge variant="info" className="truncate text-[10px] leading-tight">
        {tag.label}: {tag.text.slice(0, 28)}
        {tag.text.length > 28 ? "…" : ""}
      </Badge>
    </button>
  );
}
