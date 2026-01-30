import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Eye,
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Pagination from '@/components/ui/Pagination'
import { libraryService } from '@/services/library'
import { Borrowing, BorrowingStatus, BorrowingQueryParams } from '@/types/library'
import { showToast } from '@/utils/toast'
import { formatDate } from '@/utils/formatters'

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

export default function Borrowings() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [borrowings, setBorrowings] = useState<Borrowing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  const fetchBorrowings = useCallback(async () => {
    try {
      setLoading(true)
      const params: BorrowingQueryParams = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: selectedStatus as BorrowingStatus || undefined,
      }

      const response = await libraryService.getBorrowings(params)
      setBorrowings(response.items)
      setPagination((prev) => ({
        ...prev,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages,
      }))
    } catch (error: any) {
      console.error('Error fetching borrowings:', error)
      setError(error)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, searchTerm, selectedStatus])

  useEffect(() => {
    fetchBorrowings()
  }, [fetchBorrowings])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    setSearchParams({
      ...(searchTerm && { search: searchTerm }),
      ...(selectedStatus && { status: selectedStatus }),
    })
  }

  const handleReturn = async (id: string) => {
    if (!window.confirm('Mark this book as returned?')) return

    try {
      await libraryService.returnBook(id, {})
      showToast('success', 'Book returned successfully')
      fetchBorrowings()
    } catch (error: any) {
      showToast('error', error.message || 'Failed to process return')
    }
  }

  return (
    <Layout title="Borrowings">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Borrowings</h1>
            <p className="text-gray-600">Manage book loans and returns</p>
          </div>
          <Link to="/library/borrowings/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Issue Book
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Search by book title, member name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value={BorrowingStatus.BORROWED}>Borrowed</option>
              <option value={BorrowingStatus.RETURNED}>Returned</option>
              <option value={BorrowingStatus.OVERDUE}>Overdue</option>
              <option value={BorrowingStatus.LOST}>Lost</option>
            </select>
            <Button type="submit">
              <Filter className="h-4 w-4 mr-2" />
              Apply
            </Button>
          </form>
        </Card>

        {/* Borrowings List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <Card className="p-8 text-center">
            <p className="text-red-600">{error.message}</p>
            <Button variant="outline" onClick={fetchBorrowings} className="mt-4">
              Retry
            </Button>
          </Card>
        ) : borrowings.length === 0 ? (
          <Card className="p-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">No borrowings found</p>
            <Link to="/library/borrowings/new">
              <Button>Issue First Book</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {borrowings.map((borrowing, index) => (
              <motion.div
                key={borrowing._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {typeof borrowing.book === 'object' ? borrowing.book.title : 'Unknown Book'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Borrowed by:{' '}
                            {typeof borrowing.member === 'object'
                              ? `${borrowing.member.firstName} ${borrowing.member.lastName}`
                              : 'Unknown Member'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 mt-3 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Borrowed: {formatDate(borrowing.borrowDate)}
                        </div>
                        <div className="flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Due: {formatDate(borrowing.dueDate)}
                        </div>
                        {borrowing.returnDate && (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Returned: {formatDate(borrowing.returnDate)}
                          </div>
                        )}
                        {borrowing.status === BorrowingStatus.OVERDUE && (
                          <span className="text-red-600 font-medium">
                            {borrowing.currentOverdueDays || borrowing.overdueDays} days overdue
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStatusBadge(borrowing.status)}

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/library/borrowings/${borrowing._id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(borrowing.status === BorrowingStatus.BORROWED ||
                          borrowing.status === BorrowingStatus.OVERDUE) && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleReturn(borrowing._id)}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Return
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
          />
        )}
      </div>
    </Layout>
  )
}
