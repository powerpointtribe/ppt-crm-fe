import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Edit,
  Trash2,
  BookOpen,
  User,
  Calendar,
  MapPin,
  Tag,
  Clock,
  AlertTriangle,
  Plus
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { libraryService } from '@/services/library'
import { Book, Borrowing, BorrowingStatus, BookStatus } from '@/types/library'
import { showToast } from '@/utils/toast'
import { formatDate } from '@/utils/formatters'

function getStatusBadge(status: BookStatus) {
  switch (status) {
    case BookStatus.AVAILABLE:
      return <Badge variant="success">Available</Badge>
    case BookStatus.LOW_STOCK:
      return <Badge variant="warning">Low Stock</Badge>
    case BookStatus.OUT_OF_STOCK:
      return <Badge variant="error">Out of Stock</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

function getBorrowingStatusBadge(status: BorrowingStatus) {
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

export default function BookDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [book, setBook] = useState<Book | null>(null)
  const [borrowingHistory, setBorrowingHistory] = useState<Borrowing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    if (id) {
      fetchBookDetails()
    }
  }, [id])

  const fetchBookDetails = async () => {
    try {
      setLoading(true)
      const [bookData, historyData] = await Promise.all([
        libraryService.getBookById(id!),
        libraryService.getBookBorrowingHistory(id!)
      ])
      setBook(bookData)
      setBorrowingHistory(historyData)
    } catch (error: any) {
      console.error('Error fetching book details:', error)
      setError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this book?')) return

    try {
      await libraryService.deleteBook(id!)
      showToast('success', 'Book deleted successfully')
      navigate('/library/books')
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete book')
    }
  }

  if (loading) {
    return (
      <Layout title="Book Details">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (error || !book) {
    return (
      <Layout title="Book Details">
        <Card className="p-8 text-center">
          <p className="text-red-600">{error?.message || 'Book not found'}</p>
          <Button variant="outline" onClick={() => navigate('/library/books')} className="mt-4">
            Back to Books
          </Button>
        </Card>
      </Layout>
    )
  }

  const category = typeof book.category === 'object' ? book.category : null

  return (
    <Layout title={book.title}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/library/books')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/library/borrowings/new?bookId=${book._id}`}>
              <Button variant="primary" disabled={book.availableQuantity === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Issue Book
              </Button>
            </Link>
            <Link to={`/library/books/${book._id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
            <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Book Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex gap-6">
                {book.coverImage ? (
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="w-40 h-56 object-cover rounded-lg shadow-md"
                  />
                ) : (
                  <div className="w-40 h-56 bg-gray-200 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">{book.title}</h1>
                    {getStatusBadge(book.status)}
                  </div>
                  <p className="text-lg text-gray-600 mb-4">by {book.author}</p>

                  {book.isbn && (
                    <p className="text-sm text-gray-500 mb-2">
                      <span className="font-medium">ISBN:</span> {book.isbn}
                    </p>
                  )}

                  {category && (
                    <div className="flex items-center gap-2 mb-4">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm text-gray-600">{category.name}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-sm text-blue-600">Total Copies</p>
                      <p className="text-2xl font-bold text-blue-700">{book.totalQuantity}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-sm text-green-600">Available</p>
                      <p className="text-2xl font-bold text-green-700">{book.availableQuantity}</p>
                    </div>
                  </div>
                </div>
              </div>

              {book.description && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{book.description}</p>
                </div>
              )}
            </Card>

            {/* Borrowing History */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Borrowing History</h3>
              {borrowingHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No borrowing history yet</p>
              ) : (
                <div className="space-y-3">
                  {borrowingHistory.map((borrowing, index) => {
                    const member = typeof borrowing.member === 'object' ? borrowing.member : null
                    return (
                      <motion.div
                        key={borrowing._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {member ? `${member.firstName} ${member.lastName}` : 'Unknown Member'}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatDate(borrowing.borrowDate)}
                              </span>
                              {borrowing.returnDate && (
                                <span>Returned: {formatDate(borrowing.returnDate)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getBorrowingStatusBadge(borrowing.status)}
                          {borrowing.status === BorrowingStatus.OVERDUE && (
                            <span className="text-red-600 text-sm font-medium">
                              {borrowing.currentOverdueDays || borrowing.overdueDays} days
                            </span>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Side Info */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Additional Details</h3>
              <div className="space-y-4">
                {book.publisher && (
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Publisher</p>
                      <p className="text-gray-900">{book.publisher}</p>
                    </div>
                  </div>
                )}

                {book.publishedDate && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Published Date</p>
                      <p className="text-gray-900">{formatDate(book.publishedDate)}</p>
                    </div>
                  </div>
                )}

                {book.pageCount && (
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Page Count</p>
                      <p className="text-gray-900">{book.pageCount} pages</p>
                    </div>
                  </div>
                )}

                {book.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="text-gray-900">{book.location}</p>
                    </div>
                  </div>
                )}

                {book.tags && book.tags.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Tag className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {book.tags.map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Quick Stats */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Times Borrowed</span>
                  <span className="font-semibold">{borrowingHistory.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Currently Borrowed</span>
                  <span className="font-semibold">
                    {book.totalQuantity - book.availableQuantity}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Added On</span>
                  <span className="font-semibold">{formatDate(book.createdAt)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  )
}
