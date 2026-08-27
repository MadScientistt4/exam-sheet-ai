import { ApiError, GoogleGenAI, type ContentListUnion } from "@google/genai";

export const DEFAULT_MAX_MARKS = 2;

// Models tried in order. "gemini-flash-latest" is Google's rolling alias for
// their current recommended flash model — using it (instead of only a dated
// name like "gemini-2.0-flash") avoids silently breaking again the next time
// a specific model version is retired. The pinned models behind it are a
// known-good fallback with their own separate free-tier quota.
const MODEL_CHAIN = Array.from(
  new Set([
    process.env.GEMINI_MODEL || "gemini-flash-latest",
    "gemini-flash-latest",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
  ])
);

const SAME_MODEL_RETRY_DELAY_MS = 800;

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 500/503 are worth one immediate retry on the same model — they're usually a blip. */
function isTransientServerError(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 500 || error.status === 503);
}

/**
 * Runs a Gemini call across the model fallback chain: each model gets up to
 * two tries (a same-model retry only for transient 5xx errors), then moves on
 * to the next model. Throws the last error if every model fails.
 */
async function generateStructuredJson<T>(
  contents: ContentListUnion,
  responseJsonSchema: object,
  label: string
): Promise<T> {
  const ai = getClient();
  let lastError: unknown;

  for (const model of MODEL_CHAIN) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: { responseMimeType: "application/json", responseJsonSchema },
        });
        return parseJsonResponse<T>(response.text, label);
      } catch (error) {
        lastError = error;
        if (attempt === 1 && isTransientServerError(error)) {
          await sleep(SAME_MODEL_RETRY_DELAY_MS);
          continue;
        }
        break;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Gemini failed while ${label}.`);
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

export type QuestionOptionSeed = {
  label: string;
  text: string;
};

export type QuestionSeed = {
  number: string;
  subPart?: string;
  text: string;
  type: "written" | "mcq";
  options?: QuestionOptionSeed[];
  maxMarks?: number;
};

const QUESTION_EXTRACTION_PROMPT = `You are reading an exam question paper (a scanned image, a PDF, or plain text). The paper may mix regular written questions and multiple-choice questions.

Extract every question in the exact order they are printed. Rules:
- Preserve the original printed numbering exactly as shown (e.g. "1", "2", "11").
- If a question has labelled sub-parts (e.g. (a), (b), (i), (ii)), output each sub-part as its own entry. Each sub-part entry shares the same "number" as its parent question, and "subPart" holds just the sub-label without punctuation (e.g. "a", "i").
- If a question has no sub-parts, omit "subPart" entirely.
- "text" is the full question text (without the leading number/label, and without the option list for MCQs).
- If a question is multiple-choice (has lettered/numbered options like (a)/(b)/(c)/(d) or A)/B)/C)/D) to choose from), set "type" to "mcq" and include "options": an array of {"label": <the option's printed letter/number, e.g. "A">, "text": <that option's text>}, in printed order. Otherwise set "type" to "written" and omit "options".
- If the marks for a question are printed (e.g. "[2]", "(2 marks)"), include them as "maxMarks" (a number). Otherwise omit "maxMarks".
- Do not include section headers, instructions, or the paper's title as questions.
- Return questions in the same order they appear on the page(s).

