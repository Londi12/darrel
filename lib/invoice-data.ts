// Common invoice categories and items
export const invoiceCategories = [
  "Labor",
  "Materials",
  "Equipment",
  "Fixtures",
  "Finishes",
  "Electrical",
  "Plumbing",
  "HVAC",
  "Structural",
  "Site Work",
  "Permits & Fees",
  "Other"
];

export interface CommonInvoiceItem {
  description: string;
  category: string;
  defaultUnit: string;
  defaultRate?: number;
}

export const commonInvoiceItems: CommonInvoiceItem[] = [
  // Labor
  { description: "General Labor", category: "Labor", defaultUnit: "hours", defaultRate: 250 },
  { description: "Skilled Labor", category: "Labor", defaultUnit: "hours", defaultRate: 450 },
  { description: "Supervision", category: "Labor", defaultUnit: "hours", defaultRate: 550 },
  
  // Materials
  { description: "Cement", category: "Materials", defaultUnit: "bags", defaultRate: 120 },
  { description: "Sand", category: "Materials", defaultUnit: "m³", defaultRate: 450 },
  { description: "Gravel", category: "Materials", defaultUnit: "m³", defaultRate: 550 },
  { description: "Steel Reinforcement", category: "Materials", defaultUnit: "tons", defaultRate: 15000 },
  { description: "Bricks", category: "Materials", defaultUnit: "thousand", defaultRate: 2800 },
  { description: "Paint", category: "Materials", defaultUnit: "liters", defaultRate: 180 },
  
  // Equipment
  { description: "Excavator", category: "Equipment", defaultUnit: "days", defaultRate: 2500 },
  { description: "Concrete Mixer", category: "Equipment", defaultUnit: "days", defaultRate: 850 },
  { description: "Scaffolding", category: "Equipment", defaultUnit: "days", defaultRate: 450 },
  
  // Fixtures
  { description: "Light Fixtures", category: "Fixtures", defaultUnit: "units", defaultRate: 350 },
  { description: "Door Hardware", category: "Fixtures", defaultUnit: "sets", defaultRate: 750 },
  { description: "Window Frames", category: "Fixtures", defaultUnit: "units", defaultRate: 1200 },
  
  // Finishes
  { description: "Floor Tiles", category: "Finishes", defaultUnit: "m²", defaultRate: 450 },
  { description: "Wall Tiles", category: "Finishes", defaultUnit: "m²", defaultRate: 380 },
  { description: "Carpet", category: "Finishes", defaultUnit: "m²", defaultRate: 280 },
  
  // Electrical
  { description: "Wiring", category: "Electrical", defaultUnit: "m", defaultRate: 45 },
  { description: "Distribution Board", category: "Electrical", defaultUnit: "units", defaultRate: 3500 },
  { description: "Outlets", category: "Electrical", defaultUnit: "points", defaultRate: 180 },
  
  // Plumbing
  { description: "PVC Pipes", category: "Plumbing", defaultUnit: "m", defaultRate: 85 },
  { description: "Water Tank", category: "Plumbing", defaultUnit: "units", defaultRate: 2800 },
  { description: "Sanitary Fittings", category: "Plumbing", defaultUnit: "sets", defaultRate: 1500 },
];

// Function to get common items by category (legacy support)
export function getCommonItemsByCategory(category: string): CommonInvoiceItem[] {
  return commonInvoiceItems.filter(item => item.category === category);
}

// Function to search items
export function searchItems(query: string): CommonInvoiceItem[] {
  const lowerQuery = query.toLowerCase();
  return commonInvoiceItems.filter(
    item => 
      item.description.toLowerCase().includes(lowerQuery) ||
      item.category.toLowerCase().includes(lowerQuery)
  );
}

// Save custom items to localStorage
export function saveCustomItem(item: CommonInvoiceItem) {
  const customItems = getCustomItems();
  customItems.push(item);
  localStorage.setItem('customInvoiceItems', JSON.stringify(customItems));
}

// Get custom items from localStorage
export function getCustomItems(): CommonInvoiceItem[] {
  const saved = localStorage.getItem('customInvoiceItems');
  return saved ? JSON.parse(saved) : [];
}

