import { Plus } from "lucide-react";
import { useState } from "react";
import { TagCard } from "@/components/tags/TagCard";
import { TAG_LABEL_OPTIONS } from "@/data/tagLabels";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ClaimReviewCase, SelectionState } from "@/types/review";
import { useReviewStore } from "@/store/useReviewStore";

type Props = {
  caseId: string;
  caseData: ClaimReviewCase;
  selection: SelectionState;
  onSelect: (s: SelectionState) => void;
};

export function TagTab({ caseId, caseData, selection, onSelect }: Props) {
  const confirmTag = useReviewStore((s) => s.confirmTag);
  const relabelTag = useReviewStore((s) => s.relabelTag);
  const removeTag = useReviewStore((s) => s.removeTag);
  const addTag = useReviewStore((s) => s.addTag);
  const markTagAmbiguous = useReviewStore((s) => s.markTagAmbiguous);
  const updateTagNote = useReviewStore((s) => s.updateTagNote);

  const [open, setOpen] = useState(false);
  const [newLabel, setNewLabel] = useState<(typeof TAG_LABEL_OPTIONS)[number]>("provider");
  const [newText, setNewText] = useState("");
  const [newConf, setNewConf] = useState("0.75");

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" size="sm" variant="secondary">
              <Plus className="mr-1 h-4 w-4" />
              Add missing tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add tag (reviewer-added)</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Label</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="mt-1 w-full justify-start">
                      {newLabel}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="max-h-56 overflow-y-auto">
                    <DropdownMenuLabel>Tag label</DropdownMenuLabel>
                    {TAG_LABEL_OPTIONS.map((l) => (
                      <DropdownMenuItem key={l} onClick={() => setNewLabel(l)}>
                        {l}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div>
                <Label>Text</Label>
                <Input className="mt-1" value={newText} onChange={(e) => setNewText(e.target.value)} />
              </div>
              <div>
                <Label>Confidence (0–1)</Label>
                <Input className="mt-1" value={newConf} onChange={(e) => setNewConf(e.target.value)} />
              </div>
              <Button
                type="button"
                onClick={() => {
                  const c = Math.min(1, Math.max(0, Number(newConf) || 0.5));
                  addTag(caseId, {
                    label: newLabel,
                    text: newText || "(empty)",
                    confidence: c,
                  });
                  setOpen(false);
                  setNewText("");
                }}
              >
                Add tag
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="h-[calc(100vh-380px)] min-h-[200px] pr-3">
        <div className="space-y-2 pb-4">
          {caseData.tags.map((t) => (
            <TagCard
              key={t.id}
              tag={t}
              selected={selection?.kind === "tag" && selection.id === t.id}
              onSelect={() => onSelect({ kind: "tag", id: t.id })}
              onConfirm={() => confirmTag(caseId, t.id)}
              onRelabel={(l) => relabelTag(caseId, t.id, l)}
              onRemove={() => removeTag(caseId, t.id)}
              onAmbiguous={(note) => markTagAmbiguous(caseId, t.id, note)}
              onNote={(n) => updateTagNote(caseId, t.id, n)}
              onFocusEvidence={() => onSelect({ kind: "tag", id: t.id })}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
