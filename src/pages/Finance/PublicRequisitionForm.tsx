import { useState, useEffect, forwardRef, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  User,
  Mail,
  Phone,
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Send,
  BadgeCheck,
  CircleDot,
  FileSpreadsheet,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Modal from '@/components/ui/Modal'
import { publicRequisitionSchema, type PublicRequisitionFormData } from '@/schemas/publicRequisition'
import { financeService, type PublicExpenseCategory, type LxlEligibilityResponse } from '@/services/finance'
import { branchesService } from '@/services/branches'
import type { PublicBranch } from '@/types/branch'

// Input component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  icon?: any
  required?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon: Icon, required, className = '', ...props }, ref) => (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
        )}
        <input
          ref={ref}
          className={`
            w-full h-11 rounded-lg border bg-white
            ${Icon ? 'pl-10' : 'px-3'} pr-3
            text-gray-900 text-sm placeholder:text-gray-400
            transition-colors duration-150
            hover:border-gray-300
            focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${error ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200'}
          `}
          {...props}
        />
      </div>
      {hint && !error && (
        <p className="mt-1 text-xs text-gray-500">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
)
Input.displayName = 'Input'

// Select component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, required, children, className = '', ...props }, ref) => (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <select
          ref={ref}
          className={`
            w-full h-11 rounded-lg border bg-white
            px-3 pr-9 appearance-none
            text-gray-900 text-sm
            transition-colors duration-150
            hover:border-gray-300
            focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${error ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200'}
          `}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
      {hint && !error && (
        <p className="mt-1 text-xs text-gray-500">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
)
Select.displayName = 'Select'

// Section divider
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-3 mb-4">
    <h3 className="text-sm font-semibold text-gray-900">{children}</h3>
    <div className="flex-1 h-px bg-gray-100" />
  </div>
)

export default function PublicRequisitionForm() {
  const { branchSlug } = useParams<{ branchSlug?: string }>()
  const csvInputRef = useRef<HTMLInputElement>(null)

  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [csvError, setCsvError] = useState<string | null>(null)

  const [branch, setBranch] = useState<PublicBranch | null>(null)
  const [branches, setBranches] = useState<PublicBranch[]>([])
  const [expenseCategories, setExpenseCategories] = useState<PublicExpenseCategory[]>([])
  const [loadingBranch, setLoadingBranch] = useState(!!branchSlug)
  const [loadingCategories, setLoadingCategories] = useState(false)

  const [eligibilityEmail, setEligibilityEmail] = useState('')
  const [eligibilityBranchSlug, setEligibilityBranchSlug] = useState('')
  const [checkingEligibility, setCheckingEligibility] = useState(false)
  const [eligibilityResult, setEligibilityResult] = useState<LxlEligibilityResponse | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [showNotAllowedModal, setShowNotAllowedModal] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PublicRequisitionFormData>({
    resolver: zodResolver(publicRequisitionSchema),
    defaultValues: {
      submitterName: '',
      submitterEmail: '',
      submitterPhone: '',
      branchSlug: branchSlug || '',
      unit: '',
      expenseCategory: '',
      eventDescription: '',
      dateNeeded: '',
      lastRequestDate: '',
      costBreakdown: [{ item: '', quantity: 1, unitCost: 0, total: 0 }],
      creditAccount: {
        bankName: '',
        accountName: '',
        accountNumber: '',
      },
      documentUrls: [],
      discussedWithPDams: '',
      discussedDate: '',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'costBreakdown',
  })

  const selectedBranchSlug = watch('branchSlug')
  const costBreakdown = watch('costBreakdown')
  const discussedWithPDams = watch('discussedWithPDams')

  const totalAmount = costBreakdown.reduce((sum, item) => sum + (item.total || 0), 0)

  // Parse CSV and populate cost breakdown
  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setCsvError(null)
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())

        if (lines.length < 2) {
          setCsvError('CSV file must have a header row and at least one data row')
          return
        }

        // Parse header to find column indices
        const header = lines[0].toLowerCase().split(',').map(h => h.trim())
        const itemIdx = header.findIndex(h => h === 'item' || h === 'description' || h === 'name')
        const qtyIdx = header.findIndex(h => h === 'qty' || h === 'quantity')
        const totalIdx = header.findIndex(h => h === 'total' || h === 'amount' || h === 'cost' || h === 'unit cost' || h === 'unitcost' || h === 'price')

        if (itemIdx === -1 || totalIdx === -1) {
          setCsvError('CSV must have columns: Item (or Description/Name) and Total (or Amount/Cost/Price)')
          return
        }

        // Parse data rows
        const items = lines.slice(1).map(line => {
          const cols = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''))
          const quantity = qtyIdx !== -1 ? (parseInt(cols[qtyIdx], 10) || 1) : 1
          const total = parseFloat(cols[totalIdx].replace(/[^0-9.]/g, '')) || 0
          return {
            item: cols[itemIdx] || '',
            quantity,
            unitCost: quantity > 1 ? total / quantity : total,
            total
          }
        }).filter(item => item.item) // Remove empty rows

        if (items.length === 0) {
          setCsvError('No valid items found in CSV')
          return
        }

        // Clear existing items and add new ones
        while (fields.length > 0) {
          remove(0)
        }
        items.forEach(item => append(item))

        // Reset file input
        if (csvInputRef.current) {
          csvInputRef.current.value = ''
        }
      } catch (err) {
        setCsvError('Failed to parse CSV file. Please check the format.')
        console.error('CSV parse error:', err)
      }
    }

    reader.onerror = () => {
      setCsvError('Failed to read CSV file')
    }

    reader.readAsText(file)
  }

  const handleEligibilityCheck = async () => {
    const branchSlugToCheck = branch?.slug || eligibilityBranchSlug
    if (!eligibilityEmail || !branchSlugToCheck) {
      setError('Please enter your email and select a branch.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(eligibilityEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    try {
      setCheckingEligibility(true)
      setError(null)
      const result = await financeService.checkLxlEligibility(eligibilityEmail, branchSlugToCheck)
      setEligibilityResult(result)

      if (result.eligible) {
        setValue('submitterEmail', eligibilityEmail, { shouldValidate: true, shouldDirty: true })
        setValue('submitterName', result.memberName || '', { shouldValidate: true, shouldDirty: true })
        setValue('branchSlug', branchSlugToCheck, { shouldValidate: true, shouldDirty: true })
        setIsVerified(true)
      } else {
        setShowNotAllowedModal(true)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to verify eligibility.')
    } finally {
      setCheckingEligibility(false)
    }
  }

  const handleResetEligibility = () => {
    setIsVerified(false)
    setEligibilityResult(null)
    setEligibilityEmail('')
    setValue('submitterEmail', '')
    setValue('submitterName', '')
  }

  useEffect(() => {
    const fetchBranchInfo = async () => {
      if (branchSlug) {
        setLoadingBranch(true)
        try {
          const branchData = await branchesService.getBranchBySlug(branchSlug)
          if (branchData) {
            setBranch(branchData)
            setValue('branchSlug', branchData.slug)
          } else {
            setError('Branch not found.')
          }
        } catch {
          setError('Branch not found.')
        } finally {
          setLoadingBranch(false)
        }
      } else {
        try {
          const allBranches = await branchesService.getPublicBranches()
          setBranches(allBranches)
        } catch {
          setError('Failed to load branches.')
        }
      }
    }
    fetchBranchInfo()
  }, [branchSlug, setValue])

  useEffect(() => {
    const fetchCategories = async () => {
      const branchSlugToUse = branch?.slug || selectedBranchSlug
      if (!branchSlugToUse) {
        setExpenseCategories([])
        return
      }
      try {
        setLoadingCategories(true)
        const data = await financeService.getPublicExpenseCategories(branchSlugToUse)
        setExpenseCategories(data)
      } catch {
        // Silent fail
      } finally {
        setLoadingCategories(false)
      }
    }
    fetchCategories()
  }, [branch?.slug, selectedBranchSlug])

  const onSubmit = async (data: PublicRequisitionFormData) => {
    try {
      setLoading(true)
      setError(null)
      await financeService.createPublicRequisition(data)
      setSubmitted(true)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to submit requisition.')
    } finally {
      setLoading(false)
    }
  }

  // Success screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-50 flex items-center justify-center"
            >
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </motion.div>

            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Request Submitted
            </h1>
            <p className="text-gray-500 text-sm mb-6">
              Your requisition has been submitted. You'll receive email updates on its status.
            </p>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <h3 className="font-medium text-gray-900 text-sm mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                What happens next
              </h3>
              <ul className="space-y-1.5 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  Approvers will review your request
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  You'll be notified when approved
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  Funds disbursed to your account
                </li>
              </ul>
            </div>

            <button
              onClick={() => {
                reset({
                  submitterName: eligibilityResult?.memberName || '',
                  submitterEmail: eligibilityEmail,
                  submitterPhone: '',
                  branchSlug: branch?.slug || eligibilityBranchSlug,
                  unit: '',
                  expenseCategory: '',
                  eventDescription: '',
                  dateNeeded: '',
                  lastRequestDate: '',
                  costBreakdown: [{ item: '', quantity: 1, unitCost: 0, total: 0 }],
                  creditAccount: {
                    bankName: '',
                    accountName: '',
                    accountNumber: '',
                  },
                  documentUrls: [],
                  discussedWithPDams: '',
                  discussedDate: '',
                })
                setSubmitted(false)
                setError(null)
              }}
              className="w-full h-11 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Submit Another Request
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Loading
  if (loadingBranch) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Not Allowed Modal
  const NotAllowedModal = () => (
    <Modal
      isOpen={showNotAllowedModal}
      onClose={() => setShowNotAllowedModal(false)}
      title=""
      size="md"
    >
      <div className="text-center py-2">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-50 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-amber-600" />
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Access Restricted
        </h2>

        <p className="text-gray-500 text-sm mb-4">
          {eligibilityResult?.reason || 'You are not authorized to raise requisitions.'}
        </p>

        {eligibilityResult?.memberName && (
          <p className="text-xs text-gray-500 mb-4">
            Account: <span className="font-medium">{eligibilityResult.memberName}</span>
          </p>
        )}

        <div className="bg-amber-50 rounded-lg p-3 mb-4 text-left">
          <p className="font-medium text-amber-900 text-xs mb-2">Who can raise requisitions?</p>
          <ul className="text-xs text-amber-800 space-y-1">
            <li className="flex items-center gap-2">
              <CircleDot className="w-2 h-2 text-amber-600" />
              Unit Heads & Assistant Unit Heads
            </li>
            <li className="flex items-center gap-2">
              <CircleDot className="w-2 h-2 text-amber-600" />
              District Pastors
            </li>
            <li className="flex items-center gap-2">
              <CircleDot className="w-2 h-2 text-amber-600" />
              Ministry Directors
            </li>
            <li className="flex items-center gap-2">
              <CircleDot className="w-2 h-2 text-amber-600" />
              LXL Members, Pastors & Campus Pastors
            </li>
          </ul>
        </div>

        <Button
          onClick={() => {
            setShowNotAllowedModal(false)
            setEligibilityEmail('')
          }}
          className="w-full"
        >
          Understood
        </Button>
      </div>
    </Modal>
  )

  // Verification screen
  if (!isVerified) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NotAllowedModal />

        <div className="max-w-sm mx-auto px-4 py-12 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 mb-3">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-1">
              Expense Request
            </h1>
            <p className="text-gray-500 text-sm">
              Verify your email to continue
            </p>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
          >
            {!branch && branches.length > 0 && (
              <div className="mb-4">
                <Select
                  label="Branch"
                  required
                  value={eligibilityBranchSlug}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEligibilityBranchSlug(e.target.value)}
                >
                  <option value="">Select branch</option>
                  {branches.map((b) => (
                    <option key={b.slug} value={b.slug}>
                      {b.name}
                      {b.address?.city && ` - ${b.address.city}`}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {branch && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">{branch.name}</span>
                </div>
              </div>
            )}

            <div className="mb-4">
              <Input
                label="Email"
                required
                type="email"
                icon={Mail}
                placeholder="your@email.com"
                value={eligibilityEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEligibilityEmail(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleEligibilityCheck()
                  }
                }}
                hint="Use your registered church email"
              />
            </div>

            <Button
              type="button"
              onClick={handleEligibilityCheck}
              disabled={checkingEligibility || !eligibilityEmail || (!branch && !eligibilityBranchSlug)}
              className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              {checkingEligibility ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Continue'
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    )
  }

  // Main form
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6 md:py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center">
                <BadgeCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">{eligibilityResult?.memberName}</p>
                <p className="text-xs text-gray-500">{eligibilityResult?.leadershipRole}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetEligibility}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Change
            </button>
          </div>

          <h1 className="text-lg font-semibold text-gray-900">
            New Expense Request
          </h1>
          {branch && (
            <p className="text-sm text-gray-500">{branch.name}</p>
          )}
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-6"
        >
          <input type="hidden" {...register('branchSlug')} />
          <input type="hidden" {...register('submitterName')} />
          <input type="hidden" {...register('submitterEmail')} />

          {/* Request Details */}
          <div>
            <SectionLabel>Request Details</SectionLabel>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Category"
                  required
                  disabled={loadingCategories}
                  error={errors.expenseCategory?.message}
                  {...register('expenseCategory')}
                >
                  <option value="">
                    {loadingCategories ? 'Loading...' : 'Select'}
                  </option>
                  {expenseCategories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </Select>

                <Input
                  label="Date Needed"
                  required
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  error={errors.dateNeeded?.message}
                  {...register('dateNeeded')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('eventDescription')}
                  rows={3}
                  placeholder="What is this expense for?"
                  className={`
                    w-full rounded-lg border bg-white px-3 py-2.5
                    text-gray-900 text-sm placeholder:text-gray-400 resize-none
                    transition-colors duration-150
                    hover:border-gray-300
                    focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                    ${errors.eventDescription ? 'border-red-300' : 'border-gray-200'}
                  `}
                />
                {errors.eventDescription && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.eventDescription.message}
                  </p>
                )}
              </div>

              <Input
                label="Phone (optional)"
                type="tel"
                icon={Phone}
                placeholder="+234 800 000 0000"
                error={errors.submitterPhone?.message}
                {...register('submitterPhone')}
              />

              <Input
                label="Last Similar Request (optional)"
                type="date"
                icon={Calendar}
                hint="When was a similar expense last requested?"
                {...register('lastRequestDate')}
              />
            </div>
          </div>

          {/* Cost Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-gray-900">Cost Breakdown</h3>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              {/* Hidden CSV input */}
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => csvInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Upload CSV
              </button>
            </div>

            {/* CSV Error */}
            {csvError && (
              <div className="mb-3 p-2 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{csvError}</p>
              </div>
            )}

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex gap-2">
                    <input
                      {...register(`costBreakdown.${index}.item`)}
                      type="text"
                      placeholder="Item description"
                      className="flex-1 h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm
                        focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                        transition-colors"
                    />
                    <div className="w-28 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₦</span>
                      <Controller
                        control={control}
                        name={`costBreakdown.${index}.total`}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="number"
                            min="0"
                            placeholder="0"
                            value={field.value || ''}
                            className="w-full h-10 rounded-lg border border-gray-200 bg-white pl-7 pr-2 text-sm
                              focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                              transition-colors"
                            onFocus={(e) => {
                              if (e.target.value === '0') e.target.value = ''
                            }}
                            onChange={(e) => {
                              const value = e.target.value === '' ? 0 : Number(e.target.value)
                              field.onChange(value)
                              const qty = costBreakdown[index]?.quantity || 1
                              setValue(`costBreakdown.${index}.unitCost`, qty > 1 ? value / qty : value)
                            }}
                          />
                        )}
                      />
                    </div>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="h-10 w-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Quantity toggle */}
                  <div className="mt-2 pt-2 border-t border-gray-200/60">
                    <button
                      type="button"
                      onClick={() => {
                        const currentQty = costBreakdown[index]?.quantity || 1
                        if (currentQty === 1) {
                          setValue(`costBreakdown.${index}.quantity`, 2)
                          const total = costBreakdown[index]?.total || 0
                          setValue(`costBreakdown.${index}.unitCost`, total / 2)
                        } else {
                          setValue(`costBreakdown.${index}.quantity`, 1)
                          setValue(`costBreakdown.${index}.unitCost`, costBreakdown[index]?.total || 0)
                        }
                      }}
                      className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      {(costBreakdown[index]?.quantity || 1) > 1 ? '− Remove quantity' : '+ Add quantity'}
                    </button>

                    <AnimatePresence>
                      {(costBreakdown[index]?.quantity || 1) > 1 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 flex items-center gap-2"
                        >
                          <span className="text-xs text-gray-500">Qty:</span>
                          <Controller
                            control={control}
                            name={`costBreakdown.${index}.quantity`}
                            render={({ field }) => (
                              <input
                                {...field}
                                type="number"
                                min="1"
                                className="w-12 h-7 rounded border border-gray-200 bg-white px-2 text-xs text-center
                                  focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                onChange={(e) => {
                                  const qty = Number(e.target.value) || 1
                                  field.onChange(qty)
                                  const total = costBreakdown[index]?.total || 0
                                  setValue(`costBreakdown.${index}.unitCost`, total / qty)
                                }}
                              />
                            )}
                          />
                          <span className="text-xs text-gray-400">×</span>
                          <span className="text-xs text-gray-600">
                            ₦{((costBreakdown[index]?.total || 0) / (costBreakdown[index]?.quantity || 1)).toLocaleString()} each
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => append({ item: '', quantity: 1, unitCost: 0, total: 0 })}
                className="w-full h-10 border border-dashed border-gray-200 rounded-lg text-sm text-gray-500
                  hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50
                  transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-gray-500">Total</span>
                <span className="text-lg font-semibold text-gray-900">
                  ₦{totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div>
            <SectionLabel>Payment Details</SectionLabel>
            <div className="space-y-3">
              <Input
                label="Bank Name"
                required
                placeholder="e.g., First Bank, GTBank"
                error={errors.creditAccount?.bankName?.message}
                {...register('creditAccount.bankName')}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Account Name"
                  required
                  placeholder="Account holder"
                  error={errors.creditAccount?.accountName?.message}
                  {...register('creditAccount.accountName')}
                />
                <Input
                  label="Account Number"
                  required
                  placeholder="0123456789"
                  maxLength={10}
                  error={errors.creditAccount?.accountNumber?.message}
                  {...register('creditAccount.accountNumber')}
                />
              </div>
            </div>
          </div>

          {/* P.Dams Discussion */}
          <div>
            <SectionLabel>Confirmation</SectionLabel>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discussed with P.Dams? <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">
                For regular monthly expenses, select "Not required". For one-off expenses, discuss with P.Dams first.
              </p>

              <div className="space-y-2">
                {[
                  { value: 'yes', label: 'Yes, I have discussed this' },
                  { value: 'not_required', label: 'Not required (regular expense)' },
                  { value: 'no', label: 'No, I have not discussed this' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`
                      flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all text-sm
                      ${discussedWithPDams === option.value
                        ? option.value === 'no'
                          ? 'border-amber-300 bg-amber-50'
                          : 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      value={option.value}
                      {...register('discussedWithPDams')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>

              <AnimatePresence>
                {discussedWithPDams === 'no' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3"
                  >
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800">
                          Your request will not be routed for approval. Please discuss with P.Dams first.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading || !discussedWithPDams || discussedWithPDams === 'no'}
              className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
            <p className="text-center text-xs text-gray-500 mt-3">
              You'll receive email updates about your request
            </p>
          </div>
        </motion.form>
      </div>
    </div>
  )
}
