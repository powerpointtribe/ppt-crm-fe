import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import MemberForm from '@/components/forms/MemberForm'
import { membersService, CreateMemberData } from '@/services/members'
import { showToast } from '@/utils/toast'

export default function MemberNew() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: CreateMemberData) => {
    setLoading(true)
    try {
      const newMember = await membersService.createMember(data)
      showToast('success', 'Member created successfully')
      navigate(`/members/${newMember._id}`)
    } catch (error: any) {
      console.error('Error creating member:', error)
      showToast('error', error.message || 'Failed to create member')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/members')
  }

  return (
    <Layout
      title="New Member"
      headerActions={
        <Button
          variant="secondary"
          onClick={() => navigate('/members')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Members
        </Button>
      }
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Add New Member</h2>
          <p className="text-gray-600 mt-1">
            Fill in the member's information. All fields marked with * are required.
          </p>
        </div>

        <MemberForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </div>
    </Layout>
  )
}