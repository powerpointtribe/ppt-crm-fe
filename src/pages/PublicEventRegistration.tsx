import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Mail,
  Phone,
  User,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { eventsService, Event } from '@/services/events'
import { PublicRegistrationData } from '@/types/event'
import { formatDate } from '@/utils/formatters'
import { showToast } from '@/utils/toast'

interface RegistrationSuccess {
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
  const [registrationSuccess, setRegistrationSuccess] = useState<RegistrationSuccess | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PublicRegistrationData>()

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

  const onSubmit = async (data: PublicRegistrationData) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <div className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Event Not Found</h2>
            <p className="text-gray-500 mb-4">
              {error || 'The event you are looking for does not exist or has been removed.'}
            </p>
            <Link to="/" className="text-primary-600 hover:underline">
              Go to Home
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  // Check if registration is closed
  const isRegistrationClosed =
    !event.registrationSettings?.isOpen ||
    event.status !== 'published' ||
    (event.registrationSettings?.deadline &&
      new Date() > new Date(event.registrationSettings.deadline))

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <div className="p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Registration Successful!
            </h2>
            <p className="text-gray-600 mb-6">
              Thank you for registering, {registrationSuccess.firstName}!
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 mb-2">Your Check-in Code</p>
              <p className="text-2xl font-mono font-bold text-primary-600">
                {registrationSuccess.checkInCode}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Please save this code. You'll need it to check in at the event.
              </p>
            </div>

            <div className="text-sm text-gray-500">
              <p className="mb-2">
                Status:{' '}
                <span className="font-medium capitalize">
                  {registrationSuccess.status}
                </span>
              </p>
              {registrationSuccess.status === 'waitlisted' && (
                <p className="text-yellow-600">
                  You've been added to the waitlist. We'll notify you if a spot becomes available.
                </p>
              )}
              {registrationSuccess.status === 'pending' && (
                <p className="text-blue-600">
                  Your registration is pending approval. You'll be notified once it's confirmed.
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Event Header */}
        <Card className="mb-6">
          {event.bannerImage && (
            <div className="h-48 bg-gray-200 rounded-t-lg overflow-hidden">
              <img
                src={event.bannerImage}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-6">
            <div className="text-sm text-primary-600 font-medium mb-2">
              {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{event.title}</h1>

            <div className="space-y-3 text-gray-600">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-3 text-gray-400" />
                <span>
                  {formatDate(event.startDate)}
                  {event.endDate !== event.startDate && (
                    <> - {formatDate(event.endDate)}</>
                  )}
                </span>
              </div>
              {event.startTime && (
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-3 text-gray-400" />
                  <span>
                    {event.startTime}
                    {event.endTime && <> - {event.endTime}</>}
                  </span>
                </div>
              )}
              <div className="flex items-start">
                <MapPin className="h-5 w-5 mr-3 text-gray-400 mt-0.5" />
                <div>
                  <div>{event.location.name}</div>
                  {!event.location.isVirtual && event.location.city && (
                    <div className="text-sm">
                      {event.location.address && <>{event.location.address}, </>}
                      {event.location.city}, {event.location.state}
                    </div>
                  )}
                  {event.location.isVirtual && (
                    <div className="text-sm text-primary-600">Virtual Event</div>
                  )}
                </div>
              </div>
              {event.registrationCount !== undefined && (
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-3 text-gray-400" />
                  <span>
                    {event.registrationCount} registered
                    {event.registrationSettings?.maxAttendees && (
                      <> / {event.registrationSettings.maxAttendees} spots</>
                    )}
                  </span>
                </div>
              )}
            </div>

            {event.description && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Registration Form */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Register for this Event</h2>

            {isRegistrationClosed ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Registration Closed
                </h3>
                <p className="text-gray-500">
                  {event.status !== 'published'
                    ? 'This event is not currently accepting registrations.'
                    : event.registrationSettings?.deadline &&
                      new Date() > new Date(event.registrationSettings.deadline)
                    ? 'The registration deadline has passed.'
                    : 'Registration is currently closed for this event.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        {...register('firstName', { required: 'First name is required' })}
                        placeholder="John"
                        className="pl-10"
                        error={errors.firstName?.message}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        {...register('lastName', { required: 'Last name is required' })}
                        placeholder="Doe"
                        className="pl-10"
                        error={errors.lastName?.message}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="email"
                      {...register('email')}
                      placeholder="john.doe@example.com"
                      className="pl-10"
                      error={errors.email?.message}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      {...register('phone')}
                      placeholder="+234..."
                      className="pl-10"
                      error={errors.phone?.message}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    {...register('gender')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                {/* Custom Fields */}
                {event.registrationSettings?.customFields?.map((field) => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label} {field.required && '*'}
                    </label>
                    {field.type === 'text' && (
                      <Input
                        {...register(`customFieldResponses.${field.id}`, {
                          required: field.required ? `${field.label} is required` : false,
                        })}
                        placeholder={field.label}
                      />
                    )}
                    {field.type === 'textarea' && (
                      <textarea
                        {...register(`customFieldResponses.${field.id}`, {
                          required: field.required ? `${field.label} is required` : false,
                        })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder={field.label}
                      />
                    )}
                    {field.type === 'select' && (
                      <select
                        {...register(`customFieldResponses.${field.id}`, {
                          required: field.required ? `${field.label} is required` : false,
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Select an option</option>
                        {field.options?.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Registering...
                    </>
                  ) : (
                    'Register Now'
                  )}
                </Button>
              </form>
            )}

            {/* Contact Info */}
            {(event.contactEmail || event.contactPhone) && (
              <div className="mt-6 pt-6 border-t text-center text-sm text-gray-500">
                <p>Questions? Contact us:</p>
                <div className="mt-2 space-y-1">
                  {event.contactEmail && (
                    <p>
                      <a
                        href={`mailto:${event.contactEmail}`}
                        className="text-primary-600 hover:underline"
                      >
                        {event.contactEmail}
                      </a>
                    </p>
                  )}
                  {event.contactPhone && (
                    <p>
                      <a
                        href={`tel:${event.contactPhone}`}
                        className="text-primary-600 hover:underline"
                      >
                        {event.contactPhone}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
