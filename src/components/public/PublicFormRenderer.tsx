import { useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Loader2, User } from 'lucide-react'
import { Event, CustomField } from '@/types/event'
import { PublicRegistrationData } from '@/types/event'
import { cn } from '@/utils/cn'
import FormHeader from './FormHeader'
import CapacityIndicator from './CapacityIndicator'
import FormProgress from './FormProgress'
import FormSectionComponent from './FormSection'
import DynamicField from './DynamicField'
import TermsCheckbox from './TermsCheckbox'
import QRCodeShare from './QRCodeShare'
import {
  TextField,
  EmailField,
  PhoneField,
  SelectField,
} from './fields'

interface PublicFormRendererProps {
  event: Event
  onSubmit: (data: PublicRegistrationData) => Promise<void>
  isSubmitting?: boolean
}

export default function PublicFormRenderer({
  event,
  onSubmit,
  isSubmitting = false,
}: PublicFormRendererProps) {
  const settings = event.registrationSettings
  const isMultiSection = settings?.formLayout === 'multi-section' && (settings?.formSections?.length || 0) > 0
  const sections = settings?.formSections || []
  const customFields = settings?.customFields || []

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [completedSections, setCompletedSections] = useState<number[]>([])
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [termsError, setTermsError] = useState<string | undefined>()

  const methods = useForm<PublicRegistrationData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      gender: undefined,
      customFieldResponses: {},
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
  } = methods

  // Get fields for a specific section
  const getFieldsForSection = (sectionId: string | undefined): CustomField[] => {
    return customFields
      .filter((f) => f.sectionId === sectionId)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
  }

  // Get unassigned fields (no section)
  const unassignedFields = customFields
    .filter((f) => !f.sectionId)
    .sort((a, b) => (a.order || 0) - (b.order || 0))

  const handleFormSubmit = async (data: PublicRegistrationData) => {
    // Check terms acceptance
    if (settings?.termsAndConditions?.enabled && !termsAccepted) {
      setTermsError('You must accept the terms and conditions')
      return
    }
    setTermsError(undefined)

    await onSubmit(data)
  }

  const handleNextSection = async () => {
    const isValid = await trigger()
    if (isValid) {
      setCompletedSections([...completedSections, currentSectionIndex])
      setCurrentSectionIndex((prev) => Math.min(prev + 1, sections.length - 1))
    }
  }

  const handlePreviousSection = () => {
    setCurrentSectionIndex((prev) => Math.max(prev - 1, 0))
  }

  const publicUrl = event.registrationSlug
    ? `${window.location.origin}/event-registration/${event.registrationSlug}`
    : null

  // Render basic fields (always shown)
  const renderBasicFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative">
          <User className="absolute left-3 top-9 h-4 w-4 text-gray-400" />
          <TextField
            label="First Name"
            required
            placeholder="John"
            className="pl-10"
            error={errors.firstName?.message}
            {...register('firstName', { required: 'First name is required' })}
          />
        </div>
        <div className="relative">
          <User className="absolute left-3 top-9 h-4 w-4 text-gray-400" />
          <TextField
            label="Last Name"
            required
            placeholder="Doe"
            className="pl-10"
            error={errors.lastName?.message}
            {...register('lastName', { required: 'Last name is required' })}
          />
        </div>
      </div>

      <EmailField
        label="Email Address"
        placeholder="john.doe@example.com"
        error={errors.email?.message}
        {...register('email', {
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Please enter a valid email address',
          },
        })}
      />

      <PhoneField
        label="Phone Number"
        placeholder="+234..."
        error={errors.phone?.message}
        {...register('phone')}
      />

      <SelectField
        label="Gender"
        options={['Male', 'Female']}
        placeholder="Select gender"
        {...register('gender')}
      />
    </div>
  )

  // Render custom fields
  const renderCustomFields = (fields: CustomField[]) => (
    <div className="space-y-4">
      {fields.map((field) => (
        <DynamicField
          key={field.id}
          field={field}
          allFields={customFields}
        />
      ))}
    </div>
  )

  return (
    <FormProvider {...methods}>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <FormHeader event={event} formHeader={settings?.formHeader} />

          {/* Form Content */}
          <div className="p-6 md:p-8">
            {/* Capacity Indicator */}
            {settings?.maxAttendees && (
              <div className="mb-6">
                <CapacityIndicator
                  currentCount={event.registrationCount || 0}
                  maxAttendees={settings.maxAttendees}
                  allowWaitlist={settings.allowWaitlist}
                />
              </div>
            )}

            {/* Multi-section Progress */}
            {isMultiSection && (
              <FormProgress
                sections={sections}
                currentSectionIndex={currentSectionIndex}
                completedSections={completedSections}
                onSectionClick={(index) => {
                  if (completedSections.includes(index) || index <= currentSectionIndex) {
                    setCurrentSectionIndex(index)
                  }
                }}
              />
            )}

            <form onSubmit={handleSubmit(handleFormSubmit)}>
              {isMultiSection ? (
                // Multi-section layout
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSectionIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {/* First section always includes basic fields */}
                    {currentSectionIndex === 0 && (
                      <div className="space-y-6">
                        <div className="border-b pb-4">
                          <h3 className="font-medium text-gray-900">Personal Information</h3>
                          <p className="text-sm text-gray-500">Required information for registration</p>
                        </div>
                        {renderBasicFields()}
                      </div>
                    )}

                    {/* Section fields */}
                    {sections[currentSectionIndex] && (
                      <FormSectionComponent section={sections[currentSectionIndex]}>
                        {renderCustomFields(getFieldsForSection(sections[currentSectionIndex].id))}
                      </FormSectionComponent>
                    )}

                    {/* Last section includes terms and submit */}
                    {currentSectionIndex === sections.length - 1 && (
                      <div className="space-y-4">
                        {/* Unassigned fields */}
                        {unassignedFields.length > 0 && (
                          <div className="space-y-4">
                            {renderCustomFields(unassignedFields)}
                          </div>
                        )}

                        {/* Terms and Conditions */}
                        {settings?.termsAndConditions?.enabled && (
                          <TermsCheckbox
                            termsConfig={settings.termsAndConditions}
                            checked={termsAccepted}
                            onChange={(checked) => {
                              setTermsAccepted(checked)
                              if (checked) setTermsError(undefined)
                            }}
                            error={termsError}
                          />
                        )}
                      </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between pt-4 border-t">
                      <button
                        type="button"
                        onClick={handlePreviousSection}
                        disabled={currentSectionIndex === 0}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                          currentSectionIndex === 0
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-100'
                        )}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </button>

                      {currentSectionIndex < sections.length - 1 ? (
                        <button
                          type="button"
                          onClick={handleNextSection}
                          className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Registering...
                            </>
                          ) : (
                            'Register Now'
                          )}
                        </button>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              ) : (
                // Single-page layout
                <div className="space-y-6">
                  {/* Basic Fields */}
                  <div className="space-y-6">
                    <div className="border-b pb-4">
                      <h3 className="font-medium text-gray-900">Personal Information</h3>
                      <p className="text-sm text-gray-500">Required information for registration</p>
                    </div>
                    {renderBasicFields()}
                  </div>

                  {/* Section fields */}
                  {sections.map((section) => {
                    const sectionFields = getFieldsForSection(section.id)
                    if (sectionFields.length === 0) return null

                    return (
                      <FormSectionComponent key={section.id} section={section}>
                        {renderCustomFields(sectionFields)}
                      </FormSectionComponent>
                    )
                  })}

                  {/* Unassigned custom fields */}
                  {unassignedFields.length > 0 && (
                    <div className="space-y-4">
                      {sections.length > 0 && (
                        <div className="border-b pb-4">
                          <h3 className="font-medium text-gray-900">Additional Information</h3>
                        </div>
                      )}
                      {renderCustomFields(unassignedFields)}
                    </div>
                  )}

                  {/* Terms and Conditions */}
                  {settings?.termsAndConditions?.enabled && (
                    <TermsCheckbox
                      termsConfig={settings.termsAndConditions}
                      checked={termsAccepted}
                      onChange={(checked) => {
                        setTermsAccepted(checked)
                        if (checked) setTermsError(undefined)
                      }}
                      error={termsError}
                    />
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      'Register Now'
                    )}
                  </button>
                </div>
              )}
            </form>

            {/* Contact Info */}
            {(event.contactEmail || event.contactPhone) && (
              <div className="mt-6 pt-6 border-t text-center text-sm text-gray-500">
                <p>Questions? Contact us:</p>
                <div className="mt-2 space-y-1">
                  {event.contactEmail && (
                    <p>
                      <a
                        href={`mailto:${event.contactEmail}`}
                        className="text-primary-600 hover:underline"
                      >
                        {event.contactEmail}
                      </a>
                    </p>
                  )}
                  {event.contactPhone && (
                    <p>
                      <a
                        href={`tel:${event.contactPhone}`}
                        className="text-primary-600 hover:underline"
                      >
                        {event.contactPhone}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* QR Code Share Section */}
        {settings?.qrCodeEnabled && publicUrl && (
          <div className="mt-6">
            <QRCodeShare url={publicUrl} title="Share this registration form" />
          </div>
        )}
      </div>
    </FormProvider>
  )
}
