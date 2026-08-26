import { GoogleGenAI } from "@google/genai";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

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

export type QuestionSeed = {
  number: string;
  subPart?: string;
  text: string;
};

const QUESTION_EXTRACTION_PROMPT = `You are reading a scanned exam question paper (image or PDF).

Extract every question in the exact order they are printed. Rules:
- Preserve the original printed numbering exactly as shown (e.g. "1", "2", "11").
- If a question has labelled sub-parts (e.g. (a), (b), (i), (ii)), output each sub-part as its own entry. Each sub-part entry shares the same "number" as its parent question, and "subPart" holds just the sub-label without punctuation (e.g. "a", "i").
- If a question has no sub-parts, omit "subPart" entirely.
- "text" is the full question text (without the leading number/label).
- Do not include section headers, marks/points annotations, instructions, or the paper's title as questions.
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

  const raw = response.text;
  if (!raw) throw new Error("Gemini returned an empty response.");

  let parsed: { questions?: unknown };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Gemini returned a response that wasn't valid JSON.");
  }

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
