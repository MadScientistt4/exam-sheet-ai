export const IMAGE_AND_PDF_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
export const TEXT_TYPE = "text/plain";

/** Answer sheets are handwritten scans — PDF/image only. */
export const ANSWER_SHEET_TYPES = IMAGE_AND_PDF_TYPES;

/** Question papers may also be a plain text file (a digital paper, or handy for testing). */
export const QUESTION_PAPER_TYPES = [...IMAGE_AND_PDF_TYPES, TEXT_TYPE];

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
