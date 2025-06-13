export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  category: string;
}

export interface Invoice {
  id: string;
  jobId: string;
  number: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes: string;
  status: 'draft' | 'sent' | 'paid';
  originalDocument?: string; // Base64 of original PDF
}

export interface MaterialUsed {
  id: string;
  name: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface EquipmentUsed {
  id: string;
  name: string;
  hours: number;
  ratePerHour: number;
  totalCost: number;
}

export interface WorkEntry {
  id: string;
  jobId: string;
  date: string;
  worker: string;
  task: string;
  hoursWorked: number;
  description: string;
  materials: MaterialUsed[];
  equipment: EquipmentUsed[];
  laborRate: number;
  totalCost: number;
  status: 'completed' | 'in-progress' | 'delayed';
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  hourlyRate: number;
  assignedDate: string;
  skills: string[];
  contact: string;
}

export interface FileHistoryEntry {
  id: string;
  name: string;
  type: string;
  url: string; // base64 or blob URL
  uploadedAt: string;
}

export interface Job {
  id: string;
  title: string;
  client: string;
  location: string;
  status: 'active' | 'completed' | 'on-hold' | 'cancelled';
  budget: number;
  startDate: string;
  endDate: string;
  description: string;
  team: TeamMember[];
  invoices: Invoice[];
  totalInvoiced: number;
  completedValue: number;
  actualCost: number;
  profitMargin: number;
  fileHistory?: FileHistoryEntry[];
}
