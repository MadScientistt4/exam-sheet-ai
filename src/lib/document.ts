import { getPdfPageCount } from "@/lib/pdf";
import type { DocumentKind, UploadedDocument } from "@/types/exam";

export async function buildUploadedDocument(file: File): Promise<UploadedDocument> {
  const kind: DocumentKind = file.type === "application/pdf" ? "pdf" : "image";
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
