import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  User,
  BookOpen,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Mail,
  Phone
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { libraryService } from '@/services/library'
import { Borrowing, BorrowingStatus } from '@/types/library'
import { formatDate } from '@/utils/formatters'

interface MemberInfo {
  _id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
}

function getStatusBadge(status: BorrowingStatus) {
  switch (status) {
    case BorrowingStatus.BORROWED:
      return <Badge variant="info">Borrowed</Badge>
    case BorrowingStatus.RETURNED:
      return <Badge variant="success">Returned</Badge>
    case BorrowingStatus.OVERDUE:
      return <Badge variant="error">Overdue</Badge>
    case BorrowingStatus.LOST:
      return <Badge variant="warning">Lost</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

export default function MemberHistory() {
  const { memberId } = useParams<{ memberId: string }>()
  const navigate = useNavigate()
  const [borrowings, setBorrowings] = useState<Borrowing[]>([])
  const [member, setMember] = useState<MemberInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    if (memberId) {
      fetchMemberHistory()
    }
  }, [memberId])

  const fetchMemberHistory = async () => {
    try {
      setLoading(true)
      const data = await libraryService.getMemberBorrowingHistory(memberId!)
      setBorrowings(data)

      // Extract member info from the first borrowing if available
      if (data.length > 0 && typeof data[0].member === 'object') {
        setMember(data[0].member as MemberInfo)
      }
    } catch (error: any) {
      console.error('Error fetching member history:', error)
      setError(error)
    } finally {
      setLoading(false)
    }
  }

  const stats = {
    total: borrowings.length,
    currentlyBorrowed: borrowings.filter(b => b.status === BorrowingStatus.BORROWED).length,
    overdue: borrowings.filter(b => b.status === BorrowingStatus.OVERDUE).length,
    returned: borrowings.filter(b => b.status === BorrowingStatus.RETURNED).length,
    lost: borrowings.filter(b => b.status === BorrowingStatus.LOST).length,
  }

  if (loading) {
    return (
      <Layout title="Member Borrowing History">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Member Borrowing History">
        <Card className="p-8 text-center">
          <p className="text-red-600">{error.message}</p>
          <Button variant="outline" onClick={() => navigate('/library')} className="mt-4">
            Back to Library
          </Button>
        </Card>
      </Layout>
    )
  }

  return (
    <Layout title="Member Borrowing History">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Member Info */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {member ? `${member.firstName} ${member.lastName}` : 'Member'}
                </h1>
                <p className="text-gray-600">Borrowing History</p>
                {member && (
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    {member.email && (
                      <a href={`mailto:${member.email}`} className="flex items-center hover:text-blue-600">
                        <Mail className="h-4 w-4 mr-1" />
                        {member.email}
                      </a>
                    )}
                    {member.phone && (
                      <a href={`tel:${member.phone}`} className="flex items-center hover:text-blue-600">
                        <Phone className="h-4 w-4 mr-1" />
                        {member.phone}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-600">Total Borrowed</p>
          </Card>
          <Card className="p-4 text-center bg-blue-50">
            <p className="text-2xl font-bold text-blue-700">{stats.currentlyBorrowed}</p>
            <p className="text-sm text-blue-600">Currently Borrowed</p>
          </Card>
          <Card className="p-4 text-center bg-red-50">
            <p className="text-2xl font-bold text-red-700">{stats.overdue}</p>
            <p className="text-sm text-red-600">Overdue</p>
          </Card>
          <Card className="p-4 text-center bg-green-50">
            <p className="text-2xl font-bold text-green-700">{stats.returned}</p>
            <p className="text-sm text-green-600">Returned</p>
          </Card>
          <Card className="p-4 text-center bg-orange-50">
            <p className="text-2xl font-bold text-orange-700">{stats.lost}</p>
            <p className="text-sm text-orange-600">Lost</p>
          </Card>
        </div>

        {/* Borrowing History */}
        {borrowings.length === 0 ? (
          <Card className="p-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No borrowing history found</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {borrowings.map((borrowing, index) => {
              const book = typeof borrowing.book === 'object' ? borrowing.book : null

              return (
                <motion.div
                  key={borrowing._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {book?.title || 'Unknown Book'}
                          </h3>
                          {book?.author && (
                            <p className="text-sm text-gray-600">by {book.author}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Borrowed: {formatDate(borrowing.borrowDate)}
                            </span>
                            <span className="flex items-center">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Due: {formatDate(borrowing.dueDate)}
                            </span>
                            {borrowing.returnDate && (
                              <span className="flex items-center text-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Returned: {formatDate(borrowing.returnDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {getStatusBadge(borrowing.status)}
                        {borrowing.status === BorrowingStatus.OVERDUE && (
                          <span className="text-red-600 text-sm font-medium">
                            {borrowing.currentOverdueDays || borrowing.overdueDays} days overdue
                          </span>
                        )}
                      </div>
                    </div>

                    {borrowing.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Notes:</span> {borrowing.notes}
                        </p>
                      </div>
                    )}
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
