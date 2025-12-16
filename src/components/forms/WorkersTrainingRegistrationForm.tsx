import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  AlertCircle,
  Car,
  Home,
  Heart,
  FileText,
  Calendar,
  Users,
  MapPin,
  Clock,
  Loader2
} from 'lucide-react'

import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Cohort } from '@/types/workers-training'
import { workersTrainingService } from '@/services/workers-training'
import {
  PublicTrainingRegistrationSchema,
  PublicTrainingRegistrationFormData
} from '@/schemas/workers-training'

interface WorkersTrainingRegistrationFormProps {
  onSubmit: (data: PublicTrainingRegistrationFormData) => Promise<void>
  loading?: boolean
  availableCohorts: Cohort[]
  loadingCohorts?: boolean
  onSuccess?: () => void
}

export default function WorkersTrainingRegistrationForm({
  onSubmit,
  loading = false,
  availableCohorts,
  loadingCohorts = false,
  onSuccess
}: WorkersTrainingRegistrationFormProps) {
  const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    trigger
  } = useForm<PublicTrainingRegistrationFormData>({
    resolver: zodResolver(PublicTrainingRegistrationSchema),
    mode: 'onChange',
    defaultValues: {
      hasTransportation: false,
      needsAccommodation: false,
    }
  })

  const watchedCohortId = watch('cohortId')
  const needsAccommodation = watch('needsAccommodation')

  React.useEffect(() => {
    if (watchedCohortId) {
      const cohort = availableCohorts.find(c => c._id === watchedCohortId)
      setSelectedCohort(cohort || null)
    }
  }, [watchedCohortId, availableCohorts])

  const onSubmitForm = async (data: PublicTrainingRegistrationFormData) => {
    try {
      await onSubmit(data)
      onSuccess?.()
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const nextStep = async () => {
    let fieldsToValidate: (keyof PublicTrainingRegistrationFormData)[] = []

    if (currentStep === 1) {
      fieldsToValidate = ['firstName', 'lastName', 'email', 'phone']
    } else if (currentStep === 2) {
      fieldsToValidate = ['cohortId']
    }

    const isStepValid = await trigger(fieldsToValidate)
    if (isStepValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <User className="w-12 h-12 mx-auto text-blue-600 mb-3" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Personal Information</h2>
              <p className="text-gray-600">Let's start with your basic details</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <Input
                  {...register('firstName')}
                  placeholder="Enter your first name"
                  error={errors.firstName?.message}
                  icon={<User className="w-4 h-4" />}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <Input
                  {...register('lastName')}
                  placeholder="Enter your last name"
                  error={errors.lastName?.message}
                  icon={<User className="w-4 h-4" />}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="your.email@example.com"
                  error={errors.email?.message}
                  icon={<Mail className="w-4 h-4" />}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <Input
                  {...register('phone')}
                  type="tel"
                  placeholder="+234 800 000 0000"
                  error={errors.phone?.message}
                  icon={<Phone className="w-4 h-4" />}
                />
              </div>
            </div>
          </motion.div>
        )

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <GraduationCap className="w-12 h-12 mx-auto text-blue-600 mb-3" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Choose Your Program</h2>
              <p className="text-gray-600">Select the training program you'd like to join</p>
            </div>

            {loadingCohorts ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
                <p className="text-gray-600">Loading available programs...</p>
              </div>
            ) : availableCohorts.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 mx-auto text-yellow-500 mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Programs Available</h3>
                <p className="text-gray-600">
                  Registration is currently closed for all programs. Please check back later.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableCohorts.map((cohort) => (
                  <motion.div
                    key={cohort._id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <label className="cursor-pointer">
                      <input
                        type="radio"
                        {...register('cohortId')}
                        value={cohort._id}
                        className="sr-only"
                      />
                      <div
                        className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                          watchedCohortId === cohort._id
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {cohort.name}
                            </h3>
                            <p className="text-sm text-blue-600 font-medium">
                              {workersTrainingService.getCohortTypeDisplayName(cohort.type)}
                            </p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 transition-colors ${
                            watchedCohortId === cohort._id
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {watchedCohortId === cohort._id && (
                              <div className="w-full h-full rounded-full bg-white scale-50"></div>
                            )}
                          </div>
                        </div>

                        {cohort.description && (
                          <p className="text-gray-600 text-sm mb-4">{cohort.description}</p>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {new Date(cohort.startDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          {cohort.meetingDays && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <Clock className="w-3 h-3" />
                              <span>{cohort.meetingDays}</span>
                            </div>
                          )}
                          {cohort.venue && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{cohort.venue}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-gray-600">
                            <Users className="w-3 h-3" />
                            <span>
                              {cohort.currentParticipants}/{cohort.maxParticipants || '∞'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </label>
                  </motion.div>
                ))}
              </div>
            )}

            {errors.cohortId && (
              <p className="text-red-500 text-sm flex items-center gap-1 mt-2">
                <AlertCircle className="w-4 h-4" />
                {errors.cohortId.message}
              </p>
            )}
          </motion.div>
        )

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <Heart className="w-12 h-12 mx-auto text-blue-600 mb-3" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Additional Information</h2>
              <p className="text-gray-600">Help us serve you better (optional)</p>
            </div>

            <div className="space-y-6">
              {/* Emergency Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact Name
                  </label>
                  <Input
                    {...register('emergencyContact')}
                    placeholder="Contact person's name"
                    icon={<User className="w-4 h-4" />}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact Phone
                  </label>
                  <Input
                    {...register('emergencyPhone')}
                    type="tel"
                    placeholder="+234 800 000 0000"
                    icon={<Phone className="w-4 h-4" />}
                  />
                </div>
              </div>

              {/* Medical and Dietary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medical Notes or Conditions
                </label>
                <textarea
                  {...register('medicalNotes')}
                  rows={3}
                  placeholder="Any medical conditions, allergies, or health information we should know..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dietary Restrictions
                </label>
                <textarea
                  {...register('dietaryRestrictions')}
                  rows={2}
                  placeholder="Any dietary restrictions, food allergies, or special meal requirements..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Logistics */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    {...register('hasTransportation')}
                    id="hasTransportation"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="hasTransportation" className="flex items-center gap-2 text-sm text-gray-700">
                    <Car className="w-4 h-4 text-gray-500" />
                    I have reliable transportation to the training venue
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    {...register('needsAccommodation')}
                    id="needsAccommodation"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="needsAccommodation" className="flex items-center gap-2 text-sm text-gray-700">
                    <Home className="w-4 h-4 text-gray-500" />
                    I need accommodation assistance
                  </label>
                </div>

                {needsAccommodation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Accommodation Details
                    </label>
                    <textarea
                      {...register('accommodationDetails')}
                      rows={2}
                      placeholder="Please describe your accommodation needs..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="p-8 shadow-xl border-0 bg-white">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-500">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-8">
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <div>
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={prevStep}
                  className="flex items-center gap-2"
                >
                  ← Previous
                </Button>
              )}
            </div>

            <div className="flex gap-3">
              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-green-600"
                >
                  Next →
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading || !isValid || availableCohorts.length === 0}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-blue-600 min-w-32"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Complete Registration
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Card>
    </div>
  )
}