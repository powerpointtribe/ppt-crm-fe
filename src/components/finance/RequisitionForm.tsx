import { useState, useEffect, useRef } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Plus, Upload, Settings, X, FileText, CreditCard, Wallet, MessageSquare, ChevronDown, FileSpreadsheet } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import FormFieldManager from './FormFieldManager'
import { financeService } from '@/services/finance'
import { groupsService } from '@/services/groups'
import { requisitionSchema, type RequisitionFormData } from '@/schemas/requisition'
import { useAuth } from '@/contexts/AuthContext-unified'
import type { ExpenseCategory, Requisition, FormFieldConfig } from '@/types/finance'
import { EVENT_DESCRIPTION_OPTIONS } from '@/types/finance'

interface RequisitionFormProps {
  requisition?: Requisition
  onSubmit: (data: RequisitionFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
  mode?: 'create' | 'edit'
}

export default function RequisitionForm({
  requisition,
  onSubmit,
  onCancel,
  loading = false,
  mode = 'create',
}: RequisitionFormProps) {
  const { member, hasPermission } = useAuth()
  const canManageFields = hasPermission('finance:manage-form-fields')
  const csvInputRef = useRef<HTMLInputElement>(null)

  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [formFields, setFormFields] = useState<FormFieldConfig[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [showFieldManager, setShowFieldManager] = useState(false)
  const [eventDescriptionType, setEventDescriptionType] = useState<string>('')
  const [customEventDescription, setCustomEventDescription] = useState<string>('')
  const [csvError, setCsvError] = useState<string | null>(null)

  const defaultCostItem = { item: '', quantity: 1, unitCost: 0, total: 0 }

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RequisitionFormData>({
    resolver: zodResolver(requisitionSchema),
    defaultValues: requisition
      ? {
          unit: typeof requisition.unit === 'object' ? requisition.unit?._id : requisition.unit,
          expenseCategory:
            typeof requisition.expenseCategory === 'object'
              ? requisition.expenseCategory._id
              : requisition.expenseCategory,
          eventDescription: requisition.eventDescription,
          dateNeeded: requisition.dateNeeded?.split('T')[0],
          lastRequestDate: requisition.lastRequestDate?.split('T')[0],
          costBreakdown: requisition.costBreakdown,
          creditAccount: requisition.creditAccount,
          documentUrls: requisition.documentUrls,
          discussedWithPDams: requisition.discussedWithPDams,
          discussedDate: requisition.discussedDate?.split('T')[0],
        }
      : {
          expenseCategory: '',
          eventDescription: '',
          dateNeeded: '',
          costBreakdown: [defaultCostItem],
          creditAccount: {
            bankName: '',
            accountName: '',
            accountNumber: '',
          },
          documentUrls: [],
          discussedWithPDams: '' as any,
        },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'costBreakdown',
  })

  const costBreakdown = watch('costBreakdown')
  const discussedWithPDams = watch('discussedWithPDams')

  const calculateTotal = () => {
    return costBreakdown.reduce((sum, item) => sum + (item.total || 0), 0)
  }

  const updateItemTotal = (index: number) => {
    const quantity = costBreakdown[index]?.quantity || 0
    const unitCost = costBreakdown[index]?.unitCost || 0
    setValue(`costBreakdown.${index}.total`, quantity * unitCost)
  }

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
        const unitCostIdx = header.findIndex(h => h === 'unit cost' || h === 'unitcost' || h === 'unit_cost' || h === 'price' || h === 'unit price')

        if (itemIdx === -1 || qtyIdx === -1 || unitCostIdx === -1) {
          setCsvError('CSV must have columns: Item (or Description/Name), Qty (or Quantity), and Unit Cost (or Price)')
          return
        }

        // Parse data rows
        const items = lines.slice(1).map(line => {
          const cols = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''))
          const quantity = parseInt(cols[qtyIdx], 10) || 1
          const unitCost = parseFloat(cols[unitCostIdx].replace(/[^0-9.]/g, '')) || 0
          return {
            item: cols[itemIdx] || '',
            quantity,
            unitCost,
            total: quantity * unitCost
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

  useEffect(() => {
    loadFormData()
  }, [])

  // Initialize event description state when editing
  useEffect(() => {
    if (requisition?.eventDescription) {
      const matchingOption = EVENT_DESCRIPTION_OPTIONS.find(
        opt => opt.label === requisition.eventDescription
      )
      if (matchingOption) {
        setEventDescriptionType(matchingOption.value)
        setCustomEventDescription('')
      } else {
        setEventDescriptionType('other')
        setCustomEventDescription(requisition.eventDescription)
      }
    }
  }, [requisition])

  const loadFormData = async () => {
    try {
      setLoadingData(true)

      // Load each resource independently to prevent one failure from blocking others
      const [categoriesResult, unitsResult, fieldsResult] = await Promise.allSettled([
        financeService.getExpenseCategories(),
        groupsService.getUnits(),
        financeService.getFormFields('requisition'),
      ])

      // Handle categories
      if (categoriesResult.status === 'fulfilled') {
        let loadedCategories = categoriesResult.value || []

        // Auto-initialize if no categories exist
        if (loadedCategories.length === 0) {
          console.log('No categories found, attempting to initialize...')
          try {
            const initResult = await financeService.initializeExpenseCategories()
            console.log('Initialize result:', initResult)
            if (initResult.created) {
              // Fetch the newly created categories
              loadedCategories = await financeService.getExpenseCategories()
            }
          } catch (initErr) {
            console.error('Failed to initialize categories:', initErr)
          }
        }

        setCategories(loadedCategories)
        console.log('Loaded categories:', loadedCategories)
      } else {
        console.error('Failed to load categories:', categoriesResult.reason)
        setCategories([])
      }

      // Handle units
      if (unitsResult.status === 'fulfilled') {
        setUnits(unitsResult.value?.items || [])
      } else {
        console.error('Failed to load units:', unitsResult.reason)
        setUnits([])
      }

      // Handle form fields
      if (fieldsResult.status === 'fulfilled') {
        setFormFields(fieldsResult.value || [])
      } else {
        console.error('Failed to load form fields:', fieldsResult.reason)
        setFormFields([])
      }
    } catch (err) {
      console.error('Failed to load form data:', err)
    } finally {
      setLoadingData(false)
    }
  }

  // Handle event description type change
  const handleEventDescriptionTypeChange = (value: string) => {
    setEventDescriptionType(value)
    if (value !== 'other') {
      const option = EVENT_DESCRIPTION_OPTIONS.find(opt => opt.value === value)
      setValue('eventDescription', option?.label || '')
      setCustomEventDescription('')
    } else {
      setValue('eventDescription', customEventDescription)
    }
  }

  // Handle custom event description change
  const handleCustomEventDescriptionChange = (value: string) => {
    setCustomEventDescription(value)
    setValue('eventDescription', value)
  }

  const onFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data)
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loadingData) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-16 bg-gradient-to-r from-primary/20 to-violet-500/10 rounded-xl" />
        <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg" />
        <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg" />
      </div>
    )
  }

  return (
    <>
      <form onSubmit={onFormSubmit} className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/15 via-violet-500/10 to-pink-500/5 dark:from-primary/25 dark:via-violet-500/15 dark:to-pink-500/10 rounded-xl border border-primary/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-violet-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg shadow-primary/30">
              {member?.firstName?.[0]}{member?.lastName?.[0]}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {member?.firstName} {member?.lastName}
              </p>
              <p className="text-sm text-gray-500">{mode === 'create' ? 'New requisition' : 'Edit requisition'}</p>
            </div>
          </div>
          {canManageFields && (
            <button
              type="button"
              onClick={() => setShowFieldManager(true)}
              className="p-2 text-gray-400 hover:text-primary hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-all"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Request Details Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Request Details</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Expense Category <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  {...register('expenseCategory')}
                  className="w-full px-4 py-2.5 pr-10 text-sm bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/10 border border-blue-200/60 dark:border-blue-800/40 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/60 transition-all appearance-none cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 shadow-sm hover:shadow-md"
                >
                  <option value="">
                    {categories.length === 0 ? 'No categories available' : 'Select expense category'}
                  </option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
              </div>
              {errors.expenseCategory && <p className="text-red-500 text-xs mt-1">{errors.expenseCategory.message}</p>}
              {categories.length === 0 && (
                <p className="text-amber-600 text-xs mt-1">No expense categories found. Please contact an administrator.</p>
              )}
            </div>

            {/* Unit */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Unit <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <div className="relative">
                <select
                  {...register('unit')}
                  className="w-full px-4 py-2.5 pr-10 text-sm bg-gradient-to-br from-violet-50 to-purple-50/50 dark:from-violet-900/20 dark:to-purple-900/10 border border-violet-200/60 dark:border-violet-800/40 rounded-xl focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/60 transition-all appearance-none cursor-pointer hover:border-violet-300 dark:hover:border-violet-700 shadow-sm hover:shadow-md"
                >
                  <option value="">Select unit</option>
                  {units.map((unit) => (
                    <option key={unit._id} value={unit._id}>{unit.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400 pointer-events-none" />
              </div>
            </div>

            {/* Date Needed */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Date Needed <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('dateNeeded')}
                className="w-full px-4 py-2.5 text-sm bg-violet-50/50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-900/30 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50 transition-all"
              />
              {errors.dateNeeded && <p className="text-red-500 text-xs mt-1">{errors.dateNeeded.message}</p>}
            </div>

            {/* Last Request */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Last Similar Request <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <input
                type="date"
                {...register('lastRequestDate')}
                className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
              />
            </div>
          </div>

          {/* Event Description Dropdown */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Event Description <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={eventDescriptionType}
                onChange={(e) => handleEventDescriptionTypeChange(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 text-sm bg-gradient-to-br from-purple-50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/10 border border-purple-200/60 dark:border-purple-800/40 rounded-xl focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/60 transition-all appearance-none cursor-pointer hover:border-purple-300 dark:hover:border-purple-700 shadow-sm hover:shadow-md"
              >
                <option value="">Select event description</option>
                {EVENT_DESCRIPTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 pointer-events-none" />
            </div>
            {errors.eventDescription && !eventDescriptionType && (
              <p className="text-red-500 text-xs mt-1">{errors.eventDescription.message}</p>
            )}
          </div>

          {/* Custom Event Description (shown when "Other" is selected) */}
          {eventDescriptionType === 'other' && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Describe the Event <span className="text-red-500">*</span>
              </label>
              <textarea
                value={customEventDescription}
                onChange={(e) => handleCustomEventDescriptionChange(e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/50 resize-none transition-all"
                placeholder="Describe the purpose of this requisition..."
              />
              {errors.eventDescription && (
                <p className="text-red-500 text-xs mt-1">{errors.eventDescription.message}</p>
              )}
            </div>
          )}

          {/* Hidden field to store the actual eventDescription value */}
          <input type="hidden" {...register('eventDescription')} />
        </div>

        {/* Cost Breakdown Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Cost Breakdown</span>
            </div>
            <div className="flex items-center gap-2">
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
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
              >
                <FileSpreadsheet className="w-4 h-4" /> Upload CSV
              </button>
              <button
                type="button"
                onClick={() => append(defaultCostItem)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>
          </div>

          {/* CSV Format Hint */}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            CSV format: Item, Qty, Unit Cost (headers required)
          </p>

          {/* CSV Error Message */}
          {csvError && (
            <div className="text-red-500 text-xs bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              {csvError}
            </div>
          )}

          <div className="space-y-2">
            {fields.map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-lg"
              >
                <span className="w-6 h-6 flex items-center justify-center bg-emerald-500 text-white text-xs font-bold rounded-md">
                  {index + 1}
                </span>
                <input
                  {...register(`costBreakdown.${index}.item`)}
                  placeholder="Item description"
                  className="flex-1 min-w-0 px-3 py-2 text-sm bg-white dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-emerald-500/20"
                />
                <Controller
                  control={control}
                  name={`costBreakdown.${index}.quantity`}
                  render={({ field: f }) => (
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      className="w-16 px-3 py-2 text-sm bg-white dark:bg-gray-800 border-0 rounded-lg text-center focus:ring-2 focus:ring-emerald-500/20"
                      value={f.value}
                      onChange={(e) => {
                        f.onChange(Number(e.target.value))
                        setTimeout(() => updateItemTotal(index), 0)
                      }}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name={`costBreakdown.${index}.unitCost`}
                  render={({ field: f }) => (
                    <input
                      type="number"
                      min="0"
                      placeholder="Unit ₦"
                      className="w-24 px-3 py-2 text-sm bg-white dark:bg-gray-800 border-0 rounded-lg text-right focus:ring-2 focus:ring-emerald-500/20"
                      value={f.value}
                      onChange={(e) => {
                        f.onChange(Number(e.target.value))
                        setTimeout(() => updateItemTotal(index), 0)
                      }}
                    />
                  )}
                />
                <input
                  type="number"
                  {...register(`costBreakdown.${index}.total`, { valueAsNumber: true })}
                  className="w-28 px-3 py-2 text-sm bg-emerald-100 dark:bg-emerald-900/30 border-0 rounded-lg text-right font-semibold text-emerald-700 dark:text-emerald-300"
                  readOnly
                />
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/20">
            <span className="text-sm font-medium text-emerald-100">Total Amount</span>
            <span className="text-xl font-bold text-white">{formatCurrency(calculateTotal())}</span>
          </div>
        </div>

        {/* Bank Details Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
              <CreditCard className="w-4 h-4 text-pink-600 dark:text-pink-400" />
            </div>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Account to Credit</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Bank <span className="text-red-500">*</span>
              </label>
              <input
                {...register('creditAccount.bankName')}
                placeholder="e.g., GTBank"
                className="w-full px-4 py-2.5 text-sm bg-pink-50/50 dark:bg-pink-900/10 border border-pink-100 dark:border-pink-900/30 rounded-lg focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500/50 transition-all"
              />
              {errors.creditAccount?.bankName && <p className="text-red-500 text-xs mt-1">{errors.creditAccount.bankName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Account Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('creditAccount.accountName')}
                placeholder="Account holder"
                className="w-full px-4 py-2.5 text-sm bg-pink-50/50 dark:bg-pink-900/10 border border-pink-100 dark:border-pink-900/30 rounded-lg focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500/50 transition-all"
              />
              {errors.creditAccount?.accountName && <p className="text-red-500 text-xs mt-1">{errors.creditAccount.accountName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Account No. <span className="text-red-500">*</span>
              </label>
              <input
                {...register('creditAccount.accountNumber')}
                placeholder="10 digits"
                maxLength={10}
                className="w-full px-4 py-2.5 text-sm bg-pink-50/50 dark:bg-pink-900/10 border border-pink-100 dark:border-pink-900/30 rounded-lg focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500/50 transition-all"
              />
              {errors.creditAccount?.accountNumber && <p className="text-red-500 text-xs mt-1">{errors.creditAccount.accountNumber.message}</p>}
            </div>
          </div>
        </div>

        {/* P.Dams Discussion Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <MessageSquare className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">P.Dams Discussion</span>
          </div>

          <div className="px-4 py-3 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-xl space-y-3">
            <div>
              <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                Has this expense been discussed with P.Dams? <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  {...register('discussedWithPDams')}
                  className="w-full px-4 py-2.5 pr-10 text-sm bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/60 transition-all appearance-none cursor-pointer hover:border-amber-300 dark:hover:border-amber-600"
                >
                  <option value="">Select an option</option>
                  <option value="yes">Yes, I have discussed this with P.Dams</option>
                  <option value="not_required">Not Required - This expense doesn't require P.Dams approval</option>
                  <option value="no">No, I have not discussed this yet</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400 pointer-events-none" />
              </div>
              {errors.discussedWithPDams && (
                <p className="text-red-500 text-xs mt-1">{errors.discussedWithPDams.message}</p>
              )}
              {discussedWithPDams === 'no' && (
                <p className="text-red-500 text-xs mt-2 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                  Note: Requisitions cannot be submitted without discussing with P.Dams. Please select "Yes" or "Not Required" to submit.
                </p>
              )}
            </div>
            {discussedWithPDams === 'yes' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <label className="block text-xs text-amber-600 dark:text-amber-400 mb-1">Discussion Date</label>
                <input
                  type="date"
                  {...register('discussedDate')}
                  className="w-full md:w-48 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all"
                />
              </motion.div>
            )}
          </div>
        </div>

        {/* Upload */}
        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-5 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group">
          <Upload className="w-6 h-6 mx-auto text-gray-400 group-hover:text-primary transition-colors" />
          <p className="text-sm text-gray-500 group-hover:text-primary mt-2 transition-colors">Drop files or click to upload</p>
          <p className="text-xs text-gray-400 mt-1">PDF, images up to 10MB</p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setValue('isDraft', true)
              onFormSubmit()
            }}
            disabled={loading}
          >
            Save Draft
          </Button>
          <Button
            type="submit"
            disabled={loading}
            onClick={() => setValue('isDraft', false)}
            className="px-8 bg-gradient-to-r from-primary via-violet-500 to-pink-500 hover:opacity-90 shadow-lg shadow-primary/30"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting
              </span>
            ) : (
              'Submit Request'
            )}
          </Button>
        </div>
      </form>

      {/* Field Manager Modal */}
      <Modal
        isOpen={showFieldManager}
        onClose={() => {
          setShowFieldManager(false)
          loadFormData()
        }}
        title="Form Field Configuration"
        size="lg"
      >
        <FormFieldManager
          formType="requisition"
          onClose={() => {
            setShowFieldManager(false)
            loadFormData()
          }}
        />
      </Modal>
    </>
  )
}
