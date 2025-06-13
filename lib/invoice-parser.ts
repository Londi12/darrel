import { InvoiceItem, Invoice } from '@/types';
import { getDocument } from '@/lib/pdf-loader';

interface PDFTextItem {
  str: string;
  transform: number[];
}

interface PDFPage {
  getTextContent(): Promise<{ items: PDFTextItem[] }>;
  getViewport(options: { scale: number }): {
    height: number;
    width: number;
  };
  render(options: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { height: number; width: number };
  }): { promise: Promise<void> };
}

export interface ParsedInvoice {
  items: InvoiceItem[];
  total: number;
  date: string;
  invoiceNumber?: string;
  clientInfo?: {
    name: string;
    address?: string;
    contactInfo?: string;
  };
  imageUrl?: string;
}

export async function parseInvoice(file: File): Promise<ParsedInvoice> {
  if (!(file instanceof File || file instanceof Blob)) {
    throw new TypeError('parseInvoice: file must be a File or Blob');
  }
  // First, save the image preview
  const imageUrl = await saveInvoiceImage(file);
  // Then parse the PDF content using existing pdf-loader
  const pdfData = await file.arrayBuffer();
  const loadingTask = await getDocument(new Uint8Array(pdfData));
  const doc = await loadingTask.promise;

  // Extract text content from the first page
  const page = await doc.getPage(1);
  const content = await page.getTextContent();
  const text = content.items.map(item => item.str).join(' ');

  // Parse the extracted text to get invoice details
  const parsedData = parseInvoiceText(text);
  
  return {
    ...parsedData,
    imageUrl,
  };
}

async function saveInvoiceImage(file: File): Promise<string> {
  if (!(file instanceof File || file instanceof Blob)) {
    throw new TypeError('saveInvoiceImage: file must be a File or Blob');
  }
  try {
    // Create a canvas to render the first page
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get canvas context');

    const pdfData = await file.arrayBuffer();
    const loadingTask = await getDocument(new Uint8Array(pdfData));
    const doc = await loadingTask.promise;
    const page = await doc.getPage(1);
    
    // Set canvas size to match PDF page
    const viewport = (page as any).getViewport({ scale: 1.0 });
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    // Render PDF page to canvas
    await (page as any).render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    // Convert canvas to image and save
    const imageUrl = canvas.toDataURL('image/png');
    
    // Store in localStorage for history
    const history = JSON.parse(localStorage.getItem('invoiceImageHistory') || '[]');
    history.unshift({
      url: imageUrl,
      date: new Date().toISOString(),
      name: file.name
    });
    localStorage.setItem('invoiceImageHistory', JSON.stringify(history.slice(0, 10))); // Keep last 10 images
    
    return imageUrl;
  } catch (error) {
    console.error('Failed to save invoice image:', error);
    return '';
  }
}

function parseInvoiceText(text: string): Omit<ParsedInvoice, 'imageUrl'> {
  // Extract basic invoice information using regex patterns
  const invoiceNumberMatch = text.match(/Invoice[:\s#]+([A-Z0-9-]+)/i);
  const dateMatch = text.match(/Date[:\s]+(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/i);
  const clientMatch = text.match(/Bill To[:\s]+([^\n]+)/i);
  
  // Initialize items array
  const items: InvoiceItem[] = [];
  
  // Look for item patterns in the text
  const itemPattern = /(\d+)\s+([^$]+?)\s+(\d+(?:\.\d{2})?)\s+(\d+(?:\.\d{2})?)/g;
  let match;
  while ((match = itemPattern.exec(text)) !== null) {
    items.push({
      id: (items.length + 1).toString(),
      quantity: parseFloat(match[1]),
      description: match[2].trim(),
      unit: '',
      rate: parseFloat(match[3]),
      amount: parseFloat(match[4]),
      category: 'default'
    });
  }
  // Calculate total
  const total = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  return {
    items,
    total,
    date: dateMatch ? dateMatch[1] : '',
    invoiceNumber: invoiceNumberMatch ? invoiceNumberMatch[1] : '',
    clientInfo: clientMatch ? { name: clientMatch[1] } : undefined,
  };
}

export function validateInvoice(invoice: ParsedInvoice): boolean {
  if (!invoice.items || invoice.items.length === 0) {
    return false;
  }
  
  if (invoice.total < 0) {
    return false;
  }
  
  if (!invoice.date) {
    return false;
  }
  
  return true;
}

export function calculateInvoiceTotal(items: InvoiceItem[]): number {
  return items.reduce((total, item) => {
    return total + (item.quantity * item.rate);
  }, 0);
}

export function formatInvoiceNumber(number: string): string {
  // Add standard formatting to invoice numbers
  // Example: INV-2025-0001
  if (!number) return '';
  
  if (number.startsWith('INV-')) {
    return number;
  }
  
  const cleaned = number.replace(/[^0-9]/g, '');
  const year = new Date().getFullYear();
  const paddedNumber = cleaned.padStart(4, '0');
  
  return `INV-${year}-${paddedNumber}`;
}
