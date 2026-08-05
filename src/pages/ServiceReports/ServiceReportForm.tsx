import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Users, UserCheck, AlertCircle, Save, X, Sparkles, Calculator, StickyNote } from 'lucide-react'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import {
  serviceReportsService,
  CreateServiceReportData,
  ServiceTag,
  SERVICE_TAG_LABELS
} from '@/services/service-reports'

interface Branch {
  _id: string
  name: string
}

interface ServiceReportFormProps {
  onSubmit: (data: CreateServiceReportData) => Promise<void>
  onCancel: () => void
  initialData?: Partial<CreateServiceReportData>
  loading?: boolean
  isModal?: boolean
  branches?: Branch[]
  canSelectBranch?: boolean
  defaultBranchId?: string
}

// Compact tag labels for buttons
const COMPACT_TAG_LABELS: Record<ServiceTag, string> = {
  [ServiceTag.INVITED_GUEST_MINISTER]: 'Guest Minister',
  [ServiceTag.SUNDAY_AFTER_SATURDAY_OUTREACH]: 'Post-Outreach',
  [ServiceTag.THEMED_SERVICE]: 'Themed',
  [ServiceTag.BEGINNING_OF_NEW_SERIES]: 'New Series',
  [ServiceTag.CONTINUATION_OF_SERIES]: 'Continue Series',
  [ServiceTag.CELEBRATION_SERVICE]: 'Celebration',
  [ServiceTag.SUNDAY_AFTER_VIRAL_POST]: 'Post-Viral',
  [ServiceTag.OTHERS]: 'Other',
}

