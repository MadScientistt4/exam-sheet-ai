"use client";

import { useExamStore } from "@/components/exam/ExamStoreContext";
import { UploadScreen } from "@/components/upload/UploadScreen";
import { ExtractingScreen } from "@/components/extracting/ExtractingScreen";

export default function UploadPage() {
  const {
    questionPaper,
    answerSheet,
    busyField,
    fieldErrors,
    extracting,
    extractError,
    selectFile,
    removeFile,
    startMapping,
  } = useExamStore();

  if (extracting) return <ExtractingScreen />;

  return (
    <div className="flex flex-1 flex-col gap-3">
      {extractError && (
        <div className="rounded-xl bg-red-100 px-4 py-2 text-sm font-medium text-red-700">
          {extractError}
        </div>
      )}
      <UploadScreen
        questionPaper={questionPaper}
        answerSheet={answerSheet}
        busyField={busyField}
        errors={fieldErrors}
        onSelectQuestionPaper={(file) => selectFile("question", file)}
        onSelectAnswerSheet={(file) => selectFile("answer", file)}
        onRemoveQuestionPaper={() => removeFile("question")}
        onRemoveAnswerSheet={() => removeFile("answer")}
        onStartMapping={startMapping}
      />
    </div>
  );
}
