import { ArrowLeft, Download, Filter, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { buildReviewedPayload, downloadJsonFile, exportFeedbackLogOnly } from "@/lib/exportHelpers";
import { computeLiveUnresolvedCount } from "@/lib/reviewHelpers";
import type { ClaimReviewCase } from "@/types/review";
import { useReviewStore } from "@/store/useReviewStore";

type Props = {
  caseId: string;
  caseData: ClaimReviewCase;
  showLowConfidenceOnly: boolean;
  onToggleLowConfidence: () => void;
};

export function ReviewHeader({
  caseId,
  caseData,
  showLowConfidenceOnly,
  onToggleLowConfidence,
}: Props) {
  const approveAllHighConfidence = useReviewStore((s) => s.approveAllHighConfidence);
  const resetCase = useReviewStore((s) => s.resetCase);
  const saveReview = useReviewStore((s) => s.saveReview);

  const liveUnresolved = computeLiveUnresolvedCount(caseData);
  const pct = Math.round(caseData.extractionConfidence * 100);

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Separator orientation="vertical" className="hidden h-8 sm:block" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-base font-semibold text-slate-900">{caseData.title}</h1>
              <Badge variant="outline" className="font-mono text-[10px]">
                {caseId}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-600">
              <span>Type: {caseData.documentType}</span>
              <span>·</span>
              <span>
                Extraction:{" "}
                <Badge variant={caseData.extractionStatus === "reviewed" ? "success" : "secondary"}>
                  {caseData.extractionStatus}
                </Badge>
              </span>
              <span>·</span>
              <span>Overall confidence ~{pct}%</span>
              <span>·</span>
              <span className="font-medium text-amber-800">Unresolved: {liveUnresolved}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant={showLowConfidenceOnly ? "default" : "outline"}
                  size="sm"
                  onClick={onToggleLowConfidence}
                >
                  <Filter className="mr-1 h-4 w-4" />
                  Low confidence
                </Button>
              </TooltipTrigger>
              <TooltipContent>Filter field list to unreviewed items below ~75% confidence</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="outline" size="sm" onClick={() => approveAllHighConfidence(caseId)}>
                  <ShieldCheck className="mr-1 h-4 w-4" />
                  Approve high-conf
                </Button>
              </TooltipTrigger>
              <TooltipContent>Confirm all unreviewed fields at ≥ 90% confidence</TooltipContent>
            </Tooltip>

            <Button type="button" variant="outline" size="sm" onClick={() => resetCase(caseId)}>
              <RotateCcw className="mr-1 h-4 w-4" />
              Reset
            </Button>
            <Button type="button" size="sm" onClick={() => saveReview(caseId)}>
              <Save className="mr-1 h-4 w-4" />
              Save review
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => downloadJsonFile(buildReviewedPayload(caseData), `${caseId}-reviewed.json`)}
            >
              <Download className="mr-1 h-4 w-4" />
              Export JSON
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() =>
                downloadJsonFile(exportFeedbackLogOnly(caseData.reviewLog, caseId), `${caseId}-feedback-log.json`)
              }
            >
              Feedback log
            </Button>
          </div>
        </div>
        <p className="border-t border-slate-100 bg-slate-50 px-4 py-1.5 text-[11px] text-slate-600">
          HITL debugging layer — not adjudication. Shortcuts: C confirm · R reject field / remove tag · U uncertain · N
          note · [ / ] cycle issues
        </p>
      </header>
    </TooltipProvider>
  );
}
