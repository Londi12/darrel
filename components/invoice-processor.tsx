"use client"

import React, { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Check, FileText, Upload, AlertCircle, ArrowRight, X, Info, Bug } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getDocument } from "@/lib/pdf-loader"
import { extractFirstPageAsPdf, saveFileToJobHistory } from "@/lib/pdf-utils"

interface ExtractedData {
  companyName: string
  projectTitle: string
  clientName: string
  location: string
  totalAmount: number
  items: BoQItem[]
  rawText?: string
}

interface BoQItem {
  id: number
  description: string
  unit: string
  quantity: number
  rate: number
  amount: number
  category: string
}

interface Job {
  id: string;
  title: string;
  client: string;
  location: string;
  budget: number;
  startDate: string;
  endDate: string;
  description: string;
  status: string;
  createdAt: string;
  invoice: {
    items: BoQItem[];
    total: number;
    company: string;
  };
}

export function InvoiceProcessor() {
  const { toast } = useToast()
  const [processingStage, setProcessingStage] = useState<"upload" | "processing" | "mapping" | "complete">("upload")
  const [processingProgress, setProcessingProgress] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const [showCreateJobDialog, setShowCreateJobDialog] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null)
  const [documentType, setDocumentType] = useState<string>("")
  const [parsingError, setParsingError] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [newJob, setNewJob] = useState({
    title: "",
    client: "",
    location: "",
    budget: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    description: "",
  })

  // Update newJob when showing the create job dialog
  useEffect(() => {
    if (showCreateJobDialog && extractedData) {
      setNewJob({
        title: extractedData.projectTitle || "",
        client: extractedData.clientName || "",
        location: extractedData.location || "",
        budget: extractedData.totalAmount || 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        description: `Project based on invoice from ${extractedData.companyName}\nItems:\n${extractedData.items.map(item => `- ${item.description}`).join('\n')}`,
      })
    }
  }, [showCreateJobDialog, extractedData])

  const handleFileUpload = async (file: File) => {
    if (!file) return
    
    setUploadedFile(file)
    setProcessingStage("processing")
    setProcessingProgress(25)

    try {
      // Initial validation
      if (!file.type.includes('pdf')) {
        throw new Error('Please upload a PDF file')
      }

      setProcessingProgress(50)
      
      // Extract text from PDF
      const extractedText = await parsePDF(file)
      
      setProcessingProgress(75)

      // Basic data extraction
      const data = extractDataFromText(extractedText)

      setExtractedData(data)
      setProcessingProgress(100)
      setProcessingStage("mapping")
      
      // Save first page as PDF to file history (if jobId is available after job creation, do it there)
      if (data && data.projectTitle) {
        // Use projectTitle as a temporary job key if no jobId yet
        const tempJobId = data.projectTitle.replace(/\s+/g, '_').toLowerCase() || 'temp_job';
        const firstPagePdf = await extractFirstPageAsPdf(file);
        await saveFileToJobHistory(tempJobId, firstPagePdf, file.name.replace(/\.pdf$/i, '_page1.pdf'));
      }
      
      toast({
        title: "PDF processed successfully",
        description: "The document has been processed and data extracted.",
      })
    } catch (error) {
      console.error('PDF processing error:', error)
      setParsingError(error instanceof Error ? error.message : 'Failed to process PDF')
      setProcessingStage("upload")
      
      toast({
        variant: "destructive",
        title: "Error processing PDF",
        description: error instanceof Error ? error.message : 'Failed to process PDF',
      })
    }
  }

  const parsePDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const data = new Uint8Array(arrayBuffer)
      const loadingTask = await getDocument(data)
      const pdf = await loadingTask.promise

      let fullText = ""
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const items = textContent.items.sort((a, b) => {
          const yDiff = b.transform[5] - a.transform[5]
          return Math.abs(yDiff) < 5 ? a.transform[4] - b.transform[4] : yDiff
        })

        let lastY = 0
        items.forEach((item: any) => {
          const y = item.transform[5]
          if (lastY && Math.abs(y - lastY) > 5) {
            fullText += "\n"
          }
          fullText += item.str + " "
          lastY = y
        })
        fullText += "\n\n"
      }

      return fullText
    } catch (error) {
      console.error("PDF parsing error:", error)
      throw new Error("Failed to parse PDF: " + (error instanceof Error ? error.message : "Unknown error"))
    }
  }

  const extractDataFromText = (text: string): ExtractedData => {
    const result: ExtractedData = {
      companyName: extractCompanyName(text),
      projectTitle: extractProjectTitle(text),
      clientName: extractClientName(text),
      location: extractLocation(text),
      totalAmount: extractTotalAmount(text),
      items: extractBoQItems(text),
      rawText: text,
    }
    return result
  }

  const extractCompanyName = (text: string): string => {
    const lines = text.split('\n')
    // Look for company name at the top of the document
    const buildingServicesIndex = text.indexOf('BUILDING SERVICES')
    if (buildingServicesIndex !== -1) {
      return 'PTP BUILDING SERVICES'
    }
    
    for (const line of lines.slice(0, 5)) {
      if (line.length > 0 && !line.match(/invoice|quotation|estimate/i)) {
        return line.trim()
      }
    }
    return ''
  }

  const extractProjectTitle = (text: string): string => {
    const lines = text.split('\n')
    
    // Look for bathroom renovation or similar project title
    const bathroomRenovationLine = lines.find(line => 
      line.trim() === 'Bathroom Renovation'
    )
    
    if (bathroomRenovationLine) {
      return bathroomRenovationLine.trim()
    }
    
    // Fallback to other project title formats
    const projectLine = lines.find(line => 
      line.toLowerCase().includes('project:') ||
      line.toLowerCase().includes('project name:') ||
      line.match(/renovation/i)
    )
    
    if (projectLine) {
      if (projectLine.toLowerCase().includes('project:')) {
        return projectLine.split(/project:/i)[1]?.trim() || ''
      }
      if (projectLine.toLowerCase().includes('project name:')) {
        return projectLine.split(/project name:/i)[1]?.trim() || ''
      }
      return projectLine.trim()
    }
    
    return ''
  }

  const extractClientName = (text: string): string => {
    const lines = text.split('\n')
    
    // Look for attention line which contains the client name
    const attentionLine = lines.find(line =>
      line.toLowerCase().includes('attention:')
    )
    
    if (attentionLine) {
      const match = attentionLine.match(/attention:\s*([^\n]+)/i)
      if (match && match[1]) {
        return match[1].trim()
      }
    }
    
    const clientLine = lines.find(line =>
      line.toLowerCase().includes('client:') ||
      line.toLowerCase().includes('customer:') ||
      line.toLowerCase().includes('bill to:')
    )
    
    if (clientLine) {
      return clientLine.split(/client:|customer:|bill to:/i)[1]?.trim() || ''
    }
    
    return ''
  }

  const extractLocation = (text: string): string => {
    const lines = text.split('\n')
    
    // Look for address line which contains the location
    const addressLine = lines.find(line =>
      line.toLowerCase().includes('address:')
    )
    
    if (addressLine) {
      // Get the next line which might contain the address
      const addressIndex = lines.findIndex(line => line.toLowerCase().includes('address:'))
      if (addressIndex !== -1 && addressIndex + 1 < lines.length) {
        const address = lines[addressIndex].split(/address:/i)[1]?.trim() || ''
        if (address) {
          return address
        }
        return lines[addressIndex + 1].trim()
      }
    }
    
    const locationLine = lines.find(line =>
      line.toLowerCase().includes('location:') ||
      line.toLowerCase().includes('site:') ||
      line.toLowerCase().includes('address:')
    )
    
    if (locationLine) {
      return locationLine.split(/location:|site:|address:/i)[1]?.trim() || ''
    }
    
    return ''
  }

  const extractTotalAmount = (text: string): number => {
    const lines = text.split('\n')
    
    // Debug the total amount extraction
    console.log('Extracting total amount from:', lines.slice(-20))
    
    // PTP Building Services specific format - they typically have a section at the bottom with
    // SUB TOTAL, VAT, and TOTAL in that order
    let foundSubTotal = false
    let foundVat = false
    
    // First pass: Look for the specific sequence of SUB TOTAL -> VAT -> TOTAL at the bottom
    for (let i = lines.length - 1; i >= Math.max(0, lines.length - 30); i--) {
      const line = lines[i].trim().toUpperCase()
      
      // Log the line being processed for debugging
      console.log(`[First pass] Processing line ${i}: ${line}`)
      
      if (line.includes('TOTAL') && !line.includes('SUB') && foundVat && foundSubTotal) {
        // This should be the final total after SUB TOTAL and VAT
        const numberMatch = line.match(/[R]?\s*(\d[\d,\s]*\.\d{2})/)
        if (numberMatch && numberMatch[1]) {
          const amount = parseFloat(numberMatch[1].replace(/[,\s]/g, ''))
          console.log(`Found final total after SUB TOTAL and VAT: ${amount}`)
          if (!isNaN(amount)) {
            return amount
          }
        }
      } else if (line.includes('VAT')) {
        foundVat = true
        console.log('Found VAT line')
      } else if ((line.includes('SUB TOTAL') || line.includes('SUBTOTAL'))) {
        foundSubTotal = true
        console.log('Found SUB TOTAL line')
      }
    }
    
    // Second pass: Look for specific patterns in PTP Building Services format
    const totalPatterns = [
      /TOTAL\s*[^\d]*([\d,]+\.\d{2})/i,  // TOTAL: 123,456.78
      /TOTAL\s*R\s*([\d,]+\.\d{2})/i,    // TOTAL R 123,456.78
      /R\s*([\d,]+\.\d{2})\s*TOTAL/i,    // R 123,456.78 TOTAL
      /([\d,]+\.\d{2})\s*TOTAL/i,        // 123,456.78 TOTAL
      /GRAND TOTAL[^\d]*([\d,]+\.\d{2})/i, // GRAND TOTAL: 123,456.78
      /TOTAL\s*AMOUNT[^\d]*([\d,]+\.\d{2})/i, // TOTAL AMOUNT: 123,456.78
      /TOTAL\s*INCL[^\d]*([\d,]+\.\d{2})/i,  // TOTAL INCL VAT: 123,456.78
      /TOTAL\s*EXCL[^\d]*([\d,]+\.\d{2})/i,  // TOTAL EXCL VAT: 123,456.78
      /TOTAL\s*DUE[^\d]*([\d,]+\.\d{2})/i,   // TOTAL DUE: 123,456.78
      /TOTAL\s*PRICE[^\d]*([\d,]+\.\d{2})/i, // TOTAL PRICE: 123,456.78
      /TOTAL\s*COST[^\d]*([\d,]+\.\d{2})/i,  // TOTAL COST: 123,456.78
      /TOTAL\s*INVOICE[^\d]*([\d,]+\.\d{2})/i, // TOTAL INVOICE: 123,456.78
      /TOTAL\s*QUOTATION[^\d]*([\d,]+\.\d{2})/i, // TOTAL QUOTATION: 123,456.78
      /TOTAL\s*QUOTE[^\d]*([\d,]+\.\d{2})/i,  // TOTAL QUOTE: 123,456.78
      /TOTAL\s*ESTIMATE[^\d]*([\d,]+\.\d{2})/i, // TOTAL ESTIMATE: 123,456.78
      /TOTAL\s*PAYMENT[^\d]*([\d,]+\.\d{2})/i, // TOTAL PAYMENT: 123,456.78
      /TOTAL\s*BALANCE[^\d]*([\d,]+\.\d{2})/i, // TOTAL BALANCE: 123,456.78
      /TOTAL\s*OUTSTANDING[^\d]*([\d,]+\.\d{2})/i, // TOTAL OUTSTANDING: 123,456.78
      /TOTAL\s*PAYABLE[^\d]*([\d,]+\.\d{2})/i, // TOTAL PAYABLE: 123,456.78
      /TOTAL\s*AMOUNT\s*PAYABLE[^\d]*([\d,]+\.\d{2})/i, // TOTAL AMOUNT PAYABLE: 123,456.78
      /TOTAL\s*AMOUNT\s*DUE[^\d]*([\d,]+\.\d{2})/i, // TOTAL AMOUNT DUE: 123,456.78
      /TOTAL\s*AMOUNT\s*OUTSTANDING[^\d]*([\d,]+\.\d{2})/i, // TOTAL AMOUNT OUTSTANDING: 123,456.78
      /TOTAL\s*AMOUNT\s*PAYABLE[^\d]*([\d,]+\.\d{2})/i, // TOTAL AMOUNT PAYABLE: 123,456.78
      /TOTAL\s*AMOUNT\s*QUOTED[^\d]*([\d,]+\.\d{2})/i, // TOTAL AMOUNT QUOTED: 123,456.78
      /TOTAL\s*AMOUNT\s*ESTIMATED[^\d]*([\d,]+\.\d{2})/i, // TOTAL AMOUNT ESTIMATED: 123,456.78
      /TOTAL\s*AMOUNT\s*INVOICED[^\d]*([\d,]+\.\d{2})/i, // TOTAL AMOUNT INVOICED: 123,456.78
      /TOTAL\s*AMOUNT\s*QUOTED[^\d]*([\d,]+\.\d{2})/i, // TOTAL AMOUNT QUOTED: 123,456.78
      /TOTAL\s*AMOUNT\s*ESTIMATED[^\d]*([\d,]+\.\d{2})/i, // TOTAL AMOUNT ESTIMATED: 123,456.78
      /TOTAL\s*AMOUNT\s*INVOICED[^\d]*([\d,]+\.\d{2})/i, // TOTAL AMOUNT INVOICED: 123,456.78
      /TOTAL\s*AMOUNT\s*QUOTED[^\d]*([\d,]+\.\d{2})/i, // TOTAL AMOUNT QUOTED: 123,456.78
      /TOTAL\s*AMOUNT\s*ESTIMATED[^\d]*([\d,]+\.\d{2})/i, // TOTAL AMOUNT ESTIMATED: 123,456.78
      /TOTAL\s*AMOUNT\s*INVOICED[^\d]*([\d,]+\.\d{2})/i, // TOTAL AMOUNT INVOICED: 123,456.78
    ]
    
    // Start from the bottom of the document and work upwards
    // This is more reliable for finding the final total
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim()
      
      // Skip empty lines
      if (!line) continue
      
      // Log the line being processed for debugging
      console.log(`[Second pass] Processing line ${i}: ${line}`)
      
      // Check if this line contains "TOTAL" but not "SUB TOTAL" or "VAT"
      if (line.toUpperCase().includes('TOTAL') && 
          !line.toUpperCase().includes('SUB TOTAL') && 
          !line.toUpperCase().includes('SUBTOTAL') && 
          !line.toUpperCase().includes('VAT')) {
        
        // Try each pattern to extract the amount
        for (const pattern of totalPatterns) {
          const match = line.match(pattern)
          if (match && match[1]) {
            const amount = parseFloat(match[1].replace(/[,\s]/g, ''))
            console.log(`Found total amount: ${amount} using pattern ${pattern}`)
            if (!isNaN(amount)) {
              return amount
            }
          }
        }
        
        // If patterns didn't work, try to find any number in the line
        const numberMatch = line.match(/[R]?\s*(\d[\d,\s]*\.\d{2})/)
        if (numberMatch && numberMatch[1]) {
          const amount = parseFloat(numberMatch[1].replace(/[,\s]/g, ''))
          console.log(`Found total amount using generic number match: ${amount}`)
          if (!isNaN(amount)) {
            return amount
          }
        }
      }
    }
    
    // Third pass: If we still haven't found a total, look for the last number in the document
    // that looks like a currency amount (has 2 decimal places)
    console.log('Using last resort method to find total amount')
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim()
      
      // Skip empty lines
      if (!line) continue
      
      // Log the line being processed for debugging
      console.log(`[Third pass] Processing line ${i}: ${line}`)
      
      // Look for currency amounts with R symbol
      const rCurrencyMatch = line.match(/R\s*(\d[\d,\s]*\.\d{2})/)
      if (rCurrencyMatch && rCurrencyMatch[1]) {
        const amount = parseFloat(rCurrencyMatch[1].replace(/[,\s]/g, ''))
        console.log(`Found amount with R symbol: ${amount}`)
        if (!isNaN(amount)) {
          return amount
        }
      }
      
      // Look for any number with 2 decimal places
      const currencyMatch = line.match(/(\d[\d,\s]*\.\d{2})/)
      if (currencyMatch && currencyMatch[1]) {
        const amount = parseFloat(currencyMatch[1].replace(/[,\s]/g, ''))
        console.log(`Found amount using last resort method: ${amount}`)
        if (!isNaN(amount)) {
          return amount
        }
      }
    }
    
    console.log('Failed to extract total amount')
    return 0
  }

  const extractBoQItems = (text: string): BoQItem[] => {
    const lines = text.split('\n')
    const items: BoQItem[] = []
    let currentCategory = ''
    let itemId = 1

    // Define categories exactly as they appear in the document
    const validCategories = [
      'Demolishing',
      'Ceiling Installation',
      'Brickwork',
      'Tiling installation',
      'Plumbing (supply and installation)',
      'Electrical Installation',
      'Paint'
    ]

    // Define unit mappings with proper display formats
    const unitMappings: { [key: string]: string } = {
      'm²': 'm²',
      'm2': 'm²',
      'item': 'item',
      'ea': 'ea',
      'no': 'no'
    }

    let inItemsSection = false
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Skip empty lines
      if (!line || line === '-') continue
      
      // Start capturing items after DESCRIPTION header
      if (!inItemsSection && 
          line.toLowerCase().includes('description') && 
          line.toLowerCase().includes('unit') &&
          line.toLowerCase().includes('qty') &&
          line.toLowerCase().includes('rate') &&
          line.toLowerCase().includes('total')) {
        inItemsSection = true
        continue
      }

      // Stop at totals section
      if (inItemsSection && (
          line.toLowerCase().startsWith('sub total') ||
          line.toLowerCase().startsWith('vat') ||
          line.toLowerCase().includes('total'))) {
        break
      }

      if (inItemsSection) {
        // Check for category headers
        const cleanLine = line.replace(/[:]/g, '').trim()
        for (const category of validCategories) {
          if (line.toLowerCase().includes(category.toLowerCase())) {
            currentCategory = category
            continue
          }
        }

        // Process item lines
        // Split by multiple spaces but preserve the structure
        const parts = line.split(/\s{2,}/).map(p => p.trim()).filter(Boolean)
        
        if (parts.length >= 4) {
          // Extract the last three numbers (qty, rate, amount)
          const numbers = parts
            .slice(-3)
            .map(n => parseFloat(n.replace(/[^\d.]/g, '')))
            .filter(n => !isNaN(n))

          if (numbers.length === 3) {
            const [quantity, rate, amount] = numbers

            // Get everything before the last three numbers as description
            const descAndUnit = parts.slice(0, -3).join(' ')
            
            // Extract unit from the dedicated unit column if available
            const unitColumnIndex = parts.findIndex(p => 
              Object.keys(unitMappings).includes(p.toLowerCase())
            )

            let unit = 'item' // default unit
            let description = descAndUnit

            if (unitColumnIndex !== -1) {
              // Use unit from the unit column
              const foundUnit = parts[unitColumnIndex].toLowerCase()
              unit = unitMappings[foundUnit] || foundUnit
              // Remove unit from description if it's in there
              description = parts
                .slice(0, unitColumnIndex)
                .concat(parts.slice(unitColumnIndex + 1, -3))
                .join(' ')
            } else if (description.includes('m²')) {
              // If m² is in the description, use it as the unit
              unit = 'm²'
              description = description.replace(/m²/g, '').trim()
            }

            // Clean up description
            description = description
              .replace(/\(PC:[^)]+\)/g, '') // Remove PC amounts
              .replace(/-\s*$/, '') // Remove trailing dash
              .replace(/^\s*-\s*/, '') // Remove leading dash
              .replace(/\s+/g, ' ') // Normalize spaces
              .trim()

            // Only add if we have valid data
            if (description && !isNaN(quantity) && !isNaN(rate) && !isNaN(amount)) {
              console.log('Adding item with category:', currentCategory, {
                description,
                unit,
                quantity,
                rate,
                amount
              });
              items.push({
                id: itemId++,
                description,
                unit,
                quantity,
                rate,
                amount,
                category: currentCategory || 'Uncategorized'
              })
            }
          }
        }
      }
    }

    return items
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      await handleFileUpload(e.target.files[0])
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const createJob = async () => {
    console.log("Creating job with data:", { newJob, extractedData });
    
    if (!extractedData) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No invoice data available"
      });
      return;
    }

    if (!newJob.title || !newJob.client || !newJob.startDate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields"
      });
      return;
    }

    try {
      // Create job object with required string ID
      const newJobData: Job = {
        id: Date.now().toString(),
        title: newJob.title,
        client: newJob.client,
        location: newJob.location,
        budget: newJob.budget,
        startDate: newJob.startDate,
        endDate: newJob.endDate || "",
        description: newJob.description || "",
        status: "active",
        createdAt: new Date().toISOString(),
        invoice: {
          items: extractedData.items,
          total: extractedData.totalAmount,
          company: extractedData.companyName
        }
      };

      console.log("New job data:", newJobData);

      // Get existing jobs or initialize empty array
      const savedJobs = localStorage.getItem('jobs');
      const existingJobs = savedJobs ? JSON.parse(savedJobs) : [];
      
      // Add new job
      existingJobs.push(newJobData);
      
      // Save back to localStorage
      localStorage.setItem('jobs', JSON.stringify(existingJobs));
      
      console.log("Saved jobs:", existingJobs);

      // Save first page PDF to job file history with real jobId
      if (uploadedFile) {
        const firstPagePdf = await extractFirstPageAsPdf(uploadedFile);
        await saveFileToJobHistory(newJobData.id, firstPagePdf, uploadedFile.name.replace(/\.pdf$/i, '_page1.pdf'));
      }

      // Show success message
      toast({
        title: "Success",
        description: "Job created successfully!"
      });

      // Close dialog and reset form
      setShowCreateJobDialog(false);
      setNewJob({
        title: "",
        client: "",
        location: "",
        budget: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: "",
        description: "",
      });
    } catch (error) {
      console.error("Error creating job:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create job. Please try again."
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invoice Processor</CardTitle>
          <CardDescription>Upload and process invoice documents</CardDescription>
        </CardHeader>
        <CardContent>
          {processingStage === "upload" && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.xls,.xlsx"
                onChange={handleFileInputChange}
              />
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold">Upload Invoice</h3>
              <p className="mt-1 text-sm text-gray-500">
                Drag and drop your invoice file, or{" "}
                <button
                  type="button"
                  className="text-blue-500 hover:text-blue-600"
                  onClick={triggerFileInput}
                >
                  browse
                </button>
              </p>
              <p className="mt-2 text-xs text-gray-500">PDF files up to 10MB</p>
            </div>
          )}

          {processingStage === "processing" && (
            <div className="text-center py-8">
              <Progress value={processingProgress} className="w-1/2 mx-auto" />
              <p className="mt-4 text-sm text-gray-600">Processing document...</p>
            </div>
          )}

          {processingStage === "mapping" && extractedData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium">Project Title</h3>
                  <p className="mt-1 text-sm text-gray-600">{extractedData.projectTitle}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Client</h3>
                  <p className="mt-1 text-sm text-gray-600">{extractedData.clientName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Location</h3>
                  <p className="mt-1 text-sm text-gray-600">{extractedData.location}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Total Amount</h3>
                  <p className="mt-1 text-sm text-gray-600">R {extractedData.totalAmount.toFixed(2)}</p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extractedData.items.length > 0 ? (
                    Object.entries(
                      extractedData.items.reduce((acc, item) => {
                        if (!acc[item.category]) {
                          acc[item.category] = [];
                        }
                        acc[item.category].push(item);
                        return acc;
                      }, {} as Record<string, typeof extractedData.items>)
                    ).map(([category, items]) => (
                      <React.Fragment key={category}>
                        {/* Category Header Row */}
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="bg-blue-50 dark:bg-blue-900/20 font-semibold text-blue-900 dark:text-blue-100 py-3"
                          >
                            {category || 'Uncategorized'}
                          </TableCell>
                        </TableRow>
                        {/* Item Rows */}
                        {items.map((item) => (
                          <TableRow key={item.id} className="border-b border-gray-100">
                            <TableCell className="max-w-xs break-words pl-8">
                              {item.description}
                            </TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>R {item.rate.toFixed(2)}</TableCell>
                            <TableCell>R {item.amount.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        <div className="flex flex-col items-center space-y-2">
                          <Info className="h-6 w-6 text-amber-500" />
                          <p>No items were extracted from the document.</p>
                          <p className="text-sm text-gray-500">Check the raw text in Preview to see the document content.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="flex justify-between mt-4">
                <div>
                  <Badge variant="outline" className="mr-2">
                    {extractedData.items.length} items extracted
                  </Badge>
                  {extractedData.items.length === 0 && (
                    <Badge variant="destructive">
                      Extraction failed
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <div className="bg-gray-50 p-4 rounded-md border space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">Sub Total</div>
                      <div className="font-medium">
                        R {extractedData.items.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">VAT (15%)</div>
                      <div className="font-medium">
                        R {(extractedData.items.reduce((sum, item) => sum + item.amount, 0) * 0.15).toFixed(2)}
                      </div>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <div className="font-medium">Total Amount</div>
                        <div className="text-xl font-bold">
                          R {extractedData.totalAmount.toFixed(2)}
                          {extractedData.totalAmount === 0 && (
                            <span className="text-sm text-red-500 ml-2">(Failed to extract)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between space-x-4 mt-4">
                <div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowDebug(!showDebug)}
                    className="flex items-center"
                  >
                    <Bug className="mr-1 h-4 w-4" />
                    {showDebug ? "Hide Debug Info" : "Show Debug Info"}
                  </Button>
                </div>
                <div className="flex space-x-4">
                  <Button variant="outline" onClick={() => setShowPreview(true)}>
                    <FileText className="mr-2 h-4 w-4" /> Preview Raw Text
                  </Button>
                  <Button onClick={() => setShowCreateJobDialog(true)}>
                    <ArrowRight className="mr-2 h-4 w-4" /> Create Job
                  </Button>
                </div>
              </div>

              {showDebug && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md border text-xs">
                  <h3 className="font-bold mb-2">Debug Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold">Extracted Data</h4>
                      <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40">
                        {JSON.stringify({
                          companyName: extractedData.companyName,
                          projectTitle: extractedData.projectTitle,
                          clientName: extractedData.clientName,
                          location: extractedData.location,
                          totalAmount: extractedData.totalAmount,
                          itemCount: extractedData.items.length
                        }, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <h4 className="font-semibold">First 3 Items</h4>
                      <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40">
                        {JSON.stringify(extractedData.items.slice(0, 3), null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {parsingError && (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
              <p className="mt-4 text-sm text-red-600">{parsingError}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Raw Text Preview</DialogTitle>
            <DialogDescription>
              This is the raw text extracted from the document. If the data in the table doesn't match this text,
              it means the automatic extraction needs improvement.
            </DialogDescription>
          </DialogHeader>
          {extractedData?.rawText ? (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium">Extracted Raw Text</h3>
                <Badge variant="outline">
                  {extractedData.rawText.split('\n').length} lines
                </Badge>
              </div>
              <pre className="p-4 bg-gray-50 rounded-lg overflow-auto max-h-96 text-sm whitespace-pre-wrap">
                {extractedData.rawText}
              </pre>
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              No text was extracted from the document.
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateJobDialog} onOpenChange={setShowCreateJobDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Job</DialogTitle>
            <DialogDescription>Create a job based on this invoice</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Job Title</Label>
              <Input
                value={newJob.title}
                onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                placeholder="Enter job title"
              />
            </div>
            <div className="space-y-2">
              <Label>Client</Label>
              <Input
                value={newJob.client}
                onChange={(e) => setNewJob({ ...newJob, client: e.target.value })}
                placeholder="Enter client name"
              />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={newJob.location}
                onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                placeholder="Enter location"
              />
            </div>
            <div className="space-y-2">
              <Label>Budget</Label>
              <Input
                type="number"
                value={newJob.budget}
                onChange={(e) => setNewJob({ ...newJob, budget: parseFloat(e.target.value) })}
                placeholder="Enter budget"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={newJob.startDate}
                  onChange={(e) => setNewJob({ ...newJob, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={newJob.endDate}
                  onChange={(e) => setNewJob({ ...newJob, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newJob.description}
                onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                placeholder="Enter job description"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => setShowCreateJobDialog(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={createJob}>
              Create Job
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}