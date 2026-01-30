import { z } from 'zod'

// Book Category Schema
export const bookCategorySchema = z.object({
  branch: z.string().min(1, 'Branch is required'),
  name: z.string().min(1, 'Category name is required').max(100),
  description: z.string().max(500).optional(),
  code: z.string()
    .max(10)
    .regex(/^[A-Z0-9]*$/, 'Code must contain only uppercase letters and numbers')
    .optional()
    .or(z.literal('')),
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color')
    .optional()
    .or(z.literal('')),
  isActive: z.boolean().default(true),
  sortOrder: z.number().min(0).default(0),
})

export type BookCategoryFormData = z.infer<typeof bookCategorySchema>

// Book Schema
export const bookSchema = z.object({
  branch: z.string().min(1, 'Branch is required'),
  title: z.string().min(1, 'Title is required').max(300),
  author: z.string().min(1, 'Author is required').max(200),
  isbn: z.string().max(20).optional().or(z.literal('')),
  description: z.string().max(2000).optional(),
  coverImage: z.string().url('Invalid URL').optional().or(z.literal('')),
  totalQuantity: z.number().min(1, 'Must have at least 1 copy').default(1),
  category: z.string().optional(),
  publisher: z.string().max(200).optional(),
  publishedDate: z.string().optional(),
  pageCount: z.number().min(1).optional(),
  location: z.string().max(100).optional(),
  tags: z.array(z.string()).default([]),
})

export type BookFormData = z.infer<typeof bookSchema>

// Borrowing Schema
export const borrowingSchema = z.object({
  branch: z.string().min(1, 'Branch is required'),
  book: z.string().min(1, 'Book is required'),
  member: z.string().min(1, 'Member is required'),
  borrowDate: z.string().optional(),
  dueDate: z.string().min(1, 'Due date is required'),
  notes: z.string().max(500).optional(),
}).refine((data) => {
  if (data.borrowDate && data.dueDate) {
    return new Date(data.dueDate) > new Date(data.borrowDate)
  }
  return true
}, {
  message: 'Due date must be after borrow date',
  path: ['dueDate'],
})

export type BorrowingFormData = z.infer<typeof borrowingSchema>

// Return Book Schema
export const returnBookSchema = z.object({
  returnDate: z.string().optional(),
  notes: z.string().max(500).optional(),
  markAsLost: z.boolean().default(false),
})

export type ReturnBookFormData = z.infer<typeof returnBookSchema>

// Extend Due Date Schema
export const extendDueDateSchema = z.object({
  dueDate: z.string().min(1, 'New due date is required'),
}).refine((data) => {
  return new Date(data.dueDate) > new Date()
}, {
  message: 'New due date must be in the future',
  path: ['dueDate'],
})

export type ExtendDueDateFormData = z.infer<typeof extendDueDateSchema>
