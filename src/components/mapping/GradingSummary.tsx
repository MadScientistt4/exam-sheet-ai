"use client";

import { CheckCircle2, Circle, MinusCircle, XCircle } from "lucide-react";
import type { ExtractedQuestion } from "@/types/exam";

// Mirrors DEFAULT_MAX_MARKS in src/lib/gemini.ts — duplicated rather than
// imported so this client component doesn't pull the server-only Gemini SDK
// into the browser bundle just for one constant.
const FALLBACK_MAX_MARKS = 2;

type GradingSummaryProps = {
  questions: ExtractedQuestion[];
  overallFeedback: string | null;
};

export function GradingSummary({ questions, overallFeedback }: GradingSummaryProps) {
  let earned = 0;
  let total = 0;
  let correct = 0;
  let partial = 0;
  let incorrect = 0;
  let unanswered = 0;

  for (const q of questions) {
    // Every question counts toward the total, answered or not — an unanswered
    // question should pull the score down, not just vanish from the denominator.
    const maxMarks = q.maxMarks ?? FALLBACK_MAX_MARKS;
    total += maxMarks;

    if (!q.score) {
      unanswered += 1;
      continue;
    }
    earned += q.score.earned;
    const ratio = maxMarks === 0 ? 0 : q.score.earned / maxMarks;
    if (ratio >= 1) correct += 1;
    else if (ratio > 0) partial += 1;
    else incorrect += 1;
  }

  const percent = total === 0 ? 0 : Math.round((earned / total) * 100);

  const stats = [
    { label: "Correct", count: correct, icon: CheckCircle2, className: "text-emerald-600" },
    { label: "Partial", count: partial, icon: MinusCircle, className: "text-amber-600" },
    { label: "Incorrect", count: incorrect, icon: XCircle, className: "text-red-600" },
    { label: "Unanswered", count: unanswered, icon: Circle, className: "text-muted" },
  ];

  return (
    <div className="flex shrink-0 flex-col gap-4 rounded-2xl bg-white p-4 sm:flex-row sm:items-center md:p-5">
      <div className="flex shrink-0 items-center gap-4">
        <div className="flex shrink-0 flex-col items-center justify-center rounded-2xl bg-accent-tint px-5 py-2.5">
          <span className="text-xl font-bold text-accent-dark">
            {earned}/{total}
          </span>
          <span className="text-xs font-medium text-accent-dark/70">{percent}%</span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {stats.map(({ label, count, icon: Icon, className }) => (
            <div key={label} className="flex items-center gap-1.5 text-sm">
              <Icon className={`h-4 w-4 ${className}`} />
              <span className="font-semibold text-ink">{count}</span>
              <span className="text-muted">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {overallFeedback && (
        <div className="flex-1 sm:border-l sm:border-panel-border sm:pl-4">
          <p className="text-xs font-bold text-ink">Overall Feedback</p>
          <p className="mt-1 text-sm text-ink-soft">{overallFeedback}</p>
        </div>
      )}
    </div>
  );
}
