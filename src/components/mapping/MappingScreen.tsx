"use client";

import { useState } from "react";
import { QuestionList } from "@/components/mapping/QuestionList";
import { AnswerSheetViewer } from "@/components/mapping/AnswerSheetViewer";
import { GradingSummary } from "@/components/mapping/GradingSummary";
import type { ExtractedQuestion, UnmatchedAnswer, UploadedDocument } from "@/types/exam";

type MappingScreenProps = {
  questions: ExtractedQuestion[];
  answerSheet: UploadedDocument;
  unmatched: UnmatchedAnswer[];
  overallFeedback: string | null;
};

type MobileTab = "questions" | "answers";

export function MappingScreen({
  questions,
  answerSheet,
  unmatched,
  overallFeedback,
}: MappingScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(questions[0]?.id ?? null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [mobileTab, setMobileTab] = useState<MobileTab>("questions");

  function handleSelect(id: string) {
    const isDeselecting = selectedId === id;
    setSelectedId(isDeselecting ? null : id);

    const question = questions.find((q) => q.id === id);
    const firstRegion = question?.regions[0];
    if (firstRegion) setPage(firstRegion.page);
    if (!isDeselecting && firstRegion) setMobileTab("answers");
  }

  return (
    <div className="flex min-h-160 flex-1 flex-col gap-4">
      <GradingSummary questions={questions} overallFeedback={overallFeedback} />

      <div className="mx-auto flex shrink-0 items-center gap-1 rounded-full bg-white p-1 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileTab("questions")}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
            mobileTab === "questions" ? "bg-ink text-white" : "text-muted"
          }`}
        >
          Questions
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("answers")}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
            mobileTab === "answers" ? "bg-ink text-white" : "text-muted"
          }`}
        >
          Answer Sheet
        </button>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <QuestionList
          className={`${mobileTab === "questions" ? "flex" : "hidden"} lg:flex`}
          questions={questions}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
        <AnswerSheetViewer
          className={`${mobileTab === "answers" ? "flex" : "hidden"} lg:flex`}
          sheet={answerSheet}
          questions={questions}
          unmatched={unmatched}
          page={page}
          onPageChange={setPage}
          zoom={zoom}
          onZoomChange={setZoom}
          selectedQuestionId={selectedId}
        />
      </div>
    </div>
  );
}
