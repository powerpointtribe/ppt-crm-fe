import {
  FileText,
  CheckCircle,
  XCircle,
  Banknote,
  Clock,
} from 'lucide-react'
import type { Requisition } from '@/types/finance'
import type { Member } from '@/types'

interface TimelineStep {
  key: string
  label: string
  status: 'completed' | 'rejected' | 'pending'
  icon: typeof FileText
  iconColor: string
  iconBg: string
  badgeColor: string
  badgeBg: string
  actor?: string // email of the person
  actorName?: string
  date?: string
  notes?: string
  level?: number
}

interface RequisitionTimelineProps {
  requisition: Requisition
}

function getMemberEmail(ref?: string | Member): string {
  if (!ref) return ''
  if (typeof ref === 'object') return ref.email || ''
  return ''
}

function getMemberName(ref?: string | Member): string {
  if (!ref) return ''
  if (typeof ref === 'object') return `${ref.firstName || ''} ${ref.lastName || ''}`.trim()
  return ''
}

function formatDateTime(dateString?: string): string {
  if (!dateString) return ''
  const d = new Date(dateString)
  const month = d.toLocaleDateString('en-US', { month: 'short' })
  const day = d.getDate()
  const year = d.getFullYear()
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${month} ${day}, ${year}, ${time}`
}

function formatShortDate(dateString?: string): string {
  if (!dateString) return ''
  const d = new Date(dateString)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function RequisitionTimeline({ requisition }: RequisitionTimelineProps) {
  const steps: TimelineStep[] = []

  // Step 1: Created / Requested
  if (requisition.submittedAt) {
    steps.push({
      key: 'requested',
      label: 'REQUESTED',
      status: 'completed',
      icon: FileText,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-100',
      badgeColor: 'text-white',
      badgeBg: 'bg-purple-500',
      actor: getMemberEmail(requisition.requestor) || requisition.submitterEmail || '',
      actorName: getMemberName(requisition.requestor) || requisition.submitterName || '',
      date: requisition.submittedAt,
      level: 1,
    })
  } else {
    // Draft — not yet submitted
    steps.push({
      key: 'created',
      label: 'CREATED',
      status: 'completed',
      icon: FileText,
      iconColor: 'text-gray-500',
      iconBg: 'bg-gray-100',
      badgeColor: 'text-white',
      badgeBg: 'bg-gray-400',
      actor: getMemberEmail(requisition.createdBy) || requisition.submitterEmail || '',
      actorName: getMemberName(requisition.createdBy) || requisition.submitterName || '',
      date: requisition.createdAt,
      level: 1,
    })
  }

  // Step 2: Approved or Rejected
  if (requisition.approvedAt) {
    steps.push({
      key: 'approved',
      label: 'APPROVED',
      status: 'completed',
      icon: CheckCircle,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100',
      badgeColor: 'text-white',
      badgeBg: 'bg-green-500',
      actor: getMemberEmail(requisition.approvedBy),
      actorName: getMemberName(requisition.approvedBy),
      date: requisition.approvedAt,
      notes: requisition.approvalNotes,
      level: 2,
    })
  } else if (requisition.rejectedAt) {
    steps.push({
      key: 'rejected',
      label: 'REJECTED',
      status: 'rejected',
      icon: XCircle,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100',
      badgeColor: 'text-white',
      badgeBg: 'bg-red-500',
      actor: getMemberEmail(requisition.rejectedBy),
      actorName: getMemberName(requisition.rejectedBy),
      date: requisition.rejectedAt,
      notes: requisition.rejectionReason,
      level: 2,
    })
  } else if (requisition.submittedAt) {
    // Pending approval
    steps.push({
      key: 'pending_approval',
      label: 'PENDING APPROVAL',
      status: 'pending',
      icon: Clock,
      iconColor: 'text-gray-400',
      iconBg: 'bg-gray-100',
      badgeColor: 'text-gray-500',
      badgeBg: 'bg-gray-200',
      level: 2,
    })
  }

  // Step 3: Disbursed
  if (requisition.disbursedAt) {
    steps.push({
      key: 'disbursed',
      label: 'DISBURSED',
      status: 'completed',
      icon: Banknote,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100',
      badgeColor: 'text-white',
      badgeBg: 'bg-green-500',
      actor: getMemberEmail(requisition.disbursedBy),
      actorName: getMemberName(requisition.disbursedBy),
      date: requisition.disbursedAt,
      notes: requisition.disbursementReference
        ? `Ref: ${requisition.disbursementReference}`
        : requisition.disbursementNotes,
      level: 3,
    })
  } else if (requisition.approvedAt) {
    // Pending disbursement
    steps.push({
      key: 'pending_disbursement',
      label: 'PENDING DISBURSEMENT',
      status: 'pending',
      icon: Banknote,
      iconColor: 'text-gray-400',
      iconBg: 'bg-gray-100',
      badgeColor: 'text-gray-500',
      badgeBg: 'bg-gray-200',
      level: 3,
    })
  }

  return (
    <div className="max-w-2xl mx-auto py-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">
        Participants
      </h3>

      <div className="relative">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1
          const nextStep = steps[index + 1]
          const showLevelDivider = nextStep && nextStep.level && step.level && nextStep.level > step.level
          const lineCompleted = step.status === 'completed' && nextStep?.status === 'completed'
          const linePending = step.status === 'completed' && nextStep?.status === 'pending'

          return (
            <div key={step.key}>
              {/* Timeline step */}
              <div className="flex items-start gap-4">
                {/* Left: date shorthand */}
                <div className="w-10 text-right flex-shrink-0">
                  <span className="text-xs font-medium text-gray-400">
                    {step.date ? formatShortDate(step.date) : ''}
                  </span>
                </div>

                {/* Center: icon + vertical line */}
                <div className="relative flex flex-col items-center flex-shrink-0">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center ${step.iconBg} ${
                      step.status === 'pending' ? 'opacity-50' : ''
                    }`}
                  >
                    <step.icon className={`w-4.5 h-4.5 ${step.iconColor}`} />
                  </div>

                  {/* Connecting line */}
                  {!isLast && (
                    <div
                      className={`w-0.5 flex-1 min-h-[40px] ${
                        lineCompleted
                          ? 'bg-green-400'
                          : linePending
                            ? 'border-l-2 border-dashed border-purple-300 bg-transparent'
                            : step.status === 'rejected'
                              ? 'bg-red-300'
                              : 'border-l-2 border-dashed border-gray-300 bg-transparent'
                      }`}
                    />
                  )}
                </div>

                {/* Right: content */}
                <div className={`flex-1 pb-6 ${step.status === 'pending' ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex px-2.5 py-0.5 text-xs font-bold rounded ${step.badgeBg} ${step.badgeColor}`}
                    >
                      {step.label}
                    </span>
                    {step.actor && (
                      <span className="text-sm text-gray-600">
                        by&nbsp;&nbsp;<span className="font-medium text-gray-800">{step.actor}</span>
                      </span>
                    )}
                  </div>
                  {step.date && (
                    <p className="text-xs text-gray-400 mt-1">
                      on {formatDateTime(step.date)}
                    </p>
                  )}
                  {step.notes && (
                    <p className="text-xs text-gray-500 mt-1.5 italic">
                      &ldquo;{step.notes}&rdquo;
                    </p>
                  )}
                  {step.status === 'pending' && (
                    <p className="text-xs text-gray-400 mt-1">Awaiting action</p>
                  )}
                </div>
              </div>

              {/* Level divider */}
              {showLevelDivider && (
                <div className="flex items-center gap-3 pl-14 -mt-3 mb-2">
                  <div className="flex-1 border-t border-gray-200" />
                  <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                    Level {nextStep.level}
                  </span>
                  <div className="flex-1 border-t border-gray-200" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Empty state */}
      {steps.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Clock className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">No workflow activity yet</p>
        </div>
      )}
    </div>
  )
}
