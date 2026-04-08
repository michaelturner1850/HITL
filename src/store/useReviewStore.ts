/**
 * Session-only review state (in-memory). Simulated learning signals are local artifacts, not model training.
 *
 * Future: hydrate from processor queue; optional persistence behind feature flag; batch mode for SME sessions.
 */

import { produce } from "immer";
import { create } from "zustand";
import { BUILT_IN_CASES } from "@/data/sampleCases";
import { createCaseFromUpload, getMockCaseById } from "@/lib/mockExtractionEngine";
import { getFieldById, iterateAllFields } from "@/lib/fieldTree";
import { computeLiveUnresolvedCount, isLowConfidenceField } from "@/lib/reviewHelpers";
import { generateId } from "@/lib/utils";
import type {
  ClaimReviewCase,
  ReviewEvent,
  ReviewQuestion,
  SelectionState,
  SessionLearningSignal,
  TagEntity,
} from "@/types/review";

const HIGH_CONF = 0.9;

function nowIso() {
  return new Date().toISOString();
}

function cloneCase(c: ClaimReviewCase): ClaimReviewCase {
  return structuredClone(c);
}

function pushEvent(draft: ClaimReviewCase, ev: Omit<ReviewEvent, "id" | "timestamp">) {
  const full: ReviewEvent = {
    ...ev,
    id: generateId("evt"),
    timestamp: nowIso(),
  };
  draft.reviewLog.push(full);
  draft.unresolvedCount = computeLiveUnresolvedCount(draft);
  return full;
}

function addSignal(
  draft: ClaimReviewCase,
  signal: Omit<SessionLearningSignal, "id" | "createdFromEventId">,
  eventId: string,
) {
  draft.sessionLearningSignals.push({
    ...signal,
    id: generateId("sig"),
    createdFromEventId: eventId,
  });
}

type Store = {
  cases: Record<string, ClaimReviewCase>;
  selection: SelectionState;
  showLowConfidenceOnly: boolean;
  activeIssueCursor: number;
  seedBuiltIns: () => void;
  ensureCase: (caseId: string) => ClaimReviewCase | null;
  registerCase: (c: ClaimReviewCase) => void;
  setSelection: (s: SelectionState) => void;
  setShowLowConfidenceOnly: (v: boolean) => void;
  setIssueCursor: (n: number) => void;
  /** Simulated: after field edit, slightly boost confidence on same evidence-linked fields. */
  applySessionConfidenceBump: (caseId: string, fieldId: string) => void;
  confirmField: (caseId: string, fieldId: string) => void;
  editField: (caseId: string, fieldId: string, value: string | number | boolean | null) => void;
  rejectField: (caseId: string, fieldId: string) => void;
  markFieldUncertain: (caseId: string, fieldId: string) => void;
  restoreField: (caseId: string, fieldId: string) => void;
  addFieldNote: (caseId: string, fieldId: string, note: string) => void;
  confirmTag: (caseId: string, tagId: string) => void;
  relabelTag: (caseId: string, tagId: string, newLabel: string) => void;
  removeTag: (caseId: string, tagId: string) => void;
  addTag: (caseId: string, tag: Omit<TagEntity, "id" | "status">) => void;
  markTagAmbiguous: (caseId: string, tagId: string, note?: string) => void;
  updateTagNote: (caseId: string, tagId: string, note: string) => void;
  resolveQuestion: (caseId: string, qId: string, option: string, rationale?: string) => void;
  skipQuestion: (caseId: string, qId: string) => void;
  markQuestionUncertain: (caseId: string, qId: string) => void;
  approveAllHighConfidence: (caseId: string) => void;
  resetCase: (caseId: string) => void;
  saveReview: (caseId: string) => void;
  markTraining: (caseId: string, m: "good_example" | "poor_quality") => void;
  createUploadCase: (file: File) => ClaimReviewCase;
};

