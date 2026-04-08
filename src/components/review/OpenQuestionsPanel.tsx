import { AlertTriangle } from "lucide-react";
import { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { ClaimReviewCase, ReviewQuestion, SelectionState } from "@/types/review";
import { useReviewStore } from "@/store/useReviewStore";

type Props = {
  caseId: string;
  caseData: ClaimReviewCase;
  selection: SelectionState;
  onSelect: (s: SelectionState) => void;
  highlightQuestionId?: string | null;
};

function severityVariant(s: ReviewQuestion["severity"]) {
  if (s === "high") return "danger" as const;
  if (s === "medium") return "warning" as const;
  return "secondary" as const;
}

export function OpenQuestionsPanel({
  caseId,
  caseData,
  selection,
  onSelect,
  highlightQuestionId,
}: Props) {
  const resolveQuestion = useReviewStore((s) => s.resolveQuestion);
  const skipQuestion = useReviewStore((s) => s.skipQuestion);
  const markQuestionUncertain = useReviewStore((s) => s.markQuestionUncertain);

  const openQs = caseData.questions.filter((q) => q.status === "open");
  const refMap = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!highlightQuestionId) return;
    const el = refMap.current[highlightQuestionId];
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [highlightQuestionId]);

  if (openQs.length === 0) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/40">
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium text-emerald-900">Open questions</CardTitle>
        </CardHeader>
        <CardContent className="pb-3 pt-0 text-sm text-emerald-800">No open questions for this case.</CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50/30">
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 py-3">
        <AlertTriangle className="h-4 w-4 text-amber-700" />
        <CardTitle className="text-sm font-semibold text-amber-950">Open questions</CardTitle>
        <Badge variant="warning">{openQs.length} open</Badge>
      </CardHeader>
      <CardContent className="space-y-3 pb-3 pt-0">
        {openQs.map((q) => {
          const sel = selection?.kind === "question" && selection.id === q.id;
          return (
            <div
              key={q.id}
              ref={(el) => {
                refMap.current[q.id] = el;
              }}
              className={cn(
                "rounded-md border border-amber-200/80 bg-white/90 p-3 shadow-sm",
                sel && "ring-2 ring-sky-500",
                highlightQuestionId === q.id && "ring-2 ring-amber-500",
              )}
              onClick={() => onSelect({ kind: "question", id: q.id })}
              onKeyDown={(e) => e.key === "Enter" && onSelect({ kind: "question", id: q.id })}
              role="button"
              tabIndex={0}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={severityVariant(q.severity)}>{q.severity}</Badge>
                <span className="text-sm font-medium text-slate-900">{q.title}</span>
              </div>
              <p className="mt-2 text-sm text-slate-700">{q.prompt}</p>
              <Separator className="my-2" />
              <div className="flex flex-col gap-1.5">
                {q.options.map((opt) => (
                  <Button
                    key={opt}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-auto justify-start whitespace-normal py-2 text-left text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      resolveQuestion(caseId, q.id, opt);
                    }}
                  >
                    {opt}
                  </Button>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="ghost" onClick={() => skipQuestion(caseId, q.id)}>
                  Skip
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => markQuestionUncertain(caseId, q.id)}
                >
                  Mark uncertain
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => resolveQuestion(caseId, q.id, "Needs SME review", "needs_sme")}
                >
                  Needs SME
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
