"use client";

import { useRef, useState, type DragEvent } from "react";
import { FileText, ImageIcon, Upload, X } from "lucide-react";
import { formatBytes } from "@/lib/format";
import type { UploadedDocument } from "@/types/exam";

type FileDropzoneProps = {
  label: string;
  highlight: string;
  accept: string;
  document: UploadedDocument | null;
  busy: boolean;
  error: string | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
};

export function FileDropzone({
  label,
  highlight,
  accept,
  document,
  busy,
  error,
  onSelect,
  onRemove,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onSelect(file);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!document) setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={document ? undefined : handleDrop}
      className={`flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors md:rounded-none md:border-0 ${
        dragActive ? "border-accent bg-accent-tint/40" : "border-panel-border bg-white"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
          e.target.value = "";
        }}
      />

      {document ? (
        <div className="flex w-full max-w-xs items-center gap-3 rounded-xl bg-canvas/60 p-3">
          {document.kind === "pdf" ? (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-red-500 text-[10px] font-bold text-white">
              PDF
            </span>
          ) : document.kind === "text" ? (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-500 text-white">
              <FileText className="h-4 w-4" />
            </span>
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-sky-500 text-white">
              <ImageIcon className="h-4 w-4" />
            </span>
          )}
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-bold text-ink">{document.name}</p>
            <p className="text-xs text-muted">
              {formatBytes(document.sizeBytes)}
              {document.kind !== "text" && (
                <>
                  {" "}
                  &bull; {document.pageCount} {document.pageCount === 1 ? "Page" : "Pages"}
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            aria-label={`Remove ${document.name}`}
            onClick={onRemove}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink/80 text-white hover:bg-ink"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center gap-3 disabled:opacity-60"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-canvas text-ink">
            <Upload className="h-5 w-5" strokeWidth={2} />
          </span>
          <span className="text-base font-bold text-ink">
            {label} <span className="text-accent">{highlight}</span>
          </span>
          <span className="text-sm text-muted">{busy ? "Reading file..." : "Max 10MB"}</span>
        </button>
      )}

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
