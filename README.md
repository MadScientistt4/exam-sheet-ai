# Exam Sheet AI

AI-assisted grading tool: upload a question paper and a student's handwritten answer sheet, extract questions and answers, map answers to questions, and highlight the exact answer region on the sheet.

Built with Next.js (App Router, TypeScript, Tailwind). AI extraction uses Google Gemini (`gemini-2.5-flash` by default) via `@google/genai`.

## Approach

Two-step pipeline, each step a real Gemini call:

1. **Question extraction** (`POST /api/extract-questions`) — the question paper (PDF, image, or plain `.txt`) is sent to Gemini with a JSON schema forcing structured output: printed number, sub-part label (e.g. `11` / `a`), question text, marks if printed on the paper, and — for multiple-choice questions — the option letters/text. `.txt` is accepted here as a convenience for a digital question paper — the answer sheet stays PDF/image-only since it's inherently a handwritten scan.
2. **Answer mapping + grading** (`POST /api/map-answers`) — the answer sheet plus the extracted question list (including any MCQ options) are sent to Gemini in one call. For each question it returns whether it was attempted, one bounding-box region per contiguous block of handwriting (as `0-1` fractions of that page, supporting answers that span multiple regions/pages), a score, and one-sentence feedback. For MCQs, a bare selected letter (e.g. "D") is resolved against that question's option text so it's graded for correctness, not just presence. Handwritten content that doesn't correspond to any question comes back as a separate `unmatched` list.

Everything is in-memory: uploaded files never touch a database, and exam state lives in a React context (`ExamStoreProvider`) that survives client-side navigation between `/exams/upload` and `/exams/mapping` but is lost on a hard refresh — that's an accepted tradeoff given the assignment's "in-memory storage is sufficient" scope, not an oversight.

Answer-sheet pages are rendered client-side from the uploaded file via `pdfjs-dist` (canvas), and the highlight regions are drawn as absolutely-positioned overlays scaled as percentages, so they track zoom automatically without needing pixel math.

**Reliability**: the free Gemini tier occasionally rate-limits or returns a transient 5xx. `src/lib/gemini.ts` handles this with a model fallback chain (configured `GEMINI_MODEL` → `gemini-2.5-flash` → `gemini-2.5-flash-lite` → `gemini-2.0-flash`, deduped) — a 500/503 gets one immediate retry on the same model, anything else (429, bad JSON, etc.) moves straight to the next model in the chain. Both extraction calls go through this same wrapper.

## Status

Core flow (upload → extract questions → map & grade answers → view side-by-side with highlighting) works end-to-end on desktop and is responsive down to mobile widths. Not yet done: the mobile mapping screen layout, and a persisted/shareable result (currently single-session, in-memory only).

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.example` to `.env.local` and add your Gemini API key:

```bash
cp .env.example .env.local
```

Get a free key at [Google AI Studio](https://aistudio.google.com/apikey). `GEMINI_MODEL` is optional (defaults to `gemini-2.5-flash`).

## Assumptions & limitations

- **Marks**: if a question's marks aren't printed on the paper, it defaults to 2 (`DEFAULT_MAX_MARKS` in `src/lib/gemini.ts`).
- **File size**: 10MB cap per file (PDF/PNG/JPG/WEBP), sent to Gemini as inline base64 — comfortably under Gemini's inline-request limit. Larger files would need the Files API instead.
- **Grading is a single LLM pass**, not a rubric-based system — feedback quality depends on how well Gemini can read the handwriting and judge correctness from the question text alone.
- **No persistence**: refreshing mid-session, or opening `/exams/mapping` directly, sends you back to upload — there's nothing to recover server-side by design.
