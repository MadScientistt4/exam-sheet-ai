"use client";

import { useMemo, useState } from "react";
import { QuestionList } from "@/components/mapping/QuestionList";
import { AnswerSheetViewer } from "@/components/mapping/AnswerSheetViewer";
import type { ExtractedQuestion, UnmatchedAnswer, UploadedDocument } from "@/types/exam";

type MappingScreenProps = {
  questions: ExtractedQuestion[];
  answerSheet: UploadedDocument;
  unmatched: UnmatchedAnswer[];
};

export function MappingScreen({ questions, answerSheet, unmatched }: MappingScreenProps) {
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
    const firstRegion = question?.regions[0];
    if (firstRegion) setPage(firstRegion.page);
  }

  return (
    <div className="grid min-h-160 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <QuestionList
        questions={questions}
        selectedId={selectedId}
        onSelect={handleSelect}
        summary={summary}
      />
      <AnswerSheetViewer
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
  );
}
