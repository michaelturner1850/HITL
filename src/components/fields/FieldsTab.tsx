import { GroupedFieldsTab } from "@/components/fields/GroupedFieldsTab";
import type { ClaimReviewCase, SelectionState } from "@/types/review";

type Props = {
  caseId: string;
  caseData: ClaimReviewCase;
  selection: SelectionState;
  showLowConfidenceOnly: boolean;
  onSelect: (s: SelectionState) => void;
};

export function FieldsTab(props: Props) {
  return <GroupedFieldsTab {...props} />;
}
