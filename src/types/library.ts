// Enums
export enum BookStatus {
  AVAILABLE = 'available',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
}

export enum BorrowingStatus {
  BORROWED = 'borrowed',
  RETURNED = 'returned',
  OVERDUE = 'overdue',
  LOST = 'lost',
}

// Interfaces
export interface BookCategory {
  _id: string
  branch: string | { _id: string; name: string }
  name: string
  description?: string
  code?: string
  color: string
  isActive: boolean
  sortOrder: number
  createdBy?: { _id: string; firstName: string; lastName: string }
  createdAt: string
  updatedAt: string
}

export interface Book {
  _id: string
  branch: string | { _id: string; name: string }
  title: string
  author: string
  isbn?: string
  description?: string
  coverImage?: string
  totalQuantity: number
  availableQuantity: number
  category?: BookCategory | string
  publisher?: string
  publishedDate?: string
  pageCount?: number
  location?: string
  tags: string[]
  status: BookStatus
  createdBy?: { _id: string; firstName: string; lastName: string }
  updatedBy?: { _id: string; firstName: string; lastName: string }
  createdAt: string
  updatedAt: string
  // Extended details
  recentBorrowings?: Borrowing[]
  activeBorrowingsCount?: number
}

export interface Borrowing {
  _id: string
  branch: string | { _id: string; name: string }
  book: Book | string
  member: {
    _id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
  } | string
  borrowDate: string
  dueDate: string
  returnDate?: string
  status: BorrowingStatus
  isOverdue: boolean
  overdueDays: number
  notes?: string
  issuedBy: { _id: string; firstName: string; lastName: string } | string
  returnedTo?: { _id: string; firstName: string; lastName: string } | string
  createdAt: string
  updatedAt: string
  // Virtual fields
  currentOverdueDays?: number
}

// Create/Update DTOs
export interface CreateBookCategoryData {
  branch: string
  name: string
  description?: string
  code?: string
  color?: string
  isActive?: boolean
  sortOrder?: number
}

export interface UpdateBookCategoryData {
  name?: string
  description?: string
  code?: string
  color?: string
  isActive?: boolean
  sortOrder?: number
}

export interface CreateBookData {
  branch: string
  title: string
  author: string
  isbn?: string
  description?: string
  coverImage?: string
  totalQuantity?: number
  category?: string
  publisher?: string
  publishedDate?: string
  pageCount?: number
  location?: string
  tags?: string[]
}

export interface UpdateBookData {
  title?: string
  author?: string
  isbn?: string
  description?: string
  coverImage?: string
  totalQuantity?: number
  availableQuantity?: number
  category?: string
  publisher?: string
  publishedDate?: string
  pageCount?: number
  location?: string
  tags?: string[]
}

export interface CreateBorrowingData {
  branch: string
  book: string
  member: string
  borrowDate?: string
  dueDate: string
  notes?: string
}

export interface ReturnBookData {
  returnDate?: string
  notes?: string
  markAsLost?: boolean
}

// Query Parameters
export interface BookQueryParams {
  page?: number
  limit?: number
  search?: string
  branchId?: string
  categoryId?: string
  status?: BookStatus
  tag?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CategoryQueryParams {
  page?: number
  limit?: number
  search?: string
  branchId?: string
  isActive?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface BorrowingQueryParams {
  page?: number
  limit?: number
  search?: string
  branchId?: string
  memberId?: string
  bookId?: string
  status?: BorrowingStatus
  isOverdue?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Statistics
export interface LibraryStats {
  totalBooks: number
  totalCopies: number
  availableCopies: number
  borrowedCopies: number
  overdueCount: number
  categoryBreakdown: Array<{
    categoryId: string
    categoryName: string
    count: number
  }>
}

export interface BorrowingStats {
  totalBorrowings: number
  activeBorrowings: number
  overdueCount: number
  returnedThisMonth: number
  popularBooks: Array<{
    bookId: string
    title: string
    author: string
    borrowCount: number
  }>
  topBorrowers: Array<{
    memberId: string
    firstName: string
    lastName: string
    email: string
    borrowCount: number
  }>
}

export interface MemberBorrowingHistory {
  borrowings: Borrowing[]
  stats: {
    totalBorrowed: number
    currentlyBorrowed: number
    returned: number
    overdue: number
    lost: number
    totalOverdueDays: number
  }
}

// Paginated Response
export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}
