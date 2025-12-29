import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Shield, AlertCircle, Loader2, Info } from 'lucide-react'
import Button from '@/components/ui/Button'
import { rolesService, Role } from '@/services/roles'
import { groupsService, Group } from '@/services/groups'
import { cn } from '@/utils/cn'

interface SetDefaultRoleModalProps {
  isOpen: boolean
  onClose: () => void
  group: Group
  onSuccess: () => void
}

export default function SetDefaultRoleModal({
  isOpen,
  onClose,
  group,
  onSuccess
}: SetDefaultRoleModalProps) {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)

  // Get current default role ID
  const currentDefaultRoleId = useMemo(() => {
    if (!group.defaultRole) return null
    return typeof group.defaultRole === 'object' ? group.defaultRole._id : group.defaultRole
  }, [group.defaultRole])

  useEffect(() => {
    if (isOpen) {
      loadRoles()
      setSelectedRoleId(currentDefaultRoleId)
    }
  }, [isOpen, currentDefaultRoleId])

  const loadRoles = async () => {
    try {
      setLoading(true)
      setError(null)
      const rolesData = await rolesService.getRoles({ isActive: true })
      setRoles(rolesData)
    } catch (err: any) {
      setError(err.message || 'Failed to load roles')
    } finally {
      setLoading(false)
    }
  }

  const filteredRoles = useMemo(() => {
    if (!searchQuery) return roles

    const query = searchQuery.toLowerCase()
    return roles.filter(role => {
      return role.displayName.toLowerCase().includes(query) ||
        role.name.toLowerCase().includes(query) ||
        (role.description?.toLowerCase().includes(query))
    })
  }, [roles, searchQuery])

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      setError(null)

      if (selectedRoleId) {
        await groupsService.setDefaultRole(group._id, selectedRoleId)
      } else if (currentDefaultRoleId) {
        // Remove default role if none selected but one exists
        await groupsService.removeDefaultRole(group._id)
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to set default role')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemoveDefault = async () => {
    try {
      setSubmitting(true)
      setError(null)
      await groupsService.removeDefaultRole(group._id)
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to remove default role')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setSearchQuery('')
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
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Set Default Role</h3>
                <p className="text-sm text-gray-500">Auto-assign role for new members</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Info */}
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                When members join <strong>{group.name}</strong>, they will automatically be assigned this role.
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="px-6 py-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Role List */}
          <div className="flex-1 overflow-y-auto px-6 py-3">
            {error && (
              <div className="flex items-center gap-2 p-3 mb-3 bg-red-50 text-red-700 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              </div>
            ) : filteredRoles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {searchQuery ? 'No roles found matching your search' : 'No roles available'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {/* No default role option */}
                <button
                  onClick={() => setSelectedRoleId(null)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                    selectedRoleId === null
                      ? "bg-gray-100 border border-gray-300"
                      : "hover:bg-gray-50 border border-transparent"
                  )}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                      selectedRoleId === null
                        ? "bg-gray-600 border-gray-600"
                        : "border-gray-300"
                    )}
                  >
                    {selectedRoleId === null && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-700">No default role</p>
                    <p className="text-sm text-gray-500">Members won't be assigned a role automatically</p>
                  </div>
                </button>

                {filteredRoles.map((role) => (
                  <button
                    key={role._id}
                    onClick={() => setSelectedRoleId(role._id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                      selectedRoleId === role._id
                        ? "bg-indigo-50 border border-indigo-200"
                        : "hover:bg-gray-50 border border-transparent"
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                        selectedRoleId === role._id
                          ? "bg-indigo-600 border-indigo-600"
                          : "border-gray-300"
                      )}
                    >
                      {selectedRoleId === role._id && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{role.displayName}</p>
                        {role.isSystemRole && (
                          <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                            System
                          </span>
                        )}
                        {role._id === currentDefaultRoleId && (
                          <span className="text-xs px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded">
                            Current
                          </span>
                        )}
                      </div>
                      {role.description && (
                        <p className="text-sm text-gray-500 truncate">{role.description}</p>
                      )}
                    </div>
                    {role.colorCode && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: role.colorCode }}
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div>
              {currentDefaultRoleId && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRemoveDefault}
                  disabled={submitting}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Remove Default
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={handleClose} disabled={submitting}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || selectedRoleId === currentDefaultRoleId}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
