"use client";

import { useEffect, useRef } from "react";
import { Kalam } from "next/font/google";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import type { AnswerPage, ExtractedQuestion } from "@/types/exam";

const kalam = Kalam({ subsets: ["latin"], weight: ["400", "700"] });

type AnswerSheetViewerProps = {
  pages: AnswerPage[];
  questions: ExtractedQuestion[];
  page: number;
  onPageChange: (page: number) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  selectedQuestionId: string | null;
};

export function AnswerSheetViewer({
  pages,
  questions,
  page,
  onPageChange,
  zoom,
  onZoomChange,
  selectedQuestionId,
}: AnswerSheetViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const current = pages.find((p) => p.page === page) ?? pages[0];
  const questionByNumber = new Map(questions.map((q) => [q.id, q]));

  useEffect(() => {
    if (!selectedQuestionId) return;
    const el = scrollRef.current?.querySelector(`[data-question-id="${selectedQuestionId}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selectedQuestionId, page]);

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
              Page {page} of {pages.length}
            </span>
            <button
              type="button"
              aria-label="Next page"
              disabled={page >= pages.length}
              onClick={() => onPageChange(page + 1)}
              className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/10 disabled:opacity-30"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto bg-black/20 p-4">
        <div
          style={{ width: `${zoom}%`, transformOrigin: "top left" }}
          className="mx-auto flex min-h-full flex-col gap-4 rounded-lg bg-[#fdfcf7] p-6"
        >
          {current?.blocks.map((block, i) => {
            const question = block.questionId ? questionByNumber.get(block.questionId) : null;
            const selected = block.questionId === selectedQuestionId;
            const label = question
              ? `Q${question.number}${question.subPart ? ` (${question.subPart})` : ""}`
              : null;

            return (
              <div
                key={i}
                data-question-id={block.questionId ?? undefined}
                className={`relative rounded-md border-2 p-3 leading-8 ${kalam.className} ${
                  selected
                    ? "border-emerald-500 bg-emerald-50"
                    : block.questionId === null
                      ? "border-dashed border-muted/40"
                      : "border-transparent"
                }`}
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(to bottom, transparent, transparent 27px, #dbe3ef 28px)",
                }}
              >
                {selected && label && (
                  <span className="absolute -top-3 left-3 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    {label}
                  </span>
                )}
                {block.questionId === null && (
                  <span className="absolute -top-3 left-3 rounded-full bg-muted/70 px-2 py-0.5 text-[10px] font-bold text-white">
                    Unmatched
                  </span>
                )}
                {block.lines.map((line, li) => (
                  <p key={li} className="text-lg text-ink">
                    {line}
                  </p>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
