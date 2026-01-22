import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EventForm from '@/components/forms/EventForm'
import { eventsService, Event } from '@/services/events'
import { UpdateEventData } from '@/types/event'
import { showToast } from '@/utils/toast'
import { useAppStore } from '@/store'

export default function EventEdit() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { selectedBranch } = useAppStore()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadEvent(id)
    }
  }, [id])

  const loadEvent = async (eventId: string) => {
    try {
      setError(null)
      const eventData = await eventsService.getEventById(eventId)
      setEvent(eventData)
    } catch (error: any) {
      console.error('Error loading event:', error)
      setError(error.message || 'Failed to load event')
      showToast('error', 'Failed to load event')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: UpdateEventData) => {
    if (!id) return

    setSubmitting(true)
    try {
      const updatedEvent = await eventsService.updateEvent(id, data)
      setEvent(updatedEvent)
      showToast('success', 'Event updated successfully')
      navigate(`/events/${id}`)
    } catch (error: any) {
      console.error('Error updating event:', error)
      showToast('error', error.message || 'Failed to update event')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate(`/events/${id}`)
  }

  if (loading) {
    return (
      <Layout title="Edit Event">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (error || !event) {
    return (
      <Layout
        title="Edit Event"
        headerActions={
          <Button variant="secondary" onClick={() => navigate('/events')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        }
      >
        <div className="text-center py-12">
          <div className="text-red-600 text-lg font-medium">
            {error || 'Event not found'}
          </div>
          <Button className="mt-4" onClick={() => navigate('/events')}>
            Back to Events
          </Button>
        </div>
      </Layout>
    )
  }

  const branchId = typeof event.branch === 'string' ? event.branch : event.branch._id

  return (
    <Layout
      title="Edit Event"
      headerActions={
        <Button variant="secondary" onClick={() => navigate(`/events/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Event
        </Button>
      }
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Edit Event: {event.title}
          </h2>
          <p className="text-gray-600 mt-1">
            Update the event information.
          </p>
        </div>

        <EventForm
          mode="edit"
          event={event}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={submitting}
          branchId={branchId}
        />
      </div>
    </Layout>
  )
}
