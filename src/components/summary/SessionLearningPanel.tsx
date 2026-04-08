import { Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ClaimReviewCase } from "@/types/review";

type Props = {
  caseData: ClaimReviewCase;
};

/**
 * Simulated session learning — local artifacts only, not model training.
 * Demonstrates what downstream feedback loops could consume.
 */
export function SessionLearningPanel({ caseData }: Props) {
  const signals = caseData.sessionLearningSignals;
  return (
    <Card className="border-sky-200 bg-sky-50/40">
      <CardHeader className="flex flex-row items-center gap-2 py-3">
        <Lightbulb className="h-4 w-4 text-sky-700" />
        <CardTitle className="text-sm font-semibold text-sky-950">Session learning (simulated)</CardTitle>
        <Badge variant="info">{signals.length}</Badge>
      </CardHeader>
      <CardContent className="pb-3 pt-0">
        <p className="mb-2 text-xs text-sky-900/90">
          Captured correction signals for this session. In production these would route to labeling stores or model
          retraining — here they stay in memory only.
        </p>
        <ScrollArea className="max-h-40 pr-2">
          <ul className="space-y-2 text-xs text-slate-800">
            {signals.length === 0 && <li className="text-slate-500">No signals yet — edit fields or resolve questions.</li>}
            {signals.map((s) => (
              <li key={s.id} className="rounded border border-sky-100 bg-white/80 p-2">
                <span className="font-mono text-[10px] text-sky-800">{s.signalType}</span>
                <p className="mt-0.5">{s.description}</p>
                {s.confidenceImpact != null && (
                  <p className="text-[10px] text-slate-500">Δ confidence hint: {s.confidenceImpact}</p>
                )}
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
