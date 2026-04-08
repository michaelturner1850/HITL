/**
 * Built-in demos — grouped extraction tree (document type → recipients → providers, dates, expenses, total).
 * Fewer leaf fields than flat v0; same review + overlay mechanics via stable field ids.
 */

import type {
  ClaimReviewCase,
  EvidenceBox,
  ExtractedField,
  FieldSource,
  RecipientSection,
} from "@/types/review";

export type SampleCaseCardMeta = {
  caseId: string;
  title: string;
  description: string;
  documentType: string;
  whyInteresting?: string;
};

function fld(
  id: string,
  label: string,
  value: string | number | boolean | null,
  confidence: number,
  source: FieldSource,
  extra?: Partial<ExtractedField>,
): ExtractedField {
  return {
    id,
    label,
    value,
    originalValue: value,
    confidence,
    status: "unreviewed",
    source,
    ...extra,
  };
}

function recipientSection(
  id: string,
  heading: string,
  partial: Omit<RecipientSection, "id" | "heading">,
): RecipientSection {
  return { id, heading, ...partial };
}

/* ——— Mount Sinai ——— */

const msRecipient = recipientSection("rec_ms", "Recipient 1: Eleanor J. Vance", {
  providers: [
    fld("rec_ms_p0", "Provider name", "Mount Sinai Health System", 0.68, "inferred", {
      evidenceBoxIds: ["ev_logo_provider"],
      candidateValues: ["Mount Sinai Health System", "Central Billing Office"],
    }),
  ],
  dates: [
    {
      id: "rec_ms_d0",
      date: fld("rec_ms_d0_date", "Date (visible)", "2026-05-21", 0.72, "direct_extraction", {
        evidenceBoxIds: ["ev_date"],
        candidateValues: ["2026-05-21"],
      }),
      tag: fld("rec_ms_d0_tag", "Date role / tag", "payment_date (inferred)", 0.58, "inferred", {
        evidenceBoxIds: ["ev_date"],
        candidateValues: ["statement_date", "payment_date", "not_date_of_service"],
        displayTier: "detail",
      }),
    },
  ],
  expenseLines: [
    {
      id: "rec_ms_e0",
      description: fld("rec_ms_e0_desc", "Expense description", "Previous balance / payment on account", 0.82, "inferred", {
        evidenceBoxIds: ["ev_previous_balance_section"],
      }),
      amount: fld("rec_ms_e0_amt", "Line amount", 98.6, 0.85, "direct_extraction", {
        evidenceBoxIds: ["ev_previous_balance_section", "ev_payment_methods_section"],
        candidateValues: [98.6],
        displayTier: "detail",
      }),
    },
  ],
  totalAmount: fld("rec_ms_total", "Total for this recipient", 98.6, 0.82, "direct_extraction", {
    evidenceBoxIds: ["ev_payment_methods_section"],
  }),
});

const mountSinaiEvidence: EvidenceBox[] = [
  {
    id: "ev_date",
    label: "Visible date",
    bbox: { x: 6, y: 5, w: 22, h: 4 },
    relatedFieldIds: ["rec_ms_d0_date", "rec_ms_d0_tag"],
    confidence: 0.72,
  },
  {
    id: "ev_department",
    label: "Department",
    bbox: { x: 49, y: 5, w: 36, h: 6 },
    relatedFieldIds: [],
    confidence: 0.91,
  },
  {
    id: "ev_guarantor_name",
    label: "Guarantor",
    bbox: { x: 6, y: 9, w: 38, h: 4 },
    relatedFieldIds: [],
    confidence: 0.88,
  },
  {
    id: "ev_patient_name",
    label: "Patient",
    bbox: { x: 6, y: 14, w: 38, h: 4 },
    relatedFieldIds: [],
    confidence: 0.86,
  },
  {
    id: "ev_previous_balance_section",
    label: "Previous balance",
    bbox: { x: 9, y: 29, w: 81, h: 8 },
    relatedFieldIds: ["rec_ms_e0_desc", "rec_ms_e0_amt"],
    confidence: 0.84,
  },
  {
    id: "ev_payment_methods_section",
    label: "Payment",
    bbox: { x: 9, y: 40, w: 81, h: 10 },
    relatedFieldIds: ["rec_ms_total", "rec_ms_e0_amt"],
    confidence: 0.81,
  },
  {
    id: "ev_logo_provider",
    label: "Branding",
    bbox: { x: 10, y: 79, w: 22, h: 11 },
    relatedFieldIds: ["rec_ms_p0"],
    confidence: 0.68,
  },
];

