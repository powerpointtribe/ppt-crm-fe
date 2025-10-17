import { z } from 'zod'

// Address schema
export const firstTimerAddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional()
})

// Family member schema
export const familyMemberSchema = z.object({
  name: z.string().min(1, 'Family member name is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  age: z.number().min(0).max(120).optional(),
  attended: z.boolean().default(false)
})

// Emergency contact schema
export const firstTimerEmergencyContactSchema = z.object({
  name: z.string().min(1, 'Emergency contact name is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  phone: z.string().min(10, 'Valid phone number is required')
})

// Follow-up record schema
export const followUpRecordSchema = z.object({
  date: z.string().min(1, 'Follow-up date is required'),
  method: z.enum(['phone', 'email', 'sms', 'whatsapp', 'visit', 'video_call'], {
    required_error: 'Contact method is required'
  }),
  notes: z.string().min(1, 'Follow-up notes are required'),
  outcome: z.enum(['successful', 'no_answer', 'busy', 'not_interested', 'interested', 'follow_up_needed'], {
    required_error: 'Follow-up outcome is required'
  }),
  contactedBy: z.string().min(1, 'Contacted by field is required'),
  nextFollowUpDate: z.string().optional()
})

// Main first timer schema
export const firstTimerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female']).optional(),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']).optional(),
  address: firstTimerAddressSchema.optional(),
  dateOfVisit: z.string().min(1, 'Date of visit is required'),
  serviceType: z.string().optional(),
  howDidYouHear: z.enum(['friend', 'family', 'advertisement', 'online', 'event', 'walkby', 'other']).optional(),
  visitorType: z.enum(['first_time', 'returning', 'new_to_area', 'church_shopping']).default('first_time'),
  familyMembers: z.array(familyMemberSchema).optional().default([]),
  interests: z.array(z.string()).optional().default([]),
  prayerRequests: z.array(z.string()).optional().default([]),
  servingInterests: z.array(z.string()).optional().default([]),
  occupation: z.string().optional(),
  emergencyContact: firstTimerEmergencyContactSchema.optional(),
  followUps: z.array(followUpRecordSchema).optional().default([]),
  status: z.enum(['not_contacted', 'contacted', 'scheduled_visit', 'visited', 'joined_group', 'converted', 'lost_contact']).default('not_contacted'),
  converted: z.boolean().default(false),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional().default([])
}).refine((data) => {
  // Validate date of visit is not in the future
  if (data.dateOfVisit) {
    const visitDate = new Date(data.dateOfVisit)
    const today = new Date()
    today.setHours(23, 59, 59, 999) // Set to end of today
    return visitDate <= today
  }
  return true
}, {
  message: 'Visit date cannot be in the future',
  path: ['dateOfVisit']
}).refine((data) => {
  // Validate birth date is before visit date
  if (data.dateOfBirth && data.dateOfVisit) {
    const birthDate = new Date(data.dateOfBirth)
    const visitDate = new Date(data.dateOfVisit)
    return birthDate < visitDate
  }
  return true
}, {
  message: 'Birth date must be before visit date',
  path: ['dateOfBirth']
})

export type FirstTimerFormData = z.infer<typeof firstTimerSchema>

// Quick add schema for simpler entry
export const quickFirstTimerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  dateOfVisit: z.string().min(1, 'Date of visit is required'),
  visitorType: z.enum(['first_time', 'returning', 'new_to_area', 'church_shopping']).default('first_time'),
  howDidYouHear: z.enum(['friend', 'family', 'advertisement', 'online', 'event', 'walkby', 'other']).optional()
})

export type QuickFirstTimerFormData = z.infer<typeof quickFirstTimerSchema>