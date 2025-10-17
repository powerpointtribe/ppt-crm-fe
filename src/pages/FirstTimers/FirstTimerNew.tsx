import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, UserPlus } from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import FirstTimerForm from '@/components/forms/FirstTimerForm'
import { FirstTimerFormData } from '@/schemas/firstTimer'
import { firstTimersService } from '@/services/first-timers'

export default function FirstTimerNew() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: FirstTimerFormData) => {
    try {
      setLoading(true)
      const newFirstTimer = await firstTimersService.createFirstTimer(data)
      navigate(`/first-timers/${newFirstTimer._id}`)
    } catch (error) {
      console.error('Error creating first timer:', error)
      throw error // Let the form handle the error
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/first-timers')
  }

  return (
    <Layout
      title="Add New Visitor"
      headerActions={
        <Button
          variant="secondary"
          onClick={() => navigate('/first-timers')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to First Timers
        </Button>
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
            <div className="p-3 bg-gradient-to-br from-green-100 to-blue-100 rounded-full">
              <UserPlus className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Visitor</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Welcome a new visitor to our church family. Fill out their information to start tracking
            their journey and ensure proper follow-up care.
          </p>
        </div>

        {/* Form */}
        <FirstTimerForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          mode="create"
        />
      </motion.div>
    </Layout>
  )
}