const caseMountSinai: ClaimReviewCase = {
  caseId: "sample-mount-sinai-payment",
  title: "Mount Sinai Payment Summary",
  description: "Prior-balance style payment summary — ambiguous doc type and date roles.",
  imageUrl: "/samples/mount-sinai-payment.svg",
  imageName: "mount-sinai-payment.svg",
  documentType: "payment_summary (candidate)",
  extractionStatus: "mocked",
  extractionConfidence: 0.71,
  unresolvedCount: 4,
  documentTypeField: fld("doc_type", "Document type", "payment_summary", 0.55, "inferred", {
    candidateValues: ["payment_summary", "statement", "receipt"],
    evidenceBoxIds: ["ev_previous_balance_section"],
  }),
  recipients: [msRecipient],
  tags: [
    { id: "tg_ms_1", label: "provider", text: "Mount Sinai Health System", confidence: 0.68, bboxId: "ev_logo_provider", status: "unreviewed" },
    { id: "tg_ms_2", label: "payment_date", text: "2026-05-21", confidence: 0.72, bboxId: "ev_date", status: "unreviewed" },
    { id: "tg_ms_3", label: "previous_balance", text: "$98.60", confidence: 0.84, bboxId: "ev_previous_balance_section", status: "unreviewed" },
  ],
  evidenceBoxes: mountSinaiEvidence,
  questions: [
    {
      id: "q_ms_doc_type",
      title: "Document type",
      prompt:
        "This document looks like a payment summary or prior balance statement. How should it be classified?",
      severity: "high",
      targetType: "field",
      targetId: "doc_type",
      bboxId: "ev_previous_balance_section",
      options: ["payment_summary", "statement", "receipt", "Treat as non-service proof of payment only"],
      status: "open",
    },
    {
      id: "q_ms_date_usage",
      title: "Date interpretation",
      prompt:
        "The visible date may be statement date, payment date, or unrelated to date of service. How should it be used?",
      severity: "high",
      targetType: "field",
      targetId: "rec_ms_d0_date",
      bboxId: "ev_date",
      options: [
        "Map to statement_date only",
        "Map to payment_date only",
        "Do not use as date_of_service",
        "Needs SME — document context insufficient",
      ],
      status: "open",
    },
    {
      id: "q_ms_prev_balance",
      title: "Previous balance handling",
      prompt: "Previous balance was detected. Should this be flagged separately from current claim charges?",
      severity: "medium",
      targetType: "field",
      targetId: "rec_ms_e0_amt",
      bboxId: "ev_previous_balance_section",
      options: [
        "Flag as separate prior_balance line",
        "Link to same claim with annotation",
        "Ignore for service eligibility",
        "Needs SME",
      ],
      status: "open",
    },
    {
      id: "q_ms_no_lines",
      title: "Service line items",
      prompt: "No service line items are visible. Confirm this is not a standard itemized service receipt.",
      severity: "medium",
      targetType: "document",
      targetId: "sample-mount-sinai-payment",
      options: [
        "Proof of payment only — no line items expected",
        "Expect line items elsewhere in packet",
        "Escalate — possible incomplete scan",
        "Uncertain",
      ],
      status: "open",
    },
  ],
  reviewLog: [],
  sessionLearningSignals: [],
  metadata: {
    whyInteresting:
      "Payment vs statement ambiguity; previous balance; grouped fields per recipient.",
  },
};

/* ——— Pharmacy ——— */

const evPh = (id: string, label: string, bbox: EvidenceBox["bbox"], fids: string[]): EvidenceBox => ({
  id,
  label,
  bbox,
  relatedFieldIds: fids,
  confidence: 0.9,
});

