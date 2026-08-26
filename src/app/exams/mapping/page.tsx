"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useExamStore } from "@/components/exam/ExamStoreContext";
import { MappingScreen } from "@/components/mapping/MappingScreen";

export default function MappingPage() {
  const { questions } = useExamStore();
  const router = useRouter();

  useEffect(() => {
    if (!questions) router.replace("/exams/upload");
  }, [questions, router]);

  if (!questions) return null;

  return <MappingScreen questions={questions} />;
}
