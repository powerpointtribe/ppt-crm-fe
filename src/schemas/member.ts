import { z } from 'zod'

// Address schema
export const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State (your base location) is required'),
  zipCode: z.string().min(1, 'ZIP code is required'),
  country: z.string().min(1, 'Country is required')
})

// Emergency contact schema
export const emergencyContactSchema = z.object({
  name: z.string().optional(),
  relationship: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Valid email is required').optional().or(z.literal(''))
})

// Main member schema
export const memberSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female'], {
    required_error: 'Gender is required'
  }),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed'], {
    required_error: 'Marital status is required'
  }),
  address: addressSchema,
  district: z.string().optional(),
  unit: z.string().optional(),
  additionalGroups: z.array(z.string()).optional().default([]),
  membershipStatus: z.enum([
    'new_convert',
    'worker',
    'volunteer',
    'leader',
    'district_pastor',
    'champ',
    'unit_head',
    'inactive',
    'transferred'
  ]).default('new_convert'),
  dateJoined: z.string().optional(),
  baptismDate: z.string().optional(),
  confirmationDate: z.string().optional(),
  ministries: z.array(z.string()).optional().default([]),
  skills: z.array(z.string()).optional().default([]),
  occupation: z.string().optional(),
  workAddress: z.string().optional(),
  spouse: z.string().optional(),
  children: z.array(z.string()).optional().default([]),
  parent: z.string().optional(),
  emergencyContact: emergencyContactSchema.optional(),
  notes: z.string().optional()
}).refine((data) => {
  // Validate baptism date is after birth date
  if (data.baptismDate && data.dateOfBirth) {
    const birthDate = new Date(data.dateOfBirth)
    const baptismDate = new Date(data.baptismDate)
    return baptismDate >= birthDate
  }
  return true
}, {
  message: 'Baptism date must be after birth date',
  path: ['baptismDate']
}).refine((data) => {
  // Validate confirmation date is after baptism date (if both exist)
  if (data.confirmationDate && data.baptismDate) {
    const baptismDate = new Date(data.baptismDate)
    const confirmationDate = new Date(data.confirmationDate)
    return confirmationDate >= baptismDate
  }
  return true
}, {
  message: 'Confirmation date must be after baptism date',
  path: ['confirmationDate']
})

export type MemberFormData = z.infer<typeof memberSchema>

// Edit schema - all fields optional for partial updates
export const memberEditSchema = z.object({
  firstName: z.string().max(50, 'First name too long').optional(),
  lastName: z.string().max(50, 'Last name too long').optional(),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female']).optional(),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']).optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional()
  }).optional(),
  district: z.string().optional(),
  unit: z.string().optional(),
  additionalGroups: z.array(z.string()).optional(),
  membershipStatus: z.enum([
    'new_convert', 'worker', 'volunteer', 'leader', 'district_pastor',
    'champ', 'unit_head', 'inactive', 'transferred'
  ]).optional(),
  dateJoined: z.string().optional(),
  baptismDate: z.string().optional(),
  confirmationDate: z.string().optional(),
  ministries: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  occupation: z.string().optional(),
  workAddress: z.string().optional(),
  spouse: z.string().optional(),
  children: z.array(z.string()).optional(),
  parent: z.string().optional(),
  emergencyContact: emergencyContactSchema.optional(),
  notes: z.string().optional()
})

export type MemberEditFormData = z.infer<typeof memberEditSchema>

// Bulk edit schema (partial updates)
export const bulkMemberEditSchema = z.object({
  membershipStatus: z.enum([
    'new_convert',
    'worker',
    'volunteer',
    'leader',
    'district_pastor',
    'champ',
    'unit_head',
    'inactive',
    'transferred'
  ]).optional(),
  district: z.string().optional(),
  unit: z.string().optional(),
  ministries: z.array(z.string()).optional(),
  notes: z.string().optional()
})

export type BulkMemberEditData = z.infer<typeof bulkMemberEditSchema>