import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertCircle, Home, Calendar, Users, HeartHandshake, Loader2, CheckCircle } from 'lucide-react'
import Card from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { eventsService, Event } from '@/services/events'
import { PublicRegistrationData } from '@/types/event'
import { formatDate } from '@/utils/formatters'
import { showToast } from '@/utils/toast'
import {
  PublicFormRenderer,
  RegistrationSuccess,
} from '@/components/public'

interface RegistrationSuccessData {
  checkInCode: string
  status: string
  firstName: string
  lastName: string
}

type FormMode = 'register' | 'partner'

export default function PublicEventRegistration() {
  const { slug } = useParams<{ slug: string }>()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState<RegistrationSuccessData | null>(null)
  const [formMode, setFormMode] = useState<FormMode>('register')
  const [partnerSuccess, setPartnerSuccess] = useState(false)

  // Partner form state
  const [partnerData, setPartnerData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    interestDetails: '',
  })
  const [partnerErrors, setPartnerErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (slug) {
      loadEvent(slug)
    }
  }, [slug])

  const loadEvent = async (eventSlug: string) => {
    try {
      setError(null)
      const eventData = await eventsService.getPublicEvent(eventSlug)
      setEvent(eventData)
    } catch (error: any) {
      console.error('Error loading event:', error)
      setError(error.message || 'Event not found')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: PublicRegistrationData) => {
    if (!slug) return

    setSubmitting(true)
    try {
      const response = await eventsService.publicRegister(slug, data)
      setRegistrationSuccess({
        checkInCode: response.registration.checkInCode,
        status: response.registration.status,
        firstName: response.registration.attendeeInfo.firstName,
        lastName: response.registration.attendeeInfo.lastName,
      })
      showToast('success', 'Registration successful!')
    } catch (error: any) {
      console.error('Error registering:', error)
      showToast('error', error.message || 'Failed to register')
    } finally {
      setSubmitting(false)
    }
  }

  const validatePartnerForm = () => {
    const errors: Record<string, string> = {}
    if (!partnerData.name.trim()) errors.name = 'Name is required'
    if (!partnerData.email.trim()) errors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(partnerData.email)) errors.email = 'Invalid email address'
    if (!partnerData.phone.trim()) errors.phone = 'Phone number is required'
    if (!partnerData.interestDetails.trim()) errors.interestDetails = 'Please describe your interest'
    setPartnerErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handlePartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!slug || !validatePartnerForm()) return

    setSubmitting(true)
    try {
      await eventsService.publicSubmitPartner(slug, {
        name: partnerData.name,
        company: partnerData.company || undefined,
        email: partnerData.email,
        phone: partnerData.phone,
        interestDetails: partnerData.interestDetails,
      })
      setPartnerSuccess(true)
      showToast('success', 'Partnership inquiry submitted!')
    } catch (error: any) {
      console.error('Error submitting partnership:', error)
      showToast('error', error.message || 'Failed to submit partnership inquiry')
    } finally {
      setSubmitting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-500">Loading event...</p>
        </motion.div>
      </div>
    )
  }

  // Error state
  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="max-w-md w-full">
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Event Not Found</h2>
              <p className="text-gray-500 mb-6">
                {error || 'The event you are looking for does not exist or has been removed.'}
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Home className="h-4 w-4" />
                Go to Home
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    )
  }

  // Check if registration is closed
  const isRegistrationClosed =
    !event.registrationSettings?.isOpen ||
    event.status !== 'published' ||
    (event.registrationSettings?.deadline &&
      new Date() > new Date(event.registrationSettings.deadline))

  // Check if form is not live (draft status)
  const isFormDraft = event.registrationSettings?.formStatus === 'draft'

  // Registration closed state - still allow partner mode
  if ((isRegistrationClosed || isFormDraft) && formMode === 'register') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="w-full">
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-6">
                <AlertCircle className="h-8 w-8 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Registration Closed</h2>
              <p className="text-gray-500 mb-4">
                {isFormDraft
                  ? 'This registration form is not yet available.'
                  : event.status !== 'published'
                  ? 'This event is not currently accepting registrations.'
                  : event.registrationSettings?.deadline &&
                    new Date() > new Date(event.registrationSettings.deadline)
                  ? 'The registration deadline has passed.'
                  : 'Registration is currently closed for this event.'}
              </p>

              {/* Show event info */}
              <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
                <h3 className="font-medium text-gray-900 mb-2">{event.title}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(event.startDate)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setFormMode('partner')}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  <HeartHandshake className="h-4 w-4" />
                  Submit Partnership Inquiry
                </button>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
                >
                  <Home className="h-4 w-4" />
                  Go to Home
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    )
  }

  // Success state for registration
  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
        <RegistrationSuccess
          firstName={registrationSuccess.firstName}
          lastName={registrationSuccess.lastName}
          checkInCode={registrationSuccess.checkInCode}
          status={registrationSuccess.status}
          eventTitle={event.title}
          eventDate={formatDate(event.startDate)}
          successConfig={event.registrationSettings?.successMessage}
        />
      </div>
    )
  }

  // Partner success state
  if (partnerSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="w-full">
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Inquiry Submitted!</h2>
              <p className="text-gray-500 mb-6">
                Thank you for your interest in partnering with us for <strong>{event.title}</strong>. We'll review your inquiry and get back to you soon.
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Home className="h-4 w-4" />
                Go to Home
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    )
  }

  // Partner form
  if (formMode === 'partner') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 md:py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-lg mx-auto"
        >
          <Card className="overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-5 text-white">
              <h2 className="text-lg font-bold">{event.title}</h2>
              <p className="text-indigo-200 text-sm mt-1">Partnership Inquiry</p>
            </div>

            {/* Mode toggle */}
            <div className="px-6 pt-4">
              <div className="flex rounded-lg bg-gray-100 p-1">
                <button
                  onClick={() => setFormMode('register')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-all text-gray-500 hover:text-gray-700"
                >
                  <Users className="h-4 w-4" />
                  Register
                </button>
                <button
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-all bg-white text-indigo-700 shadow-sm"
                >
                  <HeartHandshake className="h-4 w-4" />
                  Partner
                </button>
              </div>
            </div>

            {/* Partner form */}
            <form onSubmit={handlePartnerSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={partnerData.name}
                  onChange={(e) => setPartnerData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${partnerErrors.name ? 'border-red-300' : 'border-gray-300'}`}
                />
                {partnerErrors.name && <p className="mt-1 text-xs text-red-500">{partnerErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company / Organization</label>
                <input
                  type="text"
                  value={partnerData.company}
                  onChange={(e) => setPartnerData(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="Acme Corp"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    value={partnerData.email}
                    onChange={(e) => setPartnerData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${partnerErrors.email ? 'border-red-300' : 'border-gray-300'}`}
                  />
                  {partnerErrors.email && <p className="mt-1 text-xs text-red-500">{partnerErrors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    value={partnerData.phone}
                    onChange={(e) => setPartnerData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+234 801 234 5678"
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${partnerErrors.phone ? 'border-red-300' : 'border-gray-300'}`}
                  />
                  {partnerErrors.phone && <p className="mt-1 text-xs text-red-500">{partnerErrors.phone}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Partnership Interest <span className="text-red-500">*</span></label>
                <textarea
                  value={partnerData.interestDetails}
                  onChange={(e) => setPartnerData(prev => ({ ...prev, interestDetails: e.target.value }))}
                  placeholder="Describe how you'd like to partner with this event..."
                  rows={4}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none ${partnerErrors.interestDetails ? 'border-red-300' : 'border-gray-300'}`}
                />
                {partnerErrors.interestDetails && <p className="mt-1 text-xs text-red-500">{partnerErrors.interestDetails}</p>}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <HeartHandshake className="h-4 w-4" />
                    Submit Partnership Inquiry
                  </>
                )}
              </button>
            </form>
          </Card>
        </motion.div>
      </div>
    )
  }

  // Main registration form
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 md:py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-2xl mx-auto mb-4">
          <div className="flex rounded-lg bg-white shadow-sm border border-gray-200 p-1">
            <button
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-all bg-primary-50 text-primary-700 shadow-sm"
            >
              <Users className="h-4 w-4" />
              Register
            </button>
            <button
              onClick={() => setFormMode('partner')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-all text-gray-500 hover:text-gray-700"
            >
              <HeartHandshake className="h-4 w-4" />
              Partner
            </button>
          </div>
        </div>

        <PublicFormRenderer
          event={event}
          onSubmit={handleSubmit}
          isSubmitting={submitting}
        />
      </motion.div>
    </div>
  )
}
