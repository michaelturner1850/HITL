import type { CSSProperties } from "react";
import { HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReviewQuestion } from "@/types/review";

type Props = {
  question: ReviewQuestion;
  style: CSSProperties;
  onClick: () => void;
  dim: boolean;
  selected: boolean;
};

export function OverlayQuestionChip({ question, style, onClick, dim, selected }: Props) {
  return (
    <button
      type="button"
      className={cn(
        "absolute z-[6] flex items-center gap-1",
        dim && "opacity-40",
        selected && "z-20 opacity-100",
      )}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <HelpCircle className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
      <Badge variant="warning" className="max-w-[200px] truncate text-[10px]">
        {question.title}
      </Badge>
    </button>
  );
}