const casePharmacy: ClaimReviewCase = {
  caseId: "sample-pharmacy",
  title: "CityCare Pharmacy Receipt",
  description: "Straightforward retail pharmacy slip.",
  imageUrl: "/samples/pharmacy.svg",
  imageName: "pharmacy.svg",
  documentType: "pharmacy_receipt",
  extractionStatus: "mocked",
  extractionConfidence: 0.92,
  unresolvedCount: 0,
  documentTypeField: fld("doc_type", "Document type", "pharmacy_receipt", 0.92, "direct_extraction", {
    evidenceBoxIds: ["ph_store"],
  }),
  recipients: [
    recipientSection("rec_ph", "Recipient 1: Jane M. Rivera", {
      providers: [
        fld("rec_ph_p0", "Provider name", "CityCare Pharmacy", 0.94, "direct_extraction", { evidenceBoxIds: ["ph_store"] }),
      ],
      dates: [
        {
          id: "rec_ph_d0",
          date: fld("rec_ph_d0_date", "Date", "2026-03-12", 0.9, "direct_extraction", { evidenceBoxIds: ["ph_date"] }),
          tag: fld("rec_ph_d0_tag", "Date tag", "date_of_service", 0.85, "inferred", {
            evidenceBoxIds: ["ph_date"],
            displayTier: "detail",
          }),
        },
      ],
      expenseLines: [
        {
          id: "rec_ph_e0",
          description: fld("rec_ph_e0_desc", "Item description", "Amoxicillin 500mg", 0.9, "direct_extraction", {
            evidenceBoxIds: ["ph_rx"],
          }),
          amount: fld("rec_ph_e0_amt", "Line amount", 12.49, 0.93, "direct_extraction", {
            evidenceBoxIds: ["ph_total"],
            displayTier: "detail",
          }),
        },
      ],
      totalAmount: fld("rec_ph_total", "Total for this recipient", 12.49, 0.93, "direct_extraction", {
        evidenceBoxIds: ["ph_total"],
      }),
    }),
  ],
  tags: [
    { id: "t1", label: "patient", text: "Jane M. Rivera", confidence: 0.91, bboxId: "ph_rx", status: "unreviewed" },
    { id: "t2", label: "amount", text: "$12.49", confidence: 0.93, bboxId: "ph_total", status: "unreviewed" },
  ],
  evidenceBoxes: [
    evPh("ph_store", "Store", { x: 8, y: 8, w: 40, h: 8 }, ["rec_ph_p0"]),
    evPh("ph_rx", "Rx line", { x: 8, y: 18, w: 70, h: 10 }, ["rec_ph_e0_desc"]),
    evPh("ph_date", "Date", { x: 8, y: 26, w: 35, h: 6 }, ["rec_ph_d0_date", "rec_ph_d0_tag"]),
    evPh("ph_total", "Total", { x: 8, y: 36, w: 50, h: 10 }, ["rec_ph_e0_amt", "rec_ph_total"]),
  ],
  questions: [],
  reviewLog: [],
  sessionLearningSignals: [],
  metadata: { whyInteresting: "Baseline happy path with clear grouping." },
};

/* ——— Dental ——— */

const caseDental: ClaimReviewCase = {
  caseId: "sample-dental-dates",
  title: "BrightSmile Dental — Multi-date",
  description: "Multiple dates on one receipt — grouped under one recipient.",
  imageUrl: "/samples/dental.svg",
  imageName: "dental.svg",
  documentType: "dental_receipt",
  extractionStatus: "mocked",
  extractionConfidence: 0.74,
  unresolvedCount: 1,
  documentTypeField: fld("doc_type", "Document type", "dental_summary", 0.86, "direct_extraction", {
    evidenceBoxIds: ["dn_head"],
  }),
  recipients: [
    recipientSection("rec_dn", "Recipient 1: Alex Chen", {
      providers: [fld("rec_dn_p0", "Provider name", "BrightSmile Dental", 0.92, "direct_extraction", { evidenceBoxIds: ["dn_head"] })],
      dates: [
        {
          id: "rec_dn_d0",
          date: fld("rec_dn_d0_date", "Date", "2026-02-28", 0.88, "direct_extraction", { evidenceBoxIds: ["dn_dos"] }),
          tag: fld("rec_dn_d0_tag", "Date tag", "date_of_service", 0.88, "direct_extraction", { displayTier: "detail" }),
        },
        {
          id: "rec_dn_d1",
          date: fld("rec_dn_d1_date", "Date", "2026-03-01", 0.7, "direct_extraction", {
            evidenceBoxIds: ["dn_pay"],
            displayTier: "detail",
          }),
          tag: fld("rec_dn_d1_tag", "Date tag", "payment_date", 0.65, "inferred", { displayTier: "detail" }),
        },
        {
          id: "rec_dn_d2",
          date: fld("rec_dn_d2_date", "Date", "2026-03-02", 0.65, "direct_extraction", {
            evidenceBoxIds: ["dn_stmt"],
            displayTier: "detail",
          }),
          tag: fld("rec_dn_d2_tag", "Date tag", "statement_date", 0.55, "inferred", { displayTier: "detail" }),
        },
      ],
      expenseLines: [
        {
          id: "rec_dn_e0",
          description: fld("rec_dn_e0_desc", "Expense description", "Prophy + bitewing X-ray", 0.88, "direct_extraction", {
            evidenceBoxIds: ["dn_amt"],
          }),
          amount: fld("rec_dn_e0_amt", "Line amount", 185, 0.9, "direct_extraction", {
            evidenceBoxIds: ["dn_amt"],
            displayTier: "detail",
          }),
        },
      ],
      totalAmount: fld("rec_dn_total", "Total for this recipient", 185, 0.9, "direct_extraction", { evidenceBoxIds: ["dn_amt"] }),
    }),
  ],
  tags: [],
  evidenceBoxes: [
    evPh("dn_head", "Header", { x: 6, y: 6, w: 88, h: 8 }, ["rec_dn_p0"]),
    evPh("dn_dos", "DOS", { x: 6, y: 14, w: 40, h: 6 }, ["rec_dn_d0_date"]),
    evPh("dn_pay", "Pay date", { x: 50, y: 14, w: 40, h: 6 }, ["rec_dn_d1_date"]),
    evPh("dn_stmt", "Stmt date", { x: 6, y: 20, w: 50, h: 6 }, ["rec_dn_d2_date"]),
    evPh("dn_amt", "Amount", { x: 6, y: 42, w: 45, h: 8 }, ["rec_dn_e0_amt", "rec_dn_total"]),
  ],
  questions: [
    {
      id: "q_dn_dates",
      title: "Multiple dates",
      prompt: "Three different dates appear. Which should drive claim timeliness vs billing?",
      severity: "high",
      targetType: "document",
      targetId: "sample-dental-dates",
      options: ["Use DOS for clinical, payment for ledger", "Use statement date as authoritative", "Needs SME triage", "Skip for now"],
      status: "open",
    },
  ],
  reviewLog: [],
  sessionLearningSignals: [],
  metadata: { whyInteresting: "Several dates — still one recipient block." },
};

