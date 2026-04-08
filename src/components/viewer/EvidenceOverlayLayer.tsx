import { EvidenceBoxRect } from "@/components/viewer/EvidenceBoxRect";
import { OverlayQuestionChip } from "@/components/viewer/OverlayQuestionChip";
import { OverlayTagChip } from "@/components/viewer/OverlayTagChip";
import { bboxToPercentStyle } from "@/lib/bbox";
import { getFieldById } from "@/lib/fieldTree";
import { getEvidenceById, sourceHintClass, statusToOverlayClass } from "@/lib/reviewHelpers";
import { cn } from "@/lib/utils";
import type { ClaimReviewCase, EvidenceBox, SelectionState } from "@/types/review";

type Props = {
  caseData: ClaimReviewCase;
  selection: SelectionState;
  onSelectFromOverlay: (s: SelectionState) => void;
};

function isEvidenceSelected(ev: EvidenceBox, sel: SelectionState, caseData: ClaimReviewCase): boolean {
  if (!sel) return false;
  if (sel.kind === "evidence" && sel.id === ev.id) return true;
  if (sel.kind === "field" && ev.relatedFieldIds?.includes(sel.id)) return true;
  if (sel.kind === "tag") {
    const tag = caseData.tags.find((t) => t.id === sel.id);
    if (tag?.bboxId === ev.id) return true;
  }
  if (sel.kind === "question") {
    const q = caseData.questions.find((x) => x.id === sel.id);
    if (q?.bboxId === ev.id) return true;
  }
  return false;
}

export function EvidenceOverlayLayer({ caseData, selection, onSelectFromOverlay }: Props) {
  const dimOthers =
    selection !== null &&
    (selection.kind === "field" ||
      selection.kind === "tag" ||
      selection.kind === "question" ||
      selection.kind === "evidence");

  return (
    <div className="pointer-events-none absolute left-0 top-0 h-full w-full">
      {caseData.evidenceBoxes.map((ev) => {
        const selected = isEvidenceSelected(ev, selection, caseData);
        const dim = dimOthers && !selected;
        const primaryField = ev.relatedFieldIds?.[0]
          ? getFieldById(caseData, ev.relatedFieldIds[0]!)
          : undefined;
        const ringClass = primaryField
          ? cn(statusToOverlayClass(primaryField.status), sourceHintClass(primaryField.source))
          : "border-slate-400/60 bg-slate-400/10 ring-1 ring-slate-400/30";

        return (
          <EvidenceBoxRect
            key={ev.id}
            ev={ev}
            style={bboxToPercentStyle(ev.bbox)}
            className={cn(
              ringClass,
              dim && "opacity-[0.35]",
              selected && "z-10 opacity-100 ring-2 ring-sky-500",
            )}
            onSelect={() => onSelectFromOverlay({ kind: "evidence", id: ev.id })}
            relatedFieldId={ev.relatedFieldIds?.[0]}
            onSelectField={(fid) => onSelectFromOverlay({ kind: "field", id: fid })}
          />
        );
      })}

      {caseData.tags
        .filter((t) => t.bboxId)
        .map((t) => {
          const box = t.bboxId ? getEvidenceById(caseData, t.bboxId) : undefined;
          if (!box) return null;
          const sel = selection?.kind === "tag" && selection.id === t.id;
          return (
            <OverlayTagChip
              key={`tag-${t.id}`}
              tag={t}
              style={{
                left: `${box.bbox.x}%`,
                top: `${box.bbox.y}%`,
                pointerEvents: "auto",
              }}
              dim={dimOthers && !sel}
              selected={!!sel}
              onClick={() => onSelectFromOverlay({ kind: "tag", id: t.id })}
            />
          );
        })}

      {caseData.questions
        .filter((q) => q.status === "open" && q.bboxId)
        .map((q) => {
          const box = getEvidenceById(caseData, q.bboxId!);
          if (!box) return null;
          const sel = selection?.kind === "question" && selection.id === q.id;
          return (
            <OverlayQuestionChip
              key={`q-${q.id}`}
              question={q}
              style={{
                left: `${box.bbox.x + box.bbox.w * 0.5}%`,
                top: `${box.bbox.y + box.bbox.h}%`,
                transform: "translate(-50%, 4px)",
                pointerEvents: "auto",
              }}
              dim={dimOthers && !sel}
              selected={!!sel}
              onClick={() => onSelectFromOverlay({ kind: "question", id: q.id })}
            />
          );
        })}
    </div>
  );
}
