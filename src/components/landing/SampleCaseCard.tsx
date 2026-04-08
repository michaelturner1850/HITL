import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { SampleCaseCardMeta } from "@/data/sampleCases";

type Props = {
  meta: SampleCaseCardMeta;
  onOpen: (caseId: string) => void;
};

export function SampleCaseCard({ meta, onOpen }: Props) {
  return (
    <Card className="flex flex-col border-slate-200 transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{meta.title}</CardTitle>
          <Badge variant="outline" className="shrink-0 font-normal">
            {meta.documentType}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-2 pb-2">
        <p className="text-sm text-slate-600">{meta.description}</p>
        {meta.whyInteresting && (
          <p className="rounded-md bg-amber-50/80 p-2 text-xs text-amber-950 ring-1 ring-amber-200/80">
            <span className="font-semibold">Why it matters: </span>
            {meta.whyInteresting}
          </p>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Button type="button" className="w-full" variant="secondary" onClick={() => onOpen(meta.caseId)}>
          Open case
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
