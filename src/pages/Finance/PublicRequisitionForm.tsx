import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  User,
  Mail,
  Phone,
  FileText,
  Calendar,
  Plus,
  Trash2,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Receipt,
  MessageSquare,
  Landmark,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { publicRequisitionSchema, type PublicRequisitionFormData } from '@/schemas/publicRequisition'
import { financeService, type PublicExpenseCategory } from '@/services/finance'
import { branchesService } from '@/services/branches'
import type { PublicBranch } from '@/types/branch'

// Reusable input component with modern styling
const Input = ({
  label,
  error,
  icon: Icon,
  required,
  className = '',
  ...props
}: {
  label: string
  error?: string
  icon?: any
  required?: boolean
  className?: string
  [key: string]: any
}) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      )}
      <input
        className={`
          w-full rounded-xl border border-gray-200 bg-white
          ${Icon ? 'pl-10' : 'px-4'} pr-4 py-3
          text-gray-900 placeholder:text-gray-400
          transition-all duration-200
          hover:border-gray-300
          focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
          disabled:bg-gray-50 disabled:text-gray-500
          ${error ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' : ''}
        `}
        {...props}
      />
    </div>
    {error && (
      <p className="mt-1.5 text-sm text-rose-600 flex items-center gap-1">
        <AlertCircle className="w-3.5 h-3.5" />
        {error}
      </p>
    )}
  </div>
)

// Reusable select component
const Select = ({
  label,
  error,
  required,
  children,
  className = '',
  ...props
}: {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
  [key: string]: any
}) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    <div className="relative">
      <select
        className={`
          w-full rounded-xl border border-gray-200 bg-white
          px-4 py-3 pr-10 appearance-none
          text-gray-900
          transition-all duration-200
          hover:border-gray-300
          focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          ${error ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' : ''}
        `}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
    {error && (
      <p className="mt-1.5 text-sm text-rose-600 flex items-center gap-1">
        <AlertCircle className="w-3.5 h-3.5" />
        {error}
      </p>
    )}
  </div>
)

