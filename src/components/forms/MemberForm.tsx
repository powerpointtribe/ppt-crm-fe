import React, { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, User, MapPin, Briefcase, Heart, Phone,
  ChevronLeft, ChevronRight, Check, AlertCircle, Calendar, Mail,
  Home, Building, Star, FileText
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { memberSchema, MemberFormData } from '@/schemas/member'
import { Member, CreateMemberData, UpdateMemberData } from '@/services/members'
import { groupsService, Group } from '@/services/groups'
import { cn } from '@/utils/cn'
import FormSummary from '@/components/ui/FormSummary'

interface MemberFormProps {
  member?: Member
  onSubmit: (data: CreateMemberData | UpdateMemberData) => Promise<void>
  onCancel: () => void
  loading?: boolean
  mode: 'create' | 'edit'
}

export default function MemberForm({
  member,
  onSubmit,
  onCancel,
  loading = false,
  mode
}: MemberFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 7
  const [districts, setDistricts] = useState<Group[]>([])
  const [units, setUnits] = useState<Group[]>([])
  const [loadingData, setLoadingData] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    control,
    trigger,
    formState: { errors },
    getValues
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: member ? {
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone,
      dateOfBirth: member.dateOfBirth,
      gender: member.gender,
      maritalStatus: member.maritalStatus,
      address: member.address,
      district: member.district,
      unit: member.unit || '',
      additionalGroups: member.additionalGroups || [],
      leadershipRoles: member.leadershipRoles || {},
      membershipStatus: member.membershipStatus,
      dateJoined: member.dateJoined,
      baptismDate: member.baptismDate || '',
      confirmationDate: member.confirmationDate || '',
      ministries: member.ministries || [],
      skills: member.skills || [],
      occupation: member.occupation || '',
      workAddress: member.workAddress || '',
      spouse: member.spouse || '',
      children: member.children || [],
      parent: member.parent || '',
      emergencyContact: member.emergencyContact || {
        name: '',
        relationship: '',
        phone: '',
        email: ''
      },
      notes: member.notes || ''
    } : {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: 'male',
      maritalStatus: 'single',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Nigeria'
      },
      district: '',
      unit: '',
      additionalGroups: [],
      leadershipRoles: {
        isDistrictPastor: false,
        isChamp: false,
        isUnitHead: false
      },
      membershipStatus: 'new_convert',
      dateJoined: new Date().toISOString().split('T')[0],
      baptismDate: '',
      confirmationDate: '',
      ministries: [],
      skills: [],
      occupation: '',
      workAddress: '',
      spouse: '',
      children: [],
      parent: '',
      emergencyContact: {
        name: '',
        relationship: '',
        phone: '',
        email: ''
      },
      notes: ''
    }
  })

  const {
    fields: ministryFields,
    append: appendMinistry,
    remove: removeMinistry
  } = useFieldArray({
    control,
    name: 'ministries'
  })

  const {
    fields: skillFields,
    append: appendSkill,
    remove: removeSkill
  } = useFieldArray({
    control,
    name: 'skills'
  })

  const {
    fields: childrenFields,
    append: appendChild,
    remove: removeChild
  } = useFieldArray({
    control,
    name: 'children'
  })

  const watchedLeadershipRoles = watch('leadershipRoles')
  const watchedMaritalStatus = watch('maritalStatus')

  // Fetch districts and units on component mount
  useEffect(() => {
    const fetchGroupsData = async () => {
      try {
        setLoadingData(true)
        const [districtsResponse, unitsResponse] = await Promise.all([
          groupsService.getDistricts({ limit: 100 }), // Get all districts
          groupsService.getUnits({ limit: 100 }) // Get all units
        ])

        setDistricts(districtsResponse.items || [])
        setUnits(unitsResponse.items || [])
      } catch (error) {
        console.error('Error fetching districts and units:', error)
      } finally {
        setLoadingData(false)
      }
    }

    fetchGroupsData()
  }, [])

  // Function to count errors per step
  const getErrorsForStep = (stepNumber: number) => {
    const stepFields = stepConfig[stepNumber - 1].fields
    let errorCount = 0

    for (const field of stepFields) {
      if (field === 'address') {
        // Handle address object errors
        if (errors.address?.street) errorCount++
        if (errors.address?.city) errorCount++
        if (errors.address?.state) errorCount++
        if (errors.address?.zipCode) errorCount++
        if (errors.address?.country) errorCount++
      } else if (field === 'leadershipRoles') {
        // Handle leadership roles object errors
        if (errors.leadershipRoles?.pastorsDistrict) errorCount++
        if (errors.leadershipRoles?.champForDistrict) errorCount++
        if (errors.leadershipRoles?.leadsUnit) errorCount++
      } else if (field === 'emergencyContact') {
        // Handle emergency contact object errors
        if (errors.emergencyContact?.name) errorCount++
        if (errors.emergencyContact?.relationship) errorCount++
        if (errors.emergencyContact?.phone) errorCount++
        if (errors.emergencyContact?.email) errorCount++
      } else if (field === 'ministries') {
        // Handle array field errors
        if (errors.ministries) {
          const ministryErrors = errors.ministries as any[]
          errorCount += ministryErrors?.filter(Boolean).length || 0
        }
      } else if (field === 'skills') {
        // Handle array field errors
        if (errors.skills) {
          const skillErrors = errors.skills as any[]
          errorCount += skillErrors?.filter(Boolean).length || 0
        }
      } else if (field === 'children') {
        // Handle array field errors
        if (errors.children) {
          const childrenErrors = errors.children as any[]
          errorCount += childrenErrors?.filter(Boolean).length || 0
        }
      } else {
        // Handle simple fields
        if (errors[field as keyof typeof errors]) {
          errorCount++
        }
      }
    }

    return errorCount
  }

  const getErrorCountForStep = (stepNumber: number) => {
    return getErrorsForStep(stepNumber)
  }

  const handleFormSubmit = async (data: MemberFormData) => {
    try {
      // Transform the data to match API requirements
      const transformedData = {
        ...data,
        // Convert dates to ISO strings - only include if they have values
        ...(data.dateOfBirth && { dateOfBirth: new Date(data.dateOfBirth).toISOString() }),
        dateJoined: data.dateJoined ? new Date(data.dateJoined).toISOString() : new Date().toISOString(),
        ...(data.baptismDate && { baptismDate: new Date(data.baptismDate).toISOString() }),
        ...(data.confirmationDate && { confirmationDate: new Date(data.confirmationDate).toISOString() }),

        // Handle relationship fields - convert empty strings to undefined to exclude from API call
        ...(data.district && data.district.trim() !== '' && { district: data.district }),
        ...(data.unit && data.unit.trim() !== '' && { unit: data.unit }),
        ...(data.spouse && data.spouse.trim() && { spouse: data.spouse }),
        ...(data.parent && data.parent.trim() && { parent: data.parent }),

        // Handle leadership roles - only include if they have values
        leadershipRoles: {
          isDistrictPastor: data.leadershipRoles?.isDistrictPastor || false,
          isChamp: data.leadershipRoles?.isChamp || false,
          isUnitHead: data.leadershipRoles?.isUnitHead || false,
          ...(data.leadershipRoles?.leadsUnit && data.leadershipRoles.leadsUnit.trim() !== '' && { leadsUnit: data.leadershipRoles.leadsUnit }),
          ...(data.leadershipRoles?.pastorsDistrict && data.leadershipRoles.pastorsDistrict.trim() !== '' && { pastorsDistrict: data.leadershipRoles.pastorsDistrict }),
          ...(data.leadershipRoles?.champForDistrict && data.leadershipRoles.champForDistrict.trim() !== '' && { champForDistrict: data.leadershipRoles.champForDistrict })
        },

        // Filter out empty strings from arrays
        ministries: data.ministries?.filter(Boolean) || [],
        skills: data.skills?.filter(Boolean) || [],
        children: data.children?.filter(Boolean) || [],
      }

      console.log('Transformed data being sent to API:', transformedData)
      await onSubmit(transformedData)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, totalSteps))
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const stepConfig = [
    {
      id: 1,
      title: 'Personal Information',
      subtitle: 'Basic details about the member',
      icon: User,
      fields: ['firstName', 'lastName', 'dateOfBirth', 'gender', 'maritalStatus', 'occupation']
    },
    {
      id: 2,
      title: 'Contact & Address',
      subtitle: 'How to reach this member',
      icon: Phone,
      fields: ['email', 'phone', 'address', 'workAddress']
    },
    {
      id: 3,
      title: 'Church Information',
      subtitle: 'Church roles and membership details',
      icon: Building,
      fields: ['district', 'unit', 'membershipStatus', 'dateJoined', 'baptismDate', 'confirmationDate', 'leadershipRoles']
    },
    {
      id: 4,
      title: 'Ministry & Skills',
      subtitle: 'Areas of service and expertise',
      icon: Star,
      fields: ['ministries', 'skills']
    },
    {
      id: 5,
      title: 'Family Information',
      subtitle: 'Family connections and emergency contact',
      icon: Heart,
      fields: ['spouse', 'children', 'parent', 'emergencyContact']
    },
    {
      id: 6,
      title: 'Additional Details',
      subtitle: 'Any extra notes or information',
      icon: FileText,
      fields: ['notes']
    },
    {
      id: 7,
      title: 'Review & Submit',
      subtitle: 'Review all information before submitting',
      icon: Check,
      fields: []
    }
  ]

  const renderStepIndicator = () => (
    <div className="mb-8">
      {/* Desktop Progress Bar */}
      <div className="hidden lg:block">
        <div className="flex items-center justify-between relative">
          {/* Progress Line */}
          <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 z-0">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-green-500"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>

          {stepConfig.map((step, index) => {
            const isActive = step.id === currentStep
            const isCompleted = step.id < currentStep
            const errorCount = getErrorCountForStep(step.id)
            const hasErrors = errorCount > 0
            const Icon = step.icon

            return (
              <motion.div
                key={step.id}
                className="relative z-10 flex flex-col items-center"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <motion.div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 transition-all duration-300 relative",
                    isActive && !hasErrors && "bg-blue-600 text-white border-blue-600 shadow-blue-200",
                    isActive && hasErrors && "bg-red-600 text-white border-red-600 shadow-red-200",
                    isCompleted && !hasErrors && "bg-green-600 text-white border-green-600 shadow-green-200",
                    isCompleted && hasErrors && "bg-orange-600 text-white border-orange-600 shadow-orange-200",
                    !isActive && !isCompleted && !hasErrors && "bg-white text-gray-400 border-gray-300",
                    !isActive && !isCompleted && hasErrors && "bg-red-50 text-red-500 border-red-300"
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isCompleted && !hasErrors ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}

                  {/* Error badge */}
                  {hasErrors && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-md"
                    >
                      {errorCount}
                    </motion.div>
                  )}
                </motion.div>
                <div className="mt-3 text-center max-w-24">
                  <div className={cn(
                    "text-xs font-medium",
                    isActive && !hasErrors && "text-blue-600",
                    isActive && hasErrors && "text-red-600",
                    isCompleted && !hasErrors && "text-green-600",
                    isCompleted && hasErrors && "text-orange-600",
                    !isActive && !isCompleted && !hasErrors && "text-gray-500",
                    !isActive && !isCompleted && hasErrors && "text-red-500"
                  )}>
                    {step.title}
                  </div>
                  {hasErrors && (
                    <div className="text-xs text-red-500 mt-1 font-medium">
                      {errorCount} error{errorCount > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Mobile Progress Bar */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-500">
            Step {currentStep} of {totalSteps}
          </div>
          <div className="text-sm font-medium text-gray-900">
            {Math.round((currentStep / totalSteps) * 100)}% Complete
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
        <div className="mt-4 text-center">
          <div className={cn(
            "flex items-center justify-center gap-2",
            getErrorCountForStep(currentStep) > 0 ? "text-red-600" : "text-blue-600"
          )}>
            {React.createElement(stepConfig[currentStep - 1].icon, { className: "w-5 h-5" })}
            <span className="font-medium">{stepConfig[currentStep - 1].title}</span>
            {getErrorCountForStep(currentStep) > 0 && (
              <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {getErrorCountForStep(currentStep)}
              </div>
            )}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {stepConfig[currentStep - 1].subtitle}
            {getErrorCountForStep(currentStep) > 0 && (
              <span className="text-red-500 block mt-1 font-medium">
                {getErrorCountForStep(currentStep)} validation error{getErrorCountForStep(currentStep) > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Step Header */}
      <div className="text-center border-b border-gray-100 pb-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-full">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Personal Information</h3>
        </div>
        <p className="text-gray-600">Basic details about the member</p>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Name Section */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Full Name
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <Input
                {...register('firstName')}
                placeholder="Enter first name"
                error={errors.firstName?.message}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <Input
                {...register('lastName')}
                placeholder="Enter last name"
                error={errors.lastName?.message}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Personal Details Section */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Personal Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                Date of Birth *
              </label>
              <Input
                type="date"
                {...register('dateOfBirth')}
                error={errors.dateOfBirth?.message}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender *
              </label>
              <select
                {...register('gender')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              {errors.gender && <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.gender.message}
              </p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Heart className="w-4 h-4 text-gray-500" />
                Marital Status *
              </label>
              <select
                {...register('maritalStatus')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
              {errors.maritalStatus && <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.maritalStatus.message}
              </p>}
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            Professional Information
          </h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-gray-500" />
              Occupation
            </label>
            <Input
              {...register('occupation')}
              placeholder="Enter occupation"
              error={errors.occupation?.message}
              className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </motion.div>
  )

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Step Header */}
      <div className="text-center border-b border-gray-100 pb-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-full">
            <Phone className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Contact & Address</h3>
        </div>
        <p className="text-gray-600">How to reach this member</p>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Contact Information */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Contact Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                Email Address *
              </label>
              <Input
                type="email"
                {...register('email')}
                placeholder="Enter email address"
                error={errors.email?.message}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                Phone Number *
              </label>
              <Input
                {...register('phone')}
                placeholder="Enter phone number"
                error={errors.phone?.message}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Home Address Section */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Home Address
          </h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Home className="w-4 h-4 text-gray-500" />
                Street Address *
              </label>
              <Input
                {...register('address.street')}
                placeholder="Enter street address"
                error={errors.address?.street?.message}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <Input
                  {...register('address.city')}
                  placeholder="Enter city"
                  error={errors.address?.city?.message}
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <Input
                  {...register('address.state')}
                  placeholder="Enter state"
                  error={errors.address?.state?.message}
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code *
                </label>
                <Input
                  {...register('address.zipCode')}
                  placeholder="Enter ZIP code"
                  error={errors.address?.zipCode?.message}
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                Country *
              </label>
              <Input
                {...register('address.country')}
                placeholder="Enter country"
                error={errors.address?.country?.message}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Work Address Section */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            Work Address
          </h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Building className="w-4 h-4 text-gray-500" />
              Work Address (Optional)
            </label>
            <Input
              {...register('workAddress')}
              placeholder="Enter work address"
              error={errors.workAddress?.message}
              className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </motion.div>
  )

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Step Header */}
      <div className="text-center border-b border-gray-100 pb-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-full">
            <Building className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Church Information</h3>
        </div>
        <p className="text-gray-600">Church roles and membership details</p>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Church Structure */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Church Structure
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                District
              </label>
              <select
                {...register('district')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                disabled={loadingData}
              >
                <option value="">Select a district (optional)</option>
                {districts.map((district) => (
                  <option key={district._id} value={district._id}>
                    {district.name}
                  </option>
                ))}
              </select>
              {errors.district && <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.district.message}
              </p>}
              {loadingData && <p className="text-gray-500 text-sm mt-1">Loading districts...</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit
              </label>
              <select
                {...register('unit')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                disabled={loadingData}
              >
                <option value="">Select a unit (optional)</option>
                {units.map((unit) => (
                  <option key={unit._id} value={unit._id}>
                    {unit.name}
                  </option>
                ))}
              </select>
              {errors.unit && <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.unit.message}
              </p>}
              {loadingData && <p className="text-gray-500 text-sm mt-1">Loading units...</p>}
            </div>
          </div>
        </div>

        {/* Membership Details */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Membership Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Membership Status
              </label>
              <select
                {...register('membershipStatus')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="new_convert">New Convert</option>
                <option value="worker">Worker</option>
                <option value="volunteer">Volunteer</option>
                <option value="leader">Leader</option>
                <option value="district_pastor">District Pastor</option>
                <option value="champ">Champ</option>
                <option value="unit_head">Unit Head</option>
                <option value="inactive">Inactive</option>
                <option value="transferred">Transferred</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                Date Joined
              </label>
              <Input
                type="date"
                {...register('dateJoined')}
                error={errors.dateJoined?.message}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Baptism Date
              </label>
              <Input
                type="date"
                {...register('baptismDate')}
                error={errors.baptismDate?.message}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmation Date
              </label>
              <Input
                type="date"
                {...register('confirmationDate')}
                error={errors.confirmationDate?.message}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Leadership Roles */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            Leadership Roles
          </h4>
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                {...register('leadershipRoles.isDistrictPastor')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">District Pastor</span>
            </label>

            {watchedLeadershipRoles?.isDistrictPastor && (
              <div className="ml-7">
                <select
                  {...register('leadershipRoles.pastorsDistrict')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  disabled={loadingData}
                >
                  <option value="">Select district you pastor</option>
                  {districts.map((district) => (
                    <option key={district._id} value={district._id}>
                      {district.name}
                    </option>
                  ))}
                </select>
                {errors.leadershipRoles?.pastorsDistrict && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.leadershipRoles.pastorsDistrict.message}
                  </p>
                )}
              </div>
            )}

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                {...register('leadershipRoles.isChamp')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Champ</span>
            </label>

            {watchedLeadershipRoles?.isChamp && (
              <div className="ml-7">
                <select
                  {...register('leadershipRoles.champForDistrict')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  disabled={loadingData}
                >
                  <option value="">Select district you're champ for</option>
                  {districts.map((district) => (
                    <option key={district._id} value={district._id}>
                      {district.name}
                    </option>
                  ))}
                </select>
                {errors.leadershipRoles?.champForDistrict && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.leadershipRoles.champForDistrict.message}
                  </p>
                )}
              </div>
            )}

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                {...register('leadershipRoles.isUnitHead')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Unit Head</span>
            </label>

            {watchedLeadershipRoles?.isUnitHead && (
              <div className="ml-7">
                <select
                  {...register('leadershipRoles.leadsUnit')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  disabled={loadingData}
                >
                  <option value="">Select unit you lead</option>
                  {units.map((unit) => (
                    <option key={unit._id} value={unit._id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
                {errors.leadershipRoles?.leadsUnit && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.leadershipRoles.leadsUnit.message}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Briefcase className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Ministry & Skills</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ministries
          </label>
          {ministryFields.map((field, index) => (
            <div key={field.id} className="flex gap-2 mb-2">
              <Input
                {...register(`ministries.${index}` as const)}
                placeholder="Enter ministry name"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => removeMinistry(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => appendMinistry('')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Ministry
          </Button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Skills
          </label>
          {skillFields.map((field, index) => (
            <div key={field.id} className="flex gap-2 mb-2">
              <Input
                {...register(`skills.${index}` as const)}
                placeholder="Enter skill"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => removeSkill(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => appendSkill('')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Skill
          </Button>
        </div>
      </div>
    </div>
  )

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Family Information</h3>
      </div>

      <div className="space-y-4">
        {watchedMaritalStatus === 'married' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Spouse
            </label>
            <Input
              {...register('spouse')}
              placeholder="Enter spouse name"
              error={errors.spouse?.message}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Parent
          </label>
          <Input
            {...register('parent')}
            placeholder="Enter parent name"
            error={errors.parent?.message}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Children
          </label>
          {childrenFields.map((field, index) => (
            <div key={field.id} className="flex gap-2 mb-2">
              <Input
                {...register(`children.${index}` as const)}
                placeholder="Enter child name"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => removeChild(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => appendChild('')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Child
          </Button>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Emergency Contact</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <Input
                {...register('emergencyContact.name')}
                placeholder="Enter emergency contact name"
                error={errors.emergencyContact?.name?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relationship
              </label>
              <Input
                {...register('emergencyContact.relationship')}
                placeholder="Enter relationship"
                error={errors.emergencyContact?.relationship?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <Input
                {...register('emergencyContact.phone')}
                placeholder="Enter emergency contact phone"
                error={errors.emergencyContact?.phone?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                type="email"
                {...register('emergencyContact.email')}
                placeholder="Enter emergency contact email (optional)"
                error={errors.emergencyContact?.email?.message}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep6 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Step Header */}
      <div className="text-center border-b border-gray-100 pb-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-full">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Additional Details</h3>
        </div>
        <p className="text-gray-600">Any extra notes or information</p>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Notes & Comments
          </h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              Additional Notes
            </label>
            <textarea
              {...register('notes')}
              rows={4}
              placeholder="Enter any additional notes about this member..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
            />
            {errors.notes && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.notes.message}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )

  const handleFinalSubmit = async () => {
    // Trigger validation on all fields
    const isValid = await trigger()

    if (!isValid) {
      // If validation fails, find the first step with errors and navigate there
      for (let i = 1; i <= totalSteps - 1; i++) {
        if (getErrorCountForStep(i) > 0) {
          setCurrentStep(i)
          break
        }
      }
      return
    }

    // If validation passes, submit the form
    handleSubmit(handleFormSubmit)()
  }

  const renderStep7 = () => (
    <FormSummary
      data={getValues()}
      onEdit={(step) => setCurrentStep(step)}
      onSubmit={handleFinalSubmit}
      loading={loading}
      mode={mode}
    />
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1()
      case 2: return renderStep2()
      case 3: return renderStep3()
      case 4: return renderStep4()
      case 5: return renderStep5()
      case 6: return renderStep6()
      case 7: return renderStep7()
      default: return renderStep1()
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
        <Card className="p-8 shadow-lg border-0 bg-white">
          {renderStepIndicator()}
          <AnimatePresence mode="wait">
            <div key={currentStep}>
              {renderCurrentStep()}
            </div>
          </AnimatePresence>
        </Card>

        {/* Enhanced Navigation */}
        <Card className="p-6 bg-gray-50 border-0">
          <div className="flex justify-between items-center">
            <div>
              {currentStep > 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={prevStep}
                    className="flex items-center gap-2 hover:shadow-md transition-all duration-200"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                </motion.div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                className="hover:shadow-md transition-all duration-200"
              >
                Cancel
              </Button>

              {currentStep < totalSteps ? (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {currentStep === totalSteps - 1 ? 'Review' : 'Continue'}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              ) : null}
            </div>
          </div>

          {/* Progress Summary */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                Step {currentStep} of {totalSteps} • {stepConfig[currentStep - 1].title}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <span>Auto-saved</span>
              </div>
            </div>
          </div>
        </Card>
      </form>
    </div>
  )
}