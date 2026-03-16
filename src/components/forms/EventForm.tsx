import React, { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  Trash2,
  Mail,
  Phone,
  Image,
  Tag,
  Globe,
  Video,
  Clock,
  FileText,
  ChevronDown,
  Sparkles,
  Save,
  X,
  Loader2,
  Building,
  Hash,
  Link,
  Settings,
  Copy,
  Check,
  ExternalLink,
  Link2,
  QrCode,
  MessageSquare,
  Code,
  KeyRound,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import {
  Event,
  CreateEventData,
  UpdateEventData,
  EventType,
  EventStatus,
  FormSection,
  FormHeader,
  SuccessMessage,
  TermsAndConditions,
  FormLayout,
  FormStatus,
} from '@/types/event'
import { EnhancedCustomField } from '@/types/registration-form'
import { membersService } from '@/services/members-unified'
import { Member } from '@/types'
import { FormBuilderStep } from './event'

interface EventFormProps {
  event?: Event
  onSubmit: (data: CreateEventData | UpdateEventData) => Promise<void>
  onCancel: () => void
  loading?: boolean
  mode: 'create' | 'edit'
  branchId: string
}

const eventTypes: { value: EventType; label: string; icon: string }[] = [
  { value: 'conference', label: 'Conference', icon: '🎤' },
  { value: 'workshop', label: 'Workshop', icon: '🛠️' },
  { value: 'seminar', label: 'Seminar', icon: '📚' },
  { value: 'retreat', label: 'Retreat', icon: '🏕️' },
  { value: 'service', label: 'Service', icon: '⛪' },
  { value: 'outreach', label: 'Outreach', icon: '🤝' },
  { value: 'meeting', label: 'Meeting', icon: '👥' },
  { value: 'celebration', label: 'Celebration', icon: '🎉' },
  { value: 'training', label: 'Training', icon: '🎓' },
  { value: 'other', label: 'Other', icon: '📋' },
]

const eventStatuses: { value: EventStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  { value: 'published', label: 'Published', color: 'bg-green-100 text-green-700' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-700' },
  { value: 'completed', label: 'Completed', color: 'bg-blue-100 text-blue-700' },
]

type TabId = 'details' | 'registration' | 'settings'

const tabs: { id: TabId; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'details', label: 'Event Details', icon: Calendar, description: 'Basic info, schedule & location' },
  { id: 'registration', label: 'Registration', icon: FileText, description: 'Form builder & custom fields' },
  { id: 'settings', label: 'Settings', icon: Settings, description: 'Registration rules & sharing' },
]

// Collapsible Section Component
function CollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
  badge,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  defaultOpen?: boolean
  badge?: string | number
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-50 rounded-lg">
            <Icon className="h-4 w-4 text-primary-600" />
          </div>
          <span className="font-medium text-gray-900">{title}</span>
          {badge !== undefined && (
            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown className={cn(
          "h-5 w-5 text-gray-400 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4 pt-2 border-t border-gray-100">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Compact Input with Icon — uses forwardRef so RHF's register() ref is attached to the native input
const IconInput = React.forwardRef<HTMLInputElement, {
  icon?: React.ElementType
  label?: string
  error?: string
  className?: string
} & React.InputHTMLAttributes<HTMLInputElement>>(({
  icon: Icon,
  label,
  error,
  className,
  ...props
}, ref) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input
          {...props}
          ref={ref}
          className={cn(
            "w-full rounded-lg border border-gray-300 bg-white transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
            "placeholder:text-gray-400",
            Icon ? "pl-10 pr-3 py-2.5" : "px-3 py-2.5",
            error && "border-red-300 focus:ring-red-500/20 focus:border-red-500",
            props.disabled && "bg-gray-50 text-gray-500"
          )}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
})

// Toggle switch for settings
function ToggleSwitch({ checked, onChange, label, description }: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  description?: string
}) {
  return (
    <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
      <div className="flex-1">
        <span className="text-sm font-medium text-gray-900">{label}</span>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
          checked ? "bg-primary-600" : "bg-gray-200"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </label>
  )
}

export default function EventForm({
  event,
  onSubmit,
  onCancel,
  loading = false,
  mode,
  branchId,
}: EventFormProps) {
  const [activeTab, setActiveTab] = useState<TabId>('details')
  const [members, setMembers] = useState<Member[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [slugCopied, setSlugCopied] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm<any>({
    defaultValues: event
      ? {
          title: event.title,
          description: event.description || '',
          type: event.type,
          status: event.status,
          startDate: event.startDate?.split('T')[0] || '',
          endDate: event.endDate?.split('T')[0] || '',
          startTime: event.startTime || '',
          endTime: event.endTime || '',
          location: event.location || {
            name: '',
            address: '',
            city: '',
            state: '',
            isVirtual: false,
            virtualLink: '',
          },
          registrationSettings: event.registrationSettings || {
            isOpen: true,
            maxAttendees: undefined,
            deadline: '',
            requireApproval: false,
            allowWaitlist: true,
            customFields: [],
          },
          registrationSlug: event.registrationSlug || '',
          committee: event.committee?.map((c) => ({
            member: typeof c.member === 'string' ? c.member : c.member._id,
            role: c.role,
          })) || [],
          bannerImage: event.bannerImage || '',
          contactEmail: event.contactEmail || '',
          contactPhone: event.contactPhone || '',
          websiteUrl: event.websiteUrl || '',
          tags: event.tags || [],
          isGlobal: event.isGlobal || false,
        }
      : {
          title: '',
          description: '',
          type: 'other',
          status: 'draft',
          isGlobal: false,
          startDate: '',
          endDate: '',
          startTime: '',
          endTime: '',
          location: {
            name: '',
            address: '',
            city: '',
            state: '',
            isVirtual: false,
            virtualLink: '',
          },
          registrationSettings: {
            isOpen: true,
            maxAttendees: undefined,
            deadline: '',
            requireApproval: false,
            allowWaitlist: true,
            customFields: [],
          },
          registrationSlug: '',
          committee: [],
          bannerImage: '',
          contactEmail: '',
          contactPhone: '',
          websiteUrl: '',
          tags: [],
        },
  })

  const {
    fields: committeeFields,
    append: appendCommittee,
    remove: removeCommittee,
  } = useFieldArray({
    control,
    name: 'committee',
  })

  // Enhanced registration settings state
  const [customFields, setCustomFields] = useState<EnhancedCustomField[]>(
    (event?.registrationSettings?.customFields as EnhancedCustomField[]) || []
  )
  const [formSections, setFormSections] = useState<FormSection[]>(
    event?.registrationSettings?.formSections || []
  )
  const [formLayout, setFormLayout] = useState<FormLayout>(
    event?.registrationSettings?.formLayout || 'single-page'
  )
  const [formStatus, setFormStatus] = useState<FormStatus>(
    event?.registrationSettings?.formStatus || 'draft'
  )
  const [qrCodeEnabled, setQrCodeEnabled] = useState(
    event?.registrationSettings?.qrCodeEnabled || false
  )
  const [formHeader, setFormHeader] = useState<FormHeader>(
    event?.registrationSettings?.formHeader || {}
  )
  const [successMessage, setSuccessMessage] = useState<SuccessMessage>(
    event?.registrationSettings?.successMessage || {}
  )
  const [termsAndConditions, setTermsAndConditions] = useState<TermsAndConditions>(
    event?.registrationSettings?.termsAndConditions || { enabled: false }
  )
  const [integrationMode, setIntegrationMode] = useState<'embedded' | 'api'>(
    event?.registrationSettings?.integrationMode || 'embedded'
  )
  const [apiKey] = useState<string | undefined>(
    event?.registrationSettings?.apiKey
  )
  const [apiKeyCopied, setApiKeyCopied] = useState(false)

  const watchedTags = watch('tags') || []
  const watchedIsVirtual = watch('location.isVirtual')
  const watchedType = watch('type')
  const watchedStatus = watch('status')
  const watchedTitle = watch('title')
  const watchedIsOpen = watch('registrationSettings.isOpen')
  const watchedMaxAttendees = watch('registrationSettings.maxAttendees')
  const watchedDeadline = watch('registrationSettings.deadline')
  const watchedRequireApproval = watch('registrationSettings.requireApproval')
  const watchedAllowWaitlist = watch('registrationSettings.allowWaitlist')
  const watchedSlug = watch('registrationSlug')

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    try {
      setLoadingMembers(true)
      const response = await membersService.getMembers({ limit: 100 })
      setMembers(response.items || [])
    } catch (error) {
      console.error('Error loading members:', error)
    } finally {
      setLoadingMembers(false)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !watchedTags.includes(tagInput.trim())) {
      setValue('tags', [...watchedTags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (index: number) => {
    const newTags = watchedTags.filter((_: string, i: number) => i !== index)
    setValue('tags', newTags)
  }

  const publicUrl = watchedSlug
    ? `${window.location.origin}/event-registration/${watchedSlug}`
    : null

  const copyRegistrationLink = () => {
    if (!publicUrl) return
    navigator.clipboard.writeText(publicUrl)
    setSlugCopied(true)
    setTimeout(() => setSlugCopied(false), 2000)
  }

  const selectedType = eventTypes.find(t => t.value === watchedType)
  const selectedStatus = eventStatuses.find(s => s.value === watchedStatus)

  const onFormSubmit = async (data: any) => {
    const formattedData: CreateEventData | UpdateEventData = {
      ...data,
      branch: branchId,
      registrationSettings: {
        ...data.registrationSettings,
        deadline: data.registrationSettings.deadline || undefined,
        maxAttendees: data.registrationSettings.maxAttendees
          ? parseInt(data.registrationSettings.maxAttendees)
          : undefined,
        customFields: customFields,
        formSections: formSections,
        formLayout: formLayout,
        formStatus: formStatus,
        qrCodeEnabled: qrCodeEnabled,
        formHeader: formHeader,
        successMessage: successMessage,
        termsAndConditions: termsAndConditions,
        integrationMode: integrationMode,
      },
    }
    await onSubmit(formattedData)
  }

  // Tab: Event Details
  const renderDetailsTab = () => (
    <div className="space-y-4">
      {/* Basic Info Section */}
      <CollapsibleSection title="Basic Information" icon={Sparkles} defaultOpen={true}>
        <div className="space-y-4">
          {/* Title with Type Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title', { required: 'Title is required' })}
              placeholder="Enter a memorable event title"
              className={cn(
                "w-full rounded-lg border border-gray-300 px-4 py-3 text-lg font-medium",
                "focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
                "placeholder:text-gray-400 placeholder:font-normal",
                errors.title && "border-red-300"
              )}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title?.message as string}</p>
            )}
          </div>

          {/* Type and Status Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Event Type
              </label>
              <div className="relative">
                <select
                  {...register('type')}
                  className="w-full appearance-none rounded-lg border border-gray-300 bg-white pl-10 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                >
                  {eventTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">
                  {selectedType?.icon}
                </div>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Status
              </label>
              <div className="relative">
                <select
                  {...register('status')}
                  className={cn(
                    "w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 pr-8 py-2.5",
                    "focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  )}
                >
                  {eventStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-gray-400 resize-none"
              placeholder="Describe your event..."
            />
          </div>

          {/* Global Event Toggle */}
          <div className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 bg-gray-50">
            <input
              type="checkbox"
              id="isGlobal"
              {...register('isGlobal')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <div className="flex-1">
              <label htmlFor="isGlobal" className="text-sm font-medium text-gray-900 cursor-pointer">
                Make this a Global Event
              </label>
              <p className="text-xs text-gray-500 mt-0.5">
                This event will be available to all branches across the organization
              </p>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Date & Time Section */}
      <CollapsibleSection title="Date & Time" icon={Clock} defaultOpen={true}>
        <div className="grid grid-cols-2 gap-3">
          <IconInput
            icon={Calendar}
            label="Start Date"
            type="date"
            {...register('startDate', { required: 'Start date is required' })}
            error={errors.startDate?.message as string}
          />
          <IconInput
            icon={Calendar}
            label="End Date"
            type="date"
            {...register('endDate', { required: 'End date is required' })}
            error={errors.endDate?.message as string}
          />
          <IconInput
            icon={Clock}
            label="Start Time"
            type="time"
            {...register('startTime')}
          />
          <IconInput
            icon={Clock}
            label="End Time"
            type="time"
            {...register('endTime')}
          />
        </div>
      </CollapsibleSection>

      {/* Location Section */}
      <CollapsibleSection title="Location" icon={MapPin} defaultOpen={true}>
        <div className="space-y-4">
          {/* Virtual Toggle */}
          <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              {...register('location.isVirtual')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">This is a virtual event</span>
            </div>
          </label>

          {/* Single location.name input — avoids dual-registration conflict */}
          <IconInput
            icon={watchedIsVirtual ? Globe : Building}
            label={watchedIsVirtual ? 'Platform Name' : 'Venue Name'}
            placeholder={watchedIsVirtual ? 'e.g., Zoom, Google Meet' : 'e.g., Main Auditorium'}
            {...register('location.name', {
              required: watchedIsVirtual ? 'Platform name is required' : 'Venue name is required',
            })}
            error={(errors.location as any)?.name?.message as string}
          />

          {watchedIsVirtual ? (
            <div className="space-y-3">
              <IconInput
                icon={Globe}
                label="Meeting Link"
                type="url"
                placeholder="https://..."
                {...register('location.virtualLink')}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <IconInput
                icon={MapPin}
                label="Address"
                placeholder="Street address"
                {...register('location.address')}
              />
              <div className="grid grid-cols-2 gap-3">
                <IconInput
                  label="City"
                  placeholder="City"
                  {...register('location.city')}
                />
                <IconInput
                  label="State"
                  placeholder="State"
                  {...register('location.state')}
                />
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Team & Contact Section */}
      <CollapsibleSection title="Team & Contact" icon={Users} defaultOpen={false} badge={committeeFields.length}>
        <div className="space-y-4">
          {/* Committee Members */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">Committee Members</label>
              <button
                type="button"
                onClick={() => appendCommittee({ member: '', role: '' })}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>

            {committeeFields.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                No committee members added
              </p>
            ) : (
              <div className="space-y-2">
                {committeeFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start">
                    <select
                      {...register(`committee.${index}.member`)}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      disabled={loadingMembers}
                    >
                      <option value="">Select member</option>
                      {members.map((member) => (
                        <option key={member._id} value={member._id}>
                          {member.firstName} {member.lastName}
                        </option>
                      ))}
                    </select>
                    <input
                      {...register(`committee.${index}.role`)}
                      placeholder="Role"
                      className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeCommittee(index)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <IconInput
              icon={Mail}
              label="Contact Email"
              type="email"
              placeholder="events@church.org"
              {...register('contactEmail')}
            />
            <IconInput
              icon={Phone}
              label="Contact Phone"
              placeholder="+234..."
              {...register('contactPhone')}
            />
          </div>

          {/* Website URL */}
          <div className="pt-2">
            <IconInput
              icon={Link}
              label="Event Website URL"
              type="url"
              placeholder="https://event-website.com"
              {...register('websiteUrl')}
            />
            <p className="mt-1 text-xs text-gray-500">
              Optional: Add a dedicated website URL if this event has its own website
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Tags & Media Section */}
      <CollapsibleSection title="Tags & Media" icon={Tag} defaultOpen={false} badge={watchedTags.length}>
        <div className="space-y-4">
          <IconInput
            icon={Image}
            label="Banner Image URL"
            placeholder="https://..."
            {...register('bannerImage')}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tags
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add a tag"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
              <Button type="button" variant="secondary" onClick={addTag}>
                Add
              </Button>
            </div>
            {watchedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {watchedTags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-sm font-medium"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="hover:text-primary-900 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </CollapsibleSection>
    </div>
  )

  // Tab: Registration Form (now only the form builder)
  const renderRegistrationTab = () => (
    <FormBuilderStep
      customFields={customFields}
      formSections={formSections}
      eventTitle={watchedTitle}
      formHeader={formHeader}
      termsAndConditions={termsAndConditions}
      onCustomFieldsChange={setCustomFields}
      onFormSectionsChange={setFormSections}
    />
  )

  // Tab: Settings
  const renderSettingsTab = () => (
    <div className="space-y-4">
      {/* External Integration Mode */}
      <CollapsibleSection title="External Integration" icon={Globe} defaultOpen={true}>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Integration Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setIntegrationMode('embedded')
                  setValue('registrationSettings.integrationMode', 'embedded')
                }}
                className={cn(
                  'flex flex-col items-center gap-1.5 py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all',
                  integrationMode === 'embedded'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                )}
              >
                <Link2 className="h-5 w-5" />
                <span>Embedded Form</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIntegrationMode('api')
                  setValue('registrationSettings.integrationMode', 'api')
                }}
                className={cn(
                  'flex flex-col items-center gap-1.5 py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all',
                  integrationMode === 'api'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                )}
              >
                <Code className="h-5 w-5" />
                <span>API Integration</span>
              </button>
            </div>
            <p className="text-xs text-gray-500">
              {integrationMode === 'embedded'
                ? 'Use the built-in registration form. Share the link or embed it on your website.'
                : 'External websites call the API directly to submit registrations and partner inquiries.'}
            </p>
          </div>

          {/* API Key & Docs (shown only for API mode) */}
          {integrationMode === 'api' && (
            <div className="space-y-4 pt-3 border-t border-gray-100">
              {apiKey ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <KeyRound className="inline h-3.5 w-3.5 mr-1" />
                    API Key
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-gray-50 rounded-lg border border-gray-200 px-3 py-2.5 overflow-hidden">
                      <code className="text-sm text-gray-800 break-all font-mono">{apiKey}</code>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(apiKey)
                        setApiKeyCopied(true)
                        setTimeout(() => setApiKeyCopied(false), 2000)
                      }}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex-shrink-0',
                        apiKeyCopied
                          ? 'bg-green-100 text-green-700'
                          : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                      )}
                    >
                      {apiKeyCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {apiKeyCopied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xs text-amber-600 mt-1.5">
                    Keep this key secret. Include it as the <code className="bg-gray-100 px-1 rounded">x-api-key</code> header in all API requests.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-700">
                    An API key will be generated when you save the event.
                  </p>
                </div>
              )}

              {/* API Endpoints Documentation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">API Endpoints</label>
                <div className="bg-gray-900 rounded-lg p-4 space-y-2.5 text-sm font-mono overflow-x-auto">
                  <div>
                    <p className="text-gray-500 text-xs"># Get event details</p>
                    <p className="text-green-400">GET /api/v1/events/public/{watchedSlug || '{slug}'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs"># Submit registration</p>
                    <p className="text-green-400">POST /api/v1/events/public/{watchedSlug || '{slug}'}/register</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs"># Submit partner inquiry</p>
                    <p className="text-green-400">POST /api/v1/events/public/{watchedSlug || '{slug}'}/partner</p>
                  </div>
                  <div className="pt-2 border-t border-gray-700">
                    <p className="text-gray-500 text-xs"># Required header</p>
                    <p className="text-yellow-400">x-api-key: {apiKey || '{your-api-key}'}</p>
                  </div>
                </div>
              </div>

              {/* Sample Request */}
              <details className="text-sm">
                <summary className="font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                  Sample Registration Request
                </summary>
                <pre className="mt-2 bg-gray-900 rounded-lg p-4 text-xs font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap">
{`curl -X POST \\
  ${window.location.origin}/api/v1/events/public/${watchedSlug || '{slug}'}/register \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey || '{your-api-key}'}" \\
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "08012345678"
  }'`}
                </pre>
              </details>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Registration Rules */}
      <CollapsibleSection title="Registration Rules" icon={Users} defaultOpen={true}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ToggleSwitch
              checked={watchedIsOpen}
              onChange={(value) => setValue('registrationSettings.isOpen', value)}
              label="Accept Registrations"
              description="Open for sign-ups"
            />
            <ToggleSwitch
              checked={watchedRequireApproval}
              onChange={(value) => setValue('registrationSettings.requireApproval', value)}
              label="Require Approval"
              description="Review before confirm"
            />
            <ToggleSwitch
              checked={watchedAllowWaitlist}
              onChange={(value) => setValue('registrationSettings.allowWaitlist', value)}
              label="Allow Waitlist"
              description="When capacity is full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Users className="inline h-3.5 w-3.5 mr-1" />
                Max Attendees
              </label>
              <input
                type="number"
                value={watchedMaxAttendees || ''}
                onChange={(e) => setValue('registrationSettings.maxAttendees', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Unlimited"
                min={1}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Calendar className="inline h-3.5 w-3.5 mr-1" />
                Registration Deadline
              </label>
              <input
                type="date"
                value={watchedDeadline || ''}
                onChange={(e) => setValue('registrationSettings.deadline', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Registration Link & Sharing (only in embedded mode) */}
      {integrationMode === 'embedded' && (
      <CollapsibleSection title="Registration Link" icon={Link2} defaultOpen={true}>
        <div className="space-y-4">
          {/* Slug Input with Copy Button */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              URL Slug
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={watchedSlug || ''}
                  onChange={(e) => setValue('registrationSlug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="my-event-slug"
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
              {publicUrl && (
                <button
                  type="button"
                  onClick={copyRegistrationLink}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    slugCopied
                      ? "bg-green-100 text-green-700"
                      : "bg-primary-100 text-primary-700 hover:bg-primary-200"
                  )}
                >
                  {slugCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {slugCopied ? 'Copied' : 'Copy Link'}
                </button>
              )}
            </div>
          </div>

          {/* URL Preview */}
          {publicUrl && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Public Registration URL</p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-gray-800 break-all font-mono">{publicUrl}</p>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Open <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

          {!watchedSlug && (
            <p className="text-xs text-amber-600">
              Enter a URL slug to generate a shareable registration link
            </p>
          )}

          {/* QR Code */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                QR Code Sharing
              </label>
              <button
                type="button"
                onClick={() => setQrCodeEnabled(!qrCodeEnabled)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  qrCodeEnabled ? "bg-primary-600" : "bg-gray-200"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                    qrCodeEnabled ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>
            {qrCodeEnabled && publicUrl && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                <div className="inline-block p-3 bg-white rounded-lg shadow-sm">
                  <QRCodeSVG value={publicUrl} size={120} />
                </div>
                <p className="text-xs text-gray-500 mt-2 break-all">{publicUrl}</p>
              </div>
            )}
            {qrCodeEnabled && !publicUrl && (
              <p className="text-xs text-amber-600">
                Set a URL slug above to enable QR code sharing
              </p>
            )}
          </div>
        </div>
      </CollapsibleSection>
      )}

      {/* Form Configuration */}
      <CollapsibleSection title="Form Configuration" icon={FileText} defaultOpen={true}>
        <div className="space-y-6">
          {/* Form Status */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Form Visibility</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormStatus('draft')}
                className={cn(
                  'flex-1 py-2.5 px-4 rounded-lg border-2 text-sm font-medium transition-all',
                  formStatus === 'draft'
                    ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                Draft
              </button>
              <button
                type="button"
                onClick={() => setFormStatus('live')}
                className={cn(
                  'flex-1 py-2.5 px-4 rounded-lg border-2 text-sm font-medium transition-all',
                  formStatus === 'live'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                Live
              </button>
            </div>
            <p className="text-xs text-gray-500">
              {formStatus === 'draft' ? 'Form is not publicly visible' : 'Form is publicly accessible'}
            </p>
          </div>

          {/* Form Layout */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Form Layout</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormLayout('single-page')}
                className={cn(
                  'flex-1 py-2.5 px-4 rounded-lg border-2 text-sm font-medium transition-all',
                  formLayout === 'single-page'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                Single Page
              </button>
              <button
                type="button"
                onClick={() => setFormLayout('multi-section')}
                className={cn(
                  'flex-1 py-2.5 px-4 rounded-lg border-2 text-sm font-medium transition-all',
                  formLayout === 'multi-section'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                Multi-Section
              </button>
            </div>
          </div>

          {/* Form Header */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <Image className="h-4 w-4" />
              Form Header
            </label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Custom Title</label>
                <input
                  type="text"
                  value={formHeader.title || ''}
                  onChange={(e) => setFormHeader({ ...formHeader, title: e.target.value })}
                  placeholder="Leave empty to use event title"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                <textarea
                  value={formHeader.description || ''}
                  onChange={(e) => setFormHeader({ ...formHeader, description: e.target.value })}
                  placeholder="Brief description for the form"
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Logo URL</label>
                <input
                  type="text"
                  value={formHeader.logoUrl || ''}
                  onChange={(e) => setFormHeader({ ...formHeader, logoUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Success Message */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Success Message
            </label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                <input
                  type="text"
                  value={successMessage.title || ''}
                  onChange={(e) => setSuccessMessage({ ...successMessage, title: e.target.value })}
                  placeholder="Registration Successful!"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Message</label>
                <textarea
                  value={successMessage.message || ''}
                  onChange={(e) => setSuccessMessage({ ...successMessage, message: e.target.value })}
                  placeholder="Thank you for registering..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showCheckInQR"
                  checked={successMessage.showCheckInQR !== false}
                  onChange={(e) => setSuccessMessage({ ...successMessage, showCheckInQR: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="showCheckInQR" className="ml-2 text-sm text-gray-700">
                  Show check-in QR code on success
                </label>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Terms & Conditions
              </label>
              <button
                type="button"
                onClick={() => setTermsAndConditions({ ...termsAndConditions, enabled: !termsAndConditions.enabled })}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  termsAndConditions.enabled ? "bg-primary-600" : "bg-gray-200"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                    termsAndConditions.enabled ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>
            {termsAndConditions.enabled && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Checkbox Text</label>
                  <input
                    type="text"
                    value={termsAndConditions.text || ''}
                    onChange={(e) => setTermsAndConditions({ ...termsAndConditions, text: e.target.value })}
                    placeholder="I agree to the terms and conditions"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Link URL (optional)</label>
                  <input
                    type="text"
                    value={termsAndConditions.linkUrl || ''}
                    onChange={(e) => setTermsAndConditions({ ...termsAndConditions, linkUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </CollapsibleSection>
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onFormSubmit, (validationErrors) => {
      // If validation fails on a hidden tab, switch to it so the user can see the errors
      const detailsFields = ['title', 'startDate', 'endDate', 'location', 'type']
      const hasDetailsErrors = Object.keys(validationErrors).some(key => detailsFields.includes(key))
      if (hasDetailsErrors && activeTab !== 'details') {
        setActiveTab('details')
      }
    })} className="h-full flex flex-col">
      {/* Header with Title Preview and Status */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {selectedType && (
                <span className="text-2xl">{selectedType.icon}</span>
              )}
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {watchedTitle || (mode === 'create' ? 'New Event' : 'Edit Event')}
                </h1>
                <p className="text-sm text-gray-500">
                  {mode === 'create' ? 'Create a new event' : 'Update event details'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedStatus && (
              <span className={cn(
                "px-3 py-1 rounded-full text-sm font-medium",
                selectedStatus.color
              )}>
                {selectedStatus.label}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <nav className="flex gap-1">
            {tabs.map((tab, index) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors rounded-t-lg",
                    isActive
                      ? "text-primary-600 bg-primary-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <span className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold",
                    isActive ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-600"
                  )}>
                    {index + 1}
                  </span>
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
                    />
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
            <div style={{ display: activeTab === 'details' ? 'block' : 'none' }}>
              {renderDetailsTab()}
            </div>
            <div style={{ display: activeTab === 'registration' ? 'block' : 'none' }}>
              {renderRegistrationTab()}
            </div>
            <div style={{ display: activeTab === 'settings' ? 'block' : 'none' }}>
              {renderSettingsTab()}
            </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>

          <div className="flex items-center gap-3">
            {activeTab === 'details' && (
              <Button
                type="button"
                onClick={() => setActiveTab('registration')}
                className="flex items-center gap-2"
              >
                Next: Registration
                <FileText className="h-4 w-4" />
              </Button>
            )}
            {activeTab === 'registration' && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setActiveTab('details')}
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className="flex items-center gap-2"
                >
                  Next: Settings
                  <Settings className="h-4 w-4" />
                </Button>
              </>
            )}
            {activeTab === 'settings' && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setActiveTab('registration')}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 min-w-[140px] justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {mode === 'create' ? 'Create Event' : 'Save Changes'}
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </form>
  )
}
