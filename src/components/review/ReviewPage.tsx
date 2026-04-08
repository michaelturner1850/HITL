import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Group, Panel, Separator } from "react-resizable-panels";
import { AuditTrailPanel } from "@/components/audit/AuditTrailPanel";
import { FieldsTab } from "@/components/fields/FieldsTab";
import { RawJsonTab } from "@/components/json/RawJsonTab";
import { OpenQuestionsPanel } from "@/components/review/OpenQuestionsPanel";
import { ReviewHeader } from "@/components/review/ReviewHeader";
import { TagTab } from "@/components/tags/TagTab";
import { ReviewSummaryTab } from "@/components/summary/ReviewSummaryTab";
import { DocumentViewer } from "@/components/viewer/DocumentViewer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { collectOpenIssues, useReviewStore } from "@/store/useReviewStore";
import type { SelectionState } from "@/types/review";

export function ReviewPage() {
  const { caseId = "" } = useParams();
  const navigate = useNavigate();
  const ensureCase = useReviewStore((s) => s.ensureCase);
  const cases = useReviewStore((s) => s.cases);
  const selection = useReviewStore((s) => s.selection);
  const setSelection = useReviewStore((s) => s.setSelection);
  const showLowConfidenceOnly = useReviewStore((s) => s.showLowConfidenceOnly);
  const setShowLowConfidenceOnly = useReviewStore((s) => s.setShowLowConfidenceOnly);
  const confirmField = useReviewStore((s) => s.confirmField);
  const rejectField = useReviewStore((s) => s.rejectField);
  const markFieldUncertain = useReviewStore((s) => s.markFieldUncertain);
  const addFieldNote = useReviewStore((s) => s.addFieldNote);
  const updateTagNote = useReviewStore((s) => s.updateTagNote);
  const removeTag = useReviewStore((s) => s.removeTag);
  const confirmTag = useReviewStore((s) => s.confirmTag);
  const activeIssueCursor = useReviewStore((s) => s.activeIssueCursor);
  const setIssueCursor = useReviewStore((s) => s.setIssueCursor);

  const [noteOpen, setNoteOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [issueFlashId, setIssueFlashId] = useState<string | null>(null);

  useEffect(() => {
    const c = ensureCase(caseId);
    if (!c) navigate("/", { replace: true });
  }, [caseId, ensureCase, navigate]);

  const caseData = cases[caseId];
  const hideOpenQuestions = Boolean(caseData?.metadata?.uploadSource);

  const issues = useMemo(
    () => (caseData && !hideOpenQuestions ? collectOpenIssues(caseData) : []),
    [caseData, hideOpenQuestions],
  );

  const applyIssueIndex = useCallback(
    (idx: number) => {
      if (!caseData || issues.length === 0) return;
      const i = ((idx % issues.length) + issues.length) % issues.length;
      setIssueCursor(i);
      const item = issues[i]!;
      if (item.type === "question") {
        setSelection({ kind: "question", id: item.id });
        setIssueFlashId(item.id);
        setTimeout(() => setIssueFlashId(null), 1200);
      } else {
        setSelection({ kind: "field", id: item.id });
      }
    },
    [caseData, issues, setIssueCursor, setSelection],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) return;

      if (e.key === "[" ) {
        e.preventDefault();
        applyIssueIndex(activeIssueCursor - 1);
        return;
      }
      if (e.key === "]") {
        e.preventDefault();
        applyIssueIndex(activeIssueCursor + 1);
        return;
      }
      if (!caseData) return;

      if (e.key.toLowerCase() === "c" && selection) {
        e.preventDefault();
        if (selection.kind === "field") confirmField(caseId, selection.id);
        if (selection.kind === "tag") confirmTag(caseId, selection.id);
      }
      if (e.key.toLowerCase() === "r" && selection) {
        e.preventDefault();
        if (selection.kind === "field") rejectField(caseId, selection.id);
        if (selection.kind === "tag") removeTag(caseId, selection.id);
      }
      if (e.key.toLowerCase() === "u" && selection?.kind === "field") {
        e.preventDefault();
        markFieldUncertain(caseId, selection.id);
      }
      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        setNoteDraft("");
        setNoteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    activeIssueCursor,
    applyIssueIndex,
    caseData,
    caseId,
    confirmField,
    confirmTag,
    markFieldUncertain,
    rejectField,
    removeTag,
    selection,
  ]);

  if (!caseData) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-600">
        Loading case…
      </div>
    );
  }

  const submitNote = () => {
    if (!selection) return;
    if (selection.kind === "field") addFieldNote(caseId, selection.id, noteDraft);
    if (selection.kind === "tag") updateTagNote(caseId, selection.id, noteDraft);
    setNoteOpen(false);
  };

  const onSelectFromOverlay = (s: SelectionState) => {
    setSelection(s);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <ReviewHeader
        caseId={caseId}
        caseData={caseData}
        showLowConfidenceOnly={showLowConfidenceOnly}
        onToggleLowConfidence={() => setShowLowConfidenceOnly(!showLowConfidenceOnly)}
      />

      <Group orientation="horizontal" className="flex min-h-0 flex-1">
        <Panel id="doc" defaultSize="55%" minSize="35%" className="min-w-0">
          <div className="h-[calc(100vh-120px)] min-h-[400px] p-3 pr-1">
            <DocumentViewer caseData={caseData} selection={selection} onSelectFromOverlay={onSelectFromOverlay} />
          </div>
        </Panel>
        <Separator className="w-2 shrink-0 bg-slate-200 hover:bg-slate-400" />
        <Panel id="review" defaultSize="45%" minSize="30%" className="min-w-0">
          <div className="flex h-[calc(100vh-120px)] min-h-[400px] flex-col gap-3 overflow-hidden p-3 pl-1">
            {!hideOpenQuestions && (
              <OpenQuestionsPanel
                caseId={caseId}
                caseData={caseData}
                selection={selection}
                onSelect={setSelection}
                highlightQuestionId={issueFlashId}
              />
            )}
            <Tabs defaultValue="fields" className="flex min-h-0 flex-1 flex-col">
              <TabsList className="w-full shrink-0 justify-start overflow-x-auto">
                <TabsTrigger value="fields">Extracted fields</TabsTrigger>
                <TabsTrigger value="tags">Tags</TabsTrigger>
                <TabsTrigger value="json">Raw JSON</TabsTrigger>
                <TabsTrigger value="summary">Review summary</TabsTrigger>
              </TabsList>
              <TabsContent value="fields" className="min-h-0 flex-1 overflow-hidden">
                <FieldsTab
                  caseId={caseId}
                  caseData={caseData}
                  selection={selection}
                  showLowConfidenceOnly={showLowConfidenceOnly}
                  onSelect={setSelection}
                />
              </TabsContent>
              <TabsContent value="tags" className="min-h-0 flex-1 overflow-hidden">
                <TagTab caseId={caseId} caseData={caseData} selection={selection} onSelect={setSelection} />
              </TabsContent>
              <TabsContent value="json" className="min-h-0 flex-1 overflow-hidden">
                <RawJsonTab caseData={caseData} />
              </TabsContent>
              <TabsContent value="summary" className="min-h-0 flex-1 overflow-y-auto">
                <ReviewSummaryTab caseId={caseId} caseData={caseData} />
              </TabsContent>
            </Tabs>
            <AuditTrailPanel caseData={caseData} />
          </div>
        </Panel>
      </Group>

      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add note
              {selection && (
                <span className="block text-xs font-normal text-slate-500">
                  Target: {selection.kind} / {selection.id}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {!selection || (selection.kind !== "field" && selection.kind !== "tag") ? (
            <p className="text-sm text-slate-600">Select a field or tag first.</p>
          ) : (
            <div className="space-y-2">
              <Textarea rows={4} value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} />
              <Button type="button" onClick={submitNote}>
                Save note
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
