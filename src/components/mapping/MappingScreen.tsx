"use client";

import { useMemo, useState } from "react";
import { QuestionList } from "@/components/mapping/QuestionList";
import { AnswerSheetViewer } from "@/components/mapping/AnswerSheetViewer";
import { mockAnswerPages } from "@/lib/mockExtraction";
import type { ExtractedQuestion } from "@/types/exam";

type MappingScreenProps = {
  questions: ExtractedQuestion[];
};

export function MappingScreen({ questions }: MappingScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(questions[0]?.id ?? null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);

  const summary = useMemo(() => {
    let earned = 0;
    let total = 0;
    let unanswered = 0;
    for (const q of questions) {
      if (q.score) {
        earned += q.score.earned;
        total += q.score.total;
      } else {
        unanswered += 1;
      }
    }
    return { earned, total, unanswered };
  }, [questions]);

  function handleSelect(id: string) {
    setSelectedId((current) => (current === id ? null : id));
    const question = questions.find((q) => q.id === id);
    if (question?.answerPage) setPage(question.answerPage);
  }

  return (
    <div className="grid min-h-160 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <QuestionList
        questions={questions}
        selectedId={selectedId}
        onSelect={handleSelect}
        summary={summary}
      />
      <div className="flex flex-col gap-2">
        <div className="rounded-xl bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800">
          Answer sheet mapping isn&apos;t wired up yet — the panel below shows sample data, not
          your uploaded answer sheet.
        </div>
        <AnswerSheetViewer
          pages={mockAnswerPages}
          questions={questions}
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
