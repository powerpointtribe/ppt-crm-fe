import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Settings, FileText } from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import FormFieldManager from '@/components/finance/FormFieldManager'
import { useAuth } from '@/contexts/AuthContext-unified'

export default function FormFieldsSettings() {
  const navigate = useNavigate()
  const { hasPermission, member } = useAuth()
  const canManageFormFields = hasPermission('finance:manage-form-fields')

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (!canManageFormFields) {
    return (
      <Layout>
        <div className="p-6">
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <Settings className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h2>
            <p className="text-gray-500 mb-6">
              You don't have permission to manage form fields.
            </p>
            <Button onClick={() => navigate('/finance')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Finance
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 sm:p-6 space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <button
              onClick={() => navigate('/finance')}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Finance
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {getGreeting()}, {member?.firstName || 'there'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configure requisition form fields and settings
            </p>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
          <div className="flex gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg h-fit">
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                About Form Fields
              </h3>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Customize the requisition form by adding, editing, or reordering fields.
                System fields cannot be deleted but can be hidden. Changes affect all new requisitions.
              </p>
            </div>
          </div>
        </div>

        {/* Form Field Manager */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <FormFieldManager formType="requisition" />
        </div>
      </motion.div>
    </Layout>
  )
}
