/**
 * Mock extraction — no OCR, no backend, no external calls.
 *
 * Future evolution:
 * - Accept `{ images: Blob[], extractionJson?: unknown, docId?: string }` from processor workflow.
 * - Map OCR span coordinates into normalized bboxes (same BBox type).
 * - Multi-image payloads: evidenceBoxes gain `page` index; viewer becomes carousel.
 * - Replace template pick with real model output + confidence from serving stack.
 */

import { BUILT_IN_CASES, type SampleCaseCardMeta } from "@/data/sampleCases";
import { computeLiveUnresolvedCount } from "@/lib/reviewHelpers";
import { generateId } from "@/lib/utils";
import type { ClaimReviewCase } from "@/types/review";

function deepCloneCase<T>(c: T): T {
  return structuredClone(c) as T;
}

export function listSampleCaseCards(): SampleCaseCardMeta[] {
  return BUILT_IN_CASES.map((c) => ({
    caseId: c.caseId,
    title: c.title,
    description: c.description,
    documentType: c.documentType,
    whyInteresting: c.metadata?.whyInteresting as string,
  }));
}

export function getMockCaseById(caseId: string): ClaimReviewCase | null {
  const found = BUILT_IN_CASES.find((c) => c.caseId === caseId);
  return found ? deepCloneCase(found) : null;
}

/** Deterministic template index from file name for repeatable demos. */
function templateIndexFromFileName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i) * (i + 1)) % 997;
  return h % BUILT_IN_CASES.length;
}

/**
 * Uploaded images: show preview URL, clone a built-in template for realistic mock JSON.
 * Plug real extraction here when payload includes model output.
 */
export function createCaseFromUpload(file: File): ClaimReviewCase {
  const idx = templateIndexFromFileName(file.name);
  const template = BUILT_IN_CASES[idx]!;
  const clone = deepCloneCase(template);
  const newId = generateId("upload");
  const objectUrl = URL.createObjectURL(file);

  clone.caseId = newId;
  clone.imageUrl = objectUrl;
  clone.imageName = file.name;
  clone.title = `Uploaded: ${file.name}`;
  clone.description =
    "Mock extraction cloned from an internal template for demo. Replace with real extraction JSON at ingestion boundary.";
  clone.extractionStatus = "mocked";
  clone.metadata = {
    ...clone.metadata,
    uploadSource: true,
    templateCaseId: template.caseId,
  };

  // Upload flow: no SME question queue — reviewer focuses on fields/tags on the image.
  clone.questions = [];
  clone.unresolvedCount = computeLiveUnresolvedCount(clone);

  return clone;
}
