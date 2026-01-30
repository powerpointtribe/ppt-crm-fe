import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Clock,
  RotateCcw,
  ArrowLeft,
  Mail,
  Phone,
  CheckCircle
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { libraryService } from '@/services/library'
import { Borrowing } from '@/types/library'
import { showToast } from '@/utils/toast'
import { formatDate } from '@/utils/formatters'

export default function OverdueBooks() {
  const navigate = useNavigate()
  const [overdueBorrowings, setOverdueBorrowings] = useState<Borrowing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    fetchOverdue()
  }, [])

  const fetchOverdue = async () => {
    try {
      setLoading(true)
      const data = await libraryService.getOverdueBorrowings()
      setOverdueBorrowings(data)
    } catch (error: any) {
      console.error('Error fetching overdue books:', error)
      setError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleReturn = async (id: string) => {
    if (!window.confirm('Mark this book as returned?')) return

    try {
      await libraryService.returnBook(id, {})
      showToast('success', 'Book returned successfully')
      fetchOverdue()
    } catch (error: any) {
      showToast('error', error.message || 'Failed to process return')
    }
  }

  const handleMarkLost = async (id: string) => {
    if (!window.confirm('Mark this book as lost? This action cannot be undone.')) return

    try {
      await libraryService.returnBook(id, { markAsLost: true })
      showToast('success', 'Book marked as lost')
      fetchOverdue()
    } catch (error: any) {
      showToast('error', error.message || 'Failed to mark as lost')
    }
  }

  const getOverdueColor = (days: number) => {
    if (days > 30) return 'bg-red-600 text-white'
    if (days > 14) return 'bg-red-500 text-white'
    if (days > 7) return 'bg-orange-500 text-white'
    return 'bg-yellow-500 text-white'
  }

  return (
    <Layout title="Overdue Books">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/library')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Overdue Books</h1>
              <p className="text-gray-600">Books that need immediate attention</p>
            </div>
          </div>
          <Badge variant="error" className="text-lg px-4 py-2">
            {overdueBorrowings.length} Overdue
          </Badge>
        </div>

        {/* Summary */}
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div>
              <p className="font-medium text-red-800">
                {overdueBorrowings.length} book{overdueBorrowings.length !== 1 ? 's' : ''} overdue
              </p>
              <p className="text-sm text-red-600">
                Please follow up with members to return these books promptly.
              </p>
            </div>
          </div>
        </Card>

        {/* Overdue List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <Card className="p-8 text-center">
            <p className="text-red-600">{error.message}</p>
            <Button variant="outline" onClick={fetchOverdue} className="mt-4">
              Retry
            </Button>
          </Card>
        ) : overdueBorrowings.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-gray-500 mb-4">No overdue books! Great job keeping up.</p>
            <Link to="/library">
              <Button variant="outline">Back to Library</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {overdueBorrowings.map((borrowing, index) => {
              const overdueDays = borrowing.currentOverdueDays || borrowing.overdueDays
              const member = typeof borrowing.member === 'object' ? borrowing.member : null
              const book = typeof borrowing.book === 'object' ? borrowing.book : null

              return (
                <motion.div
                  key={borrowing._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-6 border-l-4 border-red-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {book?.title || 'Unknown Book'}
                          </h3>
                          <Badge className={getOverdueColor(overdueDays)}>
                            {overdueDays} days overdue
                          </Badge>
                        </div>

                        {book?.author && (
                          <p className="text-gray-600 mb-3">by {book.author}</p>
                        )}

                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <p className="font-medium text-gray-900 mb-1">
                            Borrowed by: {member ? `${member.firstName} ${member.lastName}` : 'Unknown'}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            {member?.email && (
                              <a
                                href={`mailto:${member.email}`}
                                className="flex items-center hover:text-blue-600"
                              >
                                <Mail className="h-4 w-4 mr-1" />
                                {member.email}
                              </a>
                            )}
                            {member?.phone && (
                              <a
                                href={`tel:${member.phone}`}
                                className="flex items-center hover:text-blue-600"
                              >
                                <Phone className="h-4 w-4 mr-1" />
                                {member.phone}
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            Borrowed: {formatDate(borrowing.borrowDate)}
                          </div>
                          <div className="flex items-center text-red-600">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Due: {formatDate(borrowing.dueDate)}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleReturn(borrowing._id)}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Mark Returned
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkLost(borrowing._id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          Mark Lost
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
