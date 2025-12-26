/**
 * Branch Types for Multi-Branch Church RBAC System
 */

export interface BranchAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

export interface Branch {
  _id: string;
  name: string;
  slug: string; // URL-friendly identifier (e.g., 'lagos-mainland')
  description?: string;
  address?: BranchAddress;
  phone?: string;
  email?: string;
  branchPastor?: string; // Member ID
  branchPastorDetails?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  assistantPastors: string[]; // Member IDs
  assistantPastorDetails?: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  }>;
  isActive: boolean;
  isMainBranch: boolean;
  settings: Record<string, any>;
  metadata: Record<string, any>;
  timezone?: string;
  serviceTypes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PublicBranch {
  name: string;
  slug: string;
  address?: BranchAddress;
  phone?: string;
  email?: string;
}

export interface CreateBranchData {
  name: string;
  slug: string;
  description?: string;
  address?: BranchAddress;
  phone?: string;
  email?: string;
  branchPastor?: string;
  assistantPastors?: string[];
  isActive?: boolean;
  isMainBranch?: boolean;
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
  timezone?: string;
  serviceTypes?: string[];
}

export interface UpdateBranchData extends Partial<CreateBranchData> {}

export interface AssignPastorData {
  pastorId: string;
}

/**
 * User access scope for RBAC
 */
export enum AccessScope {
  GLOBAL = 'global', // Senior Pastor, Admin, Super Admin
  BRANCH = 'branch', // Branch Pastor
  DISTRICT = 'district', // Assistant Pastor, District Pastor
  UNIT = 'unit', // Unit Head
  SELF = 'self', // Regular member - only their own data
}

/**
 * Access filters returned by the backend for data scoping
 */
export interface AccessFilters {
  branchId?: string;
  districtIds?: string[];
  districtId?: string;
  unitId?: string;
  memberId?: string;
}

/**
 * User's branch context for display and filtering
 */
export interface UserBranchContext {
  scope: AccessScope;
  branch?: Branch;
  assignedDistricts?: string[];
  canAccessAllBranches: boolean;
  canAccessAllDistricts: boolean;
}
