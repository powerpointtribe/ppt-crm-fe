import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import RequisitionForm from '@/components/finance/RequisitionForm'
import { financeService } from '@/services/finance'
import type { RequisitionFormData } from '@/schemas/requisition'

export default function RequisitionNew() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: RequisitionFormData) => {
    try {
      setLoading(true)
      setError(null)
      await financeService.createRequisition(data)
      navigate('/finance/requisitions', {
        state: { message: data.isDraft ? 'Requisition saved as draft' : 'Requisition submitted successfully' },
      })
    } catch (err: any) {
      setError(err.message || 'Failed to create requisition')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/finance')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Finance
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            New Requisition
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Create a new expense requisition request
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <RequisitionForm
          onSubmit={handleSubmit}
          onCancel={() => navigate('/finance')}
          loading={loading}
          mode="create"
        />
      </div>
    </Layout>
  )
}
