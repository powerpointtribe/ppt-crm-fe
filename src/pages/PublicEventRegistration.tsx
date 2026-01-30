import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertCircle, Home, Calendar } from 'lucide-react'
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

export default function PublicEventRegistration() {
  const { slug } = useParams<{ slug: string }>()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState<RegistrationSuccessData | null>(null)

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

  // Registration closed state
  if (isRegistrationClosed || isFormDraft) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="max-w-md w-full">
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

  // Success state
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

  // Main registration form
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 md:py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <PublicFormRenderer
          event={event}
          onSubmit={handleSubmit}
          isSubmitting={submitting}
        />
      </motion.div>
    </div>
  )
}
