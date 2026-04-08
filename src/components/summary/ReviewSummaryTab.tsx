import { ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SessionLearningPanel } from "@/components/summary/SessionLearningPanel";
import {
  buildReviewedPayload,
  downloadJsonFile,
  exportFeedbackLogOnly,
} from "@/lib/exportHelpers";
import {
  fieldSummaryCounts,
  reviewerNotesCount,
  tagChangedCount,
  computeLiveUnresolvedCount,
} from "@/lib/reviewHelpers";
import type { ClaimReviewCase } from "@/types/review";
import { useReviewStore } from "@/store/useReviewStore";

type Props = {
  caseId: string;
  caseData: ClaimReviewCase;
};

export function ReviewSummaryTab({ caseId, caseData }: Props) {
  const saveReview = useReviewStore((s) => s.saveReview);
  const resetCase = useReviewStore((s) => s.resetCase);
  const markTraining = useReviewStore((s) => s.markTraining);

  const fc = fieldSummaryCounts(caseData);
  const unresolved = computeLiveUnresolvedCount(caseData);
  const notes = reviewerNotesCount(caseData);
  const tagsChanged = tagChangedCount(caseData.tags);
  const payload = buildReviewedPayload(caseData);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Fields confirmed" value={fc.confirmed} />
        <Stat label="Fields edited" value={fc.edited} />
        <Stat label="Fields rejected" value={fc.rejected} />
        <Stat label="Fields uncertain" value={fc.uncertain} />
        <Stat label="Tags changed / added / ambiguous" value={tagsChanged} />
        <Stat label="Unresolved items (live)" value={unresolved} />
        <Stat label="Reviewer notes" value={notes} />
        <Stat label="Training marker" value={caseData.trainingUsefulness ?? "unmarked"} />
      </div>

      <SessionLearningPanel caseData={caseData} />

      <div>
        <p className="text-xs font-semibold uppercase text-slate-600">Final reviewed JSON preview</p>
        <ScrollArea className="mt-1 h-40 rounded-md border border-slate-200 bg-slate-950 p-2">
          <pre className="whitespace-pre-wrap break-all font-mono text-[10px] text-emerald-100">
            {JSON.stringify(payload, null, 2).slice(0, 8000)}
            {JSON.stringify(payload).length > 8000 ? "\n…" : ""}
          </pre>
        </ScrollArea>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase text-slate-600">Structured feedback event log</p>
        <ScrollArea className="mt-1 h-32 rounded-md border border-slate-200 bg-white p-2">
          <pre className="font-mono text-[10px] text-slate-800">
            {JSON.stringify(caseData.reviewLog.slice(-25), null, 2)}
          </pre>
        </ScrollArea>
      </div>

      <Separator />

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => saveReview(caseId)}>
          Save review
        </Button>
        <Button type="button" variant="secondary" onClick={() => downloadJsonFile(payload, `${caseId}-reviewed.json`)}>
          Export reviewed JSON
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            downloadJsonFile(exportFeedbackLogOnly(caseData.reviewLog, caseId), `${caseId}-feedback-log.json`)
          }
        >
          Export feedback log
        </Button>
        <Button type="button" variant="outline" onClick={() => markTraining(caseId, "good_example")}>
          <ThumbsUp className="mr-1 h-4 w-4" />
          Good training example
        </Button>
        <Button type="button" variant="outline" onClick={() => markTraining(caseId, "poor_quality")}>
          <ThumbsDown className="mr-1 h-4 w-4" />
          Poor quality doc
        </Button>
        <Button type="button" variant="destructive" onClick={() => resetCase(caseId)}>
          Reset changes
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-lg font-semibold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}
