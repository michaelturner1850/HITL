import { getFieldById, iterateAllFields, listAllFields } from "@/lib/fieldTree";
import type {
  ClaimReviewCase,
  EvidenceBox,
  ExtractedField,
  ReviewQuestion,
  ReviewStatus,
  TagEntity,
} from "@/types/review";

const LOW_CONF_THRESHOLD = 0.75;

export function isLowConfidenceField(f: ExtractedField): boolean {
  return f.confidence < LOW_CONF_THRESHOLD;
}

export function countUnresolvedQuestions(questions: ReviewQuestion[]): number {
  return questions.filter((q) => q.status === "open").length;
}

/** Live unresolved count: open questions + unreviewed low-confidence fields. */
export function computeLiveUnresolvedCount(c: ClaimReviewCase): number {
  const openQ = countUnresolvedQuestions(c.questions);
  const riskyFields = listAllFields(c).filter(
    (f) => f.status === "unreviewed" && isLowConfidenceField(f),
  ).length;
  return openQ + riskyFields;
}

export function getEvidenceForField(
  c: ClaimReviewCase,
  fieldId: string,
): EvidenceBox | undefined {
  const field = getFieldById(c, fieldId);
  const firstId = field?.evidenceBoxIds?.[0];
  if (!firstId) return undefined;
  return c.evidenceBoxes.find((e) => e.id === firstId);
}

export function getEvidenceById(
  c: ClaimReviewCase,
  id: string,
): EvidenceBox | undefined {
  return c.evidenceBoxes.find((e) => e.id === id);
}

export function fieldSummaryCounts(c: ClaimReviewCase) {
  const list = listAllFields(c);
  return {
    confirmed: list.filter((f) => f.status === "confirmed").length,
    edited: list.filter((f) => f.status === "edited").length,
    rejected: list.filter((f) => f.status === "rejected").length,
    uncertain: list.filter((f) => f.status === "uncertain").length,
    added: list.filter((f) => f.status === "added").length,
    unreviewed: list.filter((f) => f.status === "unreviewed").length,
  };
}

export function tagChangedCount(tags: TagEntity[]): number {
  return tags.filter(
    (t) =>
      t.status === "edited" ||
      t.status === "rejected" ||
      t.status === "added" ||
      t.status === "uncertain",
  ).length;
}

export function reviewerNotesCount(c: ClaimReviewCase): number {
  let n = 0;
  for (const f of iterateAllFields(c)) {
    if (f.note?.trim()) n += 1;
  }
  n += c.tags.filter((t) => t.note?.trim()).length;
  return n;
}

/** Overlay ring color by review status / role. */
export function statusToOverlayClass(status: ReviewStatus): string {
  switch (status) {
    case "confirmed":
      return "border-emerald-500/90 bg-emerald-500/15 ring-2 ring-emerald-500/50";
    case "edited":
    case "added":
      return "border-sky-500/90 bg-sky-500/15 ring-2 ring-sky-500/40";
    case "rejected":
      return "border-red-500/90 bg-red-500/15 ring-2 ring-red-500/50";
    case "uncertain":
      return "border-amber-500/90 bg-amber-500/20 ring-2 ring-amber-500/50";
    case "unreviewed":
    default:
      return "border-amber-500/70 bg-amber-500/10 ring-1 ring-amber-400/40";
  }
}

export function sourceHintClass(source: ExtractedField["source"]): string {
  switch (source) {
    case "inferred":
      return "border-blue-500/80 bg-blue-500/10";
    case "missing":
    case "reviewer_added":
      return "border-neutral-400/80 bg-neutral-500/10";
    default:
      return "";
  }
}
