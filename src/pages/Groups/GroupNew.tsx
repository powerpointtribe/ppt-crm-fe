import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import GroupForm from '@/components/forms/GroupForm'
import { groupsService, CreateGroupData } from '@/services/groups'
import { showToast } from '@/utils/toast'

export default function GroupNew() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: CreateGroupData) => {
    try {
      setLoading(true)
      const newGroup = await groupsService.createGroup(data)

      showToast('success', 'Group created successfully!')
      navigate(`/groups/${newGroup._id}`)
    } catch (error: any) {
      console.error('Error creating group:', error)
      showToast('error', error.message || 'Failed to create group')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/groups')
  }

  return (
    <Layout title="Create New Group">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Group</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Set up a new group for your church community. Follow the steps to configure all the necessary details.
            </p>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <GroupForm
              mode="create"
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={loading}
            />
          </motion.div>

          {/* Help Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 max-w-2xl mx-auto"
          >
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Need Help?</h3>
              <ul className="text-blue-800 space-y-2 text-sm">
                <li>• <strong>Group Types:</strong> Choose the appropriate type based on your church structure</li>
                <li>• <strong>Leadership:</strong> Assign leaders based on the group type (District Pastor for districts, Unit Head for units)</li>
                <li>• <strong>Meeting Schedule:</strong> Set regular meeting times to help members plan</li>
                <li>• <strong>Hosting:</strong> Organize hosting rotation for fellowship groups</li>
                <li>• <strong>Contact Info:</strong> Provide ways for members to reach the group</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  )
}