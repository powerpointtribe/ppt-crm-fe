import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import MemberForm from '@/components/forms/MemberForm'
import { membersService, Member, UpdateMemberData } from '@/services/members'
import { showToast } from '@/utils/toast'

export default function MemberEdit() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadMember(id)
    }
  }, [id])

  const loadMember = async (memberId: string) => {
    try {
      setError(null)
      const memberData = await membersService.getMemberById(memberId)
      setMember(memberData)
    } catch (error: any) {
      console.error('Error loading member:', error)
      setError(error.message || 'Failed to load member')
      showToast('error', 'Failed to load member')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: UpdateMemberData) => {
    if (!id) return

    setSubmitting(true)
    try {
      const updatedMember = await membersService.updateMember(id, data)
      setMember(updatedMember)
      showToast('success', 'Member updated successfully')
      navigate(`/members/${id}`)
    } catch (error: any) {
      console.error('Error updating member:', error)
      showToast('error', error.message || 'Failed to update member')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate(`/members/${id}`)
  }

  if (loading) {
    return (
      <Layout title="Edit Member">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (error || !member) {
    return (
      <Layout
        title="Edit Member"
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
        <div className="text-center py-12">
          <div className="text-red-600 text-lg font-medium">
            {error || 'Member not found'}
          </div>
          <Button
            className="mt-4"
            onClick={() => navigate('/members')}
          >
            Back to Members
          </Button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout
      title="Edit Member"
      headerActions={
        <Button
          variant="secondary"
          onClick={() => navigate(`/members/${id}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Member
        </Button>
      }
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Edit Member: {member.firstName} {member.lastName}
          </h2>
          <p className="text-gray-600 mt-1">
            Update the member's information. All fields marked with * are required.
          </p>
        </div>

        <MemberForm
          mode="edit"
          member={member}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={submitting}
        />
      </div>
    </Layout>
  )
}