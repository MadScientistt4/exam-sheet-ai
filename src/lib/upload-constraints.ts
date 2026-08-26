export const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export function isAcceptedFile(file: File): boolean {
  return ACCEPTED_TYPES.includes(file.type);
}
