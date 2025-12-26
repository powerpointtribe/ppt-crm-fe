import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Heart, Users, Star, ArrowLeft, Building2 } from 'lucide-react'
import PublicVisitorRegistrationForm from '@/components/forms/PublicVisitorRegistrationForm'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { PublicVisitorRegistrationData, transformToFirstTimerData } from '@/schemas/publicVisitorRegistration'
import { firstTimersService } from '@/services/first-timers'
import { branchesService } from '@/services/branches'
import type { PublicBranch } from '@/types/branch'

export default function PublicVisitorRegistration() {
  const { branchSlug } = useParams<{ branchSlug?: string }>()
  const [searchParams] = useSearchParams()
  const branchFromQuery = searchParams.get('branch')

  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [branch, setBranch] = useState<PublicBranch | null>(null)
  const [loadingBranch, setLoadingBranch] = useState(false)
  const [branches, setBranches] = useState<PublicBranch[]>([])
  const [selectedBranchSlug, setSelectedBranchSlug] = useState<string>('')

  // Fetch branch info if slug is provided
  useEffect(() => {
    const fetchBranchInfo = async () => {
      const slug = branchSlug || branchFromQuery

      if (slug) {
        setLoadingBranch(true)
        try {
          const branchData = await branchesService.getBranchBySlug(slug)
          if (branchData) {
            setBranch(branchData)
            setSelectedBranchSlug(branchData.slug)
          }
        } catch (err) {
          console.error('Error fetching branch:', err)
        } finally {
          setLoadingBranch(false)
        }
      } else {
        // No branch specified, fetch all branches for selection
        try {
          const allBranches = await branchesService.getPublicBranches()
          setBranches(allBranches)
        } catch (err) {
          console.error('Error fetching branches:', err)
        }
      }
    }

    fetchBranchInfo()
  }, [branchSlug, branchFromQuery])

  const handleSubmit = async (data: PublicVisitorRegistrationData) => {
    try {
      setLoading(true)
      setError(null)

      // Validate branch selection
      const finalBranchSlug = branch?.slug || selectedBranchSlug
      if (!finalBranchSlug && branches.length > 0) {
        setError('Please select a branch')
        return
      }

      // Transform the public registration data to first timer format
      const firstTimerData = transformToFirstTimerData(data)

      // Add branch context to the submission
      const submissionData = {
        ...firstTimerData,
        branchSlug: finalBranchSlug || undefined, // Include branch context
      }

      // Submit to the public endpoint (no auth required)
      await firstTimersService.createPublicFirstTimer(submissionData)

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

  // Show loading state while fetching branch
  if (loadingBranch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
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

              {/* Branch Info Display */}
              {branch && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-blue-100"
                >
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">{branch.name}</span>
                </motion.div>
              )}
            </motion.div>

          </div>
        </motion.div>

        {/* Branch Selection (when no branch is specified) */}
        {!branch && branches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-4xl mx-auto mb-6"
          >
            <Card className="p-4 bg-white shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  Select Your Branch <span className="text-red-500">*</span>
                </div>
              </label>
              <select
                value={selectedBranchSlug}
                onChange={(e) => setSelectedBranchSlug(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Choose the branch you visited...</option>
                {branches.map((b) => (
                  <option key={b.slug} value={b.slug}>
                    {b.name}
                    {b.address?.city && ` - ${b.address.city}`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Please select the church branch you visited today
              </p>
            </Card>
          </motion.div>
        )}

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
