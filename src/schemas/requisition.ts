import { z } from 'zod'

// Cost breakdown item schema
export const costBreakdownItemSchema = z.object({
  item: z.string().min(1, 'Item description is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitCost: z.number().min(0, 'Unit cost must be positive'),
  total: z.number().min(0, 'Total must be positive'),
})

// Bank account schema
export const bankAccountSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required'),
  accountName: z.string().min(1, 'Account name is required'),
  accountNumber: z
    .string()
    .length(10, 'Account number must be exactly 10 digits')
    .regex(/^\d+$/, 'Account number must contain only digits'),
})

// Main requisition form schema
export const requisitionSchema = z.object({
  unit: z.string().optional(),
  expenseCategory: z.string().min(1, 'Expense category is required'),
  eventDescription: z
    .string()
    .min(1, 'Event description is required')
    .max(500, 'Event description must be less than 500 characters'),
  dateNeeded: z.string().min(1, 'Date needed is required'),
  lastRequestDate: z.string().optional(),
  costBreakdown: z
    .array(costBreakdownItemSchema)
    .min(1, 'At least one cost item is required'),
  creditAccount: bankAccountSchema,
  documentUrls: z.array(z.string()).optional(),
  discussedWithPDams: z.enum(['yes', 'not_required', 'no'], {
    required_error: 'Please select whether you have discussed this expense with P.Dams',
  }),
  discussedDate: z.string().optional(),
  isDraft: z.boolean().optional(),
})

export type RequisitionFormData = z.infer<typeof requisitionSchema>

// Approve requisition schema
export const approveRequisitionSchema = z.object({
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
})

export type ApproveRequisitionFormData = z.infer<typeof approveRequisitionSchema>

// Reject requisition schema
export const rejectRequisitionSchema = z.object({
  reason: z
    .string()
    .min(1, 'Rejection reason is required')
    .max(500, 'Reason must be less than 500 characters'),
})

export type RejectRequisitionFormData = z.infer<typeof rejectRequisitionSchema>

// Disburse requisition schema
export const disburseRequisitionSchema = z.object({
  disbursementReference: z.string().min(1, 'Disbursement reference is required'),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
})

export type DisburseRequisitionFormData = z.infer<typeof disburseRequisitionSchema>

// Expense category schema
export const expenseCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  code: z.string().max(20, 'Code must be less than 20 characters').optional(),
  budgetLimit: z.number().min(0, 'Budget limit must be positive').optional(),
  requiresApproval: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().min(0, 'Sort order must be positive').optional(),
})

export type ExpenseCategoryFormData = z.infer<typeof expenseCategorySchema>
