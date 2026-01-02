import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Calendar, Clock, Crown, Shield, Star,
  ChevronLeft, ChevronRight, Check, AlertCircle, Building,
  Link2, Video, MapPin
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { groupSchema, GroupFormData } from '@/schemas/group'
import { Group, CreateGroupData, UpdateGroupData, groupsService } from '@/services/groups'
import { membersService, Member } from '@/services/members'
import { cn } from '@/utils/cn'

interface GroupFormProps {
  group?: Group
  onSubmit: (data: CreateGroupData | UpdateGroupData) => Promise<void>
  onCancel: () => void
  loading?: boolean
  mode: 'create' | 'edit'
}

// Error message component
const FormError = ({ message }: { message: string | string[] }) => {
  const messages = Array.isArray(message) ? message : [message]
  return (
    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-red-800">Error creating group</p>
          <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
            {messages.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function GroupForm({
  group,
  onSubmit,
  onCancel,
  loading = false,
  mode
}: GroupFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3
  const [availableUnits, setAvailableUnits] = useState<Group[]>([])
  const [loadingUnits, setLoadingUnits] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [submitError, setSubmitError] = useState<string | string[] | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
    getValues
  } = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: group ? {
      name: group.name,
      type: group.type,
      description: group.description || '',
      districtPastor: typeof group.districtPastor === 'object' ? group.districtPastor?._id : group.districtPastor || '',
      unitHead: typeof group.unitHead === 'object' ? group.unitHead?._id : group.unitHead || '',
      assistantUnitHead: typeof group.assistantUnitHead === 'object' ? group.assistantUnitHead?._id : group.assistantUnitHead || '',
      ministryDirector: typeof group.ministryDirector === 'object' ? group.ministryDirector?._id : group.ministryDirector || '',
      linkedUnits: group.linkedUnits?.map(u => typeof u === 'string' ? u : u._id) || [],
      meetingSchedule: group.meetingSchedule ? {
        day: group.meetingSchedule.day as any || 'Sunday',
        time: group.meetingSchedule.time || '',
        frequency: group.meetingSchedule.frequency || 'weekly',
        isVirtual: group.meetingSchedule.isVirtual || false,
        meetingLink: group.meetingSchedule.virtualLink || '',
        venue: group.meetingSchedule.location || '',
      } : {
        day: 'Sunday',
        time: '',
        frequency: 'weekly',
        isVirtual: false,
        meetingLink: '',
        venue: '',
      }
    } : {
      name: '',
      type: 'fellowship',
      description: '',
      districtPastor: '',
      unitHead: '',
      assistantUnitHead: '',
      ministryDirector: '',
      linkedUnits: [],
      meetingSchedule: {
        day: 'Sunday',
        time: '',
        frequency: 'weekly',
        isVirtual: false,
        meetingLink: '',
        venue: '',
      }
    }
  })

  const watchedType = watch('type')
  const watchedLinkedUnits = watch('linkedUnits')
  const watchedIsVirtual = watch('meetingSchedule.isVirtual')

  // Fetch members for leadership dropdowns
  useEffect(() => {
    const fetchMembers = async () => {
      setLoadingMembers(true)
      try {
        const response = await membersService.getMembers({ limit: 100 })
        console.log('Members fetched:', response)
        const membersList = response.items || response.data || []
        console.log('Members list:', membersList)
        setMembers(membersList)
      } catch (error) {
        console.error('Error fetching members:', error)
      } finally {
        setLoadingMembers(false)
      }
    }
    fetchMembers()
  }, [])

  // Fetch available units when type is ministry
  useEffect(() => {
    const fetchUnits = async () => {
      if (watchedType === 'ministry') {
        setLoadingUnits(true)
        try {
          const response = await groupsService.getUnits({ limit: 100 })
          setAvailableUnits(response.items || [])
        } catch (error) {
          console.error('Error fetching units:', error)
        } finally {
          setLoadingUnits(false)
        }
      }
    }
    fetchUnits()
  }, [watchedType])

  const stepConfig = [
    {
      id: 1,
      title: 'Basic Information',
      subtitle: 'Group details and leadership',
      icon: Building,
      fields: ['name', 'type', 'description', 'linkedUnits', 'districtPastor', 'unitHead', 'assistantUnitHead', 'ministryDirector']
    },
    {
      id: 2,
      title: 'Meeting Schedule',
      subtitle: 'When and where the group meets',
      icon: Calendar,
      fields: ['meetingSchedule']
    },
    {
      id: 3,
      title: 'Review & Submit',
      subtitle: 'Review all information',
      icon: Check,
      fields: []
    }
  ]

  const getErrorCountForStep = (stepNumber: number) => {
    const stepFields = stepConfig[stepNumber - 1].fields
    let errorCount = 0
    for (const field of stepFields) {
      if (field.includes('.')) {
        const parts = field.split('.')
        let error: any = errors
        for (const part of parts) {
          error = error?.[part]
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
    setSubmitError(null)
    try {
      const transformedData: CreateGroupData | UpdateGroupData = {
        name: data.name,
        type: data.type,
        description: data.description || undefined,
        // Leadership - only include if provided
        ...(data.type === 'district' && data.districtPastor && { districtPastor: data.districtPastor }),
        ...(data.type === 'unit' && data.unitHead && { unitHead: data.unitHead }),
        ...(data.type === 'unit' && data.assistantUnitHead && { assistantUnitHead: data.assistantUnitHead }),
        ...(data.type === 'ministry' && data.ministryDirector && { ministryDirector: data.ministryDirector }),
        // Linked units for ministry
        ...(data.type === 'ministry' && data.linkedUnits && data.linkedUnits.length > 0 && {
          linkedUnits: data.linkedUnits
        }),
        // Meeting schedule - only include if time is provided
        ...(data.meetingSchedule?.time && {
          meetingSchedule: {
            day: data.meetingSchedule.day.toLowerCase(),
            time: data.meetingSchedule.time,
            frequency: data.meetingSchedule.frequency,
            isVirtual: data.meetingSchedule.isVirtual || false,
            ...(data.meetingSchedule.isVirtual && data.meetingSchedule.meetingLink && {
              virtualLink: data.meetingSchedule.meetingLink
            }),
            ...(!data.meetingSchedule.isVirtual && data.meetingSchedule.venue && {
              location: data.meetingSchedule.venue
            }),
          }
        }),
      }

      console.log('Submitting group data:', transformedData)
      await onSubmit(transformedData)
    } catch (error: any) {
      console.error('Form submission error:', error)
      // Extract error message from various formats
      const errorMessage = error?.message || error?.details || error?.error || 'An unexpected error occurred'
      setSubmitError(errorMessage)
    }
  }

  const handleFinalSubmit = async () => {
    const isValid = await trigger()
    if (!isValid) {
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
    setSubmitError(null)
    setCurrentStep(prev => Math.min(prev + 1, totalSteps))
  }
  const prevStep = () => {
    setSubmitError(null)
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const getMemberName = (memberId: string) => {
    const member = members.find(m => (m._id || (m as any).id) === memberId)
    return member ? `${member.firstName} ${member.lastName}` : memberId
  }

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
                    isActive && !hasErrors && "bg-blue-600 text-white border-blue-600",
                    isActive && hasErrors && "bg-red-600 text-white border-red-600",
                    isCompleted && !hasErrors && "bg-green-600 text-white border-green-600",
                    isCompleted && hasErrors && "bg-orange-600 text-white border-orange-600",
                    !isActive && !isCompleted && "bg-white text-gray-400 border-gray-300"
                  )}
                  whileHover={{ scale: 1.05 }}
                >
                  {isCompleted && !hasErrors ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  {hasErrors && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {errorCount}
                    </div>
                  )}
                </motion.div>
                <div className="mt-3 text-center max-w-24">
                  <div className={cn(
                    "text-xs font-medium",
                    isActive && "text-blue-600",
                    isCompleted && "text-green-600",
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

      {/* Mobile Progress */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-500">Step {currentStep} of {totalSteps}</div>
          <div className="text-sm font-medium text-gray-900">{Math.round((currentStep / totalSteps) * 100)}% Complete</div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
        <div className="mt-4 text-center">
          <div className="flex items-center justify-center gap-2 text-blue-600">
            {React.createElement(stepConfig[currentStep - 1].icon, { className: "w-5 h-5" })}
            <span className="font-medium">{stepConfig[currentStep - 1].title}</span>
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
      className="space-y-6"
    >
      <div className="text-center border-b border-gray-100 pb-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-full">
            <Building className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Basic Information</h3>
        </div>
        <p className="text-gray-600">Set up the fundamental details of your group</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Group Name *</label>
          <Input
            {...register('name')}
            placeholder="Enter group name"
            error={errors.name?.message}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Group Type *</label>
          <select
            {...register('type')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="fellowship">Fellowship</option>
            <option value="ministry">Ministry</option>
            <option value="committee">Committee</option>
            <option value="district">District</option>
            <option value="unit">Unit</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Describe the purpose of this group..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Linked Units - Only for Ministry */}
        {watchedType === 'ministry' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-gray-500" />
              Linked Units
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Members in selected units will automatically join this ministry.
            </p>
            {loadingUnits ? (
              <div className="p-3 border rounded-md bg-gray-50 text-gray-500">Loading units...</div>
            ) : availableUnits.length === 0 ? (
              <div className="p-3 border rounded-md bg-gray-50 text-gray-500">No units available</div>
            ) : (
              <div className="max-h-48 overflow-y-auto border rounded-md p-3 bg-white space-y-2">
                {availableUnits.map((unit) => (
                  <label key={unit._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('linkedUnits')}
                      value={unit._id}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm text-gray-900">{unit.name}</span>
                    <span className="text-xs text-gray-500">({unit.currentMemberCount || 0} members)</span>
                  </label>
                ))}
              </div>
            )}
            {watchedLinkedUnits && watchedLinkedUnits.length > 0 && (
              <p className="text-xs text-blue-600 mt-2">{watchedLinkedUnits.length} unit(s) selected</p>
            )}
          </div>
        )}
      </div>

      {/* Leadership Section */}
      {(watchedType === 'district' || watchedType === 'unit' || watchedType === 'ministry') && (
        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-600" />
            Leadership
          </h4>
          {loadingMembers ? (
            <div className="p-4 text-center text-gray-500">Loading members...</div>
          ) : members.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No members found. Please add members first.</div>
          ) : (
            <>
              {/* District Pastor - for districts */}
              {watchedType === 'district' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    District Pastor
                  </label>
                  <select
                    {...register('districtPastor')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a member...</option>
                    {members.map((member) => {
                      const memberId = member._id || (member as any).id
                      return (
                        <option key={memberId} value={memberId}>
                          {member.firstName} {member.lastName}
                        </option>
                      )
                    })}
                  </select>
                </div>
              )}

              {/* Unit Head & Assistant - for units */}
              {watchedType === 'unit' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit Head
                    </label>
                    <select
                      {...register('unitHead')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a member...</option>
                      {members.map((member) => {
                        const memberId = member._id || (member as any).id
                        return (
                          <option key={memberId} value={memberId}>
                            {member.firstName} {member.lastName}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assistant Unit Head
                    </label>
                    <select
                      {...register('assistantUnitHead')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a member (optional)...</option>
                      {members.map((member) => {
                        const memberId = member._id || (member as any).id
                        return (
                          <option key={memberId} value={memberId}>
                            {member.firstName} {member.lastName}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                </div>
              )}

              {/* Ministry Director - for ministries */}
              {watchedType === 'ministry' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ministry Director
                  </label>
                  <select
                    {...register('ministryDirector')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a member...</option>
                    {members.map((member) => {
                      const memberId = member._id || (member as any).id
                      return (
                        <option key={memberId} value={memberId}>
                          {member.firstName} {member.lastName}
                        </option>
                      )
                    })}
                  </select>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </motion.div>
  )

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center border-b border-gray-100 pb-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-full">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Meeting Schedule</h3>
        </div>
        <p className="text-gray-600">Set up when and where your group meets</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Day</label>
            <select
              {...register('meetingSchedule.day')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <Input type="time" {...register('meetingSchedule.time')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
            <select
              {...register('meetingSchedule.frequency')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        {/* Virtual/Physical Toggle */}
        <div className="pt-4 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-3">Meeting Type</label>
          <div className="flex gap-4">
            <label className={cn(
              "flex-1 flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all",
              !watchedIsVirtual ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
            )}>
              <input
                type="radio"
                name="meetingType"
                onChange={() => setValue('meetingSchedule.isVirtual', false)}
                checked={watchedIsVirtual === false}
                className="w-4 h-4 text-blue-600"
              />
              <MapPin className="w-5 h-5 text-gray-600" />
              <span className="font-medium">Physical</span>
            </label>
            <label className={cn(
              "flex-1 flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all",
              watchedIsVirtual ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
            )}>
              <input
                type="radio"
                name="meetingType"
                onChange={() => setValue('meetingSchedule.isVirtual', true)}
                checked={watchedIsVirtual === true}
                className="w-4 h-4 text-blue-600"
              />
              <Video className="w-5 h-5 text-gray-600" />
              <span className="font-medium">Virtual</span>
            </label>
          </div>
        </div>

        {/* Venue or Meeting Link based on selection */}
        {watchedIsVirtual ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Video className="w-4 h-4 text-gray-500" />
              Meeting Link
            </label>
            <Input
              {...register('meetingSchedule.meetingLink')}
              placeholder="https://zoom.us/j/... or https://meet.google.com/..."
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              Venue
            </label>
            <Input
              {...register('meetingSchedule.venue')}
              placeholder="Enter meeting location..."
            />
          </div>
        )}
      </div>
    </motion.div>
  )

  const renderStep3 = () => (
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
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">Basic Information</h4>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)} className="text-blue-600">
              Edit
            </Button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium">{getValues('name') || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <span className="font-medium capitalize">{getValues('type')}</span>
            </div>
            {getValues('description') && (
              <div>
                <span className="text-gray-600">Description:</span>
                <p className="mt-1 text-gray-900">{getValues('description')}</p>
              </div>
            )}
            {getValues('type') === 'ministry' && watchedLinkedUnits && watchedLinkedUnits.length > 0 && (
              <div>
                <span className="text-gray-600">Linked Units:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {watchedLinkedUnits.map((unitId) => {
                    const unit = availableUnits.find(u => u._id === unitId)
                    return (
                      <span key={unitId} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {unit?.name || unitId}
                      </span>
                    )
                  })}
                </div>
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
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">Leadership</h4>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)} className="text-blue-600">
              Edit
            </Button>
          </div>
          <div className="space-y-2 text-sm">
            {getValues('type') === 'district' && (
              <div className="flex justify-between">
                <span className="text-gray-600">District Pastor:</span>
                <span className="font-medium">{getValues('districtPastor') ? getMemberName(getValues('districtPastor')!) : 'Not assigned'}</span>
              </div>
            )}
            {getValues('type') === 'unit' && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Unit Head:</span>
                  <span className="font-medium">{getValues('unitHead') ? getMemberName(getValues('unitHead')!) : 'Not assigned'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Assistant:</span>
                  <span className="font-medium">{getValues('assistantUnitHead') ? getMemberName(getValues('assistantUnitHead')!) : 'Not assigned'}</span>
                </div>
              </>
            )}
            {getValues('type') === 'ministry' && (
              <div className="flex justify-between">
                <span className="text-gray-600">Director:</span>
                <span className="font-medium">{getValues('ministryDirector') ? getMemberName(getValues('ministryDirector')!) : 'Not assigned'}</span>
              </div>
            )}
            {(getValues('type') === 'fellowship' || getValues('type') === 'committee') && (
              <p className="text-gray-500">No specific leadership assigned</p>
            )}
          </div>
        </Card>

        {/* Meeting Schedule */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">Meeting Schedule</h4>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)} className="text-blue-600">
              Edit
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Day:</span>
              <p className="font-medium">{getValues('meetingSchedule.day') || '-'}</p>
            </div>
            <div>
              <span className="text-gray-600">Time:</span>
              <p className="font-medium">{getValues('meetingSchedule.time') || '-'}</p>
            </div>
            <div>
              <span className="text-gray-600">Frequency:</span>
              <p className="font-medium capitalize">{getValues('meetingSchedule.frequency') || '-'}</p>
            </div>
            <div>
              <span className="text-gray-600">Type:</span>
              <p className="font-medium">{watchedIsVirtual ? 'Virtual' : 'Physical'}</p>
            </div>
            {watchedIsVirtual && getValues('meetingSchedule.meetingLink') && (
              <div className="col-span-2 md:col-span-4">
                <span className="text-gray-600">Meeting Link:</span>
                <p className="font-medium text-blue-600 truncate">{getValues('meetingSchedule.meetingLink')}</p>
              </div>
            )}
            {!watchedIsVirtual && getValues('meetingSchedule.venue') && (
              <div className="col-span-2 md:col-span-4">
                <span className="text-gray-600">Venue:</span>
                <p className="font-medium">{getValues('meetingSchedule.venue')}</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Error Display */}
      {submitError && <FormError message={submitError} />}

      {/* Submit Button */}
      <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">
              Ready to {mode === 'create' ? 'Create' : 'Update'} Group?
            </h4>
            <p className="text-sm text-gray-600">
              Click submit to {mode === 'create' ? 'create' : 'update'} this group.
            </p>
          </div>
          <Button
            onClick={handleFinalSubmit}
            loading={loading}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 px-8"
          >
            {loading ? 'Saving...' : (
              <>
                <Check className="w-5 h-5 mr-2" />
                {mode === 'create' ? 'Create Group' : 'Update Group'}
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1()
      case 2: return renderStep2()
      case 3: return renderStep3()
      default: return renderStep1()
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
        <Card className="p-8 shadow-lg border-0 bg-white">
          {renderStepIndicator()}
          <AnimatePresence mode="wait">
            <div key={currentStep}>{renderCurrentStep()}</div>
          </AnimatePresence>
        </Card>

        {/* Navigation */}
        {currentStep < totalSteps && (
          <Card className="p-6 bg-gray-50 border-0">
            <div className="flex justify-between items-center">
              <div>
                {currentStep > 1 && (
                  <Button type="button" variant="secondary" onClick={prevStep}>
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button type="button" variant="secondary" onClick={onCancel}>
                  Cancel
                </Button>
                <Button type="button" onClick={nextStep}>
                  {currentStep === totalSteps - 1 ? 'Review' : 'Continue'}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </Card>
        )}
      </form>
    </div>
  )
}
