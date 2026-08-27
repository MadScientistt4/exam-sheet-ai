"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useExamStore } from "@/components/exam/ExamStoreContext";
import { MappingScreen } from "@/components/mapping/MappingScreen";

export default function MappingPage() {
  const { questions, answerSheet, unmatched, overallFeedback } = useExamStore();
  const router = useRouter();

  useEffect(() => {
    if (!questions || !answerSheet) router.replace("/exams/upload");
  }, [questions, answerSheet, router]);

  if (!questions || !answerSheet) return null;

  return (
    <MappingScreen
      questions={questions}
      answerSheet={answerSheet}
      unmatched={unmatched}
      overallFeedback={overallFeedback}
    />
  );
}