/* ——— OTC ——— */

const caseOtc: ClaimReviewCase = {
  caseId: "sample-otc-no-recipient",
  title: "QuickMart OTC — No named recipient",
  description: "OTC slip — recipient inferred as unknown.",
  imageUrl: "/samples/otc.svg",
  imageName: "otc.svg",
  documentType: "otc_receipt",
  extractionStatus: "mocked",
  extractionConfidence: 0.61,
  unresolvedCount: 1,
  documentTypeField: fld("doc_type", "Document type", "retail_receipt", 0.85, "direct_extraction", { evidenceBoxIds: ["ot_head"] }),
  recipients: [
    recipientSection("rec_ot", "Recipient 1: (not printed on slip)", {
      providers: [fld("rec_ot_p0", "Provider name", "QuickMart #8841", 0.93, "direct_extraction", { evidenceBoxIds: ["ot_head"] })],
      dates: [
        {
          id: "rec_ot_d0",
          date: fld("rec_ot_d0_date", "Date", "2026-04-01", 0.72, "direct_extraction", { evidenceBoxIds: ["ot_date"] }),
          tag: fld("rec_ot_d0_tag", "Date tag", "payment_date", 0.55, "inferred", {
            evidenceBoxIds: ["ot_date"],
            displayTier: "detail",
          }),
        },
      ],
      expenseLines: [
        {
          id: "rec_ot_e0",
          description: fld("rec_ot_e0_desc", "Expense description", "OTC items (Cetirizine, electrolyte mix)", 0.85, "inferred", {
            evidenceBoxIds: ["ot_items"],
          }),
          amount: fld("rec_ot_e0_amt", "Line amount", 24.18, 0.9, "direct_extraction", {
            evidenceBoxIds: ["ot_tot"],
            displayTier: "detail",
          }),
        },
      ],
      totalAmount: fld("rec_ot_total", "Total for this recipient", 24.18, 0.9, "direct_extraction", { evidenceBoxIds: ["ot_tot"] }),
    }),
  ],
  tags: [],
  evidenceBoxes: [
    evPh("ot_head", "Store", { x: 8, y: 10, w: 55, h: 8 }, ["rec_ot_p0"]),
    evPh("ot_date", "Timestamp", { x: 8, y: 28, w: 40, h: 8 }, ["rec_ot_d0_date"]),
    evPh("ot_items", "Items", { x: 8, y: 40, w: 80, h: 14 }, ["rec_ot_e0_desc"]),
    evPh("ot_tot", "Totals", { x: 8, y: 52, w: 55, h: 10 }, ["rec_ot_e0_amt", "rec_ot_total"]),
  ],
  questions: [
    {
      id: "q_otc_recipient",
      title: "Missing recipient",
      prompt: "No patient or guarantor is printed. How should this receipt be associated?",
      severity: "high",
      targetType: "field",
      targetId: "rec_ot_total",
      options: ["Attach to claim context only", "Reject for HSA without named recipient", "Needs SME", "Skip"],
      status: "open",
    },
  ],
  reviewLog: [],
  sessionLearningSignals: [],
  metadata: { whyInteresting: "Missing named party on grouped recipient row." },
};

