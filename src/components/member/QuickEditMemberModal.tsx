import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, AlertCircle, ChevronDown, ChevronUp, MapPin, Shield, Users2, Save } from 'lucide-react'
import Button from '@/components/ui/Button'
import { membersService } from '@/services/members-unified'
import { groupsService, Group } from '@/services/groups'
import { rolesService, Role } from '@/services/roles'
import { Member } from '@/types'
import { showToast } from '@/utils/toast'

type LeadershipRoleType = 'districtPastor' | 'unitHead' | 'assistantUnitHead' | 'ministryDirector'

interface QuickEditMemberModalProps {
  isOpen: boolean
  onClose: () => void
  member: Member
  onSuccess: () => void
}

const leadershipLabels: Record<LeadershipRoleType, string> = {
  districtPastor: 'District Pastor',
  unitHead: 'Unit Head',
  assistantUnitHead: 'Assistant Unit Head',
  ministryDirector: 'Ministry Director',
}

export default function QuickEditMemberModal({
  isOpen,
  onClose,
  member,
  onSuccess,
}: QuickEditMemberModalProps) {
  // Data loading
  const [districts, setDistricts] = useState<Group[]>([])
  const [units, setUnits] = useState<Group[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loadingData, setLoadingData] = useState(false)

  // Section collapse state
  const [openSection, setOpenSection] = useState<'assignment' | 'leadership' | 'role' | null>('assignment')

  // Assignment section state
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedUnit, setSelectedUnit] = useState('')
  const [savingAssignment, setSavingAssignment] = useState(false)

  // Leadership section state
  const [leadershipType, setLeadershipType] = useState<LeadershipRoleType>('unitHead')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [savingLeadership, setSavingLeadership] = useState(false)

  // Role section state
  const [selectedRole, setSelectedRole] = useState('')
  const [savingRole, setSavingRole] = useState(false)

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadData()
      // Pre-populate with current values
      const districtId = typeof member.district === 'object' ? member.district?._id : member.district || ''
      const unitId = typeof member.unit === 'object' ? member.unit?._id : member.unit || ''
      const roleId = typeof member.role === 'object' ? (member.role?.id || (member.role as any)?._id) : ''
      setSelectedDistrict(districtId)
      setSelectedUnit(unitId)
      setSelectedRole(roleId)
      setLeadershipType('unitHead')
      setSelectedGroup('')
      setError(null)
      setOpenSection('assignment')
    }
  }, [isOpen, member])

  const loadData = async () => {
    try {
      setLoadingData(true)
      const [districtsRes, unitsRes, rolesRes] = await Promise.all([
        groupsService.getDistricts({ limit: 100 }),
        groupsService.getUnits({ limit: 100 }),
        rolesService.getRoles({ isActive: true }),
      ])
      setDistricts(districtsRes.items)
      setUnits(unitsRes.items)
      setRoles(rolesRes)
    } catch (err: any) {
      setError('Failed to load data')
    } finally {
      setLoadingData(false)
    }
  }

  const handleSaveAssignment = async () => {
    if (!selectedUnit) {
      setError('Please select a unit')
      return
    }
    try {
      setSavingAssignment(true)
      setError(null)
      await membersService.assignUnit(member._id, {
        unit: selectedUnit,
        unitType: member.unitType || 'gia',
        district: selectedDistrict || undefined,
      })
      showToast.success('District & unit updated successfully')
      onSuccess()
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to update assignment')
    } finally {
      setSavingAssignment(false)
    }
  }

  const handleSaveLeadership = async () => {
    if (!selectedGroup) {
      setError('Please select a group')
      return
    }
    try {
      setSavingLeadership(true)
      setError(null)
      switch (leadershipType) {
        case 'districtPastor':
          await groupsService.assignDistrictPastor(selectedGroup, member._id)
          break
        case 'unitHead':
          await groupsService.assignUnitHead(selectedGroup, member._id)
          break
        case 'assistantUnitHead':
          await groupsService.assignAssistantUnitHead(selectedGroup, member._id)
          break
        case 'ministryDirector':
          await groupsService.assignMinistryDirector(selectedGroup, member._id)
          break
      }
      showToast.success(`Assigned as ${leadershipLabels[leadershipType]} successfully`)
      onSuccess()
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to assign leadership role')
    } finally {
      setSavingLeadership(false)
    }
  }

  const handleSaveRole = async () => {
    if (!selectedRole) {
      setError('Please select a role')
      return
    }
    try {
      setSavingRole(true)
      setError(null)
      await membersService.assignRole(member._id, { roleId: selectedRole })
      showToast.success('Platform role updated successfully')
      onSuccess()
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to update role')
    } finally {
      setSavingRole(false)
    }
  }

  const handleClose = () => {
    setError(null)
    onClose()
  }

  // Get groups relevant to the selected leadership type
  const leadershipGroups = leadershipType === 'districtPastor' ? districts : units

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
          className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Quick Edit</h3>
              <p className="text-sm text-gray-500">{member.firstName} {member.lastName}</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {loadingData ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              </div>
            ) : (
              <>
                {/* Section 1: District & Unit Assignment */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setOpenSection(openSection === 'assignment' ? null : 'assignment')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">District & Unit</span>
                    </div>
                    {openSection === 'assignment' ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  {openSection === 'assignment' && (
                    <div className="p-4 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">District</label>
                        <select
                          value={selectedDistrict}
                          onChange={(e) => setSelectedDistrict(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">No district</option>
                          {districts.map((d) => (
                            <option key={d._id} value={d._id}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                        <select
                          value={selectedUnit}
                          onChange={(e) => setSelectedUnit(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select unit</option>
                          {units.map((u) => (
                            <option key={u._id} value={u._id}>{u.name}</option>
                          ))}
                        </select>
                      </div>
                      <Button
                        size="sm"
                        onClick={handleSaveAssignment}
                        disabled={savingAssignment}
                        className="w-full"
                      >
                        {savingAssignment ? (
                          <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Saving...</>
                        ) : (
                          <><Save className="h-3.5 w-3.5 mr-1.5" /> Save Assignment</>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Section 2: Leadership Role */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setOpenSection(openSection === 'leadership' ? null : 'leadership')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Users2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-900">Leadership Role</span>
                    </div>
                    {openSection === 'leadership' ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  {openSection === 'leadership' && (
                    <div className="p-4 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Leadership Position</label>
                        <select
                          value={leadershipType}
                          onChange={(e) => {
                            setLeadershipType(e.target.value as LeadershipRoleType)
                            setSelectedGroup('')
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {Object.entries(leadershipLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          {leadershipType === 'districtPastor' ? 'District' : 'Unit'}
                        </label>
                        <select
                          value={selectedGroup}
                          onChange={(e) => setSelectedGroup(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select {leadershipType === 'districtPastor' ? 'district' : 'unit'}</option>
                          {leadershipGroups.map((g) => (
                            <option key={g._id} value={g._id}>{g.name}</option>
                          ))}
                        </select>
                      </div>
                      <Button
                        size="sm"
                        onClick={handleSaveLeadership}
                        disabled={savingLeadership || !selectedGroup}
                        className="w-full"
                      >
                        {savingLeadership ? (
                          <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Assigning...</>
                        ) : (
                          <><Save className="h-3.5 w-3.5 mr-1.5" /> Assign as {leadershipLabels[leadershipType]}</>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Section 3: Platform Role */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setOpenSection(openSection === 'role' ? null : 'role')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-900">Platform Role</span>
                    </div>
                    {openSection === 'role' ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  {openSection === 'role' && (
                    <div className="p-4 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                        <select
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select role</option>
                          {roles.map((r) => (
                            <option key={r._id} value={r._id}>{r.displayName || r.name}</option>
                          ))}
                        </select>
                      </div>
                      <Button
                        size="sm"
                        onClick={handleSaveRole}
                        disabled={savingRole || !selectedRole}
                        className="w-full"
                      >
                        {savingRole ? (
                          <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Saving...</>
                        ) : (
                          <><Save className="h-3.5 w-3.5 mr-1.5" /> Save Role</>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end px-6 py-3 border-t border-gray-200 bg-gray-50">
            <Button variant="secondary" size="sm" onClick={handleClose}>
              Close
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
