import { Link2, Users, Settings, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import { Group } from '@/services/groups'
import { cn } from '@/utils/cn'

interface LinkedUnitsSectionProps {
  group: Group
  onManageLinks: () => void
}

export default function LinkedUnitsSection({
  group,
  onManageLinks
}: LinkedUnitsSectionProps) {
  const navigate = useNavigate()

  // Only show for ministries
  if (group.type !== 'ministry') {
    return null
  }

  const linkedUnits = (group.linkedUnits || []) as Group[]
  const totalLinkedMembers = linkedUnits.reduce((sum, unit) => {
    if (typeof unit === 'object') {
      return sum + (unit.currentMemberCount || 0)
    }
    return sum
  }, 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-purple-500" />
          <h3 className="font-semibold text-gray-900">Linked Units</h3>
          <span className="text-sm text-gray-500">
            ({linkedUnits.length} units · {totalLinkedMembers} members synced)
          </span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onManageLinks}
        >
          <Settings className="h-4 w-4 mr-1" />
          Manage Links
        </Button>
      </div>

      {/* Info box */}
      <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg">
        <p className="text-sm text-purple-800">
          Members in linked units are automatically synced to this ministry.
          When a member joins a linked unit, they are also added here.
        </p>
      </div>

      {/* Linked units list */}
      {linkedUnits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {linkedUnits.map((unit, index) => {
            // Handle both populated and non-populated cases
            if (typeof unit === 'string') {
              return (
                <div
                  key={unit}
                  className="p-4 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  <p className="text-sm text-gray-500">Unit ID: {unit}</p>
                </div>
              )
            }

            return (
              <div
                key={unit._id || index}
                className={cn(
                  "p-4 bg-white border border-gray-200 rounded-lg",
                  "hover:border-purple-300 hover:shadow-sm transition-all cursor-pointer"
                )}
                onClick={() => navigate(`/groups/${unit._id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900 truncate">{unit.name}</h4>
                      <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                      <Users className="h-4 w-4" />
                      <span>{unit.currentMemberCount || 0} members</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                    Linked
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <Link2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <h4 className="font-medium text-gray-900 mb-1">No Linked Units</h4>
          <p className="text-sm text-gray-500 mb-4">
            Link units to automatically sync their members to this ministry
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={onManageLinks}
          >
            <Link2 className="h-4 w-4 mr-1" />
            Link Units
          </Button>
        </div>
      )}
    </div>
  )
}