/* ——— Medical multiline ——— */

const caseMedical: ClaimReviewCase = {
  caseId: "sample-medical-multiline",
  title: "Regional Health — Itemized services",
  description: "Several line items under one recipient.",
  imageUrl: "/samples/medical-multiline.svg",
  imageName: "medical-multiline.svg",
  documentType: "medical_itemized",
  extractionStatus: "mocked",
  extractionConfidence: 0.83,
  unresolvedCount: 1,
  documentTypeField: fld("doc_type", "Document type", "itemized_receipt", 0.9, "direct_extraction", { evidenceBoxIds: ["mh_head"] }),
  recipients: [
    recipientSection("rec_mh", "Recipient 1: Maria Santos", {
      providers: [
        fld("rec_mh_p0", "Provider name", "Regional Health Clinic", 0.93, "direct_extraction", { evidenceBoxIds: ["mh_head"] }),
      ],
      dates: [
        {
          id: "rec_mh_d0",
          date: fld("rec_mh_d0_date", "Date", "2026-03-15", 0.9, "direct_extraction", { evidenceBoxIds: ["mh_pt"] }),
          tag: fld("rec_mh_d0_tag", "Date tag", "date_of_service", 0.88, "direct_extraction", { displayTier: "detail" }),
        },
      ],
      expenseLines: [
        {
          id: "rec_mh_e0",
          description: fld("rec_mh_e0_desc", "Item description", "99213 Office visit", 0.88, "direct_extraction", { evidenceBoxIds: ["mh_l1"] }),
          amount: fld("rec_mh_e0_amt", "Line amount", 140, 0.88, "direct_extraction", {
            evidenceBoxIds: ["mh_l1"],
            displayTier: "detail",
          }),
        },
        {
          id: "rec_mh_e1",
          description: fld("rec_mh_e1_desc", "Item description", "80053 Lab panel", 0.85, "direct_extraction", {
            evidenceBoxIds: ["mh_l2"],
            displayTier: "detail",
          }),
          amount: fld("rec_mh_e1_amt", "Line amount", 210, 0.85, "direct_extraction", {
            evidenceBoxIds: ["mh_l2"],
            displayTier: "detail",
          }),
        },
        {
          id: "rec_mh_e2",
          description: fld("rec_mh_e2_desc", "Item description", "73030 X-ray", 0.84, "direct_extraction", {
            evidenceBoxIds: ["mh_l3"],
            displayTier: "detail",
          }),
          amount: fld("rec_mh_e2_amt", "Line amount", 95, 0.84, "direct_extraction", {
            evidenceBoxIds: ["mh_l3"],
            displayTier: "detail",
          }),
        },
      ],
      totalAmount: fld("rec_mh_total", "Total for this recipient", 445, 0.91, "direct_extraction", { evidenceBoxIds: ["mh_tot"] }),
    }),
  ],
  tags: [],
  evidenceBoxes: [
    evPh("mh_head", "Header", { x: 6, y: 6, w: 88, h: 8 }, ["rec_mh_p0"]),
    evPh("mh_pt", "Patient row", { x: 6, y: 14, w: 80, h: 8 }, ["rec_mh_d0_date"]),
    evPh("mh_l1", "Line 1", { x: 6, y: 22, w: 88, h: 8 }, ["rec_mh_e0_desc", "rec_mh_e0_amt"]),
    evPh("mh_l2", "Line 2", { x: 6, y: 28, w: 88, h: 8 }, ["rec_mh_e1_desc", "rec_mh_e1_amt"]),
    evPh("mh_l3", "Line 3", { x: 6, y: 34, w: 88, h: 8 }, ["rec_mh_e2_desc", "rec_mh_e2_amt"]),
    evPh("mh_tot", "Total", { x: 6, y: 42, w: 55, h: 10 }, ["rec_mh_total"]),
  ],
  questions: [
    {
      id: "q_med_elig",
      title: "Line eligibility",
      prompt: "Multiple procedures on one receipt. Should eligibility be evaluated per line?",
      severity: "medium",
      targetType: "document",
      targetId: "sample-medical-multiline",
      options: ["Yes — split signals per line_item tag", "Use header-level only", "Needs SME", "Skip"],
      status: "open",
    },
  ],
  reviewLog: [],
  sessionLearningSignals: [],
  metadata: { whyInteresting: "Multiple expense lines with description + amount pairs." },
};

