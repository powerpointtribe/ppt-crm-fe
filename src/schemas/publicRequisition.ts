import { z } from 'zod'
import { costBreakdownItemSchema, bankAccountSchema } from './requisition'

// Public requisition form schema (no auth required)
export const publicRequisitionSchema = z.object({
  // Submitter info (required for public submissions)
  submitterName: z
    .string()
    .min(1, 'Your name is required')
    .max(100, 'Name must be less than 100 characters'),
  submitterEmail: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  submitterPhone: z
    .string()
    .max(20, 'Phone number must be less than 20 characters')
    .optional(),

  // Branch selection
  branchSlug: z.string().min(1, 'Please select a branch'),

  // Unit selection - required: either pick a unit or type a custom one
  unit: z.string().min(1, 'Please select a unit'),
  customUnit: z
    .string()
    .max(200, 'Custom unit must be less than 200 characters')
    .optional(),
  expenseCategory: z.string().min(1, 'Expense category is required'),
  eventDescription: z
    .string()
    .min(1, 'Event description is required'),
  customEventDescription: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  dateNeeded: z.string().min(1, 'Date needed is required'),
  lastRequest: z.string().max(200, 'Must be less than 200 characters').optional(),
  costBreakdown: z
    .array(costBreakdownItemSchema)
    .min(1, 'At least one cost item is required'),
  creditAccount: bankAccountSchema,
  documentUrls: z.array(z.string()).optional(),
  discussedWithPDams: z.enum(['yes', 'not_required', 'no'], {
    required_error: 'Please select whether you have discussed this expense with P.Dams',
  }),
  discussedDate: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.unit === 'others' && (!data.customUnit || data.customUnit.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please enter your unit name',
      path: ['customUnit'],
    })
  }
  if (data.eventDescription === 'other' && (!data.customEventDescription || data.customEventDescription.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please describe the event',
      path: ['customEventDescription'],
    })
  }
})

export type PublicRequisitionFormData = z.infer<typeof publicRequisitionSchema>

// Token-based approval schema
export const publicApproveSchema = z.object({
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
})

export type PublicApproveFormData = z.infer<typeof publicApproveSchema>

// Token-based rejection schema
export const publicRejectSchema = z.object({
  reason: z
    .string()
    .min(1, 'Rejection reason is required')
    .max(500, 'Reason must be less than 500 characters'),
})

export type PublicRejectFormData = z.infer<typeof publicRejectSchema>

// Token-based disbursement schema
export const publicDisburseSchema = z.object({
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
})

export type PublicDisburseFormData = z.infer<typeof publicDisburseSchema>
