import { NextResponse } from "next/server";
import { extractQuestionsFromPaper } from "@/lib/gemini";
import { MAX_FILE_BYTES, MAX_FILE_LABEL, QUESTION_PAPER_TYPES } from "@/lib/upload-constraints";
import type { ExtractedQuestion } from "@/types/exam";

export const runtime = "nodejs";
// Retry + model-fallback can chain several Gemini calls; keep headroom under
// Vercel's Hobby-plan max (60s without Fluid Compute).
export const maxDuration = 60;

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data." }, { status: 400 });
  }

  const file = formData.get("questionPaper");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing 'questionPaper' file." }, { status: 400 });
  }
  if (!QUESTION_PAPER_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: `File exceeds the ${MAX_FILE_LABEL} limit.` }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const seeds = await extractQuestionsFromPaper(buffer.toString("base64"), file.type);

    const questions: ExtractedQuestion[] = seeds.map((seed) => ({
      id: `q-${seed.number}${seed.subPart ? `-${seed.subPart}` : ""}`,
      number: seed.number,
      subPart: seed.subPart,
      text: seed.text,
      type: seed.type === "mcq" ? "mcq" : "written",
      options: seed.type === "mcq" && seed.options ? seed.options : [],
      maxMarks: seed.maxMarks ?? null,
      matched: false,
      score: null,
      aiFeedback: null,
      regions: [],
    }));

    return NextResponse.json({ questions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Question extraction failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
