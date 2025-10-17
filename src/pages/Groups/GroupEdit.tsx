import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import GroupForm from '@/components/forms/GroupForm'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { groupsService, Group, UpdateGroupData } from '@/services/groups'
import { showToast } from '@/utils/toast'

export default function GroupEdit() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    if (id) {
      loadGroup()
    }
  }, [id])

  const loadGroup = async () => {
    try {
      setLoading(true)
      setError(null)
      const groupData = await groupsService.getGroupById(id!)
      setGroup(groupData)
    } catch (error: any) {
      console.error('Error loading group:', error)
      setError({
        status: error.status || 500,
        message: 'Failed to load group details',
        details: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: UpdateGroupData) => {
    try {
      setSubmitLoading(true)
      const updatedGroup = await groupsService.updateGroup(id!, data)

      showToast('success', 'Group updated successfully!')
      navigate(`/groups/${updatedGroup._id}`)
    } catch (error: any) {
      console.error('Error updating group:', error)
      showToast('error', error.message || 'Failed to update group')
      throw error
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleCancel = () => {
    navigate(`/groups/${id}`)
  }

  if (loading) {
    return (
      <Layout title="Edit Group">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Edit Group">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ErrorBoundary
              error={error}
              onRetry={loadGroup}
              showLogout={error.status === 401}
            />
          </div>
        </div>
      </Layout>
    )
  }

  if (!group) {
    return (
      <Layout title="Edit Group">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Group not found</h3>
              <p className="text-gray-600 mb-4">The group you're looking for doesn't exist.</p>
              <button
                onClick={() => navigate('/groups')}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Back to Groups
              </button>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title={`Edit ${group.name}`}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Group</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Update the details for <span className="font-semibold text-gray-900">{group.name}</span>
            </p>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <GroupForm
              group={group}
              mode="edit"
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={submitLoading}
            />
          </motion.div>

          {/* Help Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 max-w-2xl mx-auto"
          >
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-amber-900 mb-3">Editing Tips</h3>
              <ul className="text-amber-800 space-y-2 text-sm">
                <li>• <strong>Review Changes:</strong> Check all modifications before submitting</li>
                <li>• <strong>Member Impact:</strong> Consider how changes affect current members</li>
                <li>• <strong>Schedule Changes:</strong> Notify members of meeting time updates</li>
                <li>• <strong>Leadership Changes:</strong> Ensure smooth transitions when changing leaders</li>
                <li>• <strong>Contact Updates:</strong> Keep contact information current for communication</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  )
}