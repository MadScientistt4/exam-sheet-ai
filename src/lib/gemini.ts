import { GoogleGenAI, type ContentListUnion } from "@google/genai";

export const DEFAULT_MAX_MARKS = 2;

// Models tried in order. The "-latest" names are Google's rolling aliases for
// their current recommended models — using them (instead of only a dated name
// like "gemini-2.0-flash") avoids silently breaking again the next time a
// specific model version is retired. Lite variants go first: for this
// structured-extraction/grading task they're both accurate enough and far
// faster (~1s vs ~12s for full flash in testing), which also matters for
// staying under Vercel's function timeout. The full flash-latest is kept as a
// last-resort fallback for capability, not speed.
const MODEL_CHAIN = Array.from(
  new Set([
    process.env.GEMINI_MODEL || "gemini-flash-lite-latest",
    "gemini-flash-lite-latest",
    "gemini-3.5-flash-lite",
    "gemini-flash-latest",
  ])
);

// Bounds any single model call so one slow/hanging attempt can't consume the
// entire request budget and starve the fallbacks behind it.
const PER_CALL_TIMEOUT_MS = 20_000;

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

/**
 * Runs a Gemini call across the model fallback chain, one try per model, and
 * moves straight to the next model on any failure. No same-model retry —
 * this call is already the slow leg of the request on Vercel's function
 * timeout, so doubling up on a single model would only make that worse for
 * no real reliability gain (a failed attempt falls through to the next model
 * either way). Throws the last error if every model fails.
 */
async function generateStructuredJson<T>(
  contents: ContentListUnion,
  responseJsonSchema: object,
  label: string
): Promise<T> {
  const ai = getClient();
  let lastError: unknown;

  for (const model of MODEL_CHAIN) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          responseMimeType: "application/json",
          responseJsonSchema,
          abortSignal: AbortSignal.timeout(PER_CALL_TIMEOUT_MS),
        },
      });
      return parseJsonResponse<T>(response.text, label);
    } catch (error) {
      lastError = error;
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
- If a question has labelled sub-parts (e.g. (a), (b), (i), (ii)), output ONLY the sub-part entries — never a separate entry for the parent/stem text itself, even if that stem reads like a complete sentence on its own. Each sub-part entry shares the same "number" as its parent question, and "subPart" holds just the sub-label without punctuation (e.g. "a", "i"). Any shared instruction or context in the stem (e.g. "Answer the following about X:") belongs in each sub-part's own "text" only if needed to make that sub-part understandable alone; otherwise leave it out.
- If a question has no sub-parts, omit "subPart" entirely.
- "text" is the full question text (without the leading number/label, and without the option list for MCQs).
- If a question is multiple-choice (has lettered/numbered options like (a)/(b)/(c)/(d) or A)/B)/C)/D) to choose from), set "type" to "mcq" and include "options": an array of {"label": <the option's printed letter/number, e.g. "A">, "text": <that option's text>}, in printed order. Otherwise set "type" to "written" and omit "options".
- Marks: if a sub-part has its OWN individually printed marks (e.g. "(a) [2]", "(b) [3]"), use that exact value as its "maxMarks". If a question has sub-parts but only ONE combined marks value is printed for the whole question (e.g. "5. Explain X. [5] (a) ... (b) ... (c) ..." with no per-part breakdown), divide that total as evenly as possible across its sub-parts and give any remainder to the earlier sub-parts (e.g. 5 marks over 3 sub-parts → 2, 2, 1) — every sub-part must get its own share, never the full parent total. If a question has no sub-parts, use the printed marks directly. If no marks are printed anywhere for a question, omit "maxMarks" entirely.
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
- If attempted, find every region containing that answer. An answer may span multiple lines, or continue onto a later page — list one region per contiguous block of handwriting, in reading order. Bound the handwritten answer content closely top and bottom, but on each line a student only ever writes one answer, so it's safe (and preferred) to extend a region's right edge to the line's full writing width rather than cropping tightly right where the ink happens to end — cutting off the last word or two is worse than including a little trailing whitespace.
- Students often re-write the question (sometimes with their own numbering, which may not match the numbers above — match by content/meaning, not by number) immediately before their answer, with the next question's re-written text starting right after with little or no gap. Be precise about where THIS answer actually starts and ends: the top edge must begin at this answer's own first line (its re-written question or "Ans"/"A." label if present, otherwise its first word) — never include the tail end of the previous answer above it. The bottom edge must include every line of this answer through its true last line — never stop early and cut off its final line(s) just because the next question's text is close below. When two answers are written close together, look for the next question's re-written label as the hard boundary between them, and split the region there rather than anywhere before it.
- Each region is: {"page": <1-indexed page number matching the sheet's page order>, "x": <0-1>, "y": <0-1>, "width": <0-1>, "height": <0-1>} where x/y/width/height are FRACTIONS of that page's full width/height (top-left origin). Do not use a 0-1000 scale — use 0-1 fractions.
- Grade the answer against the question. If the question has a marks value shown above, score out of exactly that value — it is already the correct max for this specific question or sub-part, so do not adjust it. If no marks value is shown, score out of ${DEFAULT_MAX_MARKS}. Give one sentence of specific, constructive feedback explaining the score.
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
