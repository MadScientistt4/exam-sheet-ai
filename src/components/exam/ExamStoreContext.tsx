"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { buildUploadedDocument } from "@/lib/document";
import { ACCEPTED_TYPES, MAX_FILE_BYTES } from "@/lib/upload-constraints";
import type { ExtractedQuestion, UploadedDocument } from "@/types/exam";

type FieldKey = "question" | "answer";

type ExamStore = {
  questionPaper: UploadedDocument | null;
  answerSheet: UploadedDocument | null;
  busyField: FieldKey | null;
  fieldErrors: Record<FieldKey, string | null>;
  extracting: boolean;
  extractError: string | null;
  questions: ExtractedQuestion[] | null;
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
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ExtractedQuestion[] | null>(null);

  const selectFile = useCallback(async (field: FieldKey, file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFieldErrors((e) => ({ ...e, [field]: "Unsupported file type. Use PDF, PNG, JPG or WEBP." }));
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFieldErrors((e) => ({ ...e, [field]: "File exceeds the 10MB limit." }));
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
    setExtracting(true);
    setExtractError(null);
    try {
      const formData = new FormData();
      formData.append("questionPaper", questionPaper.file);

      const res = await fetch("/api/extract-questions", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Question extraction failed.");

      setQuestions(data.questions);
      router.push("/exams/mapping");
    } catch (error) {
      setExtractError(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setExtracting(false);
    }
  }, [questionPaper, answerSheet, router]);

  const value = useMemo<ExamStore>(
    () => ({
      questionPaper,
      answerSheet,
      busyField,
      fieldErrors,
      extracting,
      extractError,
      questions,
      selectFile,
      removeFile,
      startMapping,
    }),
    [
      questionPaper,
      answerSheet,
      busyField,
      fieldErrors,
      extracting,
      extractError,
      questions,
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
