import { Crosshair, Pencil, RotateCcw, StickyNote } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfidenceBadge } from "@/components/review/ConfidenceBadge";
import { SourceBadge } from "@/components/review/SourceBadge";
import { StatusBadge } from "@/components/review/StatusBadge";
import { getEvidenceForField, isLowConfidenceField } from "@/lib/reviewHelpers";
import { cn } from "@/lib/utils";
import type { ClaimReviewCase, ExtractedField } from "@/types/review";

const fmt = (v: string | number | boolean | null) =>
  v === null || v === undefined ? "—" : typeof v === "boolean" ? (v ? "Yes" : "No") : String(v);

type Props = {
  caseData: ClaimReviewCase;
  field: ExtractedField;
  selected: boolean;
  onSelect: () => void;
  onConfirm: () => void;
  onEdit: (v: string | number | boolean | null) => void;
  onReject: () => void;
  onUncertain: () => void;
  onRestore: () => void;
  onNote: (note: string) => void;
  onJumpEvidence: () => void;
};

export function FieldCard({
  caseData,
  field,
  selected,
  onSelect,
  onConfirm,
  onEdit,
  onReject,
  onUncertain,
  onRestore,
  onNote,
  onJumpEvidence,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(fmt(field.value));
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState(field.note ?? "");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected && ref.current) {
      ref.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selected]);

  const low = isLowConfidenceField(field);
  const ev = getEvidenceForField(caseData, field.id);

  const submitEdit = () => {
    const orig = field.originalValue;
    let parsed: string | number | boolean | null = draft;
    if (typeof orig === "number") {
      const n = Number(draft);
      parsed = Number.isFinite(n) ? n : draft;
    } else if (typeof orig === "boolean") {
      parsed = draft.toLowerCase() === "true" || draft === "1" || draft.toLowerCase() === "yes";
    }
    onEdit(parsed);
    setEditing(false);
  };

  return (
    <Card
      ref={ref}
      id={`field-card-${field.id}`}
      className={cn(
        "scroll-mt-2 border-slate-200 transition-shadow",
        selected && "ring-2 ring-sky-500",
        low && field.status === "unreviewed" && "border-amber-300 bg-amber-50/40",
      )}
      onClick={() => onSelect()}
    >
      <CardContent className="space-y-2 p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-900">{field.label}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              <StatusBadge status={field.status} />
              <SourceBadge source={field.source} />
              <ConfidenceBadge value={field.confidence} />
            </div>
          </div>
          {ev && (
            <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => onJumpEvidence()}>
              <Crosshair className="mr-1 h-3.5 w-3.5" />
              Evidence
            </Button>
          )}
        </div>

        {editing ? (
          <div className="flex gap-2">
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} className="font-mono text-sm" />
            <Button type="button" size="sm" onClick={submitEdit}>
              Save
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="font-mono text-sm text-slate-800">{fmt(field.value)}</p>
            {field.status === "edited" && fmt(field.value) !== fmt(field.originalValue) && (
              <p className="text-xs text-slate-500">
                Original: <span className="font-mono">{fmt(field.originalValue)}</span>
              </p>
            )}
          </div>
        )}

        {field.candidateValues && field.candidateValues.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <span className="text-xs text-slate-500">Candidates:</span>
            {field.candidateValues.map((c, i) => (
              <Badge key={i} variant="outline" className="font-mono text-[10px]">
                {fmt(c)}
              </Badge>
            ))}
          </div>
        )}

        {field.note && <p className="text-xs text-slate-600">Note: {field.note}</p>}

        {noteOpen && (
          <div className="space-y-1">
            <Textarea
              rows={2}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Reviewer note (feeds feedback log + session learning patterns)"
            />
            <Button type="button" size="sm" onClick={() => onNote(noteDraft)}>
              Save note
            </Button>
          </div>
        )}

        <div className="flex flex-wrap gap-1 pt-1">
          <Button type="button" size="sm" variant="secondary" onClick={() => onConfirm()}>
            Confirm
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setDraft(fmt(field.value));
              setEditing(true);
            }}
          >
            <Pencil className="mr-1 h-3 w-3" />
            Edit
          </Button>
          <Button type="button" size="sm" variant="destructive" onClick={() => onReject()}>
            Reject
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => onUncertain()}>
            Uncertain
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => onRestore()}>
            <RotateCcw className="mr-1 h-3 w-3" />
            Restore
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setNoteOpen((v) => !v)}>
            <StickyNote className="mr-1 h-3 w-3" />
            Note
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
