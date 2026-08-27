"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { FileDropzone } from "@/components/upload/FileDropzone";
import { ANSWER_SHEET_TYPES, QUESTION_PAPER_TYPES } from "@/lib/upload-constraints";
import type { UploadedDocument } from "@/types/exam";

const QUESTION_PAPER_ACCEPT = QUESTION_PAPER_TYPES.join(",");
const ANSWER_SHEET_ACCEPT = ANSWER_SHEET_TYPES.join(",");

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
      className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl px-4 py-4 text-center sm:px-6 md:gap-4 md:py-6"
      style={{
        background:
          "radial-gradient(circle at 30% 20%, #f8f8f9 0%, #e4e4e6 55%, #d7d7da 100%)",
      }}
    >
      <div className="flex flex-col items-center gap-1">
        <h1 className="text-xl font-bold text-ink sm:text-2xl md:text-3xl">
          <span className="md:hidden">Upload Question Paper &amp; Answer Sheets</span>
          <span className="hidden md:inline">
            Upload{" "}
            <span className="rounded-lg bg-accent-soft px-2 py-1 text-accent underline decoration-2 underline-offset-4">
              Question Paper &amp; Answer Sheets
            </span>
          </span>
        </h1>
        <p className="hidden text-sm text-muted md:block">Upload both files to get started</p>
      </div>

      <div className="hidden [@media(min-height:640px)]:block">
        <Image
          src="/vedaAI.png"
          alt="Illustration of a teacher reviewing a paper"
          width={277}
          height={277}
          priority
          className="h-20 w-20 md:h-28 md:w-28"
        />
      </div>

      <div className="flex w-full max-w-3xl flex-col gap-4 rounded-2xl border-2 border-dashed border-panel-border p-4 md:flex-row md:gap-4 md:p-3 bg-gray-200">
        <FileDropzone
          label="Upload"
          highlight="Question Paper"
          accept={QUESTION_PAPER_ACCEPT}
          document={questionPaper}
          busy={busyField === "question"}
          error={errors.question}
          onSelect={onSelectQuestionPaper}
          onRemove={onRemoveQuestionPaper}
        />
        <FileDropzone
          label="Upload"
          highlight="Answer Sheet"
          accept={ANSWER_SHEET_ACCEPT}
          document={answerSheet}
          busy={busyField === "answer"}
          error={errors.answer}
          onSelect={onSelectAnswerSheet}
          onRemove={onRemoveAnswerSheet}
        />
      </div>

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          disabled={!canStart}
          onClick={onStartMapping}
          className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-colors ${
            canStart
              ? "bg-ink text-white hover:bg-ink/90"
              : "cursor-not-allowed bg-black/15 text-muted/80"
          }`}
        >
          Start Mapping
          <ArrowRight className="h-4 w-4" />
        </button>
        <p className="max-w-sm text-xs text-muted md:text-sm">
          Once both files are uploaded, you&apos;ll able to map answers with questions
        </p>
      </div>
    </section>
  );
}