export const useReviewStore = create<Store>((set, get) => ({
  cases: {},
  selection: null,
  showLowConfidenceOnly: false,
  activeIssueCursor: 0,

  seedBuiltIns: () => {
    set(
      produce((s: Store) => {
        for (const c of BUILT_IN_CASES) {
          s.cases[c.caseId] = cloneCase(c);
        }
      }),
    );
  },

  ensureCase: (caseId) => {
    const existing = get().cases[caseId];
    if (existing) return existing;
    const mock = getMockCaseById(caseId);
    if (!mock) return null;
    set(
      produce((s: Store) => {
        s.cases[caseId] = mock;
      }),
    );
    return get().cases[caseId]!;
  },

  registerCase: (c) => {
    set(
      produce((s: Store) => {
        s.cases[c.caseId] = c;
      }),
    );
  },

  setSelection: (sel) => set({ selection: sel }),
  setShowLowConfidenceOnly: (v) => set({ showLowConfidenceOnly: v }),
  setIssueCursor: (n) => set({ activeIssueCursor: n }),

  createUploadCase: (file) => {
    const c = createCaseFromUpload(file);
    get().registerCase(c);
    return c;
  },

  applySessionConfidenceBump: (caseId, fieldId) => {
    set(
      produce((s: Store) => {
        const draft = s.cases[caseId];
        if (!draft) return;
        const field = getFieldById(draft, fieldId);
        if (!field?.evidenceBoxIds?.length) return;
        const boxIds = field.evidenceBoxIds;
        for (const f of iterateAllFields(draft)) {
          if (f.id === fieldId) continue;
          if (f.status !== "unreviewed") continue;
          if (f.evidenceBoxIds?.some((id) => boxIds.includes(id))) {
            f.confidence = Math.min(0.97, f.confidence + 0.03);
          }
        }
      }),
    );
  },

  confirmField: (caseId, fieldId) => {
    set(
      produce((s: Store) => {
        const draft = s.cases[caseId];
        const f = draft ? getFieldById(draft, fieldId) : undefined;
        if (!draft || !f) return;
        const before = { ...f };
        f.status = "confirmed";
        const ev = pushEvent(draft, {
          action: "confirm_field",
          targetType: "field",
          targetId: fieldId,
          before,
          after: { ...f },
        });
        addSignal(
          draft,
          {
            signalType: "field_correction",
            description: `Reviewer confirmed field ${fieldId}`,
            confidenceImpact: 0.05,
          },
          ev.id,
        );
      }),
    );
  },

  editField: (caseId, fieldId, value) => {
    set(
      produce((s: Store) => {
        const draft = s.cases[caseId];
        const f = draft ? getFieldById(draft, fieldId) : undefined;
        if (!draft || !f) return;
        const before = { ...f };
        f.value = value;
        f.status = "edited";
        const ev = pushEvent(draft, {
          action: "edit_field",
          targetType: "field",
          targetId: fieldId,
          before,
          after: { ...f },
        });
        addSignal(
          draft,
          {
            signalType: "field_correction",
            description: `Value updated for ${fieldId} (session-only re-rank hint)`,
            confidenceImpact: 0.08,
          },
          ev.id,
        );
        get().applySessionConfidenceBump(caseId, fieldId);
      }),
    );
  },

  rejectField: (caseId, fieldId) => {
    set(
      produce((s: Store) => {
        const draft = s.cases[caseId];
        const f = draft ? getFieldById(draft, fieldId) : undefined;
        if (!draft || !f) return;
        const before = { ...f };
        f.status = "rejected";
        pushEvent(draft, {
          action: "reject_field",
          targetType: "field",
          targetId: fieldId,
          before,
          after: { ...f },
        });
      }),
    );
  },

  markFieldUncertain: (caseId, fieldId) => {
    set(
      produce((s: Store) => {
        const draft = s.cases[caseId];
        const f = draft ? getFieldById(draft, fieldId) : undefined;
        if (!draft || !f) return;
        const before = { ...f };
        f.status = "uncertain";
        pushEvent(draft, {
          action: "mark_field_uncertain",
          targetType: "field",
          targetId: fieldId,
          before,
          after: { ...f },
        });
      }),
    );
  },

  restoreField: (caseId, fieldId) => {
    set(
      produce((s: Store) => {
        const draft = s.cases[caseId];
        const f = draft ? getFieldById(draft, fieldId) : undefined;
        if (!draft || !f) return;
        const before = { ...f };
        f.value = f.originalValue;
        f.status = "unreviewed";
        pushEvent(draft, {
          action: "edit_field",
          targetType: "field",
          targetId: fieldId,
          note: "restore_original",
          before,
          after: { ...f },
        });
      }),
    );
  },

  addFieldNote: (caseId, fieldId, note) => {
    set(
      produce((s: Store) => {
        const draft = s.cases[caseId];
        const f = draft ? getFieldById(draft, fieldId) : undefined;
        if (!draft || !f) return;
        f.note = note;
        const ev = pushEvent(draft, {
          action: "add_note",
          targetType: "field",
          targetId: fieldId,
          note,
        });
        addSignal(
          draft,
          {
            signalType: "reviewer_note_pattern",
            description: `Note on ${fieldId}: ${note.slice(0, 120)}`,
          },
          ev.id,
        );
      }),
    );
  },

  confirmTag: (caseId, tagId) => {
    set(
      produce((s: Store) => {
        const draft = s.cases[caseId];
        const tag = draft?.tags.find((t) => t.id === tagId);
        if (!tag) return;
        const before = { ...tag };
        tag.status = "confirmed";
        pushEvent(draft, {
          action: "confirm_tag",
          targetType: "tag",
          targetId: tagId,
          before,
          after: { ...tag },
        });
      }),
    );
  },

  relabelTag: (caseId, tagId, newLabel) => {
    set(
      produce((s: Store) => {
        const draft = s.cases[caseId];
        const tag = draft?.tags.find((t) => t.id === tagId);
        if (!tag) return;
        const before = { ...tag };
        const oldLabel = tag.label;
        tag.label = newLabel;
        tag.status = "edited";
        const ev = pushEvent(draft, {
          action: "relabel_tag",
          targetType: "tag",
          targetId: tagId,
          before,
          after: { ...tag },
        });
        addSignal(
          draft,
          {
            signalType: "tag_relabel",
            description: `Tag label corrected from "${oldLabel}" -> "${newLabel}"`,
          },
          ev.id,
        );
      }),
    );
  },

  removeTag: (caseId, tagId) => {
    set(
      produce((s: Store) => {
        const draft = s.cases[caseId];
        if (!draft) return;
        const tag = draft.tags.find((t) => t.id === tagId);
        if (!tag) return;
        draft.tags = draft.tags.filter((t) => t.id !== tagId);
        pushEvent(draft, {
          action: "remove_tag",
          targetType: "tag",
          targetId: tagId,
          before: tag,
          after: null,
        });
      }),
    );
  },

  addTag: (caseId, partial) => {
    set(
      produce((s: Store) => {
        const draft = s.cases[caseId];
        if (!draft) return;
        const tag: TagEntity = {
          ...partial,
          id: generateId("tag"),
          status: "added",
        };
        draft.tags.push(tag);
        pushEvent(draft, {
          action: "add_tag",
          targetType: "tag",
          targetId: tag.id,
          after: tag,
        });
      }),
    );
  },

  markTagAmbiguous: (caseId, tagId, note) => {
    set(
      produce((s: Store) => {
        const draft = s.cases[caseId];
        const tag = draft?.tags.find((t) => t.id === tagId);
        if (!tag) return;
        tag.status = "uncertain";
        if (note) tag.note = note;
        pushEvent(draft, {
          action: "mark_tag_ambiguous",
          targetType: "tag",
          targetId: tagId,
          note,
        });
      }),
    );
  },

  updateTagNote: (caseId, tagId, note) => {
    set(
      produce((s: Store) => {
        const draft = s.cases[caseId];
        const tag = draft?.tags.find((t) => t.id === tagId);
        if (!tag) return;
        tag.note = note;
        pushEvent(draft, {
          action: "add_note",
          targetType: "tag",
          targetId: tagId,
          note,
        });
      }),
    );
  },

  resolveQuestion: (caseId, qId, option, rationale) => {
    set(
      produce((s: Store) => {
        const draft = s.cases[caseId];
        const q = draft?.questions.find((x) => x.id === qId);
        if (!q) return;
        const before = { ...q };
        q.status = "resolved";
        q.selectedOption = option;
        q.rationale = rationale;
        const ev = pushEvent(draft, {
          action: "resolve_question",
          targetType: "question",
          targetId: qId,
          before,
          after: { ...q },
        });

        // Simulated session learning from question resolution
        if (q.id.includes("doc_type") || q.prompt.toLowerCase().includes("document")) {
          addSignal(
            draft,
            {
              signalType: "document_type_pattern",
              description: `Document type resolution: ${option}`,
            },
            ev.id,
          );
          {
            const dt = draft.documentTypeField;
            dt.value = option.split("—")[0]!.trim();
            dt.status = "edited";
            dt.confidence = Math.min(0.95, dt.confidence + 0.12);
          }
        }
        if (q.prompt.toLowerCase().includes("date")) {
          addSignal(
            draft,
            {
              signalType: "date_resolution_pattern",
              description: `Date handling: ${option}`,
            },
            ev.id,
          );
        }
        if (q.prompt.toLowerCase().includes("previous balance")) {
          addSignal(
            draft,
            {
              signalType: "previous_balance_pattern",
              description: `Previous balance handling: ${option}`,
            },
            ev.id,
          );
        }
        if (q.prompt.toLowerCase().includes("line items")) {
          addSignal(
            draft,
            {
              signalType: "missing_service_line_items",
              description: `Line item expectation: ${option}`,
            },
            ev.id,
          );
        }

        draft.unresolvedCount = computeLiveUnresolvedCount(draft);
      }),
    );
  },

  skipQuestion: (caseId, qId) => {
    set(
      produce((s: Store) => {
        const draft = s.cases[caseId];
        if (!draft) return;
        const q = draft.questions.find((x) => x.id === qId);
        if (!q) return;
        q.status = "skipped";
        pushEvent(draft, {
          action: "resolve_question",
          targetType: "question",
          targetId: qId,
          note: "skipped",
          after: { ...q },
        });
        draft.unresolvedCount = computeLiveUnresolvedCount(draft);
      }),
    );
  },

  markQuestionUncertain: (caseId, qId) => {
    set(
      produce((s: Store) => {
        const draft = s.cases[caseId];
        if (!draft) return;
        const q = draft.questions.find((x) => x.id === qId);
        if (!q) return;
        q.status = "uncertain";
        pushEvent(draft, {
          action: "resolve_question",
          targetType: "question",
          targetId: qId,
          note: "uncertain",
          after: { ...q },
        });
        draft.unresolvedCount = computeLiveUnresolvedCount(draft);
      }),
    );
  },

  approveAllHighConfidence: (caseId) => {
    set(
      produce((s: Store) => {
        const draft = s.cases[caseId];
        if (!draft) return;
        for (const f of iterateAllFields(draft)) {
          if (f.status === "unreviewed" && f.confidence >= HIGH_CONF) {
            f.status = "confirmed";
          }
        }
        pushEvent(draft, {
          action: "approve_all_high_confidence",
          targetType: "document",
          targetId: caseId,
          note: `threshold ${HIGH_CONF}`,
        });
      }),
    );
  },

  resetCase: (caseId) => {
    const prev = get().cases[caseId];
    const templateId = prev?.metadata?.templateCaseId as string | undefined;
    let fresh: ClaimReviewCase | null = templateId ? getMockCaseById(templateId) : null;
    if (!fresh) {
      fresh = getMockCaseById(caseId) ?? BUILT_IN_CASES.find((c) => c.caseId === caseId) ?? null;
    }
    if (!fresh) return;
    set(
      produce((s: Store) => {
        const previous = s.cases[caseId];
        s.cases[caseId] = cloneCase(fresh!);
        const next = s.cases[caseId]!;
        if (previous?.metadata?.uploadSource && previous.imageUrl.startsWith("blob:")) {
          next.imageUrl = previous.imageUrl;
          next.imageName = previous.imageName;
          next.caseId = previous.caseId;
          next.title = previous.title;
          next.metadata = { ...next.metadata, uploadSource: true, templateCaseId: templateId };
          next.questions = [];
          next.unresolvedCount = computeLiveUnresolvedCount(next);
        }
        pushEvent(next, {
          action: "reset_changes",
          targetType: "document",
          targetId: caseId,
        });
      }),
    );
  },

  saveReview: (caseId) => {
    set(
      produce((s: Store) => {
        const draft = s.cases[caseId];
        if (!draft) return;
        draft.extractionStatus = "reviewed";
        pushEvent(draft, {
          action: "save_review",
          targetType: "document",
          targetId: caseId,
        });
        draft.unresolvedCount = computeLiveUnresolvedCount(draft);
      }),
    );
  },

  markTraining: (caseId, m) => {
    set(
      produce((s: Store) => {
        const draft = s.cases[caseId];
        if (!draft) return;
        draft.trainingUsefulness = m;
        pushEvent(draft, {
          action: "mark_training_usefulness",
          targetType: "document",
          targetId: caseId,
          after: m,
        });
      }),
    );
  },
}));

export function collectOpenIssues(c: ClaimReviewCase): Array<
  | { type: "question"; id: string; q: ReviewQuestion }
  | { type: "field"; id: string }
> {
  const out: Array<
    | { type: "question"; id: string; q: ReviewQuestion }
    | { type: "field"; id: string }
  > = [];
  for (const q of c.questions) {
    if (q.status === "open") out.push({ type: "question", id: q.id, q });
  }
  for (const f of iterateAllFields(c)) {
    if (f.status === "unreviewed" && isLowConfidenceField(f)) {
      out.push({ type: "field", id: f.id });
    }
  }
  return out;
}
