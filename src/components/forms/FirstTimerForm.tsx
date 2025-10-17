import React, { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, User, MapPin, Heart, Users, Star, Phone, Mail,
  ChevronLeft, ChevronRight, Check, AlertCircle, Calendar, UserPlus,
  Home, Building, FileText, Tag, Clock
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { firstTimerSchema, FirstTimerFormData } from '@/schemas/firstTimer'
import { FirstTimer } from '@/services/first-timers'
import { cn } from '@/utils/cn'

interface FirstTimerFormProps {
  firstTimer?: FirstTimer
  onSubmit: (data: FirstTimerFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
  mode: 'create' | 'edit'
}

export default function FirstTimerForm({
  firstTimer,
  onSubmit,
  onCancel,
  loading = false,
  mode
}: FirstTimerFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 6

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
    getValues
  } = useForm<FirstTimerFormData>({
    resolver: zodResolver(firstTimerSchema),
    defaultValues: firstTimer ? {
      firstName: firstTimer.firstName,
      lastName: firstTimer.lastName,
      phone: firstTimer.phone,
      email: firstTimer.email || '',
      dateOfBirth: firstTimer.dateOfBirth || '',
      gender: firstTimer.gender,
      maritalStatus: firstTimer.maritalStatus,
      address: firstTimer.address || {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      dateOfVisit: firstTimer.dateOfVisit,
      serviceType: firstTimer.serviceType || '',
      howDidYouHear: firstTimer.howDidYouHear,
      visitorType: firstTimer.visitorType || 'first_time',
      familyMembers: firstTimer.familyMembers || [],
      interests: firstTimer.interests || [],
      prayerRequests: firstTimer.prayerRequests || [],
      servingInterests: firstTimer.servingInterests || [],
      occupation: firstTimer.occupation || '',
      emergencyContact: firstTimer.emergencyContact || {
        name: '',
        relationship: '',
        phone: ''
      },
      followUps: firstTimer.followUps || [],
      status: firstTimer.status || 'not_contacted',
      converted: firstTimer.converted || false,
      assignedTo: firstTimer.assignedTo || '',
      notes: firstTimer.notes || '',
      tags: firstTimer.tags || []
    } : {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      dateOfBirth: '',
      gender: undefined,
      maritalStatus: undefined,
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Nigeria'
      },
      dateOfVisit: new Date().toISOString().split('T')[0],
      serviceType: '',
      howDidYouHear: undefined,
      visitorType: 'first_time',
      familyMembers: [],
      interests: [],
      prayerRequests: [],
      servingInterests: [],
      occupation: '',
      emergencyContact: {
        name: '',
        relationship: '',
        phone: ''
      },
      followUps: [],
      status: 'not_contacted',
      converted: false,
      assignedTo: '',
      notes: '',
      tags: []
    }
  })

  const {
    fields: familyFields,
    append: appendFamily,
    remove: removeFamily
  } = useFieldArray({
    control,
    name: 'familyMembers'
  })

  const {
    fields: interestFields,
    append: appendInterest,
    remove: removeInterest
  } = useFieldArray({
    control,
    name: 'interests'
  })

  const {
    fields: prayerFields,
    append: appendPrayer,
    remove: removePrayer
  } = useFieldArray({
    control,
    name: 'prayerRequests'
  })

  const {
    fields: servingFields,
    append: appendServing,
    remove: removeServing
  } = useFieldArray({
    control,
    name: 'servingInterests'
  })

  const {
    fields: tagFields,
    append: appendTag,
    remove: removeTag
  } = useFieldArray({
    control,
    name: 'tags'
  })

  const watchedMaritalStatus = watch('maritalStatus')

  const handleFormSubmit = async (data: FirstTimerFormData) => {
    try {
      await onSubmit(data)
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
      title: 'Visitor Information',
      subtitle: 'Basic details about the visitor',
      icon: User,
      fields: ['firstName', 'lastName', 'phone', 'email', 'dateOfBirth', 'gender', 'maritalStatus', 'occupation']
    },
    {
      id: 2,
      title: 'Visit Details',
      subtitle: 'Information about their church visit',
      icon: Calendar,
      fields: ['dateOfVisit', 'serviceType', 'howDidYouHear', 'visitorType']
    },
    {
      id: 3,
      title: 'Contact & Address',
      subtitle: 'How to reach this visitor',
      icon: MapPin,
      fields: ['address', 'emergencyContact']
    },
    {
      id: 4,
      title: 'Family & Interests',
      subtitle: 'Family members and personal interests',
      icon: Heart,
      fields: ['familyMembers', 'interests', 'servingInterests']
    },
    {
      id: 5,
      title: 'Prayer & Follow-up',
      subtitle: 'Prayer requests and follow-up status',
      icon: Star,
      fields: ['prayerRequests', 'status', 'assignedTo', 'tags']
    },
    {
      id: 6,
      title: 'Additional Notes',
      subtitle: 'Any extra information',
      icon: FileText,
      fields: ['notes']
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
              className="h-full bg-gradient-to-r from-green-500 to-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>

          {stepConfig.map((step, index) => {
            const isActive = step.id === currentStep
            const isCompleted = step.id < currentStep
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
                    "w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 transition-all duration-300",
                    isActive && "bg-green-600 text-white border-green-600 shadow-green-200",
                    isCompleted && "bg-blue-600 text-white border-blue-600 shadow-blue-200",
                    !isActive && !isCompleted && "bg-white text-gray-400 border-gray-300"
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </motion.div>
                <div className="mt-3 text-center max-w-24">
                  <div className={cn(
                    "text-xs font-medium",
                    isActive && "text-green-600",
                    isCompleted && "text-blue-600",
                    !isActive && !isCompleted && "text-gray-500"
                  )}>
                    {step.title}
                  </div>
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
            className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
        <div className="mt-4 text-center">
          <div className="flex items-center justify-center gap-2 text-green-600">
            {React.createElement(stepConfig[currentStep - 1].icon, { className: "w-5 h-5" })}
            <span className="font-medium">{stepConfig[currentStep - 1].title}</span>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {stepConfig[currentStep - 1].subtitle}
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
          <div className="p-2 bg-green-100 rounded-full">
            <User className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Visitor Information</h3>
        </div>
        <p className="text-gray-600">Basic details about the visitor</p>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Name Section */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
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
                className="transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                className="transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Contact Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                Phone Number *
              </label>
              <Input
                {...register('phone')}
                placeholder="Enter phone number"
                error={errors.phone?.message}
                className="transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                Email Address
              </label>
              <Input
                type="email"
                {...register('email')}
                placeholder="Enter email address (optional)"
                error={errors.email?.message}
                className="transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
        </div>

        {/* Personal Details */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            Personal Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                Date of Birth
              </label>
              <Input
                type="date"
                {...register('dateOfBirth')}
                error={errors.dateOfBirth?.message}
                className="transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                {...register('gender')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
              >
                <option value="">Select gender</option>
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
                Marital Status
              </label>
              <select
                {...register('maritalStatus')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
              >
                <option value="">Select status</option>
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

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Building className="w-4 h-4 text-gray-500" />
                Occupation
              </label>
              <Input
                {...register('occupation')}
                placeholder="Enter occupation"
                error={errors.occupation?.message}
                className="transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
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
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Visit Details</h3>
        </div>
        <p className="text-gray-600">Information about their church visit</p>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Visit Information */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Visit Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                Date of Visit *
              </label>
              <Input
                type="date"
                {...register('dateOfVisit')}
                error={errors.dateOfVisit?.message}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Type
              </label>
              <select
                {...register('serviceType')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">Select service type</option>
                <option value="sunday_service">Sunday Service</option>
                <option value="midweek_service">Midweek Service</option>
                <option value="special_event">Special Event</option>
                <option value="conference">Conference</option>
                <option value="revival">Revival</option>
                <option value="other">Other</option>
              </select>
              {errors.serviceType && <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.serviceType.message}
              </p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How Did You Hear About Us?
              </label>
              <select
                {...register('howDidYouHear')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">Select option</option>
                <option value="friend">Friend/Family</option>
                <option value="family">Family Member</option>
                <option value="advertisement">Advertisement</option>
                <option value="online">Online/Social Media</option>
                <option value="event">Event/Program</option>
                <option value="walkby">Walking By</option>
                <option value="other">Other</option>
              </select>
              {errors.howDidYouHear && <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.howDidYouHear.message}
              </p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visitor Type
              </label>
              <select
                {...register('visitorType')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="first_time">First Time Visitor</option>
                <option value="returning">Returning Visitor</option>
                <option value="new_to_area">New to Area</option>
                <option value="church_shopping">Church Shopping</option>
              </select>
              {errors.visitorType && <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.visitorType.message}
              </p>}
            </div>
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
          <div className="p-2 bg-purple-100 rounded-full">
            <MapPin className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Contact & Address</h3>
        </div>
        <p className="text-gray-600">How to reach this visitor</p>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Address Information */}
        <div className="bg-purple-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            Home Address
          </h4>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Home className="w-4 h-4 text-gray-500" />
                Street Address
              </label>
              <Input
                {...register('address.street')}
                placeholder="Enter street address"
                error={errors.address?.street?.message}
                className="transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <Input
                  {...register('address.city')}
                  placeholder="Enter city"
                  error={errors.address?.city?.message}
                  className="transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <Input
                  {...register('address.state')}
                  placeholder="Enter state"
                  error={errors.address?.state?.message}
                  className="transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zip Code
                </label>
                <Input
                  {...register('address.zipCode')}
                  placeholder="Enter zip code"
                  error={errors.address?.zipCode?.message}
                  className="transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <Input
                  {...register('address.country')}
                  placeholder="Enter country"
                  error={errors.address?.country?.message}
                  className="transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-red-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            Emergency Contact
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Name
              </label>
              <Input
                {...register('emergencyContact.name')}
                placeholder="Enter contact name"
                error={errors.emergencyContact?.name?.message}
                className="transition-all duration-200 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relationship
              </label>
              <Input
                {...register('emergencyContact.relationship')}
                placeholder="e.g., Spouse, Parent, Sibling"
                error={errors.emergencyContact?.relationship?.message}
                className="transition-all duration-200 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                Phone Number
              </label>
              <Input
                {...register('emergencyContact.phone')}
                placeholder="Enter phone number"
                error={errors.emergencyContact?.phone?.message}
                className="transition-all duration-200 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )

  const renderStep4 = () => (
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
          <div className="p-2 bg-pink-100 rounded-full">
            <Heart className="w-6 h-6 text-pink-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Family & Interests</h3>
        </div>
        <p className="text-gray-600">Family members and personal interests</p>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Family Members */}
        <div className="bg-pink-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
              Family Members
            </h4>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => appendFamily({ name: '', relationship: '', age: undefined, attended: false })}
              className="flex items-center gap-2 text-pink-600 hover:text-pink-700"
            >
              <Plus className="w-4 h-4" />
              Add Family Member
            </Button>
          </div>

          {familyFields.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No family members added yet</p>
              <p className="text-sm">Click "Add Family Member" to start</p>
            </div>
          ) : (
            <div className="space-y-4">
              {familyFields.map((field, index) => (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white p-4 rounded-lg border border-pink-200"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Name
                      </label>
                      <Input
                        {...register(`familyMembers.${index}.name`)}
                        placeholder="Family member name"
                        error={errors.familyMembers?.[index]?.name?.message}
                        size="sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Relationship
                      </label>
                      <Input
                        {...register(`familyMembers.${index}.relationship`)}
                        placeholder="e.g., Spouse, Child"
                        error={errors.familyMembers?.[index]?.relationship?.message}
                        size="sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Age
                      </label>
                      <Input
                        type="number"
                        {...register(`familyMembers.${index}.age`, { valueAsNumber: true })}
                        placeholder="Age"
                        error={errors.familyMembers?.[index]?.age?.message}
                        size="sm"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                          <input
                            type="checkbox"
                            {...register(`familyMembers.${index}.attended`)}
                            className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                          />
                          Attended Service
                        </label>
                      </div>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => removeFamily(index)}
                        className="p-2"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Interests */}
        <div className="bg-green-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Personal Interests
            </h4>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => appendInterest('')}
              className="flex items-center gap-2 text-green-600 hover:text-green-700"
            >
              <Plus className="w-4 h-4" />
              Add Interest
            </Button>
          </div>

          {interestFields.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Star className="w-6 h-6 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No interests added yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {interestFields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Input
                    {...register(`interests.${index}`)}
                    placeholder="Enter interest"
                    size="sm"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeInterest(index)}
                    className="p-2"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Serving Interests */}
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Areas of Service Interest
            </h4>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => appendServing('')}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Service Area
            </Button>
          </div>

          {servingFields.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <UserPlus className="w-6 h-6 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No service interests added yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {servingFields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Input
                    {...register(`servingInterests.${index}`)}
                    placeholder="e.g., Music, Children's Ministry"
                    size="sm"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeServing(index)}
                    className="p-2"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )

  const renderStep5 = () => (
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
          <div className="p-2 bg-yellow-100 rounded-full">
            <Star className="w-6 h-6 text-yellow-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Prayer & Follow-up</h3>
        </div>
        <p className="text-gray-600">Prayer requests and follow-up status</p>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Prayer Requests */}
        <div className="bg-yellow-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              Prayer Requests
            </h4>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => appendPrayer('')}
              className="flex items-center gap-2 text-yellow-600 hover:text-yellow-700"
            >
              <Plus className="w-4 h-4" />
              Add Prayer Request
            </Button>
          </div>

          {prayerFields.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Star className="w-6 h-6 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No prayer requests added yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {prayerFields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Input
                    {...register(`prayerRequests.${index}`)}
                    placeholder="Enter prayer request"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removePrayer(index)}
                    className="p-2"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Follow-up Status */}
        <div className="bg-indigo-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
            Follow-up Management
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                Follow-up Status
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              >
                <option value="not_contacted">Not Contacted</option>
                <option value="contacted">Contacted</option>
                <option value="scheduled_visit">Scheduled Visit</option>
                <option value="visited">Visited</option>
                <option value="joined_group">Joined Group</option>
                <option value="converted">Converted</option>
                <option value="lost_contact">Lost Contact</option>
              </select>
              {errors.status && <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.status.message}
              </p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-gray-500" />
                Assigned To
              </label>
              <Input
                {...register('assignedTo')}
                placeholder="Enter name of person assigned"
                error={errors.assignedTo?.message}
                className="transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                {...register('converted')}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <Check className="w-4 h-4 text-green-500" />
              Mark as Converted
            </label>
          </div>
        </div>

        {/* Tags */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              Tags
            </h4>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => appendTag('')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-700"
            >
              <Plus className="w-4 h-4" />
              Add Tag
            </Button>
          </div>

          {tagFields.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Tag className="w-6 h-6 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No tags added yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {tagFields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Input
                    {...register(`tags.${index}`)}
                    placeholder="Enter tag"
                    size="sm"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeTag(index)}
                    className="p-2"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
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
          <div className="p-2 bg-gray-100 rounded-full">
            <FileText className="w-6 h-6 text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Additional Notes</h3>
        </div>
        <p className="text-gray-600">Any extra information about this visitor</p>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            Notes & Comments
          </h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              {...register('notes')}
              rows={6}
              placeholder="Enter any additional notes, observations, or important information about this visitor..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200 resize-none"
            />
            {errors.notes && <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.notes.message}
            </p>}
          </div>
        </div>

        {/* Form Summary */}
        <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
          <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Form Summary
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 mb-1">Visitor Name:</p>
              <p className="font-medium">{watch('firstName')} {watch('lastName')}</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Contact:</p>
              <p className="font-medium">{watch('phone')}</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Visit Date:</p>
              <p className="font-medium">{watch('dateOfVisit')}</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Status:</p>
              <p className="font-medium capitalize">{watch('status')?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1()
      case 2: return renderStep2()
      case 3: return renderStep3()
      case 4: return renderStep4()
      case 5: return renderStep5()
      case 6: return renderStep6()
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
                    className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    loading={loading}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {loading ? (
                      'Saving...'
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        {mode === 'create' ? 'Add Visitor' : 'Update Visitor'}
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
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