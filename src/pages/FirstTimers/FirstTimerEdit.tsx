import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Edit, UserPlus } from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import FirstTimerForm from '@/components/forms/FirstTimerForm'
import { FirstTimerFormData } from '@/schemas/firstTimer'
import { FirstTimer, firstTimersService } from '@/services/first-timers'

export default function FirstTimerEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [firstTimer, setFirstTimer] = useState<FirstTimer | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    if (id) {
      loadFirstTimer()
    }
  }, [id])

  const loadFirstTimer = async () => {
    try {
      setError(null)
      const data = await firstTimersService.getFirstTimerById(id!)
      setFirstTimer(data)
    } catch (error: any) {
      console.error('Error loading first timer:', error)
      setError({
        status: error.code || 500,
        message: 'Failed to load visitor details',
        details: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: FirstTimerFormData) => {
    try {
      setSubmitting(true)
      const updatedFirstTimer = await firstTimersService.updateFirstTimer(id!, data)
      navigate(`/first-timers/${updatedFirstTimer._id}`)
    } catch (error) {
      console.error('Error updating first timer:', error)
      throw error // Let the form handle the error
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate(`/first-timers/${id}`)
  }

  if (loading) {
    return (
      <Layout title="Loading...">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (error || !firstTimer) {
    return (
      <Layout title="Edit Visitor">
        <ErrorBoundary
          error={error || { status: 404, message: 'Visitor not found' }}
          onRetry={loadFirstTimer}
        />
      </Layout>
    )
  }

  return (
    <Layout
      title={`Edit ${firstTimer.firstName} ${firstTimer.lastName}`}
      headerActions={
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate('/first-timers')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate(`/first-timers/${id}`)}
          >
            View Details
          </Button>
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="text-center py-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full">
              <Edit className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Edit Visitor Details
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Update {firstTimer.firstName} {firstTimer.lastName}'s information to ensure
            accurate records and effective follow-up.
          </p>
        </div>

        {/* Form */}
        <FirstTimerForm
          firstTimer={firstTimer}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={submitting}
          mode="edit"
        />
      </motion.div>
    </Layout>
  )
}