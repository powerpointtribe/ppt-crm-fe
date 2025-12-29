import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Link2, Check, AlertCircle, Loader2, AlertTriangle, Users } from 'lucide-react'
import Button from '@/components/ui/Button'
import { groupsService, Group } from '@/services/groups'
import { cn } from '@/utils/cn'

interface LinkUnitsModalProps {
  isOpen: boolean
  onClose: () => void
  ministry: Group
  onSuccess: () => void
}

export default function LinkUnitsModal({
  isOpen,
  onClose,
  ministry,
  onSuccess
}: LinkUnitsModalProps) {
  const [units, setUnits] = useState<Group[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUnitIds, setSelectedUnitIds] = useState<Set<string>>(new Set())

  // Get currently linked unit IDs
  const linkedUnitIds = useMemo(() => {
    return new Set(
      (ministry.linkedUnits || []).map(u => typeof u === 'object' ? u._id : u)
    )
  }, [ministry.linkedUnits])

  useEffect(() => {
    if (isOpen) {
      loadUnits()
      // Initialize with currently linked units
      setSelectedUnitIds(new Set(linkedUnitIds))
    }
  }, [isOpen, linkedUnitIds])

  const loadUnits = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await groupsService.getUnits({ limit: 100 })
      setUnits(response.items)
    } catch (err: any) {
      setError(err.message || 'Failed to load units')
    } finally {
      setLoading(false)
    }
  }

  const filteredUnits = useMemo(() => {
    if (!searchQuery) return units

    const query = searchQuery.toLowerCase()
    return units.filter(unit => {
      return unit.name.toLowerCase().includes(query) ||
        (unit.description?.toLowerCase().includes(query))
    })
  }, [units, searchQuery])

  const toggleUnit = (unitId: string) => {
    setSelectedUnitIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(unitId)) {
        newSet.delete(unitId)
      } else {
        newSet.add(unitId)
      }
      return newSet
    })
  }

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      setError(null)

      // Determine which units to link and unlink
      const unitsToLink = Array.from(selectedUnitIds).filter(id => !linkedUnitIds.has(id))
      const unitsToUnlink = Array.from(linkedUnitIds).filter(id => !selectedUnitIds.has(id))

      // Link new units
      if (unitsToLink.length > 0) {
        await groupsService.linkUnitsToMinistry(ministry._id, unitsToLink)
      }

      // Unlink removed units
      if (unitsToUnlink.length > 0) {
        await groupsService.unlinkUnitsFromMinistry(ministry._id, unitsToUnlink)
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to update linked units')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setSearchQuery('')
    setError(null)
    onClose()
  }

  // Calculate changes
  const unitsToLink = Array.from(selectedUnitIds).filter(id => !linkedUnitIds.has(id))
  const unitsToUnlink = Array.from(linkedUnitIds).filter(id => !selectedUnitIds.has(id))
  const hasChanges = unitsToLink.length > 0 || unitsToUnlink.length > 0

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
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Link2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Link Units</h3>
                <p className="text-sm text-gray-500">Manage linked units for {ministry.name}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Warning */}
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-100">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                Members in linked units will be automatically synced to this ministry.
                When a member joins a linked unit, they will also be added to this ministry.
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="px-6 py-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search units..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Unit List */}
          <div className="flex-1 overflow-y-auto px-6 py-3">
            {error && (
              <div className="flex items-center gap-2 p-3 mb-3 bg-red-50 text-red-700 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
              </div>
            ) : filteredUnits.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {searchQuery ? 'No units found matching your search' : 'No units available'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredUnits.map((unit) => (
                  <button
                    key={unit._id}
                    onClick={() => toggleUnit(unit._id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                      selectedUnitIds.has(unit._id)
                        ? "bg-purple-50 border border-purple-200"
                        : "hover:bg-gray-50 border border-transparent"
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                        selectedUnitIds.has(unit._id)
                          ? "bg-purple-600 border-purple-600"
                          : "border-gray-300"
                      )}
                    >
                      {selectedUnitIds.has(unit._id) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{unit.name}</p>
                      {unit.description && (
                        <p className="text-sm text-gray-500 truncate">{unit.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Users className="h-4 w-4" />
                      <span>{unit.currentMemberCount || 0}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Summary of changes */}
          {hasChanges && (
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-sm text-gray-600">
                {unitsToLink.length > 0 && (
                  <span className="text-green-600">+{unitsToLink.length} to link</span>
                )}
                {unitsToLink.length > 0 && unitsToUnlink.length > 0 && ' · '}
                {unitsToUnlink.length > 0 && (
                  <span className="text-red-600">-{unitsToUnlink.length} to unlink</span>
                )}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <Button variant="secondary" onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!hasChanges || submitting}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