/* ——— Vision ——— */

const caseVision: ClaimReviewCase = {
  caseId: "sample-vision-optics",
  title: "LensCraft — Vision receipt",
  description: "Ambiguous lens / eligibility cues.",
  imageUrl: "/samples/vision-optics.svg",
  imageName: "vision-optics.svg",
  documentType: "vision_receipt",
  extractionStatus: "mocked",
  extractionConfidence: 0.66,
  unresolvedCount: 1,
  documentTypeField: fld("doc_type", "Document type", "optical_sales", 0.84, "direct_extraction", { evidenceBoxIds: ["vs_head"] }),
  recipients: [
    recipientSection("rec_vs", "Recipient 1: Jordan Lee", {
      providers: [fld("rec_vs_p0", "Provider name", "LensCraft Optics", 0.92, "direct_extraction", { evidenceBoxIds: ["vs_head"] })],
      dates: [
        {
          id: "rec_vs_d0",
          date: fld("rec_vs_d0_date", "Date", "2026-03-22", 0.86, "direct_extraction", { evidenceBoxIds: ["vs_pt"] }),
          tag: fld("rec_vs_d0_tag", "Date tag", "date_of_service", 0.78, "inferred", { displayTier: "detail" }),
        },
      ],
      expenseLines: [
        {
          id: "rec_vs_e0",
          description: fld("rec_vs_e0_desc", "Item description", "Single vision poly lenses (+ polarized?)", 0.72, "inferred", {
            evidenceBoxIds: ["vs_items"],
          }),
          amount: fld("rec_vs_e0_amt", "Line amount", 220, 0.72, "direct_extraction", {
            evidenceBoxIds: ["vs_items"],
            displayTier: "detail",
          }),
        },
        {
          id: "rec_vs_e1",
          description: fld("rec_vs_e1_desc", "Item description", "Frame SKU V-220", 0.68, "direct_extraction", {
            evidenceBoxIds: ["vs_items"],
            displayTier: "detail",
          }),
          amount: fld("rec_vs_e1_amt", "Line amount", 92, 0.68, "direct_extraction", {
            evidenceBoxIds: ["vs_items"],
            displayTier: "detail",
          }),
        },
      ],
      totalAmount: fld("rec_vs_total", "Total for this recipient", 312, 0.88, "direct_extraction", { evidenceBoxIds: ["vs_tot"] }),
    }),
  ],
  tags: [],
  evidenceBoxes: [
    evPh("vs_head", "Header", { x: 6, y: 8, w: 88, h: 8 }, ["rec_vs_p0"]),
    evPh("vs_pt", "Patient", { x: 6, y: 16, w: 75, h: 8 }, ["rec_vs_d0_date"]),
    evPh("vs_items", "Lens line", { x: 6, y: 26, w: 88, h: 14 }, ["rec_vs_e0_desc", "rec_vs_e1_desc"]),
    evPh("vs_tot", "Total", { x: 6, y: 46, w: 55, h: 10 }, ["rec_vs_total"]),
  ],
  questions: [
    {
      id: "q_vis_polar",
      title: "Lens upgrade",
      prompt:
        "Receipt mentions polarized upgrade. Should this be treated as cosmetic / non-eligible separate from base prescription?",
      severity: "high",
      targetType: "field",
      targetId: "rec_vs_e0_amt",
      bboxId: "vs_items",
      options: ["Split eligible base vs non-eligible upgrade", "Treat entire line as vision hardware", "Needs SME", "Uncertain"],
      status: "open",
    },
  ],
  reviewLog: [],
  sessionLearningSignals: [],
  metadata: { whyInteresting: "Polarized / eligibility ambiguity." },
};

export const BUILT_IN_CASES: ClaimReviewCase[] = [
  caseMountSinai,
  casePharmacy,
  caseDental,
  caseOtc,
  caseMedical,
  caseVision,
];
