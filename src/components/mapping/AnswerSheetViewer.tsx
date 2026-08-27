"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Minus, Plus } from "lucide-react";
import { renderPdfPageToDataUrl } from "@/lib/pdf";
import type { AnswerRegion, ExtractedQuestion, UnmatchedAnswer, UploadedDocument } from "@/types/exam";

type AnswerSheetViewerProps = {
  sheet: UploadedDocument;
  questions: ExtractedQuestion[];
  unmatched: UnmatchedAnswer[];
  page: number;
  onPageChange: (page: number) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  selectedQuestionId: string | null;
};

export function AnswerSheetViewer({
  sheet,
  questions,
  unmatched,
  page,
  onPageChange,
  zoom,
  onZoomChange,
  selectedQuestionId,
}: AnswerSheetViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pageImages, setPageImages] = useState<Record<number, string>>({});

  const selectedQuestion = questions.find((q) => q.id === selectedQuestionId) ?? null;

  useEffect(() => {
    if (sheet.kind === "image") return;
    if (pageImages[page]) return;

    let cancelled = false;
    renderPdfPageToDataUrl(sheet.file, page).then((dataUrl) => {
      if (!cancelled) setPageImages((prev) => ({ ...prev, [page]: dataUrl }));
    });

    return () => {
      cancelled = true;
    };
  }, [sheet, page, pageImages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const imageSrc = sheet.kind === "image" ? sheet.previewUrl : pageImages[page];
  const regionsOnPage = selectedQuestion?.regions.filter((r) => r.page === page) ?? [];
  const unmatchedOnPage = unmatched.filter((u) => u.page === page);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-ink">
      <div className="flex shrink-0 items-center justify-between px-4 py-3">
        <span className="text-sm font-semibold text-white">Answer Sheet</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-2 py-1">
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => onZoomChange(Math.max(50, zoom - 10))}
              className="flex h-6 w-6 items-center justify-center rounded-full text-white/80 hover:bg-white/10"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-10 text-center text-xs font-medium text-white">{zoom}%</span>
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => onZoomChange(Math.min(200, zoom + 10))}
              className="flex h-6 w-6 items-center justify-center rounded-full text-white/80 hover:bg-white/10"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-white/80">
            <button
              type="button"
              aria-label="Previous page"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/10 disabled:opacity-30"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span>
              Page {page} of {sheet.pageCount}
            </span>
            <button
              type="button"
              aria-label="Next page"
              disabled={page >= sheet.pageCount}
              onClick={() => onPageChange(page + 1)}
              className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/10 disabled:opacity-30"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto bg-black/20 p-4">
        <div style={{ width: `${zoom}%` }} className="relative mx-auto">
          {imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element -- client-generated data: URL of variable size, not an optimizable static asset
            <img src={imageSrc} alt={`Answer sheet page ${page}`} className="w-full rounded-lg" />
          ) : (
            <div className="flex aspect-3/4 w-full flex-col items-center justify-center gap-2 rounded-lg bg-white/5 text-white/60">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-xs">Rendering page...</span>
            </div>
          )}

          {regionsOnPage.map((region, i) => (
            <RegionOverlay key={i} region={region} tone="selected" />
          ))}
          {unmatchedOnPage.map((region, i) => (
            <RegionOverlay key={i} region={region} tone="unmatched" label="Unmatched" />
          ))}
        </div>
      </div>
    </div>
  );
}

function RegionOverlay({
  region,
  tone,
  label,
}: {
  region: AnswerRegion;
  tone: "selected" | "unmatched";
  label?: string;
}) {
  return (
    <div
      className={`absolute rounded border-2 ${
        tone === "selected" ? "border-emerald-500 bg-emerald-500/10" : "border-dashed border-white/40 bg-white/5"
      }`}
      style={{
        left: `${region.x * 100}%`,
        top: `${region.y * 100}%`,
        width: `${region.width * 100}%`,
        height: `${region.height * 100}%`,
      }}
    >
      {label && (
        <span className="absolute -top-3 left-1 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold text-ink">
          {label}
        </span>
      )}
    </div>
  );
}
