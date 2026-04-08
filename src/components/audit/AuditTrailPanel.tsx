import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { ClaimReviewCase } from "@/types/review";

type Props = {
  caseData: ClaimReviewCase;
};

export function AuditTrailPanel({ caseData }: Props) {
  const events = [...caseData.reviewLog].reverse().slice(0, 40);
  return (
    <div className="rounded-md border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Activity / audit trail</p>
        <p className="text-[11px] text-slate-500">Latest structured review events (typed feedback log).</p>
      </div>
      <ScrollArea className="h-36">
        <div className="space-y-0 p-2">
          {events.length === 0 && <p className="px-1 text-xs text-slate-500">No events yet.</p>}
          {events.map((e, i) => (
            <div key={e.id}>
              {i > 0 && <Separator className="my-1" />}
              <div className="rounded px-1 py-1 text-[11px] leading-snug">
                <span className="font-mono text-slate-400">{new Date(e.timestamp).toLocaleTimeString()}</span>{" "}
                <span className="font-medium text-slate-800">{e.action}</span>{" "}
                <span className="text-slate-600">
                  {e.targetType}/{e.targetId}
                </span>
                {e.note && <span className="block text-slate-500">Note: {e.note}</span>}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
