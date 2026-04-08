/**
 * Grouped extraction tree: Document type → Recipients → providers, dates (+tags), expense lines, total.
 * Leaf nodes remain ExtractedField with stable ids for evidence linking and review events.
 */

import type { ClaimReviewCase, ExtractedField } from "@/types/review";

export function getFieldById(c: ClaimReviewCase, fieldId: string): ExtractedField | undefined {
  if (c.documentTypeField.id === fieldId) return c.documentTypeField;
  for (const r of c.recipients) {
    for (const p of r.providers) {
      if (p.id === fieldId) return p;
    }
    for (const row of r.dates) {
      if (row.date.id === fieldId) return row.date;
      if (row.tag.id === fieldId) return row.tag;
    }
    for (const line of r.expenseLines) {
      if (line.description.id === fieldId) return line.description;
      if (line.amount.id === fieldId) return line.amount;
    }
    if (r.totalAmount.id === fieldId) return r.totalAmount;
  }
  return undefined;
}

export function* iterateAllFields(c: ClaimReviewCase): Generator<ExtractedField> {
  yield c.documentTypeField;
  for (const r of c.recipients) {
    for (const p of r.providers) yield p;
    for (const row of r.dates) {
      yield row.date;
      yield row.tag;
    }
    for (const line of r.expenseLines) {
      yield line.description;
      yield line.amount;
    }
    yield r.totalAmount;
  }
}

export function listAllFields(c: ClaimReviewCase): ExtractedField[] {
  return [...iterateAllFields(c)];
}
