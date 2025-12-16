import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, GraduationCap, Users, Star, ArrowLeft, Calendar, MapPin, Clock } from 'lucide-react'
import WorkersTrainingRegistrationForm from '@/components/forms/WorkersTrainingRegistrationForm'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { PublicTrainingRegistrationFormData } from '@/schemas/workers-training'
import { workersTrainingService } from '@/services/workers-training'
import { Cohort, CohortStatus } from '@/types/workers-training'

export default function WorkersTrainingRegistration() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableCohorts, setAvailableCohorts] = useState<Cohort[]>([])
  const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null)
  const [loadingCohorts, setLoadingCohorts] = useState(true)

  useEffect(() => {
    fetchAvailableCohorts()
  }, [])

  const fetchAvailableCohorts = async () => {
    try {
      setLoadingCohorts(true)
      const cohorts = await workersTrainingService.getPublicCohorts()
      setAvailableCohorts(cohorts)
    } catch (error) {
      console.error('Error fetching cohorts:', error)
      setError('Unable to load available training programs. Please try again later.')
    } finally {
      setLoadingCohorts(false)
    }
  }

  const handleSubmit = async (data: PublicTrainingRegistrationFormData) => {
    try {
      setLoading(true)
      setError(null)

      const cohort = availableCohorts.find(c => c._id === data.cohortId)
      setSelectedCohort(cohort || null)

      await workersTrainingService.submitPublicRegistration(data)
      setSubmitted(true)
    } catch (error: any) {
      console.error('Error submitting training registration:', error)
      setError(
        error.response?.data?.message ||
        error.message ||
        'An error occurred while submitting your registration. Please try again.'
      )
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleStartOver = () => {
    setSubmitted(false)
    setSelectedCohort(null)
    setError(null)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <Card className="p-12 shadow-2xl border-0 bg-white">
              <div className="mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-24 h-24 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <Check className="w-12 h-12 text-white" />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl font-bold text-gray-900 mb-4"
                >
                  Registration Successful!
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg text-gray-600 mb-8"
                >
                  Thank you for registering for our Workers Training program!
                  {selectedCohort && (
                    <span className="block mt-2 font-semibold text-blue-600">
                      {selectedCohort.name}
                    </span>
                  )}
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-6"
              >
                {selectedCohort && (
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border border-blue-200">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                      Training Program Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span>
                          {new Date(selectedCohort.startDate).toLocaleDateString()} -
                          {new Date(selectedCohort.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      {selectedCohort.meetingDays && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span>{selectedCohort.meetingDays}</span>
                        </div>
                      )}
                      {selectedCohort.venue && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-500" />
                          <span>{selectedCohort.venue}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span>
                          {selectedCohort.currentParticipants} of {selectedCohort.maxParticipants} enrolled
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5 text-green-600" />
                    What Happens Next?
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span>You'll receive a confirmation email within 24 hours with detailed information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span>Our training coordinator will contact you 1-2 weeks before the program starts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span>You'll receive training materials and pre-course requirements</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span>Prepare for an exciting journey of growth and leadership development!</span>
                    </li>
                  </ul>
                </div>

                <div className="flex gap-4 justify-center pt-6">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-6"
            >
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-600 to-green-600 rounded-full">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                Workers Training Registration
              </h1>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Join our comprehensive training program designed to equip you with the skills,
                knowledge, and character needed to serve effectively in God's kingdom.
              </p>
            </motion.div>

            {/* Available Programs Preview */}
            {!loadingCohorts && availableCohorts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {availableCohorts.slice(0, 3).map((cohort) => (
                    <div
                      key={cohort._id}
                      className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
                    >
                      <h3 className="font-semibold text-gray-900 text-sm mb-2">
                        {cohort.name}
                      </h3>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Starts {new Date(cohort.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{cohort.currentParticipants}/{cohort.maxParticipants} enrolled</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto mb-6"
            >
              <Card className="p-4 bg-red-50 border border-red-200">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600 text-sm font-semibold">!</span>
                  </div>
                  <div>
                    <p className="text-red-800 font-medium text-sm">Registration Error</p>
                    <p className="text-red-700 text-sm">{error}</p>
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
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <WorkersTrainingRegistrationForm
            onSubmit={handleSubmit}
            loading={loading}
            availableCohorts={availableCohorts}
            loadingCohorts={loadingCohorts}
            onSuccess={() => setSubmitted(true)}
          />
        </motion.div>
      </div>
    </div>
  )
}