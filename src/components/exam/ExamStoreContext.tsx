"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { buildUploadedDocument } from "@/lib/document";
import {
  ANSWER_SHEET_TYPES,
  MAX_FILE_BYTES,
  MAX_FILE_LABEL,
  QUESTION_PAPER_TYPES,
} from "@/lib/upload-constraints";
import type { ExtractedQuestion, UnmatchedAnswer, UploadedDocument } from "@/types/exam";

type FieldKey = "question" | "answer";
export type ExtractingStage = "questions" | "answers" | null;

type ExamStore = {
  questionPaper: UploadedDocument | null;
  answerSheet: UploadedDocument | null;
  busyField: FieldKey | null;
  fieldErrors: Record<FieldKey, string | null>;
  extractingStage: ExtractingStage;
  extractError: string | null;
  questions: ExtractedQuestion[] | null;
  unmatched: UnmatchedAnswer[];
  overallFeedback: string | null;
  selectFile: (field: FieldKey, file: File) => Promise<void>;
  removeFile: (field: FieldKey) => void;
  startMapping: () => Promise<void>;
};

const ExamStoreCtx = createContext<ExamStore | null>(null);

export function ExamStoreProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [questionPaper, setQuestionPaper] = useState<UploadedDocument | null>(null);
  const [answerSheet, setAnswerSheet] = useState<UploadedDocument | null>(null);
  const [busyField, setBusyField] = useState<FieldKey | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<FieldKey, string | null>>({
    question: null,
    answer: null,
  });
  const [extractingStage, setExtractingStage] = useState<ExtractingStage>(null);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ExtractedQuestion[] | null>(null);
  const [unmatched, setUnmatched] = useState<UnmatchedAnswer[]>([]);
  const [overallFeedback, setOverallFeedback] = useState<string | null>(null);

  const selectFile = useCallback(async (field: FieldKey, file: File) => {
    const allowedTypes = field === "question" ? QUESTION_PAPER_TYPES : ANSWER_SHEET_TYPES;
    if (!allowedTypes.includes(file.type)) {
      const hint = field === "question" ? "PDF, PNG, JPG, WEBP or TXT" : "PDF, PNG, JPG or WEBP";
      setFieldErrors((e) => ({ ...e, [field]: `Unsupported file type. Use ${hint}.` }));
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFieldErrors((e) => ({ ...e, [field]: `File exceeds the ${MAX_FILE_LABEL} limit.` }));
      return;
    }
    setFieldErrors((e) => ({ ...e, [field]: null }));
    setBusyField(field);
    try {
      const doc = await buildUploadedDocument(file);
      if (field === "question") setQuestionPaper(doc);
      else setAnswerSheet(doc);
    } catch {
      setFieldErrors((e) => ({ ...e, [field]: "Could not read this file. Try another." }));
    } finally {
      setBusyField(null);
    }
  }, []);

  const removeFile = useCallback((field: FieldKey) => {
    if (field === "question") setQuestionPaper(null);
    else setAnswerSheet(null);
    setFieldErrors((e) => ({ ...e, [field]: null }));
  }, []);

  const startMapping = useCallback(async () => {
    if (!questionPaper || !answerSheet) return;
    setExtractError(null);

    try {
      setExtractingStage("questions");
      const questionForm = new FormData();
      questionForm.append("questionPaper", questionPaper.file);
      const questionRes = await fetch("/api/extract-questions", {
        method: "POST",
        body: questionForm,
      });
      const questionData = await questionRes.json();
      if (!questionRes.ok) throw new Error(questionData.error || "Question extraction failed.");

      const extracted: ExtractedQuestion[] = questionData.questions;
      if (extracted.length === 0) {
        throw new Error("No questions were found on the question paper.");
      }

      setExtractingStage("answers");
      const answerForm = new FormData();
      answerForm.append("answerSheet", answerSheet.file);
      answerForm.append(
        "questions",
        JSON.stringify(
          extracted.map((q) => ({
            id: q.id,
            number: q.number,
            subPart: q.subPart,
            text: q.text,
            type: q.type,
            options: q.options,
            maxMarks: q.maxMarks,
          }))
        )
      );
      const answerRes = await fetch("/api/map-answers", { method: "POST", body: answerForm });
      const answerData = await answerRes.json();
      if (!answerRes.ok) throw new Error(answerData.error || "Answer mapping failed.");

      setQuestions(answerData.questions);
      setUnmatched(answerData.unmatched ?? []);
      setOverallFeedback(answerData.overallFeedback ?? null);
      router.push("/exams/mapping");
    } catch (error) {
      setExtractError(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setExtractingStage(null);
    }
  }, [questionPaper, answerSheet, router]);

  const value = useMemo<ExamStore>(
    () => ({
      questionPaper,
      answerSheet,
      busyField,
      fieldErrors,
      extractingStage,
      extractError,
      questions,
      unmatched,
      overallFeedback,
      selectFile,
      removeFile,
      startMapping,
    }),
    [
      questionPaper,
      answerSheet,
      busyField,
      fieldErrors,
      extractingStage,
      extractError,
      questions,
      unmatched,
      overallFeedback,
      selectFile,
      removeFile,
      startMapping,
    ]
  );

  return <ExamStoreCtx.Provider value={value}>{children}</ExamStoreCtx.Provider>;
}

export function useExamStore(): ExamStore {
  const ctx = useContext(ExamStoreCtx);
  if (!ctx) throw new Error("useExamStore must be used within ExamStoreProvider");
  return ctx;
}
