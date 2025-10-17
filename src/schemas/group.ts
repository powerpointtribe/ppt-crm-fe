import { z } from 'zod'

// Meeting schedule schema
export const meetingScheduleSchema = z.object({
  day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], {
    required_error: 'Meeting day is required'
  }),
  time: z.string().min(1, 'Meeting time is required'),
  frequency: z.enum(['weekly', 'biweekly', 'monthly'], {
    required_error: 'Meeting frequency is required'
  })
})

// Hosting info schema
export const hostingInfoSchema = z.object({
  currentHost: z.string().min(1, 'Current host is required'),
  hostRotation: z.array(z.string()).optional().default([]),
  nextRotationDate: z.string().optional()
})

// Contact schema
export const contactSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  address: z.string().optional()
})

// Main group schema
export const groupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100, 'Name is too long'),
  type: z.enum(['district', 'unit', 'fellowship', 'ministry', 'committee'], {
    required_error: 'Group type is required'
  }),
  description: z.string().optional(),
  capacity: z.number().min(1, 'Capacity must be at least 1').optional(),

  // Leadership fields
  districtPastor: z.string().optional(),
  unitHead: z.string().optional(),
  champs: z.array(z.string()).optional().default([]),

  // Optional nested objects
  meetingSchedule: meetingScheduleSchema.optional(),
  hostingInfo: hostingInfoSchema.optional(),
  contact: contactSchema.optional()
}).refine((data) => {
  // If type is district, districtPastor should be provided
  if (data.type === 'district' && !data.districtPastor) {
    return false
  }
  return true
}, {
  message: 'District Pastor is required for district groups',
  path: ['districtPastor']
}).refine((data) => {
  // If type is unit, unitHead should be provided
  if (data.type === 'unit' && !data.unitHead) {
    return false
  }
  return true
}, {
  message: 'Unit Head is required for unit groups',
  path: ['unitHead']
}).refine((data) => {
  // Validate meeting schedule consistency
  if (data.meetingSchedule) {
    const { day, time, frequency } = data.meetingSchedule
    if ((day || time || frequency) && !(day && time && frequency)) {
      return false
    }
  }
  return true
}, {
  message: 'Complete meeting schedule required (day, time, and frequency)',
  path: ['meetingSchedule']
})

export type GroupFormData = z.infer<typeof groupSchema>

// Separate schema for bulk operations
export const bulkGroupEditSchema = z.object({
  type: z.enum(['district', 'unit', 'fellowship', 'ministry', 'committee']).optional(),
  districtPastor: z.string().optional(),
  unitHead: z.string().optional(),
  isActive: z.boolean().optional(),
  capacity: z.number().min(1).optional()
})

export type BulkGroupEditData = z.infer<typeof bulkGroupEditSchema>