Return only JSON matching the provided schema — no markdown fences, no commentary.`;

const QUESTION_OPTION_SCHEMA = {
  type: "object",
  properties: {
    label: { type: "string" },
    text: { type: "string" },
  },
  required: ["label", "text"],
};

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
          type: { type: "string", enum: ["written", "mcq"] },
          options: { type: "array", items: QUESTION_OPTION_SCHEMA },
          maxMarks: { type: "number" },
        },
        required: ["number", "text", "type"],
      },
    },
  },
  required: ["questions"],
};

export async function extractQuestionsFromPaper(
  fileBase64: string,
  mimeType: string
): Promise<QuestionSeed[]> {
  const parsed = await generateStructuredJson<{ questions?: unknown }>(
    [
      {
        role: "user",
        parts: [
          { text: QUESTION_EXTRACTION_PROMPT },
          { inlineData: { mimeType, data: fileBase64 } },
        ],
      },
    ],
    QUESTION_EXTRACTION_SCHEMA,
    "extracting questions"
  );

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
    overallFeedback: { type: "string" },
  },
  required: ["answers", "overallFeedback"],
};

type QuestionForPrompt = {
  number: string;
  subPart?: string;
  text: string;
  type: "written" | "mcq";
  options?: QuestionOptionSeed[];
  maxMarks?: number;
};

function buildAnswerMappingPrompt(questions: QuestionForPrompt[]): string {
  const hasMcq = questions.some((q) => q.type === "mcq");

  const list = questions
    .map((q) => {
      const label = q.subPart ? `${q.number} (${q.subPart})` : q.number;
      const marks = q.maxMarks ? ` [${q.maxMarks} marks]` : "";
      const header = `${label}: ${q.text}${marks}`;
      if (q.type === "mcq" && q.options?.length) {
        const opts = q.options.map((o) => `${o.label}) ${o.text}`).join("  ");
        return `${header}\n   Options: ${opts}`;
      }
      return header;
    })
    .join("\n");

  const mcqGuidance = hasMcq
    ? `\n\nSome questions above are multiple-choice (their options are listed under them). For these, the student's answer on the sheet may just be a single letter (e.g. "D"), a circled/underlined/ticked option, or the option's text copied out — any of these counts as an attempt, even though it's short. Locate wherever the student indicated their choice as the region. Grade by checking whether the option they indicated is the correct answer to the question, using the option text above to judge correctness — do not mark it wrong just because the answer itself is only one letter.`
    : "";

  return `You are given a scanned, handwritten student answer sheet (image or PDF, possibly multiple pages) and the list of exam questions below. Questions may be answered out of order.

Questions:
${list}

For each question in the list:
- Determine whether the student attempted it anywhere on the sheet.
- If attempted, find every region containing that answer. An answer may span multiple lines, or continue onto a later page — list one region per contiguous block of handwriting, in reading order. Tightly bound just the handwritten answer content, not the whole page.
- Each region is: {"page": <1-indexed page number matching the sheet's page order>, "x": <0-1>, "y": <0-1>, "width": <0-1>, "height": <0-1>} where x/y/width/height are FRACTIONS of that page's full width/height (top-left origin). Do not use a 0-1000 scale — use 0-1 fractions.
- Grade the answer against the question. If the question has a marks value shown above, score out of that; otherwise score out of ${DEFAULT_MAX_MARKS} and set maxMarks to ${DEFAULT_MAX_MARKS}. Give one sentence of specific, constructive feedback explaining the score.
- If not attempted anywhere on the sheet, set matched to false, regions to an empty array, omit score, and set feedback to "No answer found on the sheet for this question."${mcqGuidance}

Also list any handwritten content on the sheet that does NOT correspond to any question above (e.g. scratch work, an answer to a question not in this list, notes) as "unmatched" entries using the same region format plus a short "text" snippet of what it says.

Finally, write "overallFeedback": 2-3 sentences summarizing the student's performance across the whole exam — call out what they did well and what to work on, and keep it encouraging but honest. Base it only on the grading above, not on anything else.

Return only JSON matching the provided schema — no markdown fences, no commentary.`;
}

export async function mapAndGradeAnswers(
  fileBase64: string,
  mimeType: string,
  questions: QuestionForPrompt[]
): Promise<{ answers: AnswerSeed[]; unmatched: UnmatchedSeed[]; overallFeedback: string | null }> {
  const parsed = await generateStructuredJson<{
    answers?: unknown;
    unmatched?: unknown;
    overallFeedback?: unknown;
  }>(
    [
      {
        role: "user",
        parts: [
          { text: buildAnswerMappingPrompt(questions) },
          { inlineData: { mimeType, data: fileBase64 } },
        ],
      },
    ],
    ANSWER_MAPPING_SCHEMA,
    "mapping answers"
  );

  if (!Array.isArray(parsed.answers)) {
    throw new Error("Gemini's response was missing an 'answers' array.");
  }

  return {
    answers: parsed.answers as AnswerSeed[],
    unmatched: Array.isArray(parsed.unmatched) ? (parsed.unmatched as UnmatchedSeed[]) : [],
    overallFeedback: typeof parsed.overallFeedback === "string" ? parsed.overallFeedback : null,
  };
}
