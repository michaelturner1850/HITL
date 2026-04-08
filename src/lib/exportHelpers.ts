import type { ClaimReviewCase, ReviewEvent } from "@/types/review";

/**
 * Builds exportable reviewed payload for downstream labeling / training systems.
 * Future: POST to feedback sink, Lens DB, batch export for weekly SME sessions.
 */

export function buildReviewedPayload(c: ClaimReviewCase) {
  return {
    caseId: c.caseId,
    title: c.title,
    documentType: c.documentType,
    documentTypeField: c.documentTypeField,
    recipients: c.recipients,
    extractionStatus: c.extractionStatus,
    extractionConfidence: c.extractionConfidence,
    trainingUsefulness: c.trainingUsefulness ?? "unmarked",
    tags: c.tags,
    lineItems: c.lineItems ?? [],
    evidenceBoxes: c.evidenceBoxes,
    questions: c.questions,
    reviewLog: c.reviewLog,
    sessionLearningSignals: c.sessionLearningSignals,
    metadata: c.metadata ?? {},
    exportedAt: new Date().toISOString(),
  };
}

export function downloadJsonFile(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportFeedbackLogOnly(events: ReviewEvent[], caseId: string) {
  return {
    caseId,
    events,
    exportedAt: new Date().toISOString(),
  };
}

/*
 * Optional persistence (disabled by default for v0 PoC).
 * TODO: enable localStorage hydration behind a feature flag if product wants resume.
 * if (import.meta.env.VITE_PERSIST_REVIEWS === 'true') { ... }
 */
