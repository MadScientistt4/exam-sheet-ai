"use client";

import { ChevronDown } from "lucide-react";
import type { ExtractedQuestion } from "@/types/exam";

function scorePillClasses(question: ExtractedQuestion): string {
  if (!question.score) return "bg-canvas text-muted";
  const ratio = question.score.total === 0 ? 0 : question.score.earned / question.score.total;
  if (ratio >= 0.7) return "bg-emerald-100 text-emerald-700";
  if (ratio > 0) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

type QuestionListProps = {
  questions: ExtractedQuestion[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  summary: { earned: number; total: number; unanswered: number };
};

export function QuestionList({ questions, selectedId, onSelect, summary }: QuestionListProps) {
  const seenNumbers = new Set<string>();

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-white">
      <div className="flex shrink-0 flex-col gap-2 border-b border-panel-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-ink">Extracted Questions (from question paper)</h2>
          <p className="text-xs text-muted">
            Score {summary.earned}/{summary.total}
            {summary.unanswered > 0 ? ` · ${summary.unanswered} unanswered` : ""}
          </p>
        </div>
        <button
          type="button"
          className="self-start rounded-full border border-panel-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-canvas sm:self-auto"
        >
          Expand All
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-3">
          {questions.map((question) => {
            const showBadge = !seenNumbers.has(question.number);
            seenNumbers.add(question.number);
            const selected = question.id === selectedId;

            return (
              <div
                key={question.id}
                onClick={() => onSelect(question.id)}
                className={`cursor-pointer rounded-xl border p-3 transition-colors ${
                  selected ? "border-accent bg-accent-tint/40" : "border-transparent bg-canvas/50 hover:bg-canvas"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      showBadge ? "bg-ink text-white" : "invisible"
                    }`}
                  >
                    {question.number}
                  </span>

                  <div className="flex-1">
                    <p className="text-sm text-ink">
                      {question.subPart && <span className="font-semibold">{question.subPart}. </span>}
                      {question.text}
                    </p>
                    {question.type === "mcq" && question.options.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                        {question.options.map((option) => (
                          <span key={option.label} className="text-xs text-muted">
                            <span className="font-semibold text-ink-soft">{option.label}.</span>{" "}
                            {option.text}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${scorePillClasses(question)}`}
                  >
                    {question.score ? `${question.score.earned}/${question.score.total}` : "—"}
                  </span>

                  <ChevronDown
                    className={`mt-1 h-4 w-4 shrink-0 text-muted transition-transform ${
                      selected ? "rotate-180" : ""
                    }`}
                  />
                </div>

                {selected && (
                  <div className="mt-3 ml-10 rounded-xl bg-canvas/70 p-3">
                    <p className="text-xs font-bold text-ink">AI Feedback</p>
                    <p className="mt-1 text-sm text-ink-soft">
                      {question.aiFeedback ?? "Not graded yet."}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
