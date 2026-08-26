let workerConfigured = false;

async function loadPdfjs() {
  const pdfjsLib = await import("pdfjs-dist");
  if (!workerConfigured) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    workerConfigured = true;
  }
  return pdfjsLib;
}

export async function getPdfPageCount(file: File): Promise<number> {
  const pdfjsLib = await loadPdfjs();
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const doc = await loadingTask.promise;
  const pageCount = doc.numPages;
  await loadingTask.destroy();
  return pageCount;
}

export async function renderPdfPageToDataUrl(
  file: File,
  pageNumber: number,
  scale = 1.5
): Promise<string> {
  const pdfjsLib = await loadPdfjs();
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const doc = await loadingTask.promise;
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not get canvas context");

  await page.render({ canvas, canvasContext: context, viewport }).promise;
  const dataUrl = canvas.toDataURL("image/png");
  await loadingTask.destroy();
  return dataUrl;
}
