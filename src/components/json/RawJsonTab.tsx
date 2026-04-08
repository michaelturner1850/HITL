import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { buildReviewedPayload } from "@/lib/exportHelpers";
import type { ClaimReviewCase } from "@/types/review";

type Props = {
  caseData: ClaimReviewCase;
};

function InspectorRow({ k, v, depth = 0 }: { k: string; v: unknown; depth?: number }) {
  const pad = { paddingLeft: Math.min(depth * 12, 120) };
  if (v !== null && typeof v === "object" && !Array.isArray(v)) {
    return (
      <div style={pad} className="font-mono text-xs">
        <span className="text-sky-700">{k}:</span>
        <div className="border-l border-slate-200 pl-2">
          {Object.entries(v as Record<string, unknown>).map(([ck, cv]) => (
            <InspectorRow key={ck} k={ck} v={cv} depth={depth + 1} />
          ))}
        </div>
      </div>
    );
  }
  if (Array.isArray(v)) {
    return (
      <div style={pad} className="font-mono text-xs text-slate-700">
        <span className="text-sky-700">{k}:</span>{" "}
        <span className="text-slate-500">[{v.length} items]</span>
      </div>
    );
  }
  return (
    <div style={pad} className="font-mono text-xs text-slate-800">
      <span className="text-sky-700">{k}:</span>{" "}
      <span className="break-all">{JSON.stringify(v)}</span>
    </div>
  );
}

export function RawJsonTab({ caseData }: Props) {
  const [mode, setMode] = useState<"pretty" | "inspector">("pretty");
  const payload = useMemo(() => buildReviewedPayload(caseData), [caseData]);
  const pretty = useMemo(() => JSON.stringify(payload, null, 2), [payload]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant={mode === "pretty" ? "default" : "outline"} onClick={() => setMode("pretty")}>
          Pretty JSON
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "inspector" ? "default" : "outline"}
          onClick={() => setMode("inspector")}
        >
          Structured / inspector
        </Button>
      </div>
      <ScrollArea className="h-[calc(100vh-380px)] min-h-[200px] rounded-md border border-slate-200 bg-slate-950 p-3">
        {mode === "pretty" ? (
          <pre className="whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed text-emerald-100">
            {pretty}
          </pre>
        ) : (
          <div className="space-y-1 text-emerald-50">
            {Object.entries(payload as Record<string, unknown>).map(([k, v]) => (
              <InspectorRow key={k} k={k} v={v} />
            ))}
          </div>
        )}
      </ScrollArea>
      <p className="text-xs text-slate-500">
        Includes document type, grouped recipients (providers, dates, expense lines, totals), tags, evidence, questions,
        review log, and session learning signals — live view.
      </p>
    </div>
  );
}
