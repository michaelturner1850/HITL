import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SampleCaseCard } from "@/components/landing/SampleCaseCard";
import { UploadDropzone } from "@/components/landing/UploadDropzone";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { listSampleCaseCards } from "@/lib/mockExtractionEngine";
import { useReviewStore } from "@/store/useReviewStore";

/**
 * Landing — upload or pick a sample. Routes to /review/:caseId.
 * Future: queue picker, batch mode, payload JSON paste, multi-doc packets.
 */
export function LandingPage() {
  const navigate = useNavigate();
  const seedBuiltIns = useReviewStore((s) => s.seedBuiltIns);
  const createUploadCase = useReviewStore((s) => s.createUploadCase);
  const [sampleMode, setSampleMode] = useState(true);

  useEffect(() => {
    seedBuiltIns();
  }, [seedBuiltIns]);

  const cards = listSampleCaseCards();

  const onUpload = (file: File) => {
    const c = createUploadCase(file);
    navigate(`/review/${c.caseId}`);
  };

  const openCase = (caseId: string) => {
    navigate(`/review/${caseId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="text-center">
          <Badge variant="secondary" className="mb-4">
            Internal v0 PoC — human-in-the-loop review
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            Claims document feedback & debugging
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            AI extracted and tagged this document. You review what matters on the image, resolve ambiguities, and emit
            structured training/debug signals — without treating this as final adjudication.
          </p>
        </div>

        <Card className="mx-auto mt-10 max-w-2xl border-slate-200 shadow-md">
          <CardHeader>
            <CardTitle>Upload</CardTitle>
            <CardDescription>
              Demo uses mocked extraction results tied to your image — no real OCR, APIs, or backend.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UploadDropzone onFile={onUpload} />
          </CardContent>
        </Card>

        <div className="mx-auto mt-10 flex max-w-2xl items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-800">Sample mode</p>
            <p className="text-xs text-slate-500">Show curated internal demo cases below</p>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="sample-toggle" className="text-xs text-slate-600">
              {sampleMode ? "On" : "Off"}
            </Label>
            <Switch id="sample-toggle" checked={sampleMode} onCheckedChange={setSampleMode} />
          </div>
        </div>

        {sampleMode && (
          <>
            <Separator className="my-10" />
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Sample cases</h2>
              <p className="mt-1 text-sm text-slate-600">
                Pre-seeded scenarios with bbox overlays and open questions — including a payment-summary / previous-balance
                style case.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {cards.map((c) => (
                  <SampleCaseCard key={c.caseId} meta={c} onOpen={openCase} />
                ))}
              </div>
            </div>
          </>
        )}

        <p className="mt-12 text-center text-xs text-slate-500">
          Feedback log + session learning stay in memory for this browser tab only. Optional persistence could be added
          behind a feature flag (see export helpers).
        </p>
      </div>
    </div>
  );
}
