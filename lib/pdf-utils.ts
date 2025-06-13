import { PDFDocument } from 'pdf-lib';

/**
 * Extracts the first page of a PDF file and returns a new PDF Blob containing only that page.
 */
export async function extractFirstPageAsPdf(file: File): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const srcPdf = await PDFDocument.load(arrayBuffer);
  const newPdf = await PDFDocument.create();
  const [firstPage] = await newPdf.copyPages(srcPdf, [0]);
  newPdf.addPage(firstPage);
  const pdfBytes = await newPdf.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * Saves a file to the job's file history in localStorage (or update to IndexedDB for large files).
 */
export async function saveFileToJobHistory(jobId: string, file: Blob, fileName: string) {
  const reader = new FileReader();
  reader.onload = () => {
    const base64 = reader.result as string;
    const key = `jobFileHistory_${jobId}`;
    const history = JSON.parse(localStorage.getItem(key) || '[]');
    history.unshift({
      name: fileName,
      date: new Date().toISOString(),
      data: base64,
      type: file.type
    });
    localStorage.setItem(key, JSON.stringify(history.slice(0, 20)));
  };
  reader.readAsDataURL(file);
}
