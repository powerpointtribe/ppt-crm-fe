import { z } from 'zod'

// Meeting schedule schema - all fields optional for flexibility
export const meetingScheduleSchema = z.object({
  day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']).optional(),
  time: z.string().optional(), // Made optional - empty string is allowed
  frequency: z.enum(['weekly', 'biweekly', 'monthly']).optional().default('weekly'),
  isVirtual: z.boolean().optional().default(false),
  meetingLink: z.string().optional(), // For virtual meetings
  venue: z.string().optional(), // For physical meetings
}).optional()

// Main group schema - simplified
export const groupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100, 'Name is too long'),
  type: z.enum(['district', 'unit', 'fellowship', 'ministry', 'committee'], {
    required_error: 'Group type is required'
  }),
  description: z.string().optional(),

  // Leadership fields (member IDs from dropdown)
  districtPastor: z.string().optional(),
  unitHead: z.string().optional(),
  assistantUnitHead: z.string().optional(),
  ministryDirector: z.string().optional(),

  // Ministry-specific: linked units (members in these units auto-join the ministry)
  linkedUnits: z.array(z.string()).optional().default([]),

  // Meeting schedule - entirely optional
  meetingSchedule: meetingScheduleSchema,
})

export type GroupFormData = z.infer<typeof groupSchema>

// Separate schema for bulk operations
export const bulkGroupEditSchema = z.object({
  type: z.enum(['district', 'unit', 'fellowship', 'ministry', 'committee']).optional(),
  districtPastor: z.string().optional(),
  unitHead: z.string().optional(),
  isActive: z.boolean().optional(),
})

export type BulkGroupEditData = z.infer<typeof bulkGroupEditSchema>
