import type { CSSProperties } from "react";
import type { BBox } from "@/types/review";

/** Normalized bbox (0–100) → CSS % positions for absolute overlay layer. */
export function bboxToPercentStyle(bbox: BBox): CSSProperties {
  return {
    left: `${bbox.x}%`,
    top: `${bbox.y}%`,
    width: `${bbox.w}%`,
    height: `${bbox.h}%`,
  };
}
