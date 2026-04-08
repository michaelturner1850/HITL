import { Building2, CalendarDays, ChevronDown, CircleDollarSign, Receipt, UserCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { FieldCard } from "@/components/fields/FieldCard";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { listAllFields } from "@/lib/fieldTree";
import { isLowConfidenceField } from "@/lib/reviewHelpers";
import { cn } from "@/lib/utils";
import type { ClaimReviewCase, ExtractedField, RecipientSection, SelectionState } from "@/types/review";
import { useReviewStore } from "@/store/useReviewStore";

type Props = {
  caseId: string;
  caseData: ClaimReviewCase;
  selection: SelectionState;
  showLowConfidenceOnly: boolean;
  onSelect: (s: SelectionState) => void;
};

type FieldTheme = {
  id: string;
  label: string;
  icon: React.ReactNode;
  fields: ExtractedField[];
};

function fieldVisible(f: ExtractedField, showLowConfidenceOnly: boolean): boolean {
  if (!showLowConfidenceOnly) return true;
  return f.status === "unreviewed" && isLowConfidenceField(f);
}

/**
 * Exactly four SME-facing buckets per recipient. Order determines what shows first vs under the chevron.
 * - Provider: primary provider first; extra providers + document type (first recipient only) in "more".
 * - Dates: first calendar value first; tags and additional dates in "more".
 * - Expense item: first line description first; amounts and additional lines in "more".
 * - Total amount: recipient total; usually a single field.
 */
function recipientThemes(
  caseData: ClaimReviewCase,
  r: RecipientSection,
  recipientIndex: number,
): FieldTheme[] {
  const providerFields: ExtractedField[] = [...r.providers];
  if (recipientIndex === 0) {
    providerFields.push(caseData.documentTypeField);
  }

  const dateFieldsOrdered: ExtractedField[] = [];
  for (const row of r.dates) {
    dateFieldsOrdered.push(row.date, row.tag);
  }

  const expenseFieldsOrdered: ExtractedField[] = [];
  for (const line of r.expenseLines) {
    expenseFieldsOrdered.push(line.description, line.amount);
  }

  return [
    {
      id: `${r.id}_theme_prov`,
      label: "Provider",
      icon: <Building2 className="h-3.5 w-3.5" />,
      fields: providerFields,
    },
    {
      id: `${r.id}_theme_dates`,
      label: "Dates",
      icon: <CalendarDays className="h-3.5 w-3.5" />,
      fields: dateFieldsOrdered,
    },
    {
      id: `${r.id}_theme_expense`,
      label: "Expense item",
      icon: <Receipt className="h-3.5 w-3.5" />,
      fields: expenseFieldsOrdered,
    },
    {
      id: `${r.id}_theme_total`,
      label: "Total amount",
      icon: <CircleDollarSign className="h-3.5 w-3.5" />,
      fields: [r.totalAmount],
    },
  ];
}

type ThemePanelProps = {
  theme: FieldTheme;
  renderField: (f: ExtractedField) => React.ReactNode;
  showLowConfidenceOnly: boolean;
  allowed: Set<string>;
};

/**
 * One bucket: first field always visible; chevron reveals the rest (deeper extraction for that bucket).
 */
function ThemePanel({ theme, renderField, showLowConfidenceOnly, allowed }: ThemePanelProps) {
  const visible = theme.fields.filter((f) => fieldVisible(f, showLowConfidenceOnly));
  const [moreOpen, setMoreOpen] = useState(false);

  const forceExpandMore =
    showLowConfidenceOnly && visible.length > 1 && visible.slice(1).some((f) => allowed.has(f.id));
  const collapsibleOpen = forceExpandMore || moreOpen;

  if (visible.length === 0) return null;

  const primary = visible[0]!;
  const rest = visible.slice(1);
  const hasMore = rest.length > 0;

  return (
    <section className="rounded-md border border-slate-100 bg-slate-50/50 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
        {theme.icon}
        {theme.label}
      </div>

      <div className="space-y-2">{renderField(primary)}</div>

      {hasMore && (
        <Collapsible open={collapsibleOpen} onOpenChange={setMoreOpen} className="mt-2">
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-full justify-between border-dashed text-xs font-normal text-slate-700"
            >
              <span>
                More for {theme.label.toLowerCase()}
                <span className="ml-1 text-slate-500">({rest.length})</span>
              </span>
              <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", collapsibleOpen && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2 border-l-2 border-slate-200 pl-3">
            <p className="text-[11px] text-slate-500">
              Supporting extraction — use when you need to correct mapping or drill into alternate values.
            </p>
            {rest.map((f) => (
              <div key={f.id}>{renderField(f)}</div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </section>
  );
}

export function GroupedFieldsTab({ caseId, caseData, selection, showLowConfidenceOnly, onSelect }: Props) {
  const confirmField = useReviewStore((s) => s.confirmField);
  const editField = useReviewStore((s) => s.editField);
  const rejectField = useReviewStore((s) => s.rejectField);
  const markFieldUncertain = useReviewStore((s) => s.markFieldUncertain);
  const restoreField = useReviewStore((s) => s.restoreField);
  const addFieldNote = useReviewStore((s) => s.addFieldNote);

  const filtered = listAllFields(caseData).filter((f) => fieldVisible(f, showLowConfidenceOnly));
  const allowed = useMemo(() => new Set(filtered.map((f) => f.id)), [filtered]);

  const renderField = (f: ExtractedField) => {
    if (showLowConfidenceOnly && !allowed.has(f.id)) return null;
    return (
      <FieldCard
        key={f.id}
        caseData={caseData}
        field={f}
        selected={selection?.kind === "field" && selection.id === f.id}
        onSelect={() => onSelect({ kind: "field", id: f.id })}
        onConfirm={() => confirmField(caseId, f.id)}
        onEdit={(v) => editField(caseId, f.id, v)}
        onReject={() => rejectField(caseId, f.id)}
        onUncertain={() => markFieldUncertain(caseId, f.id)}
        onRestore={() => restoreField(caseId, f.id)}
        onNote={(note) => addFieldNote(caseId, f.id, note)}
        onJumpEvidence={() => onSelect({ kind: "field", id: f.id })}
      />
    );
  };

  const defaultOpen = caseData.recipients.map((r) => r.id);

  return (
    <ScrollArea className="h-[calc(100vh-320px)] min-h-[240px] pr-3">
      <div className="space-y-3 pb-4">
        <p className="text-xs text-slate-600">
          Four buckets per recipient: <span className="font-medium text-slate-800">Provider</span>,{" "}
          <span className="font-medium">Dates</span>, <span className="font-medium">Expense item</span>,{" "}
          <span className="font-medium">Total amount</span>. Only the lead value shows first; open the chevron to review
          or remap supporting fields (e.g. document type sits under Provider on the first recipient).
        </p>

        {showLowConfidenceOnly && filtered.length === 0 && (
          <p className="rounded-md border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
            No unreviewed low-confidence fields match this filter.
          </p>
        )}

        <Accordion type="multiple" defaultValue={defaultOpen} className="space-y-2">
          {caseData.recipients.map((r, idx) => (
            <AccordionItem key={r.id} value={r.id} className="rounded-lg border border-slate-200 bg-white px-3">
              <AccordionTrigger className="py-3 text-sm font-semibold hover:no-underline">
                <span className="flex items-center gap-2 text-left">
                  <UserCircle className="h-4 w-4 shrink-0 text-slate-500" />
                  <span>{r.heading}</span>
                  <span className="text-xs font-normal text-slate-500">
                    ({idx + 1} of {caseData.recipients.length})
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4 pt-0">
                {recipientThemes(caseData, r, idx).map((theme) => (
                  <ThemePanel
                    key={theme.id}
                    theme={theme}
                    renderField={renderField}
                    showLowConfidenceOnly={showLowConfidenceOnly}
                    allowed={allowed}
                  />
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </ScrollArea>
  );
}
