import type { AnswerPage, ExtractedQuestion } from "@/types/exam";

/**
 * Placeholder sample used to build out the mapping UI before the real
 * extraction pipeline (Gemini) is wired up. Shape mirrors what the
 * extraction API will eventually return.
 */
export const mockQuestions: ExtractedQuestion[] = [
  {
    id: "q1",
    number: "1",
    text: "What is the powerhouse of the cell?",
    score: { earned: 2, total: 2 },
    aiFeedback: "Correct — you named the mitochondria and its role in producing ATP.",
    answerPage: 1,
  },
  {
    id: "q2",
    number: "2",
    text: "Define osmosis in one sentence.",
    score: { earned: 1, total: 2 },
    aiFeedback: "Partially correct. The direction of movement (low to high solute concentration) is missing.",
    answerPage: 1,
  },
  {
    id: "q3",
    number: "3",
    text: "List two functions of the human liver.",
    score: { earned: 0, total: 2 },
    aiFeedback: "Only one vague function was given. Bile production and detoxification were not mentioned.",
    answerPage: 2,
  },
  {
    id: "q4",
    number: "4",
    text: "Draw and label a plant cell.",
    score: null,
    aiFeedback: "No answer found on the sheet for this question.",
    answerPage: null,
  },
  {
    id: "q5a",
    number: "5",
    subPart: "a",
    text: "State Newton's second law of motion.",
    score: { earned: 2, total: 2 },
    aiFeedback: "Correctly stated as F = ma.",
    answerPage: 2,
  },
  {
    id: "q5b",
    number: "5",
    subPart: "b",
    text: "Give one real-world example of Newton's second law.",
    score: { earned: 1, total: 2 },
    aiFeedback: "The example is valid but doesn't reference force or mass explicitly.",
    answerPage: 2,
  },
  {
    id: "q6",
    number: "6",
    text: "Explain why ice floats on water.",
    score: { earned: 2, total: 2 },
    aiFeedback: "Well explained — ice is less dense than liquid water.",
    answerPage: 2,
  },
];

export const mockAnswerPages: AnswerPage[] = [
  {
    page: 1,
    blocks: [
      {
        questionId: "q1",
        lines: [
          "Q1. The mitochondria is the powerhouse of the",
          "cell because it produces ATP through cellular",
          "respiration.",
        ],
      },
      {
        questionId: "q2",
        lines: ["Q2. Osmosis is the movement of water molecules", "from a region of low solute concentration."],
      },
      {
        questionId: null,
        lines: ["Note to self: revise diffusion before next test."],
      },
    ],
  },
  {
    page: 2,
    blocks: [
      {
        questionId: "q3",
        lines: ["Q3. The liver stores fat."],
      },
      {
        questionId: "q5a",
        lines: ["Q5 (a). F = ma is Newton's second law of motion."],
      },
      {
        questionId: "q5b",
        lines: [
          "Q5 (b). Pushing a shopping cart needs more force",
          "to make it accelerate faster.",
        ],
      },
      {
        questionId: "q6",
        lines: [
          "Q6. Ice floats because water expands when it",
          "freezes, making ice less dense than liquid water.",
        ],
      },
    ],
  },
];
