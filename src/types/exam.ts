export type DocumentKind = "pdf" | "image";

export type UploadedDocument = {
  id: string;
  file: File;
  name: string;
  sizeBytes: number;
  kind: DocumentKind;
  pageCount: number;
  previewUrl: string;
};

export type QuestionScore = {
  earned: number;
  total: number;
};

export type ExtractedQuestion = {
  id: string;
  number: string;
  subPart?: string;
  text: string;
  score: QuestionScore | null;
  aiFeedback: string | null;
  answerPage: number | null;
};

export type AnswerBlock = {
  questionId: string | null;
  lines: string[];
};

export type AnswerPage = {
  page: number;
  blocks: AnswerBlock[];
};
