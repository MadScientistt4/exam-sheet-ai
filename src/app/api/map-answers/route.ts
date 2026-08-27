import { NextResponse } from "next/server";
import { DEFAULT_MAX_MARKS, mapAndGradeAnswers } from "@/lib/gemini";
import { ANSWER_SHEET_TYPES, MAX_FILE_BYTES, MAX_FILE_LABEL } from "@/lib/upload-constraints";
import type {
  AnswerRegion,
  ExtractedQuestion,
  QuestionOption,
  QuestionType,
  UnmatchedAnswer,
} from "@/types/exam";

export const runtime = "nodejs";
// Retry + model-fallback can chain several Gemini calls; keep headroom under
// Vercel's Hobby-plan max (60s without Fluid Compute).
export const maxDuration = 60;

function clampFraction(n: unknown): number {
  const num = typeof n === "number" && Number.isFinite(n) ? n : 0;
  // Defend against a model that ignores the 0-1 instruction and uses a 0-1000 scale.
  const normalized = num > 1 ? num / 1000 : num;
  return Math.min(1, Math.max(0, normalized));
}

function toRegion(raw: unknown): AnswerRegion | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const page = typeof r.page === "number" && r.page > 0 ? Math.round(r.page) : null;
  if (!page) return null;
  return {
    page,
    x: clampFraction(r.x),
    y: clampFraction(r.y),
    width: clampFraction(r.width),
    height: clampFraction(r.height),
  };
}

// Small visual seam left between two adjacent regions rather than having them
// touch pixel-for-pixel.
const REGION_GAP = 0.008;

/**
 * The model is much more reliable at knowing where a block of handwriting
 * STARTS than where it precisely ENDS — dense, closely-written answers are
 * exactly where it tends to cut a region short. Rather than trust its guess
 * at the bottom edge, this stretches each region down to just before the
 * next region on the same page starts (across every question's regions and
 * any unmatched content), so an answer's full extent is always captured up
 * to the point the next thing on the page visibly begins. Never shrinks a
 * region — only extends one that's short.
 */
function extendRegionsToNextBoundary(regions: AnswerRegion[]): void {
  const byPage = new Map<number, AnswerRegion[]>();
  for (const region of regions) {
    const list = byPage.get(region.page);
    if (list) list.push(region);
    else byPage.set(region.page, [region]);
  }

  for (const pageRegions of byPage.values()) {
    pageRegions.sort((a, b) => a.y - b.y);
    for (let i = 0; i < pageRegions.length - 1; i++) {
      const current = pageRegions[i];
      const next = pageRegions[i + 1];
      const extendedBottom = Math.max(current.y + current.height, next.y - REGION_GAP);
      current.height = Math.max(0, Math.min(1 - current.y, extendedBottom - current.y));
    }
  }
}

type IncomingQuestion = {
  id: string;
  number: string;
  subPart?: string;
  text: string;
  type: QuestionType;
  options: QuestionOption[];
  maxMarks: number | null;
};

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data." }, { status: 400 });
  }

  const file = formData.get("answerSheet");
  const questionsRaw = formData.get("questions");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing 'answerSheet' file." }, { status: 400 });
  }
  if (!ANSWER_SHEET_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: `File exceeds the ${MAX_FILE_LABEL} limit.` }, { status: 400 });
  }
  if (typeof questionsRaw !== "string") {
    return NextResponse.json({ error: "Missing 'questions' field." }, { status: 400 });
  }

  let questions: IncomingQuestion[];
  try {
    questions = JSON.parse(questionsRaw);
    if (!Array.isArray(questions)) throw new Error();
  } catch {
    return NextResponse.json({ error: "'questions' must be a JSON array." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { answers, unmatched, overallFeedback } = await mapAndGradeAnswers(
      buffer.toString("base64"),
      file.type,
      questions.map((q) => ({
        number: q.number,
        subPart: q.subPart,
        text: q.text,
        type: q.type,
        options: q.options.length ? q.options : undefined,
        maxMarks: q.maxMarks ?? undefined,
      }))
    );

    const answerByKey = new Map(answers.map((a) => [`${a.number}::${a.subPart ?? ""}`, a]));

    const merged: ExtractedQuestion[] = questions.map((q) => {
      const seed = answerByKey.get(`${q.number}::${q.subPart ?? ""}`);
      if (!seed) {
        return {
          ...q,
          maxMarks: q.maxMarks ?? DEFAULT_MAX_MARKS,
          matched: false,
          score: null,
          aiFeedback: "No answer found on the sheet for this question.",
          regions: [],
        };
      }

      const regions = seed.regions.map(toRegion).filter((r): r is AnswerRegion => r !== null);
      // Extraction is the only step that actually reads the question paper, so
      // its maxMarks (including any even split across sub-parts) is authoritative —
      // grading is told what to score out of, not asked to redecide it.
      const maxMarks = q.maxMarks ?? DEFAULT_MAX_MARKS;
      const earned =
        seed.matched && typeof seed.score === "number"
          ? Math.max(0, Math.min(seed.score, maxMarks))
          : null;

      return {
        ...q,
        maxMarks,
        matched: seed.matched,
        regions,
        score: earned !== null ? { earned, total: maxMarks } : null,
        aiFeedback: seed.feedback,
      };
    });

    const unmatchedAnswers: UnmatchedAnswer[] = unmatched
      .map((u) => {
        const region = toRegion(u);
        if (!region) return null;
        return { ...region, text: typeof u.text === "string" ? u.text : "" };
      })
      .filter((u): u is UnmatchedAnswer => u !== null);

    extendRegionsToNextBoundary([
      ...merged.flatMap((q) => q.regions),
      ...unmatchedAnswers,
    ]);

    return NextResponse.json({ questions: merged, unmatched: unmatchedAnswers, overallFeedback });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Answer mapping failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
