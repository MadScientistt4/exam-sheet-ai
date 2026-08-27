import { GoogleGenAI } from "@google/genai";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
export const DEFAULT_MAX_MARKS = 2;

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env.local (see .env.example)."
    );
  }
  if (!client) client = new GoogleGenAI({ apiKey });
  return client;
}

function parseJsonResponse<T>(raw: string | undefined, label: string): T {
  if (!raw) throw new Error(`Gemini returned an empty response while ${label}.`);
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`Gemini returned a response that wasn't valid JSON while ${label}.`);
  }
}

// ---------------------------------------------------------------------------
// Question extraction
// ---------------------------------------------------------------------------

export type QuestionSeed = {
  number: string;
  subPart?: string;
  text: string;
  maxMarks?: number;
};

const QUESTION_EXTRACTION_PROMPT = `You are reading a scanned exam question paper (image or PDF).

Extract every question in the exact order they are printed. Rules:
- Preserve the original printed numbering exactly as shown (e.g. "1", "2", "11").
- If a question has labelled sub-parts (e.g. (a), (b), (i), (ii)), output each sub-part as its own entry. Each sub-part entry shares the same "number" as its parent question, and "subPart" holds just the sub-label without punctuation (e.g. "a", "i").
- If a question has no sub-parts, omit "subPart" entirely.
- "text" is the full question text (without the leading number/label).
- If the marks for a question are printed (e.g. "[2]", "(2 marks)"), include them as "maxMarks" (a number). Otherwise omit "maxMarks".
- Do not include section headers, instructions, or the paper's title as questions.
- Return questions in the same order they appear on the page(s).

Return only JSON matching the provided schema — no markdown fences, no commentary.`;

const QUESTION_EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          number: { type: "string" },
          subPart: { type: "string" },
          text: { type: "string" },
          maxMarks: { type: "number" },
        },
        required: ["number", "text"],
      },
    },
  },
  required: ["questions"],
};

export async function extractQuestionsFromPaper(
  fileBase64: string,
  mimeType: string
): Promise<QuestionSeed[]> {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { text: QUESTION_EXTRACTION_PROMPT },
          { inlineData: { mimeType, data: fileBase64 } },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: QUESTION_EXTRACTION_SCHEMA,
    },
  });

  const parsed = parseJsonResponse<{ questions?: unknown }>(response.text, "extracting questions");
  if (!Array.isArray(parsed.questions)) {
    throw new Error("Gemini's response was missing a 'questions' array.");
  }

  return parsed.questions.filter(
    (q): q is QuestionSeed =>
      typeof q === "object" &&
      q !== null &&
      typeof (q as QuestionSeed).number === "string" &&
      typeof (q as QuestionSeed).text === "string"
  );
}

// ---------------------------------------------------------------------------
// Answer mapping + grading
// ---------------------------------------------------------------------------

export type RegionSeed = {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type AnswerSeed = {
  number: string;
  subPart?: string;
  matched: boolean;
  regions: RegionSeed[];
  score?: number;
  maxMarks?: number;
  feedback: string;
};

export type UnmatchedSeed = RegionSeed & { text: string };

const REGION_SCHEMA = {
  type: "object",
  properties: {
    page: { type: "integer" },
    x: { type: "number" },
    y: { type: "number" },
    width: { type: "number" },
    height: { type: "number" },
  },
  required: ["page", "x", "y", "width", "height"],
};

const ANSWER_MAPPING_SCHEMA = {
  type: "object",
  properties: {
    answers: {
      type: "array",
      items: {
        type: "object",
        properties: {
          number: { type: "string" },
          subPart: { type: "string" },
          matched: { type: "boolean" },
          regions: { type: "array", items: REGION_SCHEMA },
          score: { type: "number" },
          maxMarks: { type: "number" },
          feedback: { type: "string" },
        },
        required: ["number", "matched", "regions", "feedback"],
      },
    },
    unmatched: {
      type: "array",
      items: {
        type: "object",
        properties: {
          page: { type: "integer" },
          x: { type: "number" },
          y: { type: "number" },
          width: { type: "number" },
          height: { type: "number" },
          text: { type: "string" },
        },
        required: ["page", "x", "y", "width", "height", "text"],
      },
    },
  },
  required: ["answers"],
};

function buildAnswerMappingPrompt(
  questions: { number: string; subPart?: string; text: string; maxMarks?: number }[]
): string {
  const list = questions
    .map((q) => {
      const label = q.subPart ? `${q.number} (${q.subPart})` : q.number;
      const marks = q.maxMarks ? ` [${q.maxMarks} marks]` : "";
      return `${label}: ${q.text}${marks}`;
    })
    .join("\n");

  return `You are given a scanned, handwritten student answer sheet (image or PDF, possibly multiple pages) and the list of exam questions below. Questions may be answered out of order.

Questions:
${list}

For each question in the list:
- Determine whether the student attempted it anywhere on the sheet.
- If attempted, find every region containing that answer. An answer may span multiple lines, or continue onto a later page — list one region per contiguous block of handwriting, in reading order. Tightly bound just the handwritten answer content, not the whole page.
- Each region is: {"page": <1-indexed page number matching the sheet's page order>, "x": <0-1>, "y": <0-1>, "width": <0-1>, "height": <0-1>} where x/y/width/height are FRACTIONS of that page's full width/height (top-left origin). Do not use a 0-1000 scale — use 0-1 fractions.
- Grade the answer against the question. If the question has a marks value shown above, score out of that; otherwise score out of ${DEFAULT_MAX_MARKS} and set maxMarks to ${DEFAULT_MAX_MARKS}. Give one sentence of specific, constructive feedback explaining the score.
- If not attempted anywhere on the sheet, set matched to false, regions to an empty array, omit score, and set feedback to "No answer found on the sheet for this question."

Also list any handwritten content on the sheet that does NOT correspond to any question above (e.g. scratch work, an answer to a question not in this list, notes) as "unmatched" entries using the same region format plus a short "text" snippet of what it says.

Return only JSON matching the provided schema — no markdown fences, no commentary.`;
}

export async function mapAndGradeAnswers(
  fileBase64: string,
  mimeType: string,
  questions: { number: string; subPart?: string; text: string; maxMarks?: number }[]
): Promise<{ answers: AnswerSeed[]; unmatched: UnmatchedSeed[] }> {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { text: buildAnswerMappingPrompt(questions) },
          { inlineData: { mimeType, data: fileBase64 } },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: ANSWER_MAPPING_SCHEMA,
    },
  });

  const parsed = parseJsonResponse<{ answers?: unknown; unmatched?: unknown }>(
    response.text,
    "mapping answers"
  );
  if (!Array.isArray(parsed.answers)) {
    throw new Error("Gemini's response was missing an 'answers' array.");
  }

  return {
    answers: parsed.answers as AnswerSeed[],
    unmatched: Array.isArray(parsed.unmatched) ? (parsed.unmatched as UnmatchedSeed[]) : [],
  };
}
