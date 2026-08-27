# Exam Sheet AI

AI-assisted grading tool: upload a question paper and a student's handwritten answer sheet, extract questions and answers, map answers to questions, and highlight the exact answer region on the sheet.

Built with Next.js (App Router, TypeScript, Tailwind). AI extraction uses Google Gemini (`gemini-2.5-flash` by default) via `@google/genai`.

## Approach

Two-step pipeline, each step a real Gemini call:

1. **Question extraction** (`POST /api/extract-questions`) — the question paper (PDF, image, or plain `.txt`) is sent to Gemini with a JSON schema forcing structured output: printed number, sub-part label (e.g. `11` / `a`), question text, marks if printed on the paper, and — for multiple-choice questions — the option letters/text. `.txt` is accepted here as a convenience for a digital question paper — the answer sheet stays PDF/image-only since it's inherently a handwritten scan.
2. **Answer mapping + grading** (`POST /api/map-answers`) — the answer sheet plus the extracted question list (including any MCQ options) are sent to Gemini in one call. For each question it returns whether it was attempted, one bounding-box region per contiguous block of handwriting (as `0-1` fractions of that page, supporting answers that span multiple regions/pages), a score, and one-sentence feedback. For MCQs, a bare selected letter (e.g. "D") is resolved against that question's option text so it's graded for correctness, not just presence. Handwritten content that doesn't correspond to any question comes back as a separate `unmatched` list. The same call also returns a 2-3 sentence `overallFeedback` — a holistic summary of the student's performance across the whole exam — so there's no extra round-trip for it.

The mapping screen shows a dedicated grading summary (score, correct/partial/incorrect/unanswered breakdown, and the overall feedback) above the question list and answer sheet panels, rather than a single-line score subtitle.

Everything is in-memory: uploaded files never touch a database, and exam state lives in a React context (`ExamStoreProvider`) that survives client-side navigation between `/exams/upload` and `/exams/mapping` but is lost on a hard refresh — that's an accepted tradeoff given the assignment's "in-memory storage is sufficient" scope, not an oversight.

Answer-sheet pages are rendered client-side from the uploaded file via `pdfjs-dist` (canvas), and the highlight regions are drawn as absolutely-positioned overlays scaled as percentages, so they track zoom automatically without needing pixel math.

**Reliability**: free-tier Gemini access has turned out to be genuinely unstable during this project — a specific dated model (`gemini-2.0-flash`) got retired outright (404), and separately `gemini-2.5-flash-lite` became "no longer available to new users" (also 404) while `gemini-2.5-flash` hit its rate limit (429), all within the same API key. `src/lib/gemini.ts` handles this with a model fallback chain (configured `GEMINI_MODEL` → `gemini-flash-lite-latest` → `gemini-3.5-flash-lite` → `gemini-flash-latest`, deduped) — any failure moves straight to the next model, one try each, no same-model retry, and each call is bounded by a 20s `abortSignal` so one slow attempt can't starve the fallbacks behind it. The `-latest` names are Google's rolling aliases for their current recommended models, so the default path shouldn't go stale the same way again. The lite models are tried first: verified in testing to be both accurate enough for this structured-extraction task and dramatically faster (~1-2s vs ~12s for full flash) — which also matters for the timeout issue below. Both extraction calls go through this same wrapper.

**Function timeout**: `/api/map-answers` is the heavy call (full answer sheet + region detection + grading + overall feedback, potentially multi-page) and both routes set `maxDuration = 60` — the max Vercel's Hobby plan allows without Fluid Compute. The lite-first model chain above is the main fix for this, since it cut typical latency roughly 5-10x; the per-call abort timeout and the earlier same-model-retry removal both exist to keep worst-case latency bounded under that 60s ceiling too. If a single Gemini call is itself slow enough to exceed the ceiling on a large real scan, the next lever is enabling Fluid Compute in the Vercel project settings (raises the ceiling to 300s) — that's a dashboard change, not code.

## Status

Core flow (upload → extract questions → map & grade answers → view side-by-side with highlighting, plus a dedicated grading summary and overall feedback) works end-to-end on desktop and mobile, including MCQ questions and a mobile Questions/Answer Sheet tab view. Verified against real scanned handwritten answer sheets, including one spanning multiple pages — not just synthetic test documents. Not yet done:

- **Deployment** — code is ready (see below), but not actually deployed anywhere yet.
- **Single combined PDF** (questions + answers in one file) — not wired up; would need a small prompt change plus a "same file for both" UI affordance.

### Deploying to Vercel

The code is ready for Vercel specifically:
- File size cap is 4MB (under Vercel's hard 4.5MB serverless request-body limit).
- Both API routes set `maxDuration = 60` to give the retry/model-fallback chain room, since Hobby plan otherwise defaults to a 10s timeout.
- Both routes already run on `runtime = "nodejs"` (required for `Buffer`), and the PDF.js worker loads from a CDN client-side, so nothing else is Vercel-specific.

What's left is dashboard configuration, not code: connect this repo as a new Vercel project (zero-config Next.js detection), and set `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`) as environment variables in the Vercel project settings — `.env`/`.env.local` are gitignored on purpose and won't ship with the deploy.

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
- **File size**: 4MB cap per file (PDF/PNG/JPG/WEBP) — chosen to fit under Vercel's 4.5MB serverless request-body limit, well under Gemini's own inline-request limit. Larger files would need the Files API plus a direct-to-storage upload path.
- **Grading is a single LLM pass**, not a rubric-based system — feedback quality depends on how well Gemini can read the handwriting and judge correctness from the question text alone.
- **No persistence**: refreshing mid-session, or opening `/exams/mapping` directly, sends you back to upload — there's nothing to recover server-side by design.
