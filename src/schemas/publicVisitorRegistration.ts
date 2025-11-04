import { z } from 'zod'

// Public visitor registration schema - simplified for self-registration
export const publicVisitorRegistrationSchema = z.object({
  // Basic Information (Required)
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),

  // Visit Information (Required)
  dateOfVisit: z.string().min(1, 'Date of visit is required'),

  // Optional Personal Details
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female']).optional(),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']).optional(),
  occupation: z.string().optional(),
  alternateContactMethod: z.string().optional(),
  website: z.string().optional(),

  // Social media handles
  socialMediaHandles: z.object({
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    tiktok: z.string().optional(),
    other: z.string().optional()
  }).optional(),

  referredBy: z.string().optional(),
  serviceExperience: z.string().optional(),
  profilePhotoUrl: z.string().optional(),

  // How they heard about us
  howDidYouHear: z.enum(['friend', 'family', 'advertisement', 'online', 'event', 'walkby', 'other']).optional(),

  // Service type they attended
  serviceType: z.string().optional(),

  // Address (Optional but encouraged)
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional()
  }).optional(),

  // Family members who attended
  familyMembers: z.array(z.object({
    name: z.string().min(1, 'Family member name is required'),
    relationship: z.string().min(1, 'Relationship is required'),
    age: z.number().min(0).max(120).optional(),
    attended: z.boolean().default(true)
  })).optional().default([]),

  // Interests and involvement
  interests: z.array(z.string()).optional().default([]),
  servingInterests: z.array(z.string()).optional().default([]),

  // Prayer requests (optional)
  prayerRequests: z.array(z.string()).optional().default([]),

  // Emergency contact (encouraged for families with children)
  emergencyContact: z.object({
    name: z.string().optional(),
    relationship: z.string().optional(),
    phone: z.string().optional()
  }).optional(),

  // Additional comments/notes
  comments: z.string().optional(),

  // Consent and preferences
  allowFollowUp: z.boolean().default(true),
  preferredContactMethod: z.enum(['phone', 'email', 'sms', 'whatsapp']).optional(),
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

export type PublicVisitorRegistrationData = z.infer<typeof publicVisitorRegistrationSchema>

// Transform function to convert public registration data to first timer format
export const transformToFirstTimerData = (publicData: PublicVisitorRegistrationData) => {
  return {
    firstName: publicData.firstName,
    lastName: publicData.lastName,
    phone: publicData.phone,
    email: publicData.email,
    dateOfBirth: publicData.dateOfBirth,
    gender: publicData.gender,
    maritalStatus: publicData.maritalStatus,
    occupation: publicData.occupation,
    alternateContactMethod: publicData.alternateContactMethod,
    website: publicData.website,
    socialMediaHandles: publicData.socialMediaHandles,
    referredBy: publicData.referredBy,
    serviceExperience: publicData.serviceExperience,
    profilePhotoUrl: publicData.profilePhotoUrl,
    address: publicData.address,
    dateOfVisit: publicData.dateOfVisit,
    serviceType: publicData.serviceType,
    howDidYouHear: publicData.howDidYouHear,
    visitorType: 'first_time' as const, // Default for public registration
    familyMembers: publicData.familyMembers || [],
    interests: publicData.interests || [],
    prayerRequests: publicData.prayerRequests || [],
    servingInterests: publicData.servingInterests || [],
    emergencyContact: publicData.emergencyContact?.name ? publicData.emergencyContact : undefined,
    notes: publicData.comments ? `Self-registered visitor. Comments: ${publicData.comments}${publicData.preferredContactMethod ? ` | Preferred contact: ${publicData.preferredContactMethod}` : ''}${publicData.allowFollowUp ? '' : ' | Requested NO follow-up'}` : undefined,
    // Admin fields set to defaults
    status: 'not_contacted' as const,
    converted: false,
    followUps: [],
    tags: ['self-registered']
  }
}
