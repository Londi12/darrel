"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, Edit, Trash2, FileText, DollarSign } from "lucide-react"

interface Invoice {
  id: number
  invoiceNumber: string
  jobTitle: string
  client: string
  date: string
  dueDate: string
  status: "draft" | "sent" | "paid" | "overdue"
  subtotal: number
  tax: number
  total: number
}

interface BoQItem {
  id: number
  invoiceId: number
  description: string
  unit: string
  quantity: number
  rate: number
  amount: number
  category: string
}

export function InvoiceManagement() {
  const { toast } = useToast()

  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: 1,
      invoiceNumber: "INV-001",
      jobTitle: "Bathroom Renovation",
      client: "John Smith",
      date: "2024-06-01",
      dueDate: "2024-06-30",
      status: "sent",
      subtotal: 11720,
      tax: 1758,
      total: 13478,
    },
  ])

  const [boqItems, setBoqItems] = useState<BoQItem[]>([
    {
      id: 1,
      invoiceId: 1,
      description: "Supply and fit new porcelain floor tiles",
      unit: "m²",
      quantity: 5,
      rate: 240.0,
      amount: 1200.0,
      category: "Floor installation",
    },
    {
      id: 2,
      invoiceId: 1,
      description: "Supply and fit new wall tiles",
      unit: "m²",
      quantity: 18,
      rate: 240.0,
      amount: 4320.0,
      category: "Wall installation",
    },
    {
      id: 3,
      invoiceId: 1,
      description: "Supply and fit new vanity unit",
      unit: "item",
      quantity: 1,
      rate: 1200.0,
      amount: 1200.0,
      category: "Fixture installation",
    },
    {
      id: 4,
      invoiceId: 1,
      description: "Supply and fit new toilet",
      unit: "item",
      quantity: 1,
      rate: 850.0,
      amount: 850.0,
      category: "Fixture installation",
    },
    {
      id: 5,
      invoiceId: 1,
      description: "Supply and fit new shower",
      unit: "item",
      quantity: 1,
      rate: 1800.0,
      amount: 1800.0,
      category: "Fixture installation",
    },
    {
      id: 6,
      invoiceId: 1,
      description: "Remove existing bathroom fixtures",
      unit: "item",
      quantity: 1,
      rate: 650.0,
      amount: 650.0,
      category: "Demolition",
    },
    {
      id: 7,
      invoiceId: 1,
      description: "Electrical work for new lighting",
      unit: "item",
      quantity: 1,
      rate: 750.0,
      amount: 750.0,
      category: "Electrical",
    },
    {
      id: 8,
      invoiceId: 1,
      description: "Plumbing connections",
      unit: "item",
      quantity: 1,
      rate: 950.0,
      amount: 950.0,
      category: "Plumbing",
    },
  ])

  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)
  const [showBoqDialog, setShowBoqDialog] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [editingBoqItem, setEditingBoqItem] = useState<BoQItem | null>(null)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number>(1)

  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({
    invoiceNumber: "",
    jobTitle: "",
    client: "",
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
    status: "draft",
    subtotal: 0,
    tax: 0,
    total: 0,
  })

  const [newBoqItem, setNewBoqItem] = useState<Partial<BoQItem>>({
    invoiceId: 1,
    description: "",
    unit: "",
    quantity: 0,
    rate: 0,
    amount: 0,
    category: "",
  })

  const handleAddInvoice = () => {
    if (newInvoice.invoiceNumber && newInvoice.jobTitle && newInvoice.client) {
      const invoice: Invoice = {
        id: Math.max(...invoices.map((i) => i.id), 0) + 1,
        invoiceNumber: newInvoice.invoiceNumber || "",
        jobTitle: newInvoice.jobTitle || "",
        client: newInvoice.client || "",
        date: newInvoice.date || new Date().toISOString().split("T")[0],
        dueDate: newInvoice.dueDate || "",
        status: (newInvoice.status as Invoice["status"]) || "draft",
        subtotal: newInvoice.subtotal || 0,
        tax: newInvoice.tax || 0,
        total: newInvoice.total || 0,
      }
      setInvoices([...invoices, invoice])
      resetInvoiceDialog()
      toast({
        title: "Invoice Created",
        description: `Invoice "${invoice.invoiceNumber}" has been successfully created.`,
      })
    }
  }

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setNewInvoice(invoice)
    setShowInvoiceDialog(true)
  }

  const handleUpdateInvoice = () => {
    if (editingInvoice && newInvoice.invoiceNumber && newInvoice.jobTitle && newInvoice.client) {
      const updatedInvoice: Invoice = {
        ...editingInvoice,
        invoiceNumber: newInvoice.invoiceNumber || "",
        jobTitle: newInvoice.jobTitle || "",
        client: newInvoice.client || "",
        date: newInvoice.date || editingInvoice.date,
        dueDate: newInvoice.dueDate || "",
        status: (newInvoice.status as Invoice["status"]) || "draft",
        subtotal: newInvoice.subtotal || 0,
        tax: newInvoice.tax || 0,
        total: newInvoice.total || 0,
      }
      setInvoices(invoices.map((i) => (i.id === editingInvoice.id ? updatedInvoice : i)))
      resetInvoiceDialog()
      toast({
        title: "Invoice Updated",
        description: `Invoice "${updatedInvoice.invoiceNumber}" has been successfully updated.`,
      })
    }
  }

  const handleDeleteInvoice = (invoiceId: number) => {
    const invoice = invoices.find((i) => i.id === invoiceId)
    const relatedBoqItems = boqItems.filter((item) => item.invoiceId === invoiceId)

    setInvoices(invoices.filter((i) => i.id !== invoiceId))
    setBoqItems(boqItems.filter((item) => item.invoiceId !== invoiceId))

    toast({
      title: "Invoice Deleted",
      description: `Invoice "${invoice?.invoiceNumber}" and ${relatedBoqItems.length} BoQ items have been deleted.`,
      variant: "destructive",
    })
  }

  const handleAddBoqItem = () => {
    if (newBoqItem.description && newBoqItem.unit && newBoqItem.quantity && newBoqItem.rate) {
      const amount = (newBoqItem.quantity || 0) * (newBoqItem.rate || 0)
      const boqItem: BoQItem = {
        id: Math.max(...boqItems.map((item) => item.id), 0) + 1,
        invoiceId: newBoqItem.invoiceId || selectedInvoiceId,
        description: newBoqItem.description || "",
        unit: newBoqItem.unit || "",
        quantity: newBoqItem.quantity || 0,
        rate: newBoqItem.rate || 0,
        amount: amount,
        category: newBoqItem.category || "",
      }
      setBoqItems([...boqItems, boqItem])
      resetBoqDialog()
      toast({
        title: "BoQ Item Added",
        description: `"${boqItem.description}" has been added to the invoice.`,
      })
    }
  }

  const handleEditBoqItem = (boqItem: BoQItem) => {
    setEditingBoqItem(boqItem)
    setNewBoqItem(boqItem)
    setShowBoqDialog(true)
  }

  const handleUpdateBoqItem = () => {
    if (editingBoqItem && newBoqItem.description && newBoqItem.unit && newBoqItem.quantity && newBoqItem.rate) {
      const amount = (newBoqItem.quantity || 0) * (newBoqItem.rate || 0)
      const updatedBoqItem: BoQItem = {
        ...editingBoqItem,
        description: newBoqItem.description || "",
        unit: newBoqItem.unit || "",
        quantity: newBoqItem.quantity || 0,
        rate: newBoqItem.rate || 0,
        amount: amount,
        category: newBoqItem.category || "",
      }
      setBoqItems(boqItems.map((item) => (item.id === editingBoqItem.id ? updatedBoqItem : item)))
      resetBoqDialog()
      toast({
        title: "BoQ Item Updated",
        description: `"${updatedBoqItem.description}" has been successfully updated.`,
      })
    }
  }

  const handleDeleteBoqItem = (boqItemId: number) => {
    const boqItem = boqItems.find((item) => item.id === boqItemId)
    setBoqItems(boqItems.filter((item) => item.id !== boqItemId))
    toast({
      title: "BoQ Item Deleted",
      description: `"${boqItem?.description}" has been successfully deleted.`,
      variant: "destructive",
    })
  }

  const resetInvoiceDialog = () => {
    setEditingInvoice(null)
    setNewInvoice({
      invoiceNumber: "",
      jobTitle: "",
      client: "",
      date: new Date().toISOString().split("T")[0],
      dueDate: "",
      status: "draft",
      subtotal: 0,
      tax: 0,
      total: 0,
    })
    setShowInvoiceDialog(false)
  }

  const resetBoqDialog = () => {
    setEditingBoqItem(null)
    setNewBoqItem({
      invoiceId: selectedInvoiceId,
      description: "",
      unit: "",
      quantity: 0,
      rate: 0,
      amount: 0,
      category: "",
    })
    setShowBoqDialog(false)
  }

  const selectedInvoice = invoices.find((inv) => inv.id === selectedInvoiceId)
  const selectedBoqItems = boqItems.filter((item) => item.invoiceId === selectedInvoiceId)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
            <p className="text-xs text-muted-foreground">Active invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R
              {invoices
                .filter((inv) => inv.status === "sent")
                .reduce((sum, inv) => sum + inv.total, 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Pending payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R
              {invoices
                .filter((inv) => inv.status === "paid")
                .reduce((sum, inv) => sum + inv.total, 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Received payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R
              {invoices
                .filter((inv) => inv.status === "overdue")
                .reduce((sum, inv) => sum + inv.total, 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Invoice Management</CardTitle>
              <CardDescription>Create and manage construction invoices</CardDescription>
            </div>
            <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingInvoice(null)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingInvoice ? "Edit Invoice" : "Create New Invoice"}</DialogTitle>
                  <DialogDescription>
                    {editingInvoice ? "Update invoice details" : "Create a new invoice for a construction job"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="invoiceNumber">Invoice Number</Label>
                      <Input
                        id="invoiceNumber"
                        value={newInvoice.invoiceNumber}
                        onChange={(e) => setNewInvoice({ ...newInvoice, invoiceNumber: e.target.value })}
                        placeholder="INV-001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={newInvoice.status}
                        onValueChange={(value) => setNewInvoice({ ...newInvoice, status: value as Invoice["status"] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">Job Title</Label>
                      <Input
                        id="jobTitle"
                        value={newInvoice.jobTitle}
                        onChange={(e) => setNewInvoice({ ...newInvoice, jobTitle: e.target.value })}
                        placeholder="Bathroom Renovation"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="client">Client</Label>
                      <Input
                        id="client"
                        value={newInvoice.client}
                        onChange={(e) => setNewInvoice({ ...newInvoice, client: e.target.value })}
                        placeholder="Client name"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Invoice Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newInvoice.date}
                        onChange={(e) => setNewInvoice({ ...newInvoice, date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={newInvoice.dueDate}
                        onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subtotal">Subtotal (R)</Label>
                      <Input
                        id="subtotal"
                        type="number"
                        value={newInvoice.subtotal}
                        onChange={(e) => setNewInvoice({ ...newInvoice, subtotal: Number(e.target.value) })}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tax">Tax (R)</Label>
                      <Input
                        id="tax"
                        type="number"
                        value={newInvoice.tax}
                        onChange={(e) => setNewInvoice({ ...newInvoice, tax: Number(e.target.value) })}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="total">Total (R)</Label>
                      <Input
                        id="total"
                        type="number"
                        value={newInvoice.total}
                        onChange={(e) => setNewInvoice({ ...newInvoice, total: Number(e.target.value) })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={resetInvoiceDialog}>
                    Cancel
                  </Button>
                  <Button onClick={editingInvoice ? handleUpdateInvoice : handleAddInvoice}>
                    {editingInvoice ? "Update Invoice" : "Create Invoice"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id} className={selectedInvoiceId === invoice.id ? "bg-muted/50" : ""}>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.jobTitle}</TableCell>
                  <TableCell>{invoice.client}</TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>{invoice.dueDate}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        invoice.status === "paid"
                          ? "default"
                          : invoice.status === "sent"
                            ? "secondary"
                            : invoice.status === "overdue"
                              ? "destructive"
                              : "outline"
                      }
                    >
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>R{invoice.total.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedInvoiceId(invoice.id)}>
                        View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEditInvoice(invoice)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete invoice "{invoice.invoiceNumber}"? This will also delete
                              all associated BoQ items.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteInvoice(invoice.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedInvoice && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Bill of Quantities - {selectedInvoice.invoiceNumber}</CardTitle>
                <CardDescription>
                  {selectedInvoice.jobTitle} for {selectedInvoice.client}
                </CardDescription>
              </div>
              <Dialog open={showBoqDialog} onOpenChange={setShowBoqDialog}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingBoqItem(null)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add BoQ Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingBoqItem ? "Edit BoQ Item" : "Add BoQ Item"}</DialogTitle>
                    <DialogDescription>
                      {editingBoqItem ? "Update BoQ item details" : "Add a new item to the Bill of Quantities"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newBoqItem.description}
                        onChange={(e) => setNewBoqItem({ ...newBoqItem, description: e.target.value })}
                        placeholder="Supply and fit new porcelain floor tiles"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="unit">Unit</Label>
                        <Input
                          id="unit"
                          value={newBoqItem.unit}
                          onChange={(e) => setNewBoqItem({ ...newBoqItem, unit: e.target.value })}
                          placeholder="m², item, etc."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Input
                          id="category"
                          value={newBoqItem.category}
                          onChange={(e) => setNewBoqItem({ ...newBoqItem, category: e.target.value })}
                          placeholder="Floor installation"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          value={newBoqItem.quantity}
                          onChange={(e) => setNewBoqItem({ ...newBoqItem, quantity: Number(e.target.value) })}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rate">Rate (R)</Label>
                        <Input
                          id="rate"
                          type="number"
                          step="0.01"
                          value={newBoqItem.rate}
                          onChange={(e) => setNewBoqItem({ ...newBoqItem, rate: Number(e.target.value) })}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount (R)</Label>
                        <Input
                          id="amount"
                          type="number"
                          value={(newBoqItem.quantity || 0) * (newBoqItem.rate || 0)}
                          readOnly
                          className="bg-muted"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={resetBoqDialog}>
                      Cancel
                    </Button>
                    <Button onClick={editingBoqItem ? handleUpdateBoqItem : handleAddBoqItem}>
                      {editingBoqItem ? "Update Item" : "Add Item"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedBoqItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">R{item.rate.toFixed(2)}</TableCell>
                    <TableCell className="text-right">R{item.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditBoqItem(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete BoQ Item</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this BoQ item?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteBoqItem(item.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 flex justify-end">
              <div className="text-right space-y-2">
                <div className="text-lg font-semibold">
                  Total: R{selectedBoqItems.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
