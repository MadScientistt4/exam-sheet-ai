import { NextResponse } from "next/server";
import { extractQuestionsFromPaper } from "@/lib/gemini";
import { ACCEPTED_TYPES, MAX_FILE_BYTES } from "@/lib/upload-constraints";
import type { ExtractedQuestion } from "@/types/exam";

export const runtime = "nodejs";

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
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File exceeds the 10MB limit." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const seeds = await extractQuestionsFromPaper(buffer.toString("base64"), file.type);

    const questions: ExtractedQuestion[] = seeds.map((seed) => ({
      id: `q-${seed.number}${seed.subPart ? `-${seed.subPart}` : ""}`,
      number: seed.number,
      subPart: seed.subPart,
      text: seed.text,
      score: null,
      aiFeedback: null,
      answerPage: null,
    }));

    return NextResponse.json({ questions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Question extraction failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