export default function ServiceReportForm({
  onSubmit,
  onCancel,
  initialData = {},
  loading = false,
  isModal = false,
  branches = [],
  canSelectBranch = false,
  defaultBranchId,
}: ServiceReportFormProps) {
  const [formData, setFormData] = useState<CreateServiceReportData>({
    date: new Date().toISOString().split('T')[0],
    serviceName: '',
    serviceTags: [],
    totalAttendance: 0,
    numberOfMales: 0,
    numberOfFemales: 0,
    numberOfChildren: 0,
    numberOfFirstTimers: 0,
    headcountOnly: false,
    notes: '',
    branchId: defaultBranchId || '',
    ...initialData
  })

  const [errors, setErrors] = useState<string[]>([])
  const [autoSync, setAutoSync] = useState(true)
  const [otherTagDescription, setOtherTagDescription] = useState(initialData?.notes?.startsWith('[Other: ') ? '' : '')
  const [existingSeriesNames, setExistingSeriesNames] = useState<string[]>([])

  useEffect(() => {
    serviceReportsService.getSeriesNames().then(setExistingSeriesNames).catch(() => {})
  }, [])

  // Validate attendance numbers in real-time
  useEffect(() => {
    const validationErrors = serviceReportsService.validateAttendanceNumbers(formData)
    setErrors(validationErrors)
  }, [formData.totalAttendance, formData.numberOfMales, formData.numberOfFemales, formData.numberOfChildren, formData.numberOfFirstTimers])

  // Auto-sync total when autoSync is enabled (disabled for head-count-only reports,
  // where the total is entered directly as the head count).
  useEffect(() => {
    if (autoSync && !formData.headcountOnly) {
      const calculatedTotal = formData.numberOfMales + formData.numberOfFemales + formData.numberOfChildren
      if (calculatedTotal !== formData.totalAttendance && calculatedTotal > 0) {
        setFormData(prev => ({ ...prev, totalAttendance: calculatedTotal }))
      }
    }
  }, [formData.numberOfMales, formData.numberOfFemales, formData.numberOfChildren, autoSync, formData.headcountOnly])

  // Toggle head-count-only mode: turning it on clears the breakdown and switches
  // the total to a manually-entered head count.
  const toggleHeadcountOnly = () => {
    setFormData(prev => {
      const next = !prev.headcountOnly
      return next
        ? { ...prev, headcountOnly: true, numberOfMales: 0, numberOfFemales: 0, numberOfChildren: 0 }
        : { ...prev, headcountOnly: false }
    })
    setAutoSync(false)
  }

  const handleInputChange = (field: keyof CreateServiceReportData, value: any) => {
    if (field === 'totalAttendance') {
      setAutoSync(false)
    }
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleServiceTagToggle = (tag: ServiceTag) => {
    if (tag === ServiceTag.OTHERS && (formData.serviceTags || []).includes(tag)) {
      setOtherTagDescription('')
    }
    const isRemoving = (formData.serviceTags || []).includes(tag)
    let newTags: ServiceTag[]
    if (isRemoving) {
      newTags = (formData.serviceTags || []).filter(t => t !== tag)
    } else {
      newTags = [...(formData.serviceTags || []), tag]
      if (tag === ServiceTag.BEGINNING_OF_NEW_SERIES) {
        newTags = newTags.filter(t => t !== ServiceTag.CONTINUATION_OF_SERIES)
      } else if (tag === ServiceTag.CONTINUATION_OF_SERIES) {
        newTags = newTags.filter(t => t !== ServiceTag.BEGINNING_OF_NEW_SERIES)
      }
    }
    const seriesRemoved = isRemoving && (
      tag === ServiceTag.BEGINNING_OF_NEW_SERIES || tag === ServiceTag.CONTINUATION_OF_SERIES
    )
    const hasAnySeries = newTags.includes(ServiceTag.BEGINNING_OF_NEW_SERIES) || newTags.includes(ServiceTag.CONTINUATION_OF_SERIES)
    setFormData(prev => ({
      ...prev,
      serviceTags: newTags,
      seriesName: seriesRemoved && !hasAnySeries ? undefined : prev.seriesName,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (errors.length > 0) {
      return
    }

    const dataToSubmit = { ...formData }
    // Head-count-only reports don't capture the gender/age breakdown.
    if (formData.headcountOnly) {
      dataToSubmit.numberOfMales = 0
      dataToSubmit.numberOfFemales = 0
      dataToSubmit.numberOfChildren = 0
    }
    if ((formData.serviceTags || []).includes(ServiceTag.OTHERS) && otherTagDescription.trim()) {
      const prefix = `[Other: ${otherTagDescription.trim()}]`
      dataToSubmit.notes = formData.notes
        ? `${prefix}\n${formData.notes}`
        : prefix
    }
    await onSubmit(dataToSubmit)
  }

  const calculateTotal = () => {
    return formData.numberOfMales + formData.numberOfFemales + formData.numberOfChildren
  }

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Alert - Compact */}
      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 bg-red-50 border border-red-200 rounded-xl"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-red-700">
                {errors.map((error, index) => (
                  <p key={index}>{error}</p>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Service Info - Compact 2-column */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              required
              className="w-full pl-8 pr-2.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Service Name
          </label>
          <input
            type="text"
            value={formData.serviceName}
            onChange={(e) => handleInputChange('serviceName', e.target.value)}
            placeholder="e.g., Sunday Service"
            required
            maxLength={200}
            className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Branch Selector - only shown if user can select branch */}
      {canSelectBranch && branches.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Campus
          </label>
          <select
            value={formData.branchId || ''}
            onChange={(e) => handleInputChange('branchId', e.target.value)}
            className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
          >
            <option value="">Select campus</option>
            {branches.map((branch) => (
              <option key={branch._id} value={branch._id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Service Tags - Button Grid */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Service Tags <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {Object.entries(COMPACT_TAG_LABELS).map(([tag, label]) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleServiceTagToggle(tag as ServiceTag)}
              title={SERVICE_TAG_LABELS[tag as ServiceTag]}
              className={cn(
                "px-2 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150",
                (formData.serviceTags || []).includes(tag as ServiceTag)
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <AnimatePresence>
          {(formData.serviceTags || []).includes(ServiceTag.OTHERS) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="mt-2"
            >
              <input
                type="text"
                value={otherTagDescription}
                onChange={(e) => setOtherTagDescription(e.target.value)}
                placeholder="Describe the service tag..."
                maxLength={100}
                className="w-full px-2.5 py-2 text-xs border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400 bg-indigo-50/40"
              />
            </motion.div>
          )}
          {((formData.serviceTags || []).includes(ServiceTag.BEGINNING_OF_NEW_SERIES) ||
            (formData.serviceTags || []).includes(ServiceTag.CONTINUATION_OF_SERIES)) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="mt-2"
            >
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Series Name
              </label>
              {(formData.serviceTags || []).includes(ServiceTag.CONTINUATION_OF_SERIES) && existingSeriesNames.length > 0 ? (
                <div className="space-y-1.5">
                  <select
                    value={formData.seriesName || ''}
                    onChange={(e) => handleInputChange('seriesName', e.target.value || undefined)}
                    className="w-full px-2.5 py-2 text-xs border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-indigo-50/40"
                  >
                    <option value="">Select an existing series...</option>
                    {existingSeriesNames.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={formData.seriesName || ''}
                    onChange={(e) => handleInputChange('seriesName', e.target.value || undefined)}
                    placeholder="Or type a series name..."
                    maxLength={200}
                    className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400"
                  />
                </div>
              ) : (
                <input
                  type="text"
                  value={formData.seriesName || ''}
                  onChange={(e) => handleInputChange('seriesName', e.target.value || undefined)}
                  placeholder="Enter the series name..."
                  maxLength={200}
                  className="w-full px-2.5 py-2 text-xs border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400 bg-indigo-50/40"
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Attendance Section - Compact Grid */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl p-3 border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-semibold text-gray-800">Attendance</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleHeadcountOnly}
              title="For special events: capture only the total head count"
              className={cn(
                "flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors",
                formData.headcountOnly
                  ? "bg-amber-100 text-amber-700"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              )}
            >
              <Users className="w-3 h-3" />
              Head count only {formData.headcountOnly ? 'ON' : 'OFF'}
            </button>
            {!formData.headcountOnly && (
              <button
                type="button"
                onClick={() => setAutoSync(!autoSync)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors",
                  autoSync
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                )}
              >
                <Calculator className="w-3 h-3" />
                Auto-sync {autoSync ? 'ON' : 'OFF'}
              </button>
            )}
          </div>
        </div>
        {formData.headcountOnly && (
          <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-1 mb-2">
            Special event: only the total head count is required — the males / females / children breakdown is skipped.
          </p>
        )}

        <div className={cn('grid gap-2', formData.headcountOnly ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4')}>
          {!formData.headcountOnly && (
          <>
          {/* Males */}
          <div>
            <label className="block text-xs text-gray-500 mb-1 text-center">Males</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={formData.numberOfMales || ''}
                onChange={(e) => handleInputChange('numberOfMales', parseInt(e.target.value) || 0)}
                required
                className="w-full px-2 py-2 text-sm text-center font-medium border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500"></div>
            </div>
          </div>

          {/* Females */}
          <div>
            <label className="block text-xs text-gray-500 mb-1 text-center">Females</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={formData.numberOfFemales || ''}
                onChange={(e) => handleInputChange('numberOfFemales', parseInt(e.target.value) || 0)}
                required
                className="w-full px-2 py-2 text-sm text-center font-medium border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
              />
              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-pink-500"></div>
            </div>
          </div>

          {/* Children */}
          <div>
            <label className="block text-xs text-gray-500 mb-1 text-center">Children</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={formData.numberOfChildren || ''}
                onChange={(e) => handleInputChange('numberOfChildren', parseInt(e.target.value) || 0)}
                required
                className="w-full px-2 py-2 text-sm text-center font-medium border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
              />
              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500"></div>
            </div>
          </div>
          </>
          )}

          {/* First Timers */}
          <div>
            <label className="block text-xs text-gray-500 mb-1 text-center">
              <span className="flex items-center justify-center gap-0.5">
                <Sparkles className="w-3 h-3 text-purple-500" />
                New
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={formData.numberOfFirstTimers || ''}
                onChange={(e) => handleInputChange('numberOfFirstTimers', parseInt(e.target.value) || 0)}
                required
                className="w-full px-2 py-2 text-sm text-center font-medium border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-purple-50"
              />
              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-purple-500"></div>
            </div>
          </div>
        </div>

        {/* Total Display */}
        <div className="mt-3 pt-3 border-t border-gray-200/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">
              {formData.headcountOnly ? 'Head count' : 'Total Attendance'}
            </span>
            <div className="flex items-center gap-2">
              {(!autoSync || formData.headcountOnly) && (
                <input
                  type="number"
                  min="0"
                  value={formData.totalAttendance || ''}
                  onChange={(e) => handleInputChange('totalAttendance', parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-sm text-center font-bold border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              )}
              <div className={cn(
                "px-3 py-1.5 rounded-lg font-bold text-lg",
                autoSync && !formData.headcountOnly ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"
              )}>
                {autoSync && !formData.headcountOnly ? calculateTotal() : formData.totalAttendance}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes - Compact */}
      <div>
        <label className="flex items-center gap-1 text-xs font-medium text-gray-700 mb-1">
          <StickyNote className="w-3 h-3" />
          Notes <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Special observations, events, or highlights..."
          maxLength={1000}
          rows={2}
          className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none placeholder:text-gray-400"
        />
        <div className="flex justify-end">
          <span className="text-xs text-gray-400">{(formData.notes?.length || 0)}/1000</span>
        </div>
      </div>

      {/* Actions - Compact */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onCancel}
          disabled={loading}
          className="px-4"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={loading || errors.length > 0}
          className="px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        >
          {loading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
              />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-1.5" />
              Save Report
            </>
          )}
        </Button>
      </div>
    </form>
  )

  if (isModal) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={(e) => e.target === e.currentTarget && onCancel()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.15 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <Users className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-base font-semibold text-white">New Service Report</h2>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-3 sm:p-4 max-h-[80vh] sm:max-h-[70vh] overflow-y-auto">
            {formContent}
          </div>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Card Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Users className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-base font-semibold text-white">Service Report</h2>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4">
          {formContent}
        </div>
      </div>
    </motion.div>
  )
}