// Get all items including custom items
export function getAllItems(): CommonInvoiceItem[] {
  return [...commonInvoiceItems, ...getCustomItems()];
}

export interface InvoiceCategory {
  id: string;
  name: string;
  description: string;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  name: string;
  description: string;
  unit: string;
  defaultRate: number;
  categoryId: string;
}

// Common invoice categories for construction projects
export const INVOICE_CATEGORIES: InvoiceCategory[] = [
  {
    id: "labor",
    name: "Labor",
    description: "Workforce and professional services",
    items: [
      {
        id: "general-labor",
        name: "General Labor",
        description: "Basic construction and site work",
        unit: "hour",
        defaultRate: 150,
        categoryId: "labor"
      },
      {
        id: "skilled-labor",
        name: "Skilled Labor",
        description: "Specialized construction work",
        unit: "hour",
        defaultRate: 250,
        categoryId: "labor"
      },
      {
        id: "supervisor",
        name: "Site Supervisor",
        description: "Project supervision and management",
        unit: "hour",
        defaultRate: 350,
        categoryId: "labor"
      }
    ]
  },
  {
    id: "materials",
    name: "Materials",
    description: "Construction materials and supplies",
    items: [
      {
        id: "concrete",
        name: "Concrete",
        description: "Ready-mix concrete",
        unit: "m³",
        defaultRate: 1200,
        categoryId: "materials"
      },
      {
        id: "steel",
        name: "Steel Reinforcement",
        description: "Rebar and structural steel",
        unit: "ton",
        defaultRate: 15000,
        categoryId: "materials"
      },
      {
        id: "bricks",
        name: "Bricks",
        description: "Standard construction bricks",
        unit: "1000",
        defaultRate: 4500,
        categoryId: "materials"
      }
    ]
  },
  {
    id: "equipment",
    name: "Equipment",
    description: "Construction equipment and machinery",
    items: [
      {
        id: "excavator",
        name: "Excavator",
        description: "Heavy excavation equipment",
        unit: "day",
        defaultRate: 3500,
        categoryId: "equipment"
      },
      {
        id: "crane",
        name: "Crane",
        description: "Mobile crane service",
        unit: "day",
        defaultRate: 5000,
        categoryId: "equipment"
      },
      {
        id: "generator",
        name: "Generator",
        description: "Power generator rental",
        unit: "day",
        defaultRate: 1200,
        categoryId: "equipment"
      }
    ]
  },
  {
    id: "services",
    name: "Services",
    description: "Professional and specialized services",
    items: [
      {
        id: "architect",
        name: "Architectural Services",
        description: "Design and planning",
        unit: "hour",
        defaultRate: 450,
        categoryId: "services"
      },
      {
        id: "engineer",
        name: "Engineering Services",
        description: "Structural and technical consulting",
        unit: "hour",
        defaultRate: 500,
        categoryId: "services"
      },
      {
        id: "surveyor",
        name: "Surveying",
        description: "Site surveying and measurements",
        unit: "day",
        defaultRate: 2500,
        categoryId: "services"
      }
    ]
  }
];

// Utility functions for invoice data
export const getInvoiceItemById = (itemId: string): InvoiceItem | undefined => {
  for (const category of INVOICE_CATEGORIES) {
    const item = category.items.find(item => item.id === itemId);
    if (item) return item;
  }
  return undefined;
};

export const getCategoryById = (categoryId: string): InvoiceCategory | undefined => {
  return INVOICE_CATEGORIES.find(category => category.id === categoryId);
};

export const getItemsByCategory = (categoryId: string): InvoiceItem[] => {
  const category = getCategoryById(categoryId);
  return category?.items || [];
};

// Helper to suggest items based on work log description
export const suggestInvoiceItems = (description: string): InvoiceItem[] => {
  const keywords = description.toLowerCase().split(' ');
  const suggestions: InvoiceItem[] = [];
  
  for (const category of INVOICE_CATEGORIES) {
    for (const item of category.items) {
      if (keywords.some(keyword => 
        item.name.toLowerCase().includes(keyword) || 
        item.description.toLowerCase().includes(keyword)
      )) {
        suggestions.push(item);
      }
    }
  }
  
  return suggestions;
};
