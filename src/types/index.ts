// Role interface for permission-based access control
export interface Role {
  id: string
  name: string
  displayName: string
  level: number
}

// User interface is now replaced by Member from members-unified.ts
// All user-related functionality should use the Member interface instead
export interface Member {
  _id: string
  id?: string // Alias for _id (used in auth context)
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: 'male' | 'female'
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed'

  // Authentication fields
  isActive: boolean
  lastLogin?: string

  // System access control (NEW permission-based system)
  role?: Role // NEW: Single role with permissions
  permissions?: string[] // NEW: Flat array of permission names (e.g., ['members:create', 'members:view'])
  permissionsGrouped?: Record<string, string[]> // NEW: Permissions grouped by module

  // Legacy access control (deprecated, kept for backward compatibility)
  systemRoles: string[]
  unitType?: 'gia' | 'district' | 'ministry_unit' | 'leadership_unit'
  accessibleModules: string[]

  // Church membership - Hierarchical status (MEMBER, DC, LXL, DIRECTOR, PASTOR, SENIOR_PASTOR, LEFT)
  // This is different from engagement status used in First Timers module
  membershipStatus: 'MEMBER' | 'DC' | 'LXL' | 'DIRECTOR' | 'PASTOR' | 'SENIOR_PASTOR' | 'LEFT'
  dateJoined: string
  baptismDate?: string
  confirmationDate?: string

  // Church structure
  district?: any
  unit?: any
  additionalGroups?: string[]

  // Leadership roles
  leadershipRoles: {
    isDistrictPastor: boolean
    isChamp: boolean
    isUnitHead: boolean
    champForDistrict?: string
    leadsUnit?: string
    pastorsDistrict?: string
  }

  // Personal info
  address?: {
    street: string
    city: string
    state: string
    zipCode?: string
    country: string
  }
  ministries?: string[]
  skills?: string[]
  occupation?: string
  workAddress?: string

  // Family
  spouse?: any
  children?: any[]
  parent?: any
  emergencyContact?: {
    name: string
    relationship: string
    phone: string
    email?: string
  }

  // Spiritual journey
  spiritualJourney: {
    foundationClass: { completed: boolean; completionDate?: string }
    baptismClass: { completed: boolean; completionDate?: string }
    membershipClass: { completed: boolean; completionDate?: string }
    leadershipClass: { completed: boolean; completionDate?: string }
  }

  // System fields
  notes?: string
  profilePicture?: string
  engagement: {
    lastAttendance?: string
    attendanceCount: number
    engagementScore: number
  }
  createdAt: string
  updatedAt: string
}

export interface Prayer {
  _id: string;
  title: string;
  description: string;
  requestedBy: string | Member;
  assignedPastor?: string | Member;
  category: 'healing' | 'thanksgiving' | 'guidance' | 'general' | 'urgent';
  status: 'pending' | 'in_progress' | 'prayed' | 'answered';
  isAnonymous: boolean;
  isUrgent: boolean;
  prayedDate?: string;
  answeredDate?: string;
  testimonial?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  memberId: string | Member;
  amount: number;
  currency: string;
  type: 'tithe' | 'offering' | 'donation' | 'pledge' | 'special_offering';
  category?: string;
  method: 'cash' | 'check' | 'card' | 'bank_transfer' | 'mobile_money';
  reference?: string;
  description?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentDate: string;
  receiptNumber?: string;
  processedBy?: string | Member;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  _id: string;
  paymentId?: string | Payment;
  amount: number;
  currency: string;
  type: 'income' | 'expense' | 'transfer';
  category: 'tithe' | 'offering' | 'donation' | 'salary' | 'utilities' | 'maintenance' | 'other';
  description: string;
  reference?: string;
  balanceBefore: number;
  balanceAfter: number;
  approvedBy?: string | Member;
  createdAt: string;
}

export interface Estate {
  _id: string;
  name: string;
  address: string;
  location: {
    coordinates: [number, number];
    type: 'Point';
  };
  value: number;
  purchaseDate?: string;
  description?: string;
  type: 'land' | 'building' | 'equipment' | 'vehicle' | 'other';
  status: 'active' | 'sold' | 'under_maintenance' | 'inactive';
  documents?: {
    title: string;
    url: string;
    type: string;
  }[];
  managedBy?: string | Member;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
  statusCode?: number;
}

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  totalPrayers: number;
  answeredPrayers: number;
  totalPayments: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalEstates: number;
  totalTransactions: number;
}

export interface Ministry {
  _id: string;
  name: string;
  description?: string;
  leader: string | Member;
  members: string[] | Member[];
  meetingDay?: string;
  meetingTime?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  _id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  location: string;
  organizer: string | Member;
  attendees?: string[] | Member[];
  type: 'service' | 'conference' | 'meeting' | 'outreach' | 'social' | 'other';
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  _id: string;
  eventId: string | Event;
  memberId: string | Member;
  status: 'present' | 'absent' | 'late';
  checkInTime?: string;
  notes?: string;
  createdAt: string;
}