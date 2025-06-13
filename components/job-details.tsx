"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Clock, FileText, Users, Plus } from "lucide-react"
import { WorkEntry, Invoice, TeamMember, Job, WorkCost } from "./job-management"
import { DailyWorkLogDialog } from "./daily-work-log"
import { INVOICE_CATEGORIES, suggestInvoiceItems, getCategoryById } from "@/lib/invoice-data"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { parseInvoice } from "@/lib/invoice-parser"
import { FileHistoryEntry } from "@/types";
import { saveFileToIndexedDB, getFileFromIndexedDB } from "@/lib/file-db";

interface JobDetailsProps {
  job: Job;
  onUpdate: (job: Job) => void;
}

interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
}

export function JobDetails({ job, onUpdate }: JobDetailsProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("worklog")
  const [workLogs, setWorkLogs] = useState<WorkEntry[]>([])
  const [showWorkLogDialog, setShowWorkLogDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [viewDocUrl, setViewDocUrl] = useState<string | null>(null);
  const [viewDocType, setViewDocType] = useState<string | null>(null);
  const [showFileDialog, setShowFileDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null)

  const invoiceTemplates: InvoiceTemplate[] = [
    {
      id: "detailed",
      name: "Detailed Construction Quote",
      description: "Comprehensive quote with detailed breakdown of materials, labor, and equipment",
      preview: "/templates/detailed.png"
    },
    {
      id: "simple",
      name: "Simple Quote",
      description: "Basic quote template with essential line items and totals",
      preview: "/templates/simple.png"
    },
    {
      id: "progress",
      name: "Progress Invoice",
      description: "Template for progress billing with completion percentages",
      preview: "/templates/progress.png"
    }
  ];

  useEffect(() => {
    // Load work logs
    const savedWorkLogs = localStorage.getItem('workLogs')
    if (savedWorkLogs) {
      const parsedWorkLogs = JSON.parse(savedWorkLogs)
      const jobLogs = parsedWorkLogs.filter((log: WorkEntry) => log.jobId === job.id)
      setWorkLogs(jobLogs)
    }
  }, [job.id])

  const calculateTotalCosts = (costs: WorkCost) => {
    const materialCost = costs.materials.reduce((sum: number, item: any) => sum + (item.cost * item.quantity), 0)
    const laborCost = costs.labor.reduce((sum: number, item: any) => sum + (item.hours * item.rate), 0)
    const equipmentCost = costs.equipment.reduce((sum: number, item: any) => sum + item.cost, 0)
    return materialCost + laborCost + equipmentCost
  }

  const generateInvoice = async () => {
    if (!selectedTemplate) {
      setShowInvoiceDialog(true);
      return;
    }

    // Get completed work logs
    const completedLogs = workLogs.filter(log => log.status === "completed")
    
    // Group work logs by task and suggest invoice items
    const taskGroups = new Map<string, {
      logs: WorkEntry[],
      suggestedItems: ReturnType<typeof suggestInvoiceItems>
    }>
    
    completedLogs.forEach(log => {
      if (!taskGroups.has(log.task)) {
        taskGroups.set(log.task, {
          logs: [],
          suggestedItems: suggestInvoiceItems(log.task)
        })
      }
      taskGroups.get(log.task)!.logs.push(log)
    })

    // Create invoice items with suggested categories
    const items = Array.from(taskGroups.entries()).map(([task, { logs, suggestedItems }]) => {
      const totalHours = logs.reduce((sum, log) => sum + log.hoursWorked, 0)
      const totalCost = logs.reduce((sum, log) => sum + calculateTotalCosts(log.costs), 0)
      
      // Try to find a matching invoice item from suggestions
      const suggestedItem = suggestedItems[0]
      const category = suggestedItem ? getCategoryById(suggestedItem.categoryId) : undefined

      // Format items based on template
      if (selectedTemplate === 'detailed') {
        return {
          description: task,
          quantity: totalHours,
          unit: suggestedItem?.unit || "hours",
          rate: (totalCost * 1.2) / totalHours,
          category: category?.name || "Labor",
          materials: logs.flatMap(log => log.costs.materials),
          labor: logs.flatMap(log => log.costs.labor),
          equipment: logs.flatMap(log => log.costs.equipment)
        }
      } else if (selectedTemplate === 'progress') {
        const totalBudget = job.budget || 0;
        const completionPercentage = (totalCost / totalBudget) * 100;
        return {
          description: task,
          quantity: 1,
          unit: "lot",
          rate: totalCost * 1.2,
          category: category?.name || "Labor",
          completionPercentage: Math.min(completionPercentage, 100),
          previouslyBilled: 0 // This should be calculated from previous invoices
        }
      } else {
        // Simple template
        return {
          description: task,
          quantity: totalHours,
          unit: suggestedItem?.unit || "hours",
          rate: (totalCost * 1.2) / totalHours,
          category: category?.name || "Labor"
        }
      }
    })

    // Import data from original invoice if available
    const originalInvoice = job.invoices.find((inv: Invoice) => inv.type === "original");
    if (originalInvoice) {
      // Add any missing items from original invoice that aren't covered by work logs
      const existingDescriptions = new Set(items.map(item => item.description));
      const additionalItems = originalInvoice.items
        .filter(item => !existingDescriptions.has(item.description))
        .map(item => ({
          ...item,
          note: "Imported from original invoice"
        }));
      items.push(...additionalItems);
    }

    const newInvoice: Invoice = {
      id: Date.now().toString(),
      jobId: job.id,
      date: new Date().toISOString(),
      items,
      total: items.reduce((sum, item) => sum + (item.quantity * item.rate), 0),
      company: job.client,
      type: "generated",
      templateType: selectedTemplate,
      originalDocument: originalInvoice?.originalDocument
    }

    // Update job with new invoice and recalculate values
    const updatedJob = {
      ...job,
      invoices: [...job.invoices, newInvoice],
      completedValue: job.completedValue + newInvoice.total,
      actualCost: job.actualCost + items.reduce((sum, item) => sum + (item.quantity * item.rate / 1.2), 0),
      profitMargin: ((job.completedValue + newInvoice.total - (job.actualCost + items.reduce((sum, item) => sum + (item.quantity * item.rate / 1.2), 0))) / (job.completedValue + newInvoice.total)) * 100
    }
    
    onUpdate(updatedJob)
    setSelectedTemplate(null)
    setShowInvoiceDialog(false)

    toast({
      title: "Invoice Generated",
      description: `New invoice has been created using the ${invoiceTemplates.find(t => t.id === selectedTemplate)?.name} template.`,
    })
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      setIsUploading(true)
      const fileId = Date.now().toString();
      // Save file data to IndexedDB
      await saveFileToIndexedDB(job.id, fileId, file);
      // Save only metadata in localStorage
      const newEntry: FileHistoryEntry = {
        id: fileId,
        name: file.name,
        type: file.type,
        url: '', // Will be loaded on demand
        uploadedAt: new Date().toISOString(),
      };
      const updatedJob: Job = {
        ...job,
        fileHistory: [newEntry, ...(job.fileHistory || [])],
      };
      onUpdate(updatedJob);
      setShowUploadDialog(false);
      toast({
        title: "File Uploaded",
        description: "The file has been added to this job's file history.",
      });
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload file. Please try again.",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Helper to open the document preview dialog
  const handleViewDocument = async (invoice: Invoice) => {
    // Try to find a matching file in fileHistory by name or id
    const fileEntry = (job.fileHistory || []).find(f => f.name === invoice.company || f.name === invoice.id || invoice.originalDocument?.includes(f.name));
    if (fileEntry) {
      const blob = await getFileFromIndexedDB(job.id, fileEntry.id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        setViewDocUrl(url);
        setViewDocType(fileEntry.type.includes('pdf') ? 'pdf' : 'text');
        return;
      }
    }
    // fallback: try to use originalDocument if present
    if (invoice.originalDocument) {
      let url = invoice.originalDocument;
      let type = 'text';
      if (url.startsWith('data:application/pdf') || url.endsWith('.pdf')) {
        type = 'pdf';
      } else if (url.startsWith('data:')) {
        if (url.includes('application/pdf')) type = 'pdf';
        else if (url.includes('text/plain')) type = 'text';
      }
      setViewDocUrl(url);
      setViewDocType(type);
      return;
    }
    setViewDocUrl(null);
    setViewDocType(null);
    toast({ title: 'Error', description: 'Document not found in file history or invoice.' });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div>
            <Label>Total Invoiced</Label>
            <p className="text-2xl font-bold">
              R{job.invoices.reduce((sum, inv) => sum + inv.total, 0).toLocaleString()}
            </p>
          </div>
          <div>
            <Label>Completed Value</Label>
            <p className="text-2xl font-bold">R{job.completedValue.toLocaleString()}</p>
          </div>
          <div>
            <Label>Actual Cost</Label>
            <p className="text-2xl font-bold">R{job.actualCost.toLocaleString()}</p>
          </div>
          <div>
            <Label>Profit Margin</Label>
            <p className="text-2xl font-bold">{job.profitMargin.toFixed(2)}%</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="worklog">
              <Clock className="w-4 h-4 mr-2" />
              Work Log
            </TabsTrigger>
            <TabsTrigger value="invoices">
              <FileText className="w-4 h-4 mr-2" />
              Invoice History
            </TabsTrigger>
            <TabsTrigger value="team">
              <Users className="w-4 h-4 mr-2" />
              Team
            </TabsTrigger>
          </TabsList>

          <TabsContent value="worklog">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Work Log Entries</h3>
                <Button onClick={() => setShowWorkLogDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Log Work
                </Button>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Worker</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Costs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{format(new Date(log.date), "MMM d, yyyy")}</TableCell>
                      <TableCell>{log.worker}</TableCell>
                      <TableCell>{log.task}</TableCell>
                      <TableCell>{log.hoursWorked}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            log.status === "completed"
                              ? "default"
                              : log.status === "in-progress"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>R{calculateTotalCosts(log.costs).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="invoices">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Invoice History</h3>
                <div className="space-x-2">
                  {!job.invoices.some(inv => inv.type === "original") && (
                    <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <FileText className="w-4 h-4 mr-2" />
                          Upload Original Invoice
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Upload Original Invoice</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            Upload a text file containing the original invoice. The system will attempt to parse it automatically.
                          </p>
                          <Input
                            ref={fileInputRef}
                            type="file"
                            accept=".txt,.pdf"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                          />
                          {isUploading && (
                            <p className="text-sm text-muted-foreground">
                              Uploading and parsing invoice...
                            </p>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  <Button onClick={generateInvoice}>
                    <Plus className="w-4 h-4 mr-2" />
                    Generate Invoice
                  </Button>
                </div>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Categories</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {job.invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{format(new Date(invoice.date), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <Badge variant={invoice.type === "original" ? "default" : "secondary"}>
                          {invoice.type}
                        </Badge>
                      </TableCell>
                      <TableCell>R{invoice.total.toLocaleString()}</TableCell>
                      <TableCell>{invoice.items.length} items</TableCell>
                      <TableCell>
                        {Array.from(new Set(invoice.items.map(item => item.category))).join(", ")}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">View Details</Button>
                          {invoice.type === "original" && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => handleViewDocument(invoice)}>
                                  View Document
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Original Invoice Document</DialogTitle>
                                  <DialogDescription>
                                    Preview of the uploaded original invoice document for this job.
                                  </DialogDescription>
                                </DialogHeader>
                                {viewDocUrl && viewDocType === 'pdf' && (
                                  <iframe src={viewDocUrl} width="100%" height="600px" title="Invoice PDF Preview" />
                                )}
                                {viewDocUrl && viewDocType === 'text' && (
                                  <pre className="whitespace-pre-wrap max-h-[600px] overflow-auto bg-muted p-4 rounded">
                                    {viewDocUrl.startsWith('data:') ? atob(viewDocUrl.split(',')[1]) : viewDocUrl}
                                  </pre>
                                )}
                                {!viewDocUrl && <p>No document available.</p>}
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold mb-2">File History</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(job.fileHistory || []).map((file: FileHistoryEntry) => (
                    <TableRow key={file.id}>
                      <TableCell>{file.name}</TableCell>
                      <TableCell>{file.type}</TableCell>
                      <TableCell>{format(new Date(file.uploadedAt), "MMM d, yyyy")}</TableCell>                      <TableCell>
                        <Button variant="outline" size="sm" onClick={async () => {
                          const blob = await getFileFromIndexedDB(job.id, file.id);
                          if (blob) {
                            const url = URL.createObjectURL(blob);
                            setViewDocUrl(url);
                            setViewDocType(file.type.includes('pdf') ? 'pdf' : 'text');
                            setShowFileDialog(true);
                          } else {
                            toast({ title: 'Error', description: 'File not found in storage.' });
                          }
                        }}>
                          View
                        </Button>
                        <a href="#" onClick={async (e) => {
                          e.preventDefault();
                          const blob = await getFileFromIndexedDB(job.id, file.id);
                          if (blob) {
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = file.name;
                            a.click();
                            URL.revokeObjectURL(url);
                          } else {
                            toast({ title: 'Error', description: 'File not found in storage.' });
                          }
                        }} className="ml-2 text-blue-600 underline text-sm">Download</a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="team">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Team Members</h3>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Team Member
                </Button>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Hours Worked</TableHead>
                    <TableHead>Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {job.team.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>{member.name}</TableCell>
                      <TableCell>{member.role}</TableCell>
                      <TableCell>R{member.hourlyRate.toLocaleString()}/hr</TableCell>
                      <TableCell>{member.totalHoursWorked}</TableCell>
                      <TableCell>
                        R{(member.hourlyRate * member.totalHoursWorked).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        <DailyWorkLogDialog
          isOpen={showWorkLogDialog}
          onClose={() => setShowWorkLogDialog(false)}
          job={job}
          onWorkLogged={() => {
            setShowWorkLogDialog(false);
            // Refresh work logs
            const savedWorkLogs = localStorage.getItem('workLogs');
            if (savedWorkLogs) {
              const parsedWorkLogs = JSON.parse(savedWorkLogs);
              const jobLogs = parsedWorkLogs.filter((log: WorkEntry) => log.jobId === job.id);
              setWorkLogs(jobLogs);
            }
          }}
        />

        {/* Add Dialog for file preview (outside the Table) */}
        <Dialog open={showFileDialog} onOpenChange={setShowFileDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>File Preview</DialogTitle>
              <DialogDescription>Preview of the selected file from file history.</DialogDescription>
            </DialogHeader>
            {viewDocUrl && viewDocType === 'pdf' && (
              <iframe src={viewDocUrl} width="100%" height="600px" title="File PDF Preview" />
            )}
            {viewDocUrl && viewDocType === 'text' && (
              <pre className="whitespace-pre-wrap max-h-[600px] overflow-auto bg-muted p-4 rounded">
                {viewDocUrl.startsWith('data:') ? atob(viewDocUrl.split(',')[1]) : viewDocUrl}
              </pre>
            )}
            {!viewDocUrl && <p>No document available.</p>}
          </DialogContent>
        </Dialog>

        {/* Template Selection Dialog */}
        <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
          <DialogContent className="sm:max-w-[900px]">
            <DialogHeader>
              <DialogTitle>Choose Invoice Template</DialogTitle>
              <DialogDescription>
                Select a template for your new invoice. You can customize it after generation.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-4 py-4">
              {invoiceTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
                    selectedTemplate === template.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <div className="aspect-video mb-4 bg-muted rounded-md overflow-hidden">
                    <img
                      src={template.preview}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-semibold mb-2">{template.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {template.description}
                  </p>
                  {selectedTemplate === template.id && (
                    <div className="absolute inset-0 border-2 border-primary rounded-lg bg-primary/5" />
                  )}
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedTemplate(null);
                  setShowInvoiceDialog(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={generateInvoice}
                disabled={!selectedTemplate}
              >
                Generate Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
