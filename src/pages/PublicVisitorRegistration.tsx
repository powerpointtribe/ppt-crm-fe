import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Heart, Users, Star, ArrowLeft } from 'lucide-react'
import PublicVisitorRegistrationForm from '@/components/forms/PublicVisitorRegistrationForm'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { PublicVisitorRegistrationData, transformToFirstTimerData } from '@/schemas/publicVisitorRegistration'
import { firstTimersService } from '@/services/first-timers'

export default function PublicVisitorRegistration() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: PublicVisitorRegistrationData) => {
    try {
      setLoading(true)
      setError(null)

      // Transform the public registration data to first timer format
      const firstTimerData = transformToFirstTimerData(data)

      // Submit to the public endpoint (no auth required)
      await firstTimersService.createPublicFirstTimer(firstTimerData)

      setSubmitted(true)
    } catch (error: any) {
      console.error('Error submitting visitor registration:', error)
      setError(error.message || 'An error occurred while submitting your registration. Please try again.')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleStartOver = () => {
    setSubmitted(false)
    setError(null)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto text-center"
          >
            <Card className="p-12 shadow-2xl border-0 bg-white">
              <div className="mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <Check className="w-10 h-10 text-white" />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-gray-900 mb-4"
                >
                  Thank You for Visiting!
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg text-gray-600 mb-8"
                >
                  We're so glad you took the time to register with us. Your information has been
                  submitted successfully, and someone from our church family will be in touch soon.
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-6"
              >

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
                  <h4 className="font-semibold text-gray-900 mb-2">What's Next?</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Someone from our team will reach out within 2-3 days</li>
                    <li>• We'll answer any questions you might have</li>
                    <li>• Learn about our programs and small groups</li>
                    <li>• Get connected with opportunities to serve</li>
                  </ul>
                </div>

                <div className="flex gap-4 justify-center pt-4">
                  <Button
                    variant="secondary"
                    onClick={handleStartOver}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Register Another Person
                  </Button>
                </div>
              </motion.div>
            </Card>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-6">
        {/* Compact Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6"
        >
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-6"
            >
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
                  <Heart className="w-6 h-6 text-white" />
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                This is Home!
              </h1>
              <p className="text-gray-600 mb-4">
                We're excited you visited us! Please share some information so we can connect with you.
              </p>
            </motion.div>

          </div>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto mb-4"
            >
              <Card className="p-3 bg-red-50 border border-red-200">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600 text-xs">!</span>
                  </div>
                  <div>
                    <p className="text-red-800 font-medium text-sm">Registration Error</p>
                    <p className="text-red-700 text-xs">{error}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Registration Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <PublicVisitorRegistrationForm
            onSubmit={handleSubmit}
            loading={loading}
            onSuccess={() => setSubmitted(true)}
          />
        </motion.div>
      </div>
    </div>
  )
}
