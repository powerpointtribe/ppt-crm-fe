import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Loader2 } from 'lucide-react'

// This component now redirects to the new Entry Import module with first_timer pre-selected
export default function FirstTimerEntryImport() {
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect to the new entry import page with first_timer entity type
    navigate('/entry-import?entityType=first_timer', { replace: true })
  }, [navigate])

  // Show loading while redirecting
  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Redirecting to Entry Import...</p>
        </div>
      </div>
    </Layout>
  )
}