// Section component
const Section = ({
  icon: Icon,
  title,
  description,
  children,
  delay = 0,
}: {
  icon: any
  title: string
  description?: string
  children: React.ReactNode
  delay?: number
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
  >
    <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-white">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
      </div>
    </div>
    <div className="p-6">{children}</div>
  </motion.div>
)

export default function PublicRequisitionForm() {
  const { branchSlug } = useParams<{ branchSlug?: string }>()

  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [branch, setBranch] = useState<PublicBranch | null>(null)
  const [branches, setBranches] = useState<PublicBranch[]>([])
  const [expenseCategories, setExpenseCategories] = useState<PublicExpenseCategory[]>([])
  const [loadingBranch, setLoadingBranch] = useState(!!branchSlug)
  const [loadingCategories, setLoadingCategories] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
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

  // Calculate total amount
  const totalAmount = costBreakdown.reduce((sum, item) => sum + (item.total || 0), 0)

  // Fetch branch info if slug is provided, otherwise fetch all branches
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
            setError('Branch not found. Please check the URL.')
          }
        } catch (err) {
          console.error('Error fetching branch:', err)
          setError('Branch not found. Please check the URL.')
        } finally {
          setLoadingBranch(false)
        }
      } else {
        try {
          const allBranches = await branchesService.getPublicBranches()
          setBranches(allBranches)
        } catch (err) {
          console.error('Error fetching branches:', err)
          setError('Failed to load branches. Please refresh and try again.')
        }
      }
    }

    fetchBranchInfo()
  }, [branchSlug, setValue])

  // Fetch expense categories when branch changes
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
      } catch (err) {
        console.error('Error fetching expense categories:', err)
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
      console.error('Error submitting requisition:', err)
      setError(err.response?.data?.message || err.message || 'Failed to submit requisition. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Success State
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 md:p-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30"
            >
              <CheckCircle2 className="w-10 h-10 text-white" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                Request Submitted!
              </h1>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Your requisition has been submitted successfully. You'll receive email updates on its status.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 text-left"
            >
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                What happens next?
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  Approvers will review your request via email
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  You'll be notified when approved or if changes needed
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  Funds will be disbursed to your provided account
                </li>
              </ul>
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={() => {
                setSubmitted(false)
                setError(null)
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Submit Another Request
            </motion.button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Loading State
  if (loadingBranch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 mb-4">
            <Receipt className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Powerpoint Tribe Expense Requisition
          </h1>
          <p className="text-gray-500">
            Submit your expense request for approval
          </p>

          {/* Branch Badge */}
          {branch && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-white shadow-sm border border-gray-100"
            >
              <Building2 className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">{branch.name}</span>
            </motion.div>
          )}
        </motion.div>

        {/* Branch Selection */}
        {!branch && branches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Select Your Branch</h3>
                  <p className="text-sm text-gray-500">Choose the branch for this requisition</p>
                </div>
              </div>
              <Select
                label=""
                value={selectedBranchSlug}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setValue('branchSlug', e.target.value)}
                required
              >
                <option value="">Choose a branch...</option>
                {branches.map((b) => (
                  <option key={b.slug} value={b.slug}>
                    {b.name}
                    {b.address?.city && ` - ${b.address.city}`}
                  </option>
                ))}
              </Select>
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mb-6"
            >
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-rose-800">Something went wrong</p>
                  <p className="text-sm text-rose-700">{error}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <input type="hidden" {...register('branchSlug')} />

          {/* Your Information */}
          <Section icon={User} title="Your Information" description="Tell us who you are" delay={0.1}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                required
                icon={User}
                placeholder="John Doe"
                error={errors.submitterName?.message}
                {...register('submitterName')}
              />
              <Input
                label="Email Address"
                required
                type="email"
                icon={Mail}
                placeholder="john@example.com"
                error={errors.submitterEmail?.message}
                {...register('submitterEmail')}
              />
              <Input
                label="Phone Number"
                type="tel"
                icon={Phone}
                placeholder="+234 800 000 0000"
                error={errors.submitterPhone?.message}
                className="md:col-span-2 md:max-w-xs"
                {...register('submitterPhone')}
              />
            </div>
          </Section>

          {/* Request Details */}
          <Section icon={FileText} title="Request Details" description="What is this expense for?" delay={0.2}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Expense Category"
                  required
                  disabled={loadingCategories || (!branch && !selectedBranchSlug)}
                  error={errors.expenseCategory?.message}
                  {...register('expenseCategory')}
                >
                  <option value="">
                    {loadingCategories
                      ? 'Loading categories...'
                      : !branch && !selectedBranchSlug
                      ? 'Select a branch first'
                      : 'Select a category'}
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
                  icon={Calendar}
                  min={new Date().toISOString().split('T')[0]}
                  error={errors.dateNeeded?.message}
                  {...register('dateNeeded')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Purpose / Description
                  <span className="text-rose-500 ml-0.5">*</span>
                </label>
                <textarea
                  {...register('eventDescription')}
                  rows={3}
                  placeholder="Describe the purpose of this expense request..."
                  className={`
                    w-full rounded-xl border border-gray-200 bg-white px-4 py-3
                    text-gray-900 placeholder:text-gray-400 resize-none
                    transition-all duration-200
                    hover:border-gray-300
                    focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                    ${errors.eventDescription ? 'border-rose-300' : ''}
                  `}
                />
                {errors.eventDescription && (
                  <p className="mt-1.5 text-sm text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.eventDescription.message}
                  </p>
                )}
              </div>

            </div>
          </Section>

          {/* Cost Breakdown */}
          <Section icon={Wallet} title="Cost Breakdown" description="List your expense items" delay={0.3}>
            <div className="space-y-3">
              {fields.map((field, index) => (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-gray-50 rounded-xl p-4"
                  >
                    <div className="flex gap-3 items-start">
                      {/* Item Description */}
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                          Item
                        </label>
                        <input
                          {...register(`costBreakdown.${index}.item`)}
                          type="text"
                          placeholder="e.g., Transport, Refreshments, Printing"
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm
                            focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                            transition-all duration-200"
                        />
                      </div>

                      {/* Amount */}
                      <div className="w-32">
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                          Amount (NGN)
                        </label>
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
                              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm
                                focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                                transition-all duration-200"
                              onFocus={(e) => {
                                if (e.target.value === '0') {
                                  e.target.value = ''
                                }
                              }}
                              onChange={(e) => {
                                const value = e.target.value === '' ? 0 : Number(e.target.value)
                                field.onChange(value)
                                // If quantity > 1, calculate unit cost
                                const qty = costBreakdown[index]?.quantity || 1
                                if (qty > 1) {
                                  setValue(`costBreakdown.${index}.unitCost`, value / qty)
                                } else {
                                  setValue(`costBreakdown.${index}.unitCost`, value)
                                }
                              }}
                            />
                          )}
                        />
                      </div>

                      {/* Delete button */}
                      <div className="pt-6">
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Optional Quantity Toggle */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
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
                            className="mt-2 flex items-center gap-3"
                          >
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-gray-500">Qty:</label>
                              <Controller
                                control={control}
                                name={`costBreakdown.${index}.quantity`}
                                render={({ field }) => (
                                  <input
                                    {...field}
                                    type="number"
                                    min="1"
                                    className="w-16 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-center
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
                            </div>
                            <span className="text-xs text-gray-400">×</span>
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-gray-500">Unit price:</label>
                              <span className="text-sm text-gray-700">
                                NGN {((costBreakdown[index]?.total || 0) / (costBreakdown[index]?.quantity || 1)).toLocaleString()}
                              </span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
              ))}

              <button
                type="button"
                onClick={() => append({ item: '', quantity: 1, unitCost: 0, total: 0 })}
                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500
                  hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50
                  transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Another Item
              </button>

              {/* Total */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Total Amount</span>
                  <span className="text-xl font-semibold text-gray-900">
                    NGN {totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </Section>

          {/* Bank Details */}
          <Section icon={Landmark} title="Disbursement Account" description="Where should we send the funds?" delay={0.4}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Bank Name"
                required
                placeholder="e.g., First Bank"
                error={errors.creditAccount?.bankName?.message}
                {...register('creditAccount.bankName')}
              />
              <Input
                label="Account Name"
                required
                placeholder="Account holder name"
                error={errors.creditAccount?.accountName?.message}
                {...register('creditAccount.accountName')}
              />
              <Input
                label="Account Number"
                required
                placeholder="0123456789"
                maxLength={10}
                className="font-mono"
                error={errors.creditAccount?.accountNumber?.message}
                {...register('creditAccount.accountNumber')}
              />
            </div>
          </Section>

          {/* Discussion Confirmation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            <div>
              <label className="text-sm font-medium text-gray-900 mb-1 block">
                Have you discussed this expense with P.Dams? <span className="text-rose-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                For pre-agreed regular monthly expenses, please select "Not required". For one-off or event related expenses, please ensure you have discussed the budget with P.Dams and received his go-ahead to fill the form. Selecting "No" would not route your request for approval and no approvals would be granted outside the requisition system.
              </p>

              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50/50">
                  <input
                    type="radio"
                    value="yes"
                    {...register('discussedWithPDams')}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Yes, I have discussed this with P.Dams</span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50/50">
                  <input
                    type="radio"
                    value="not_required"
                    {...register('discussedWithPDams')}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Not required (pre-agreed regular monthly expense)</span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:border-amber-500 has-[:checked]:bg-amber-50/50">
                  <input
                    type="radio"
                    value="no"
                    {...register('discussedWithPDams')}
                    className="w-4 h-4 text-amber-600 border-gray-300 focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-700">No, I have not discussed this</span>
                </label>
              </div>

              <AnimatePresence>
                {discussedWithPDams === 'yes' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4"
                  >
                    <Input
                      label="Discussion Date"
                      type="date"
                      max={new Date().toISOString().split('T')[0]}
                      {...register('discussedDate')}
                    />
                  </motion.div>
                )}
                {discussedWithPDams === 'no' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4"
                  >
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">Your request will not be routed for approval</p>
                          <p className="text-xs text-amber-700 mt-1">
                            No approvals will be granted outside the requisition system. Please discuss with P.Dams before submitting.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="pt-4"
          >
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-4 text-base rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all duration-200"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Submit Requisition
                </>
              )}
            </Button>
            <p className="text-center text-sm text-gray-500 mt-3">
              You'll receive email updates about your request status
            </p>
          </motion.div>
        </form>
      </div>
    </div>
  )
}
