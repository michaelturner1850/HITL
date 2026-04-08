import { Crosshair, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { ConfidenceBadge } from "@/components/review/ConfidenceBadge";
import { StatusBadge } from "@/components/review/StatusBadge";
import { TAG_LABEL_OPTIONS } from "@/data/tagLabels";
import { cn } from "@/lib/utils";
import type { TagEntity } from "@/types/review";

type Props = {
  tag: TagEntity;
  selected: boolean;
  onSelect: () => void;
  onConfirm: () => void;
  onRelabel: (label: string) => void;
  onRemove: () => void;
  onAmbiguous: (note?: string) => void;
  onNote: (note: string) => void;
  onFocusEvidence: () => void;
};

export function TagCard({
  tag,
  selected,
  onSelect,
  onConfirm,
  onRelabel,
  onRemove,
  onAmbiguous,
  onNote,
  onFocusEvidence,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected && ref.current) ref.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selected]);

  return (
    <Card
      ref={ref}
      id={`tag-card-${tag.id}`}
      className={cn("scroll-mt-2 border-slate-200", selected && "ring-2 ring-sky-500")}
      onClick={() => onSelect()}
    >
      <CardContent className="space-y-2 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {tag.label}
            </Badge>
            <StatusBadge status={tag.status} />
            <ConfidenceBadge value={tag.confidence} />
          </div>
          {tag.bboxId && (
            <Button type="button" variant="outline" size="sm" onClick={() => onFocusEvidence()}>
              <Crosshair className="mr-1 h-3.5 w-3.5" />
              Focus
            </Button>
          )}
        </div>
        <p className="text-sm text-slate-800">{tag.text}</p>
        {tag.note && <p className="text-xs text-slate-600">Note: {tag.note}</p>}

        <div className="flex flex-wrap gap-1">
          <Button type="button" size="sm" variant="secondary" onClick={() => onConfirm()}>
            Confirm
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" size="sm" variant="outline">
                Change label
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
              <DropdownMenuLabel>Tag label</DropdownMenuLabel>
              {TAG_LABEL_OPTIONS.map((l) => (
                <DropdownMenuItem key={l} onClick={() => onRelabel(l)}>
                  {l}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button type="button" size="sm" variant="outline" onClick={() => onAmbiguous()}>
            Ambiguous
          </Button>
          <Button type="button" size="sm" variant="destructive" onClick={() => onRemove()}>
            <Trash2 className="mr-1 h-3 w-3" />
            Remove
          </Button>
        </div>

        <div className="space-y-1 border-t border-slate-100 pt-2">
          <p className="text-xs text-slate-500">Attach / edit note</p>
          <TagNoteForm
            key={`${tag.id}-${tag.note ?? ""}`}
            initial={tag.note ?? ""}
            onSave={(n) => {
              onNote(n);
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function TagNoteForm({ initial, onSave }: { initial: string; onSave: (n: string) => void }) {
  const [v, setV] = useState(initial);
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Textarea rows={2} value={v} onChange={(e) => setV(e.target.value)} className="text-sm" />
      <Button type="button" size="sm" className="self-end shrink-0" onClick={() => onSave(v)}>
        Save
      </Button>
    </div>
  );
}
