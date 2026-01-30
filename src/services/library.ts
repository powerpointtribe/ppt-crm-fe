import { apiService } from './api'
import { ApiResponse } from '@/types/api'
import { transformPaginatedResponse, transformSingleResponse } from '@/utils/apiResponseTransform'
import {
  Book,
  BookCategory,
  Borrowing,
  CreateBookData,
  UpdateBookData,
  CreateBookCategoryData,
  UpdateBookCategoryData,
  CreateBorrowingData,
  ReturnBookData,
  BookQueryParams,
  CategoryQueryParams,
  BorrowingQueryParams,
  LibraryStats,
  BorrowingStats,
  MemberBorrowingHistory,
  PaginatedResponse,
} from '@/types/library'

export const libraryService = {
  // ============== CATEGORIES ==============

  getCategories: async (params?: CategoryQueryParams): Promise<PaginatedResponse<BookCategory>> => {
    const response = await apiService.get<ApiResponse<any>>('/library/categories', { params })
    return transformPaginatedResponse<BookCategory>(response)
  },

  getActiveCategories: async (branchId?: string): Promise<BookCategory[]> => {
    const response = await apiService.get<ApiResponse<BookCategory[]>>('/library/categories/active', {
      params: branchId ? { branchId } : undefined,
    })
    return transformSingleResponse<BookCategory[]>(response) as BookCategory[]
  },

  getCategoryById: async (id: string): Promise<BookCategory> => {
    const response = await apiService.get<ApiResponse<BookCategory>>(`/library/categories/${id}`)
    return transformSingleResponse<BookCategory>(response) as BookCategory
  },

  createCategory: async (data: CreateBookCategoryData): Promise<BookCategory> => {
    const response = await apiService.post<ApiResponse<BookCategory>>('/library/categories', data)
    return transformSingleResponse<BookCategory>(response) as BookCategory
  },

  updateCategory: async (id: string, data: UpdateBookCategoryData): Promise<BookCategory> => {
    const response = await apiService.patch<ApiResponse<BookCategory>>(`/library/categories/${id}`, data)
    return transformSingleResponse<BookCategory>(response) as BookCategory
  },

  deleteCategory: async (id: string): Promise<void> => {
    await apiService.delete(`/library/categories/${id}`)
  },

  // ============== BOOKS ==============

  getBooks: async (params?: BookQueryParams): Promise<PaginatedResponse<Book>> => {
    const response = await apiService.get<ApiResponse<any>>('/library/books', { params })
    return transformPaginatedResponse<Book>(response)
  },

  getBookById: async (id: string): Promise<Book> => {
    const response = await apiService.get<ApiResponse<Book>>(`/library/books/${id}`)
    return transformSingleResponse<Book>(response) as Book
  },

  getBookWithDetails: async (id: string): Promise<Book> => {
    const response = await apiService.get<ApiResponse<Book>>(`/library/books/${id}/details`)
    return transformSingleResponse<Book>(response) as Book
  },

  createBook: async (data: CreateBookData): Promise<Book> => {
    const response = await apiService.post<ApiResponse<Book>>('/library/books', data)
    return transformSingleResponse<Book>(response) as Book
  },

  updateBook: async (id: string, data: UpdateBookData): Promise<Book> => {
    const response = await apiService.patch<ApiResponse<Book>>(`/library/books/${id}`, data)
    return transformSingleResponse<Book>(response) as Book
  },

  deleteBook: async (id: string): Promise<void> => {
    await apiService.delete(`/library/books/${id}`)
  },

  getBookStats: async (branchId?: string): Promise<LibraryStats> => {
    const response = await apiService.get<ApiResponse<LibraryStats>>('/library/books/stats', {
      params: branchId ? { branchId } : undefined,
    })
    return transformSingleResponse<LibraryStats>(response) as LibraryStats
  },

  // ============== BORROWINGS ==============

  getBorrowings: async (params?: BorrowingQueryParams): Promise<PaginatedResponse<Borrowing>> => {
    const response = await apiService.get<ApiResponse<any>>('/library/borrowings', { params })
    return transformPaginatedResponse<Borrowing>(response)
  },

  getBorrowingById: async (id: string): Promise<Borrowing> => {
    const response = await apiService.get<ApiResponse<Borrowing>>(`/library/borrowings/${id}`)
    return transformSingleResponse<Borrowing>(response) as Borrowing
  },

  createBorrowing: async (data: CreateBorrowingData): Promise<Borrowing> => {
    const response = await apiService.post<ApiResponse<Borrowing>>('/library/borrowings', data)
    return transformSingleResponse<Borrowing>(response) as Borrowing
  },

  returnBook: async (id: string, data: ReturnBookData): Promise<Borrowing> => {
    const response = await apiService.patch<ApiResponse<Borrowing>>(`/library/borrowings/${id}/return`, data)
    return transformSingleResponse<Borrowing>(response) as Borrowing
  },

  extendDueDate: async (id: string, newDueDate: string): Promise<Borrowing> => {
    const response = await apiService.patch<ApiResponse<Borrowing>>(`/library/borrowings/${id}`, {
      dueDate: newDueDate,
    })
    return transformSingleResponse<Borrowing>(response) as Borrowing
  },

  getOverdueBorrowings: async (branchId?: string): Promise<Borrowing[]> => {
    const response = await apiService.get<ApiResponse<Borrowing[]>>('/library/borrowings/overdue', {
      params: branchId ? { branchId } : undefined,
    })
    return transformSingleResponse<Borrowing[]>(response) as Borrowing[]
  },

  getMemberHistory: async (memberId: string, branchId?: string): Promise<MemberBorrowingHistory> => {
    const response = await apiService.get<ApiResponse<MemberBorrowingHistory>>(
      `/library/borrowings/member/${memberId}`,
      { params: branchId ? { branchId } : undefined }
    )
    return transformSingleResponse<MemberBorrowingHistory>(response) as MemberBorrowingHistory
  },

  getBorrowingStats: async (branchId?: string): Promise<BorrowingStats> => {
    const response = await apiService.get<ApiResponse<BorrowingStats>>('/library/borrowings/statistics', {
      params: branchId ? { branchId } : undefined,
    })
    return transformSingleResponse<BorrowingStats>(response) as BorrowingStats
  },
}
