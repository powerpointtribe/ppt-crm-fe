import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Search, UserPlus, Users, Check, ChevronRight,
  Phone, Mail, Calendar, Loader2, UserCheck, AlertCircle
} from 'lucide-react'
import { Member } from '@/services/members-unified'
import { FirstTimer } from '@/services/first-timers'
import { formatDate } from '@/utils/formatters'
import Button from './Button'

interface AssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  onAssign: (assigneeId: string) => Promise<void>
  selectedFirstTimers: FirstTimer[]
  members: Member[]
  membersLoading: boolean
  assignmentLoading: boolean
}

export default function AssignmentModal({
  isOpen,
  onClose,
  onAssign,
  selectedFirstTimers,
  members,
  membersLoading,
  assignmentLoading,
}: AssignmentModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [step, setStep] = useState<'select' | 'confirm'>('select')

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      setSelectedMemberId(null)
      setStep('select')
    }
  }, [isOpen])

  // Filter members based on search
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members
    const query = searchQuery.toLowerCase()
    return members.filter(member =>
      `${member.firstName} ${member.lastName}`.toLowerCase().includes(query) ||
      member.email?.toLowerCase().includes(query) ||
      member.phone?.includes(query)
    )
  }, [members, searchQuery])

  // Get the selected member object
  const selectedMember = useMemo(() => {
    return members.find(m => m._id === selectedMemberId)
  }, [members, selectedMemberId])

  // Get member role badge
  const getMemberRoleBadge = (member: Member) => {
    // Check new RBAC role first
    if (member.role && typeof member.role === 'object') {
      const roleName = member.role.displayName || member.role.name
      return { label: roleName, color: 'bg-purple-100 text-purple-700' }
    }
    // Check membership status for leadership levels
    if (member.membershipStatus) {
      if (member.membershipStatus === 'SENIOR_PASTOR') {
        return { label: 'Senior Pastor', color: 'bg-purple-100 text-purple-700' }
      }
      if (member.membershipStatus === 'PASTOR') {
        return { label: 'Pastor', color: 'bg-purple-100 text-purple-700' }
      }
      if (member.membershipStatus === 'DIRECTOR') {
        return { label: 'Director', color: 'bg-blue-100 text-blue-700' }
      }
    }
    // Check system roles
    if (member.systemRoles?.includes('admin') || member.systemRoles?.includes('super_admin')) {
      return { label: 'Admin', color: 'bg-red-100 text-red-700' }
    }
    return { label: 'Member', color: 'bg-gray-100 text-gray-700' }
  }

  const handleSelectMember = (memberId: string) => {
    setSelectedMemberId(memberId)
    setStep('confirm')
  }

  const handleBack = () => {
    setStep('select')
  }

  const handleConfirmAssign = async () => {
    if (!selectedMemberId) return
    await onAssign(selectedMemberId)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Assign for Follow-up
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedFirstTimers.length} first-timer{selectedFirstTimers.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <AnimatePresence mode="wait">
              {step === 'select' ? (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 overflow-hidden flex flex-col"
                >
                  {/* Selected First Timers Preview */}
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">
                        Selected First Timers
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                      {selectedFirstTimers.slice(0, 6).map((ft) => (
                        <div
                          key={ft._id}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-gray-200 text-sm"
                        >
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-medium">
                            {ft.firstName.charAt(0)}
                          </div>
                          <span className="text-gray-700">
                            {ft.firstName} {ft.lastName}
                          </span>
                        </div>
                      ))}
                      {selectedFirstTimers.length > 6 && (
                        <div className="flex items-center px-3 py-1.5 bg-blue-50 rounded-full text-sm text-blue-600 font-medium">
                          +{selectedFirstTimers.length - 6} more
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Search */}
                  <div className="px-6 py-4 border-b border-gray-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search team members by name, email, or phone..."
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Members List */}
                  <div className="flex-1 overflow-y-auto px-6 py-4">
                    {membersLoading ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" />
                        <p className="text-gray-500">Loading team members...</p>
                      </div>
                    ) : filteredMembers.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Users className="h-12 w-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 text-center">
                          {searchQuery ? 'No members match your search' : 'No team members available'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredMembers.map((member) => {
                          const badge = getMemberRoleBadge(member)
                          return (
                            <motion.button
                              key={member._id}
                              onClick={() => handleSelectMember(member._id)}
                              className="w-full flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                            >
                              {/* Avatar */}
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                                {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                              </div>

                              {/* Info */}
                              <div className="flex-1 text-left min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-gray-900 truncate">
                                    {member.firstName} {member.lastName}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                                    {badge.label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  {member.email && (
                                    <span className="flex items-center gap-1 truncate">
                                      <Mail className="h-3 w-3" />
                                      {member.email}
                                    </span>
                                  )}
                                  {member.phone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {member.phone}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Arrow */}
                              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                            </motion.button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex-1 overflow-hidden flex flex-col"
                >
                  {/* Confirmation Content */}
                  <div className="flex-1 overflow-y-auto px-6 py-6">
                    {/* Selected Assignee */}
                    {selectedMember && (
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <UserCheck className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-gray-700">
                            Assigning to
                          </span>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold text-xl">
                            {selectedMember.firstName.charAt(0)}{selectedMember.lastName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900 text-lg">
                                {selectedMember.firstName} {selectedMember.lastName}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getMemberRoleBadge(selectedMember).color}`}>
                                {getMemberRoleBadge(selectedMember).label}
                              </span>
                            </div>
                            {selectedMember.email && (
                              <p className="text-sm text-gray-600 mt-1">{selectedMember.email}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Assignment Summary */}
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">
                          First Timers to Assign ({selectedFirstTimers.length})
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-200 max-h-64 overflow-y-auto">
                        {selectedFirstTimers.map((ft) => (
                          <div key={ft._id} className="flex items-center gap-3 p-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium">
                              {ft.firstName.charAt(0)}{ft.lastName.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {ft.firstName} {ft.lastName}
                              </p>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                {ft.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {ft.phone}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Visited {formatDate(ft.dateOfVisit)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Info Note */}
                    <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-700">
                        <p className="font-medium mb-1">What happens next?</p>
                        <ul className="space-y-1 text-blue-600">
                          <li>The assigned team member will receive a notification</li>
                          <li>First timers will appear in their assignment list</li>
                          <li>They can then start recording follow-up activities</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                    <Button
                      variant="ghost"
                      onClick={handleBack}
                      disabled={assignmentLoading}
                    >
                      Back
                    </Button>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={assignmentLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleConfirmAssign}
                        loading={assignmentLoading}
                        disabled={assignmentLoading}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Confirm Assignment
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer for select step */}
          {step === 'select' && (
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Select a team member to assign the follow-up
                </p>
                <Button
                  variant="secondary"
                  onClick={onClose}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
