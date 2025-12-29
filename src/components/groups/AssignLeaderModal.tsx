import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Crown, Shield, Star, AlertCircle, Loader2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import { membersService } from '@/services/members'
import { groupsService, Group } from '@/services/groups'
import { Member } from '@/types'
import { cn } from '@/utils/cn'

type LeaderRole =
  | 'districtPastor'
  | 'unitHead'
  | 'assistantUnitHead'
  | 'ministryDirector'

interface AssignLeaderModalProps {
  isOpen: boolean
  onClose: () => void
  group: Group
  leaderRole: LeaderRole
  onSuccess: () => void
}

const leaderConfig: Record<LeaderRole, {
  title: string
  icon: typeof Crown
  iconColor: string
  bgColor: string
}> = {
  districtPastor: {
    title: 'District Pastor',
    icon: Crown,
    iconColor: 'text-yellow-600',
    bgColor: 'bg-yellow-100'
  },
  unitHead: {
    title: 'Unit Head',
    icon: Shield,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  assistantUnitHead: {
    title: 'Assistant Unit Head',
    icon: Shield,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  ministryDirector: {
    title: 'Ministry Director',
    icon: Star,
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-100'
  }
}

export default function AssignLeaderModal({
  isOpen,
  onClose,
  group,
  leaderRole,
  onSuccess
}: AssignLeaderModalProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)

  const config = leaderConfig[leaderRole]
  const IconComponent = config.icon

  useEffect(() => {
    if (isOpen) {
      loadMembers()
      setSelectedMemberId(null)
    }
  }, [isOpen])

  const loadMembers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await membersService.getMembers({ limit: 100 })
      setMembers(response.items)
    } catch (err: any) {
      setError(err.message || 'Failed to load members')
    } finally {
      setLoading(false)
    }
  }

  const filteredMembers = useMemo(() => {
    if (!searchQuery) return members

    const query = searchQuery.toLowerCase()
    return members.filter(member => {
      const fullName = `${member.firstName} ${member.lastName}`.toLowerCase()
      const email = member.email?.toLowerCase() || ''
      const phone = member.phone || ''
      return fullName.includes(query) || email.includes(query) || phone.includes(query)
    })
  }, [members, searchQuery])

  const handleSubmit = async () => {
    if (!selectedMemberId) return

    try {
      setSubmitting(true)
      setError(null)

      switch (leaderRole) {
        case 'districtPastor':
          await groupsService.assignDistrictPastor(group._id, selectedMemberId)
          break
        case 'unitHead':
          await groupsService.assignUnitHead(group._id, selectedMemberId)
          break
        case 'assistantUnitHead':
          await groupsService.assignAssistantUnitHead(group._id, selectedMemberId)
          break
        case 'ministryDirector':
          await groupsService.assignMinistryDirector(group._id, selectedMemberId)
          break
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to assign leader')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setSearchQuery('')
    setSelectedMemberId(null)
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", config.bgColor)}>
                <IconComponent className={cn("h-5 w-5", config.iconColor)} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Assign {config.title}</h3>
                <p className="text-sm text-gray-500">Select a member for {group.name}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Search */}
          <div className="px-6 py-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Member List */}
          <div className="flex-1 overflow-y-auto px-6 py-3">
            {error && (
              <div className="flex items-center gap-2 p-3 mb-3 bg-red-50 text-red-700 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {searchQuery ? 'No members found matching your search' : 'No members available'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredMembers.map((member) => (
                  <button
                    key={member._id}
                    onClick={() => setSelectedMemberId(member._id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                      selectedMemberId === member._id
                        ? "bg-blue-50 border border-blue-200"
                        : "hover:bg-gray-50 border border-transparent"
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                        selectedMemberId === member._id
                          ? "bg-blue-600 border-blue-600"
                          : "border-gray-300"
                      )}
                    >
                      {selectedMemberId === member._id && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {member.email || member.phone}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <Button variant="secondary" onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedMemberId || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                `Assign ${config.title}`
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
