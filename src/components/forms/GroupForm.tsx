import React, { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, MapPin, Calendar, Clock, Phone, Mail, Home, Crown, Shield, Star,
  Plus, Trash2, ChevronLeft, ChevronRight, Check, AlertCircle, Building,
  Settings as SettingsIcon, Heart, FileText
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { groupSchema, GroupFormData } from '@/schemas/group'
import { Group, CreateGroupData, UpdateGroupData } from '@/services/groups'
import { cn } from '@/utils/cn'
import FormSummary from '@/components/ui/FormSummary'

interface GroupFormProps {
  group?: Group
  onSubmit: (data: CreateGroupData | UpdateGroupData) => Promise<void>
  onCancel: () => void
  loading?: boolean
  mode: 'create' | 'edit'
}

export default function GroupForm({
  group,
  onSubmit,
  onCancel,
  loading = false,
  mode
}: GroupFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 5

  const {
    register,
    handleSubmit,
    watch,
    control,
    trigger,
    formState: { errors },
    getValues
  } = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: group ? {
      name: group.name,
      type: group.type,
      description: group.description || '',
      capacity: group.capacity || undefined,
      districtPastor: group.districtPastor || '',
      unitHead: group.unitHead || '',
      champs: group.champs || [],
      meetingSchedule: group.meetingSchedule || {
        day: 'Sunday',
        time: '',
        frequency: 'weekly'
      },
      hostingInfo: group.hostingInfo || {
        currentHost: '',
        hostRotation: [],
        nextRotationDate: ''
      },
      contact: group.contact || {
        phone: '',
        email: '',
        address: ''
      }
    } : {
      name: '',
      type: 'fellowship',
      description: '',
      capacity: undefined,
      districtPastor: '',
      unitHead: '',
      champs: [],
      meetingSchedule: {
        day: 'Sunday',
        time: '',
        frequency: 'weekly'
      },
      hostingInfo: {
        currentHost: '',
        hostRotation: [],
        nextRotationDate: ''
      },
      contact: {
        phone: '',
        email: '',
        address: ''
      }
    }
  })

  const {
    fields: champFields,
    append: appendChamp,
    remove: removeChamp
  } = useFieldArray({
    control,
    name: 'champs'
  })

  const {
    fields: hostRotationFields,
    append: appendHost,
    remove: removeHost
  } = useFieldArray({
    control,
    name: 'hostingInfo.hostRotation'
  })

  const watchedType = watch('type')

  // Function to count errors per step
  const getErrorCountForStep = (stepNumber: number) => {
    const stepFields = stepConfig[stepNumber - 1].fields
    let errorCount = 0

    for (const field of stepFields) {
      if (field.includes('.')) {
        const parts = field.split('.')
        let error = errors
        for (const part of parts) {
          error = error?.[part as keyof typeof error]
        }
        if (error) errorCount++
      } else {
        if (errors[field as keyof typeof errors]) {
          errorCount++
        }
      }
    }

    return errorCount
  }

  const handleFormSubmit = async (data: GroupFormData) => {
    try {
      // Transform the data to match API requirements
      const transformedData = {
        ...data,
        // Only include leadership fields if they have values
        ...(data.districtPastor && data.districtPastor.trim() !== '' && { districtPastor: data.districtPastor }),
        ...(data.unitHead && data.unitHead.trim() !== '' && { unitHead: data.unitHead }),

        // Filter out empty champs
        champs: data.champs?.filter(Boolean) || [],

        // Handle meeting schedule - only include if all fields are provided
        ...(data.meetingSchedule?.day && data.meetingSchedule?.time && data.meetingSchedule?.frequency && {
          meetingSchedule: data.meetingSchedule
        }),

        // Handle hosting info - only include if current host is provided
        ...(data.hostingInfo?.currentHost && data.hostingInfo.currentHost.trim() !== '' && {
          hostingInfo: {
            ...data.hostingInfo,
            hostRotation: data.hostingInfo.hostRotation?.filter(Boolean) || []
          }
        }),

        // Handle contact - only include if at least one field is provided
        ...((data.contact?.phone || data.contact?.email || data.contact?.address) && {
          contact: {
            ...data.contact,
            email: data.contact.email || undefined
          }
        })
      }

      await onSubmit(transformedData)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const handleFinalSubmit = async () => {
    const isValid = await trigger()

    if (!isValid) {
      // Navigate to first step with errors
      for (let i = 1; i <= totalSteps - 1; i++) {
        if (getErrorCountForStep(i) > 0) {
          setCurrentStep(i)
          break
        }
      }
      return
    }

    handleSubmit(handleFormSubmit)()
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
      title: 'Basic Information',
      subtitle: 'Group name, type, and description',
      icon: Building,
      fields: ['name', 'type', 'description', 'capacity']
    },
    {
      id: 2,
      title: 'Leadership',
      subtitle: 'Assign leaders and champions',
      icon: Crown,
      fields: ['districtPastor', 'unitHead', 'champs']
    },
    {
      id: 3,
      title: 'Meeting Schedule',
      subtitle: 'When and how often the group meets',
      icon: Calendar,
      fields: ['meetingSchedule']
    },
    {
      id: 4,
      title: 'Hosting & Contact',
      subtitle: 'Hosting arrangements and contact information',
      icon: Home,
      fields: ['hostingInfo', 'contact']
    },
    {
      id: 5,
      title: 'Review & Submit',
      subtitle: 'Review all information before submitting',
      icon: Check,
      fields: []
    }
  ]

  const renderStepIndicator = () => (
    <div className="mb-8">
      {/* Desktop Progress */}
      <div className="hidden lg:block">
        <div className="flex items-center justify-between relative">
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
                >
                  {isCompleted && !hasErrors ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}

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
                    !isActive && !isCompleted && "text-gray-500"
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

      {/* Mobile Progress */}
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
            <Building className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Basic Information</h3>
        </div>
        <p className="text-gray-600">Set up the fundamental details of your group</p>
      </div>

      <div className="space-y-6">
        {/* Group Identity */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Group Identity
          </h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group Name *
              </label>
              <Input
                {...register('name')}
                placeholder="Enter group name"
                error={errors.name?.message}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group Type *
              </label>
              <select
                {...register('type')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="fellowship">Fellowship</option>
                <option value="ministry">Ministry</option>
                <option value="committee">Committee</option>
                <option value="district">District</option>
                <option value="unit">Unit</option>
              </select>
              {errors.type && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.type.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="Describe the purpose and activities of this group..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Group Settings */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Group Settings
          </h4>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              Maximum Capacity
            </label>
            <Input
              type="number"
              min="1"
              {...register('capacity', { valueAsNumber: true })}
              placeholder="e.g. 50 (optional)"
              error={errors.capacity?.message}
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
            <Crown className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Leadership</h3>
        </div>
        <p className="text-gray-600">Assign leaders and champions for your group</p>
      </div>

      <div className="space-y-6">
        {/* Primary Leadership */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Primary Leadership
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {watchedType === 'district' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-gray-500" />
                  District Pastor *
                </label>
                <Input
                  {...register('districtPastor')}
                  placeholder="Enter district pastor name"
                  error={errors.districtPastor?.message}
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {watchedType === 'unit' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-500" />
                  Unit Head *
                </label>
                <Input
                  {...register('unitHead')}
                  placeholder="Enter unit head name"
                  error={errors.unitHead?.message}
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Champions/Supporters */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            Champions & Supporters
          </h4>

          <div className="space-y-3">
            {champFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input
                  {...register(`champs.${index}` as const)}
                  placeholder="Enter champion name"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => removeChamp(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => appendChamp('')}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Champion
            </Button>
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
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Meeting Schedule</h3>
        </div>
        <p className="text-gray-600">Set up when and how often your group meets</p>
      </div>

      <div className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Meeting Details
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Day
              </label>
              <select
                {...register('meetingSchedule.day')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="Sunday">Sunday</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                Meeting Time
              </label>
              <Input
                type="time"
                {...register('meetingSchedule.time')}
                error={errors.meetingSchedule?.time?.message}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frequency
              </label>
              <select
                {...register('meetingSchedule.frequency')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          {errors.meetingSchedule && (
            <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.meetingSchedule.message}
            </p>
          )}
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
          <div className="p-2 bg-blue-100 rounded-full">
            <Home className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Hosting & Contact</h3>
        </div>
        <p className="text-gray-600">Set up hosting arrangements and contact information</p>
      </div>

      <div className="space-y-6">
        {/* Hosting Information */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            Hosting Information
          </h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Home className="w-4 h-4 text-gray-500" />
                Current Host
              </label>
              <Input
                {...register('hostingInfo.currentHost')}
                placeholder="Enter current host name"
                error={errors.hostingInfo?.currentHost?.message}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Host Rotation List
              </label>
              <div className="space-y-2">
                {hostRotationFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input
                      {...register(`hostingInfo.hostRotation.${index}` as const)}
                      placeholder="Enter host name"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => removeHost(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => appendHost('')}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Rotation
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Next Rotation Date
              </label>
              <Input
                type="date"
                {...register('hostingInfo.nextRotationDate')}
                error={errors.hostingInfo?.nextRotationDate?.message}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Contact Information
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                Phone Number
              </label>
              <Input
                {...register('contact.phone')}
                placeholder="Enter phone number"
                error={errors.contact?.phone?.message}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                Email Address
              </label>
              <Input
                type="email"
                {...register('contact.email')}
                placeholder="Enter email address"
                error={errors.contact?.email?.message}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              Address
            </label>
            <Input
              {...register('contact.address')}
              placeholder="Enter meeting address"
              error={errors.contact?.address?.message}
              className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </motion.div>
  )

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center pb-6 border-b border-gray-100">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="p-3 bg-green-100 rounded-full">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Review Information</h3>
            <p className="text-gray-600">Please review all details before submitting</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Basic Information</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentStep(1)}
                className="text-blue-600 hover:text-blue-700 p-0 h-auto"
              >
                Edit
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Name:</span>
              <span className="text-sm text-gray-900">{getValues('name') || 'Not provided'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Type:</span>
              <span className="text-sm text-gray-900 capitalize">{getValues('type')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Capacity:</span>
              <span className="text-sm text-gray-900">{getValues('capacity') || 'Not set'}</span>
            </div>
            {getValues('description') && (
              <div>
                <span className="text-sm font-medium text-gray-600">Description:</span>
                <p className="text-sm text-gray-900 mt-1">{getValues('description')}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Leadership */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Crown className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Leadership</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentStep(2)}
                className="text-blue-600 hover:text-blue-700 p-0 h-auto"
              >
                Edit
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {getValues('districtPastor') && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">District Pastor:</span>
                <span className="text-sm text-gray-900">{getValues('districtPastor')}</span>
              </div>
            )}
            {getValues('unitHead') && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Unit Head:</span>
                <span className="text-sm text-gray-900">{getValues('unitHead')}</span>
              </div>
            )}
            <div>
              <span className="text-sm font-medium text-gray-600">Champions:</span>
              <div className="mt-1">
                {getValues('champs')?.filter(Boolean).length > 0 ? (
                  getValues('champs')?.filter(Boolean).map((champ, index) => (
                    <span key={index} className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                      {champ}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">None</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Meeting Schedule */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Meeting Schedule</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentStep(3)}
                className="text-blue-600 hover:text-blue-700 p-0 h-auto"
              >
                Edit
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {getValues('meetingSchedule.day') && getValues('meetingSchedule.time') && getValues('meetingSchedule.frequency') ? (
              <>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Day:</span>
                  <span className="text-sm text-gray-900">{getValues('meetingSchedule.day')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Time:</span>
                  <span className="text-sm text-gray-900">{getValues('meetingSchedule.time')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Frequency:</span>
                  <span className="text-sm text-gray-900 capitalize">{getValues('meetingSchedule.frequency')}</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">No meeting schedule set</p>
            )}
          </div>
        </Card>

        {/* Contact & Hosting */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Home className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Contact & Hosting</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentStep(4)}
                className="text-blue-600 hover:text-blue-700 p-0 h-auto"
              >
                Edit
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {getValues('hostingInfo.currentHost') && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Current Host:</span>
                <span className="text-sm text-gray-900">{getValues('hostingInfo.currentHost')}</span>
              </div>
            )}
            {getValues('contact.phone') && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Phone:</span>
                <span className="text-sm text-gray-900">{getValues('contact.phone')}</span>
              </div>
            )}
            {getValues('contact.email') && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Email:</span>
                <span className="text-sm text-gray-900">{getValues('contact.email')}</span>
              </div>
            )}
            {getValues('contact.address') && (
              <div>
                <span className="text-sm font-medium text-gray-600">Address:</span>
                <p className="text-sm text-gray-900 mt-1">{getValues('contact.address')}</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Submit Button */}
      <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">
              Ready to {mode === 'create' ? 'Create' : 'Update'} Group?
            </h4>
            <p className="text-sm text-gray-600">
              All information looks good. Click submit to {mode === 'create' ? 'create' : 'update'} this group.
            </p>
          </div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handleFinalSubmit}
              loading={loading}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-200 px-8"
            >
              {loading ? 'Saving...' : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  {mode === 'create' ? 'Create Group' : 'Update Group'}
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </Card>
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1()
      case 2: return renderStep2()
      case 3: return renderStep3()
      case 4: return renderStep4()
      case 5: return renderStep5()
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

        {/* Navigation */}
        {currentStep < totalSteps && (
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
        )}
      </form>
    </div>
  )
}