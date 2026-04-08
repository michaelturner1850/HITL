import { Minus, Plus, RotateCcw } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { EvidenceOverlayLayer } from "@/components/viewer/EvidenceOverlayLayer";
import { cn } from "@/lib/utils";
import type { ClaimReviewCase, SelectionState } from "@/types/review";

type Props = {
  caseData: ClaimReviewCase;
  selection: SelectionState;
  onSelectFromOverlay: (s: SelectionState) => void;
};

export function DocumentViewer({ caseData, selection, onSelectFromOverlay }: Props) {
  const [zoom, setZoom] = useState(1);

  const zoomIn = useCallback(() => setZoom((z) => Math.min(2.5, Math.round((z + 0.1) * 10) / 10)), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(0.4, Math.round((z - 0.1) * 10) / 10)), []);
  const resetZoom = useCallback(() => setZoom(1), []);

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-slate-200 bg-slate-100/80">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2">
        <p className="truncate text-xs font-medium text-slate-600">
          Document image — primary artifact (bbox overlays are normalized 0–100)
        </p>
        <div className="flex shrink-0 items-center gap-1">
          <Button type="button" variant="outline" size="icon" onClick={zoomOut} aria-label="Zoom out">
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center text-xs tabular-nums text-slate-600">{Math.round(zoom * 100)}%</span>
          <Button type="button" variant="outline" size="icon" onClick={zoomIn} aria-label="Zoom in">
            <Plus className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={resetZoom}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div className="flex min-h-full justify-center">
          <div
            className="origin-top transition-transform duration-150"
            style={{ transform: `scale(${zoom})` }}
          >
            <div className={cn("relative inline-block max-w-full shadow-md")}>
              <img
                src={caseData.imageUrl}
                alt={caseData.imageName}
                className="block max-h-[calc(100vh-220px)] w-auto max-w-full select-none bg-white object-contain"
                draggable={false}
              />
              <EvidenceOverlayLayer
                caseData={caseData}
                selection={selection}
                onSelectFromOverlay={onSelectFromOverlay}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
