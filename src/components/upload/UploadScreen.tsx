"use client";

import { ArrowRight, BookOpen, Clock3, ScanLine, Sparkle } from "lucide-react";
import { FileDropzone } from "@/components/upload/FileDropzone";
import type { UploadedDocument } from "@/types/exam";

const BADGES = [
  { icon: Clock3, className: "-top-1 right-6" },
  { icon: ScanLine, className: "top-8 -left-3" },
  { icon: Sparkle, className: "bottom-6 -right-3" },
  { icon: BookOpen, className: "-bottom-1 left-10" },
];

function TeacherIllustration() {
  return (
    <div className="relative flex h-32 w-32 items-center justify-center md:h-44 md:w-44">
      <div className="absolute inset-0 rounded-full bg-accent-soft" />
      <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm md:h-28 md:w-28">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-tint text-accent-dark md:h-24 md:w-24">
          <BookOpen className="h-8 w-8 md:h-10 md:w-10" strokeWidth={1.5} />
        </div>
      </div>
      {BADGES.map(({ icon: Icon, className }, i) => (
        <div
          key={i}
          className={`absolute flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white shadow-sm md:h-7 md:w-7 ${className}`}
        >
          <Icon className="h-3 w-3 md:h-3.5 md:w-3.5" strokeWidth={2} />
        </div>
      ))}
    </div>
  );
}

type UploadScreenProps = {
  questionPaper: UploadedDocument | null;
  answerSheet: UploadedDocument | null;
  busyField: "question" | "answer" | null;
  errors: { question: string | null; answer: string | null };
  onSelectQuestionPaper: (file: File) => void;
  onSelectAnswerSheet: (file: File) => void;
  onRemoveQuestionPaper: () => void;
  onRemoveAnswerSheet: () => void;
  onStartMapping: () => void;
};

export function UploadScreen({
  questionPaper,
  answerSheet,
  busyField,
  errors,
  onSelectQuestionPaper,
  onSelectAnswerSheet,
  onRemoveQuestionPaper,
  onRemoveAnswerSheet,
  onStartMapping,
}: UploadScreenProps) {
  const canStart = Boolean(questionPaper && answerSheet) && !busyField;

  return (
    <section
      className="flex min-h-160 flex-1 flex-col items-center justify-center gap-6 rounded-2xl px-4 py-10 text-center sm:px-6 md:gap-8 md:py-12"
      style={{
        background:
          "radial-gradient(circle at 30% 20%, #f8f8f9 0%, #e4e4e6 55%, #d7d7da 100%)",
      }}
    >
      <div className="flex flex-col items-center gap-3">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl md:text-4xl">
          <span className="md:hidden">Upload Question Paper &amp; Answer Sheets</span>
          <span className="hidden md:inline">
            Upload{" "}
            <span className="rounded-lg bg-accent-soft px-2 py-1 text-accent underline decoration-2 underline-offset-4">
              Question Paper &amp; Answer Sheets
            </span>
          </span>
        </h1>
        <p className="hidden text-base text-muted md:block">Upload both files to get started</p>
      </div>

      <TeacherIllustration />

      <div className="flex w-full max-w-3xl flex-col gap-4 md:flex-row md:gap-0 md:divide-x md:divide-panel-border md:rounded-2xl md:border-2 md:border-dashed md:border-panel-border md:bg-white">
        <FileDropzone
          label="Upload"
          highlight="Question Paper"
          document={questionPaper}
          busy={busyField === "question"}
          error={errors.question}
          onSelect={onSelectQuestionPaper}
          onRemove={onRemoveQuestionPaper}
        />
        <FileDropzone
          label="Upload"
          highlight="Answer Sheet"
          document={answerSheet}
          busy={busyField === "answer"}
          error={errors.answer}
          onSelect={onSelectAnswerSheet}
          onRemove={onRemoveAnswerSheet}
        />
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          disabled={!canStart}
          onClick={onStartMapping}
          className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors ${
            canStart
              ? "bg-ink text-white hover:bg-ink/90"
              : "cursor-not-allowed bg-black/15 text-muted/80"
          }`}
        >
          Start Mapping
          <ArrowRight className="h-4 w-4" />
        </button>
        <p className="max-w-sm text-sm text-muted">
          Once both files are uploaded, you&apos;ll able to map answers with questions
        </p>
      </div>
    </section>
  );
}
