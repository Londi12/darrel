// Using the official PDF.js build from the CDN
const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174'

interface PDFDocumentProxy {
  numPages: number
  getPage(pageNumber: number): Promise<PDFPageProxy>
}

interface PDFPageProxy {
  getTextContent(): Promise<PDFTextContent>
}

interface PDFTextContent {
  items: Array<{ str: string; transform: number[] }>
}

type PDFDocumentLoadingTask = {
  promise: Promise<PDFDocumentProxy>
}

declare global {
  interface Window {
    pdfjsLib: {
      getDocument: (data: Uint8Array | { data: Uint8Array }) => PDFDocumentLoadingTask
      GlobalWorkerOptions: { workerSrc: string }
    }
  }
}

let isLibraryLoaded = false

async function loadPDFLibrary() {
  if (typeof window === 'undefined') return
  if (isLibraryLoaded) return

  try {
    await Promise.all([
      loadScript(`${PDFJS_CDN}/pdf.min.js`),
      loadScript(`${PDFJS_CDN}/pdf.worker.min.js`)
    ])

    window.pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/pdf.worker.min.js`
    isLibraryLoaded = true
  } catch (error) {
    console.error('Failed to load PDF.js:', error)
    throw new Error('Failed to load PDF processing library')
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
    document.head.appendChild(script)
  })
}

export async function getDocument(data: Uint8Array): Promise<PDFDocumentLoadingTask> {
  if (typeof window === 'undefined') {
    throw new Error('PDF parsing is only available in the browser')
  }

  await loadPDFLibrary()

  try {
    return window.pdfjsLib.getDocument({ data })
  } catch (error) {
    console.error('Error loading PDF document:', error)
    throw new Error('Failed to load PDF document')
  }
}

export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const uint8Array = new Uint8Array(arrayBuffer)
  const loadingTask = await getDocument(uint8Array)
  const pdf = await loadingTask.promise

  let fullText = ''
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()
    
    // Group text items by their y-position (within a small threshold)
    const lineMap = new Map<number, Array<{text: string, x: number}>>()
    
    content.items.forEach(item => {
      const y = Math.round(item.transform[5])
      const x = item.transform[4]
      
      if (!lineMap.has(y)) {
        lineMap.set(y, [])
      }
      
      lineMap.get(y)!.push({
        text: item.str,
        x: x
      })
    })
    
    // Sort lines by y-position (top to bottom)
    const sortedYPositions = Array.from(lineMap.keys()).sort((a, b) => b - a)
    
    // For each line, sort text items by x-position (left to right) and join
    let pageText = ''
    sortedYPositions.forEach(y => {
      const line = lineMap.get(y)!
        .sort((a, b) => a.x - b.x)
        .map(item => item.text)
        .join(' ')
      
      pageText += line + '\n'
    })
    
    fullText += pageText + '\n'
  }

  console.log('Extracted PDF text:', fullText)
  return fullText
}
