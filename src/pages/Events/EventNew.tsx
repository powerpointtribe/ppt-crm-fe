import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2 } from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import EventForm from '@/components/forms/EventForm'
import { eventsService } from '@/services/events'
import { branchesService } from '@/services/branches'
import { CreateEventData, UpdateEventData } from '@/types/event'
// Note: FullBranch is imported but might not be used if type mapping is done inline
// import { Branch as FullBranch } from '@/types/branch'
import { showToast } from '@/utils/toast'
import { useAppStore, Branch } from '@/store'
import { useAuth } from '@/contexts/AuthContext-unified'

export default function EventNew() {
  const navigate = useNavigate()
  const { selectedBranch, branches: storeBranches, setBranches } = useAppStore()
  const { hasPermission } = useAuth()
  const [loading, setLoading] = useState(false)
  const [targetBranchId, setTargetBranchId] = useState<string>(selectedBranch?._id || '')
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([])
  const [loadingBranches, setLoadingBranches] = useState(false)

  const canViewAllBranches = hasPermission('branches:view-all')

  // Load branches if user can view all branches
  useEffect(() => {
    const loadBranches = async () => {
      if (canViewAllBranches) {
        setLoadingBranches(true)
        try {
          if (storeBranches.length > 0) {
            setAvailableBranches(storeBranches)
          } else {
            const data = await branchesService.getBranchesForSelector()
            const activeBranches: Branch[] = data
              .filter(b => b.isActive)
              .map(b => ({ _id: b._id, name: b.name, slug: b.slug, isActive: b.isActive }))
            setAvailableBranches(activeBranches)
            setBranches(activeBranches)
          }
        } catch (error) {
          console.error('Failed to load branches:', error)
        } finally {
          setLoadingBranches(false)
        }
      }
    }
    loadBranches()
  }, [canViewAllBranches, storeBranches.length, setBranches])

  // Set default branch when branches are loaded
  useEffect(() => {
    if (selectedBranch && !targetBranchId) {
      setTargetBranchId(selectedBranch._id)
    }
  }, [selectedBranch, targetBranchId])

  const handleSubmit = async (data: CreateEventData | UpdateEventData) => {
    setLoading(true)
    try {
      const newEvent = await eventsService.createEvent(data as CreateEventData)
      showToast('success', 'Event created successfully')
      navigate(`/events/${newEvent._id}`)
    } catch (error: any) {
      console.error('Error creating event:', error)
      showToast('error', error.message || 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/events')
  }

  // Get the branch to use for event creation
  const effectiveBranchId = canViewAllBranches && targetBranchId ? targetBranchId : selectedBranch?._id

  if (!effectiveBranchId && !canViewAllBranches) {
    return (
      <Layout title="New Event">
        <div className="text-center py-12">
          <p className="text-gray-500">Please select a branch to create an event.</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout
      title="New Event"
      actions={
        <Button variant="secondary" onClick={() => navigate('/events')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>
      }
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Create New Event</h2>
          <p className="text-gray-600 mt-1">
            Fill in the event details. You can save as draft and publish later.
          </p>

          {/* Branch Selection - Only show if user can view all branches */}
          {canViewAllBranches && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Building2 className="h-4 w-4" />
                Create Event For Branch
              </label>
              <select
                value={targetBranchId}
                onChange={(e) => setTargetBranchId(e.target.value)}
                disabled={loadingBranches}
                className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {loadingBranches ? (
                  <option value="">Loading branches...</option>
                ) : (
                  <>
                    <option value="">Select a branch</option>
                    {availableBranches.map((branch) => (
                      <option key={branch._id} value={branch._id}>
                        {branch.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {selectedBranch && targetBranchId && targetBranchId !== selectedBranch._id && (
                <p className="text-xs text-amber-600 mt-2">
                  Note: You are creating an event for a different branch than your currently selected one.
                </p>
              )}
            </div>
          )}
        </div>

        {effectiveBranchId ? (
          <EventForm
            mode="create"
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
            branchId={effectiveBranchId}
          />
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Please select a branch above to create an event.</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
