import { Calendar, MapPin, Clock, ExternalLink } from 'lucide-react'
import { FormHeader as FormHeaderType } from '@/types/registration-form'
import { Event } from '@/types/event'
import { formatDate } from '@/utils/formatters'

interface FormHeaderProps {
  event: Event
  formHeader?: FormHeaderType
}

export default function FormHeader({ event, formHeader }: FormHeaderProps) {
  const title = formHeader?.title || event.title
  const description = formHeader?.description || event.description

  return (
    <div className="overflow-hidden rounded-t-xl">
      {/* Banner Image */}
      {event.bannerImage && (
        <div className="h-40 md:h-56 bg-gradient-to-br from-primary-600 to-primary-800 relative">
          <img
            src={event.bannerImage}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      {/* Header Content */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white p-6 md:p-8">
        {/* Logo */}
        {formHeader?.logoUrl && (
          <img
            src={formHeader.logoUrl}
            alt="Logo"
            className="h-12 w-auto mb-4"
          />
        )}

        {/* Event Type Badge */}
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-sm font-medium mb-3">
          {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{title}</h1>

        {/* Description */}
        {description && (
          <p className="text-white/90 text-sm md:text-base mb-4 line-clamp-3">
            {description}
          </p>
        )}

        {/* Event Details */}
        <div className="flex flex-wrap gap-4 text-sm text-white/90">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              {formatDate(event.startDate)}
              {event.endDate !== event.startDate && (
                <> - {formatDate(event.endDate)}</>
              )}
            </span>
          </div>

          {event.startTime && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                {event.startTime}
                {event.endTime && <> - {event.endTime}</>}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>
              {event.location.isVirtual ? (
                <>
                  Virtual Event
                  {event.location.virtualLink && (
                    <a
                      href={event.location.virtualLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 inline-flex items-center hover:underline"
                    >
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  )}
                </>
              ) : (
                <>
                  {event.location.name}
                  {event.location.city && `, ${event.location.city}`}
                </>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
