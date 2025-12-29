import { Crown, Shield, Star, UserPlus, X, Phone, Mail } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Group, MemberReference } from '@/services/groups'
import { cn } from '@/utils/cn'

interface LeadershipSectionProps {
  group: Group
  onAssignLeader: (role: string) => void
  onRemoveLeader: (role: string) => void
  isLoading?: boolean
}

interface LeaderCardProps {
  title: string
  member: MemberReference | null
  icon: typeof Crown
  iconColor: string
  bgColor: string
  borderColor: string
  onAssign: () => void
  onRemove?: () => void
  showRemove?: boolean
}

function LeaderCard({
  title,
  member,
  icon: Icon,
  iconColor,
  bgColor,
  borderColor,
  onAssign,
  onRemove,
  showRemove = true
}: LeaderCardProps) {
  if (!member) {
    return (
      <div className={cn("p-4 rounded-lg border-2 border-dashed", borderColor)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", bgColor)}>
              <Icon className={cn("h-5 w-5", iconColor)} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{title}</p>
              <p className="text-sm text-gray-400">Not assigned</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={onAssign}
            className="text-gray-600"
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Assign
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("p-4 rounded-lg border", borderColor, bgColor)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
            <Icon className={cn("h-6 w-6", iconColor)} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
            <p className="font-semibold text-gray-900">
              {member.firstName} {member.lastName}
            </p>
            <div className="flex items-center gap-3 mt-1">
              {member.phone && (
                <a
                  href={`tel:${member.phone}`}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  <Phone className="h-3 w-3" />
                  {member.phone}
                </a>
              )}
              {member.email && (
                <a
                  href={`mailto:${member.email}`}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  <Mail className="h-3 w-3" />
                  {member.email}
                </a>
              )}
            </div>
          </div>
        </div>
        {showRemove && onRemove && (
          <button
            onClick={onRemove}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Remove"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

export default function LeadershipSection({
  group,
  onAssignLeader,
  onRemoveLeader
}: LeadershipSectionProps) {
  const getMemberRef = (value: string | MemberReference | undefined | null): MemberReference | null => {
    if (!value) return null
    if (typeof value === 'string') return null // ID only, not populated

    // Check if it's a properly populated object with firstName
    if (typeof value === 'object' && value !== null) {
      // Handle the case where it might be an object with _id but populated data
      if ('firstName' in value && value.firstName) {
        return value as MemberReference
      }
      // If it has _id but no firstName, it's not properly populated
      if ('_id' in value && !('firstName' in value)) {
        return null
      }
    }

    return value as MemberReference
  }

  // District leadership
  if (group.type === 'district') {
    const districtPastor = getMemberRef(group.districtPastor)

    return (
      <div className="space-y-4">
        <LeaderCard
          title="District Pastor"
          member={districtPastor}
          icon={Crown}
          iconColor="text-yellow-600"
          bgColor="bg-yellow-50"
          borderColor="border-yellow-200"
          onAssign={() => onAssignLeader('districtPastor')}
          onRemove={() => onRemoveLeader('districtPastor')}
        />
      </div>
    )
  }

  // Unit leadership
  if (group.type === 'unit') {
    const unitHead = getMemberRef(group.unitHead)
    const assistantUnitHead = getMemberRef(group.assistantUnitHead)

    return (
      <div className="space-y-4">
        <LeaderCard
          title="Unit Head"
          member={unitHead}
          icon={Shield}
          iconColor="text-green-600"
          bgColor="bg-green-50"
          borderColor="border-green-200"
          onAssign={() => onAssignLeader('unitHead')}
          onRemove={() => onRemoveLeader('unitHead')}
        />

        <LeaderCard
          title="Assistant Unit Head"
          member={assistantUnitHead}
          icon={Shield}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
          borderColor="border-blue-200"
          onAssign={() => onAssignLeader('assistantUnitHead')}
          onRemove={() => onRemoveLeader('assistantUnitHead')}
        />
      </div>
    )
  }

  // Ministry leadership
  if (group.type === 'ministry') {
    const ministryDirector = getMemberRef(group.ministryDirector)

    return (
      <div className="space-y-4">
        <LeaderCard
          title="Ministry Director"
          member={ministryDirector}
          icon={Star}
          iconColor="text-purple-600"
          bgColor="bg-purple-50"
          borderColor="border-purple-200"
          onAssign={() => onAssignLeader('ministryDirector')}
          onRemove={() => onRemoveLeader('ministryDirector')}
        />
      </div>
    )
  }

  // Default - no specific leadership structure
  return (
    <div className="text-center py-8">
      <p className="text-gray-500">No leadership structure defined for this group type</p>
    </div>
  )
}
