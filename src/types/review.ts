/**
 * HITL claims document review — core domain types.
 * Future: swap mocked extraction for image + JSON payloads, OCR spans, multi-page docs.
 */

export type ReviewStatus =
  | "unreviewed"
  | "confirmed"
  | "edited"
  | "rejected"
  | "uncertain"
  | "added";

export type FieldSource =
  | "direct_extraction"
  | "inferred"
  | "missing"
  | "reviewer_added";

export type Severity = "low" | "medium" | "high";

export type BBox = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type EvidenceBox = {
  id: string;
  label: string;
  bbox: BBox;
  page?: number;
  sourceText?: string;
  relatedFieldIds?: string[];
  relatedTagIds?: string[];
  confidence?: number;
};

export type LineItem = {
  id: string;
  description: string;
  amount: number | null;
  confidence: number;
  evidenceBoxId?: string;
};

export type ExtractedField = {
  id: string;
  label: string;
  value: string | number | boolean | null;
  originalValue: string | number | boolean | null;
  confidence: number;
  status: ReviewStatus;
  source: FieldSource;
  candidateValues?: Array<string | number | boolean | null>;
  evidenceBoxIds?: string[];
  note?: string;
  /** `key` = shown first in category; `detail` = behind “Additional fields” until expanded. */
  displayTier?: "key" | "detail";
};

/** One date row: extracted date + its role/tag (e.g. payment_date vs statement_date). */
export type DateTagRow = {
  id: string;
  date: ExtractedField;
  tag: ExtractedField;
};

/** Expense line: description and amount as separate reviewable fields. */
export type ExpenseLineFields = {
  id: string;
  description: ExtractedField;
  amount: ExtractedField;
};

/**
 * All extraction for one named party on the document (repeat per recipient).
 * Mirrors SME-friendly grouping: Provider(s) → Dates → Line items → Total.
 */
export type RecipientSection = {
  id: string;
  /** e.g. "Recipient 1: Jane Rivera" */
  heading: string;
  providers: ExtractedField[];
  dates: DateTagRow[];
  expenseLines: ExpenseLineFields[];
  totalAmount: ExtractedField;
};

export type TagEntity = {
  id: string;
  label: string;
  text: string;
  confidence: number;
  bboxId?: string;
  status: ReviewStatus;
  note?: string;
};

export type ReviewQuestion = {
  id: string;
  title: string;
  prompt: string;
  severity: Severity;
  targetType: "field" | "tag" | "document";
  targetId: string;
  bboxId?: string;
  options: string[];
  selectedOption?: string;
  status: "open" | "resolved" | "skipped" | "uncertain";
  rationale?: string;
};

export type ReviewEvent = {
  id: string;
  timestamp: string;
  action:
    | "confirm_field"
    | "edit_field"
    | "reject_field"
    | "mark_field_uncertain"
    | "confirm_tag"
    | "relabel_tag"
    | "remove_tag"
    | "add_tag"
    | "mark_tag_ambiguous"
    | "resolve_question"
    | "add_note"
    | "approve_all_high_confidence"
    | "mark_training_usefulness"
    | "reset_changes"
    | "save_review";
  targetType: "field" | "tag" | "question" | "document";
  targetId: string;
  before?: unknown;
  after?: unknown;
  note?: string;
};

export type SessionLearningSignal = {
  id: string;
  signalType:
    | "field_correction"
    | "tag_relabel"
    | "document_type_pattern"
    | "date_resolution_pattern"
    | "previous_balance_pattern"
    | "missing_service_line_items"
    | "reviewer_note_pattern";
  description: string;
  createdFromEventId: string;
  confidenceImpact?: number;
};

export type ClaimReviewCase = {
  caseId: string;
  title: string;
  description: string;
  imageUrl: string;
  imageName: string;
  /** Short label for cards/header (may mirror documentTypeField). */
  documentType: string;
  extractionStatus: "mocked" | "reviewed";
  extractionConfidence: number;
  unresolvedCount: number;
  /** Top-level document classification (receipt / payment summary / …). */
  documentTypeField: ExtractedField;
  /** One section per person / party paid for or billed. */
  recipients: RecipientSection[];
  tags: TagEntity[];
  evidenceBoxes: EvidenceBox[];
  questions: ReviewQuestion[];
  reviewLog: ReviewEvent[];
  sessionLearningSignals: SessionLearningSignal[];
  /** @deprecated Prefer recipients[].expenseLines — kept for export compatibility if needed */
  lineItems?: LineItem[];
  trainingUsefulness?: "good_example" | "poor_quality" | "unmarked";
  metadata?: Record<string, unknown>;
};

export type SelectionState =
  | { kind: "field"; id: string }
  | { kind: "tag"; id: string }
  | { kind: "question"; id: string }
  | { kind: "evidence"; id: string }
  | null;
