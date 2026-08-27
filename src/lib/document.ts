import { getPdfPageCount } from "@/lib/pdf";
import type { DocumentKind, UploadedDocument } from "@/types/exam";

function kindOf(file: File): DocumentKind {
  if (file.type === "application/pdf") return "pdf";
  if (file.type === "text/plain") return "text";
  return "image";
}

export async function buildUploadedDocument(file: File): Promise<UploadedDocument> {
  const kind = kindOf(file);
  const pageCount = kind === "pdf" ? await getPdfPageCount(file) : 1;

  return {
    id: `${file.name}-${file.size}-${Date.now()}`,
    file,
    name: file.name,
    sizeBytes: file.size,
    kind,
    pageCount,
    previewUrl: URL.createObjectURL(file),
  };
}
