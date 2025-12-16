export enum InventoryStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DISCONTINUED = 'DISCONTINUED',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  LOW_STOCK = 'LOW_STOCK',
}

export enum UnitOfMeasurement {
  GRAMS = 'GRAMS',
  KILOGRAMS = 'KILOGRAMS',
  POUNDS = 'POUNDS',
  MILLILITERS = 'MILLILITERS',
  LITERS = 'LITERS',
  GALLONS = 'GALLONS',
  CENTIMETERS = 'CENTIMETERS',
  METERS = 'METERS',
  INCHES = 'INCHES',
  FEET = 'FEET',
  PIECES = 'PIECES',
  SETS = 'SETS',
  BOXES = 'BOXES',
  PACKAGES = 'PACKAGES',
  BOTTLES = 'BOTTLES',
  CANS = 'CANS',
  BAGS = 'BAGS',
  SQUARE_METERS = 'SQUARE_METERS',
  SQUARE_FEET = 'SQUARE_FEET',
  HOURS = 'HOURS',
  DAYS = 'DAYS',
  EACH = 'EACH',
}

export enum InventoryCategoryType {
  GENERAL = 'GENERAL',
  OFFICE_SUPPLIES = 'OFFICE_SUPPLIES',
  ELECTRONICS = 'ELECTRONICS',
  FURNITURE = 'FURNITURE',
  BOOKS_MATERIALS = 'BOOKS_MATERIALS',
  FOOD_BEVERAGES = 'FOOD_BEVERAGES',
  CLEANING_SUPPLIES = 'CLEANING_SUPPLIES',
  MEDICAL_SUPPLIES = 'MEDICAL_SUPPLIES',
  MUSICAL_INSTRUMENTS = 'MUSICAL_INSTRUMENTS',
  SOUND_EQUIPMENT = 'SOUND_EQUIPMENT',
  DECORATIONS = 'DECORATIONS',
  UNIFORMS_CLOTHING = 'UNIFORMS_CLOTHING',
  VEHICLES = 'VEHICLES',
  MAINTENANCE = 'MAINTENANCE',
  GIFTS_DONATIONS = 'GIFTS_DONATIONS',
}

export interface InventoryCategory {
  _id: string;
  name: string;
  description?: string;
  type: InventoryCategoryType;
  code: string;
  color?: string;
  icon?: string;
  parentCategory?: InventoryCategory;
  isActive: boolean;
  sortOrder: number;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  updatedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  children?: InventoryCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  _id: string;
  name: string;
  description?: string;
  itemCode: string;
  barcode?: string;
  category: InventoryCategory;
  brand?: string;
  model?: string;
  serialNumber?: string;
  unitOfMeasurement: UnitOfMeasurement;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  reorderLevel: number;
  unitCost: number;
  currency: string;
  status: InventoryStatus;
  assignedUnit?: {
    _id: string;
    name: string;
    type: string;
  };
  assignedDistrict?: {
    _id: string;
    name: string;
    type: string;
  };
  location?: string;
  supplier?: string;
  supplierContact?: string;
  purchaseDate?: string;
  expiryDate?: string;
  warrantyExpiry?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  imageUrls?: string[];
  documentUrls?: string[];
  customFields?: Record<string, any>;
  tags?: string[];
  notes?: string;
  tracking: {
    isTracked: boolean;
    trackingType: string;
    individualItems?: Array<{
      serialNumber: string;
      status: string;
      assignedTo?: string;
      assignmentDate?: string;
      condition?: string;
      lastMaintenanceDate?: string;
      notes?: string;
    }>;
    batchInfo?: {
      batchNumber: string;
      manufactureDate: string;
      expiryDate: string;
      quantity: number;
    };
  };
  isDepreciable: boolean;
  depreciationRate?: number;
  lastStockCheck?: string;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  updatedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  lastStockCheckedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  stockStatus?: string;
  totalValue?: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryQuery {
  search?: string;
  category?: string;
  status?: InventoryStatus;
  unitOfMeasurement?: UnitOfMeasurement;
  assignedUnit?: string;
  assignedDistrict?: string;
  location?: string;
  lowStock?: boolean;
  outOfStock?: boolean;
  nearExpiry?: boolean;
  expiryDateStart?: string;
  expiryDateEnd?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface InventoryStatistics {
  summary: {
    totalItems: number;
    totalValue: number;
    lowStockItems: number;
    outOfStockItems: number;
  };
  categoryBreakdown: Array<{
    _id: string;
    itemCount: number;
    totalValue: number;
    categoryInfo: InventoryCategory;
  }>;
}

export interface CreateInventoryItemDto {
  name: string;
  description?: string;
  itemCode: string;
  barcode?: string;
  category: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  unitOfMeasurement: UnitOfMeasurement;
  currentStock: number;
  minimumStock?: number;
  maximumStock?: number;
  reorderLevel?: number;
  unitCost?: number;
  currency?: string;
  status?: InventoryStatus;
  assignedUnit?: string;
  assignedDistrict?: string;
  location?: string;
  supplier?: string;
  supplierContact?: string;
  purchaseDate?: string;
  expiryDate?: string;
  warrantyExpiry?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  imageUrls?: string[];
  documentUrls?: string[];
  customFields?: Record<string, any>;
  tags?: string[];
  notes?: string;
  tracking?: {
    isTracked?: boolean;
    trackingType?: string;
    individualItems?: Array<{
      serialNumber: string;
      status: string;
      assignedTo?: string;
      assignmentDate?: Date;
      condition?: string;
      lastMaintenanceDate?: Date;
      notes?: string;
    }>;
    batchInfo?: {
      batchNumber: string;
      manufactureDate: Date;
      expiryDate: Date;
      quantity: number;
    };
  };
  isDepreciable?: boolean;
  depreciationRate?: number;
}