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

/** Normalized as fractions (0-1) of the page's width/height, top-left origin. */
export type AnswerRegion = {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ExtractedQuestion = {
  id: string;
  number: string;
  subPart?: string;
  text: string;
  maxMarks: number | null;
  matched: boolean;
  score: QuestionScore | null;
  aiFeedback: string | null;
  regions: AnswerRegion[];
};

export type UnmatchedAnswer = AnswerRegion & {
  text: string;
};
