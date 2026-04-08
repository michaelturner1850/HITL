import { Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCEPT = "image/jpeg,image/jpg,image/png,.jpg,.jpeg,.png";

type Props = {
  onFile: (file: File) => void;
  disabled?: boolean;
};

export function UploadDropzone({ onFile, disabled }: Props) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return;
      const f = files[0]!;
      const ok = /\.(jpe?g|png)$/i.test(f.name) || /image\/(jpeg|png)/.test(f.type);
      if (!ok) return;
      onFile(f);
    },
    [onFile],
  );

  return (
    <div
      className={cn(
        "rounded-xl border-2 border-dashed border-slate-300 bg-white p-10 text-center transition-colors",
        drag && "border-sky-500 bg-sky-50/50",
        disabled && "pointer-events-none opacity-60",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <Upload className="mx-auto h-10 w-10 text-slate-400" aria-hidden />
      <p className="mt-3 text-sm font-medium text-slate-800">Drag and drop a claim document image</p>
      <p className="mt-1 text-xs text-slate-500">JPG, JPEG, or PNG — demo uses mocked extraction (no OCR).</p>
      <div className="mt-6">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          disabled={disabled}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button type="button" onClick={() => inputRef.current?.click()}>
          Upload claim image
        </Button>
      </div>
    </div>
  );
}
