import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Users, Check, AlertCircle, Loader2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import { membersService } from '@/services/members'
import { groupsService, Group, MemberReference } from '@/services/groups'
import { Member } from '@/types'
import { cn } from '@/utils/cn'

interface AddMembersModalProps {
  isOpen: boolean
  onClose: () => void
  group: Group
  onSuccess: () => void
}

export default function AddMembersModal({
  isOpen,
  onClose,
  group,
  onSuccess
}: AddMembersModalProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set())

  // Get existing member IDs from group
  const existingMemberIds = useMemo(() => {
    return new Set(
      group.members.map(m => typeof m === 'object' ? (m as MemberReference)._id : m)
    )
  }, [group.members])

  useEffect(() => {
    if (isOpen) {
      loadMembers()
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
    return members.filter(member => {
      // Exclude already added members
      if (existingMemberIds.has(member._id)) return false

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const fullName = `${member.firstName} ${member.lastName}`.toLowerCase()
        const email = member.email?.toLowerCase() || ''
        const phone = member.phone || ''
        return fullName.includes(query) || email.includes(query) || phone.includes(query)
      }
      return true
    })
  }, [members, existingMemberIds, searchQuery])

  const toggleMember = (memberId: string) => {
    setSelectedMemberIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(memberId)) {
        newSet.delete(memberId)
      } else {
        newSet.add(memberId)
      }
      return newSet
    })
  }

  const selectAll = () => {
    const allIds = new Set(filteredMembers.map(m => m._id))
    setSelectedMemberIds(allIds)
  }

  const clearSelection = () => {
    setSelectedMemberIds(new Set())
  }

  const handleSubmit = async () => {
    if (selectedMemberIds.size === 0) return

    try {
      setSubmitting(true)
      setError(null)
      await groupsService.addMembersToGroup(group._id, Array.from(selectedMemberIds))
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to add members')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setSearchQuery('')
    setSelectedMemberIds(new Set())
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
          className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Add Members</h3>
                <p className="text-sm text-gray-500">Add members to {group.name}</p>
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
                placeholder="Search members by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-gray-500">
                {selectedMemberIds.size} selected · {filteredMembers.length} available
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAll}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Select all
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={clearSelection}
                  className="text-sm text-gray-600 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
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
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  {searchQuery ? 'No members found matching your search' : 'No available members to add'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredMembers.map((member) => (
                  <button
                    key={member._id}
                    onClick={() => toggleMember(member._id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                      selectedMemberIds.has(member._id)
                        ? "bg-blue-50 border border-blue-200"
                        : "hover:bg-gray-50 border border-transparent"
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                        selectedMemberIds.has(member._id)
                          ? "bg-blue-600 border-blue-600"
                          : "border-gray-300"
                      )}
                    >
                      {selectedMemberIds.has(member._id) && (
                        <Check className="h-3 w-3 text-white" />
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
                    {member.membershipStatus && (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                        {member.membershipStatus}
                      </span>
                    )}
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
              disabled={selectedMemberIds.size === 0 || submitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>Add {selectedMemberIds.size} Member{selectedMemberIds.size !== 1 ? 's' : ''}</>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
